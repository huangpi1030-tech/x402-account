/**
 * X402 Account Recorder - Content Script
 * 负责与页面 IndexedDB 交互，实现数据同步
 */

// IndexedDB 配置（与 Web App 保持一致）
const DB_NAME = 'X402AccountDB';
const DB_VERSION = 1;
const STORE_CANONICAL = 'canonical';
const STORE_RAW_EVIDENCE = 'rawEvidence';

/**
 * 打开 IndexedDB
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('无法打开 IndexedDB'));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建 canonical store
      if (!db.objectStoreNames.contains(STORE_CANONICAL)) {
        const canonicalStore = db.createObjectStore(STORE_CANONICAL, { keyPath: 'event_id' });
        canonicalStore.createIndex('persistence_id', 'persistence_id', { unique: false });
        canonicalStore.createIndex('merchant_domain', 'merchant_domain', { unique: false });
        canonicalStore.createIndex('status', 'status', { unique: false });
        canonicalStore.createIndex('created_at', 'created_at', { unique: false });
        canonicalStore.createIndex('paid_at', 'paid_at', { unique: false });
      }

      // 创建 rawEvidence store
      if (!db.objectStoreNames.contains(STORE_RAW_EVIDENCE)) {
        const rawStore = db.createObjectStore(STORE_RAW_EVIDENCE, { keyPath: 'evidence_id' });
        rawStore.createIndex('event_id', 'event_id', { unique: false });
        rawStore.createIndex('captured_at', 'captured_at', { unique: false });
      }
    };
  });
}

/**
 * 保存记录到 IndexedDB
 */
async function saveToIndexedDB(record) {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_CANONICAL], 'readwrite');
      const store = transaction.objectStore(STORE_CANONICAL);

      // 先检查是否存在
      const getRequest = store.get(record.event_id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        
        if (existing) {
          // 更新现有记录
          const merged = {
            ...existing,
            ...record,
            tx_hash: record.tx_hash || existing.tx_hash,
            paid_at: record.paid_at || existing.paid_at,
            status: record.tx_hash ? 'settled' : existing.status,
            confidence: Math.max(existing.confidence || 0, record.confidence || 0),
            updated_at: new Date().toISOString()
          };
          store.put(merged);
        } else {
          // 插入新记录
          store.add(record);
        }
      };

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(new Error('保存失败'));
      };
    });
  } catch (error) {
    return false;
  }
}

/**
 * 保存原始证据
 */
async function saveRawEvidence(evidence) {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_RAW_EVIDENCE], 'readwrite');
      const store = transaction.objectStore(STORE_RAW_EVIDENCE);
      store.add(evidence);

      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };

      transaction.onerror = () => {
        db.close();
        reject(new Error('保存原始证据失败'));
      };
    });
  } catch (error) {
    return false;
  }
}

/**
 * 获取所有记录
 */
async function getAllRecords() {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_CANONICAL], 'readonly');
      const store = transaction.objectStore(STORE_CANONICAL);
      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };

      request.onerror = () => {
        db.close();
        reject(new Error('读取失败'));
      };
    });
  } catch (error) {
    return [];
  }
}

// ============ 消息监听 ============

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'X402_SYNC_RECORD') {
    // 保存记录到 IndexedDB
    saveToIndexedDB(message.record)
      .then(success => {
        sendResponse({ success });
        
        // 触发页面刷新事件（让 React 知道有新数据）
        window.dispatchEvent(new CustomEvent('x402-data-updated', {
          detail: { record: message.record }
        }));
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }

  if (message.type === 'X402_GET_RECORDS') {
    getAllRecords()
      .then(records => {
        sendResponse({ success: true, records });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'X402_SAVE_RAW_EVIDENCE') {
    saveRawEvidence(message.evidence)
      .then(success => {
        sendResponse({ success });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// ============ 页面注入 ============

// 注入一个脚本到页面，用于检测 x402 相关的 fetch/XHR 请求
const injectedScript = `
(function() {
  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // 检查响应头是否包含 x402 相关信息
    const x402Headers = {};
    let hasX402 = false;
    
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('x-402') || lowerKey === 'x-payment-required') {
        x402Headers[key] = value;
        hasX402 = true;
      }
    });
    
    // 检查是否是 402 响应
    if (response.status === 402 || hasX402) {
      window.postMessage({
        type: 'X402_FETCH_DETECTED',
        url: args[0]?.url || args[0],
        method: args[1]?.method || args[0]?.method || 'GET',
        status: response.status,
        headers: x402Headers
      }, '*');
    }
    
    return response;
  };

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._x402_url = url;
    this._x402_method = method;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('load', function() {
      if (this.status === 402) {
        const headers = this.getAllResponseHeaders();
        window.postMessage({
          type: 'X402_XHR_DETECTED',
          url: this._x402_url,
          method: this._x402_method,
          status: this.status,
          headers: headers
        }, '*');
      }
    });
    return originalXHRSend.apply(this, args);
  };
})();
`;

// 注入脚本
const script = document.createElement('script');
script.textContent = injectedScript;
(document.head || document.documentElement).appendChild(script);
script.remove();

// 监听页面消息
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'X402_FETCH_DETECTED' || event.data.type === 'X402_XHR_DETECTED') {
    // 发送给 background script 处理
    chrome.runtime.sendMessage({
      type: 'X402_PAGE_DETECTION',
      data: event.data
    });
  }
});
