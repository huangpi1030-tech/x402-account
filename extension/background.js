/**
 * X402 Account Recorder - Background Service Worker
 * 对应 PRD 第 7 节：Browser Recorder（采集层）
 * 
 * 核心功能：
 * 1. 拦截 HTTP 请求/响应，检测 x402 支付相关 header
 * 2. 解析支付数据，生成 Canonical Record
 * 3. 存储到本地并同步到 Web App
 */

// ============ 配置 ============
const X402_HEADERS = [
  'x-402-payment',
  'x-402-network', 
  'x-402-recipient',
  'x-402-amount',
  'x-402-order-id',
  'x-402-nonce',
  'x-402-valid-after',
  'x-402-valid-until',
  'x-payment-required',
  'www-authenticate' // 402 响应中可能包含支付信息
];

const PAYMENT_RESPONSE_HEADERS = [
  'x-402-receipt',
  'x-402-tx-hash',
  'x-402-payment-id'
];

const X402_PARAM_KEYS = [
  'payto',
  'recipient',
  'network',
  'amount',
  'asset',
  'order-id',
  'order_id',
  'nonce',
  'valid-after',
  'valid-until',
  'valid_after',
  'valid_until',
  'tx-hash',
  'receipt',
  'payment-id'
];

// Web App URL（部署后需要更新）
const WEB_APP_ORIGIN = 'https://x402-account.vercel.app'; // TODO: 更新为你的实际部署地址

// 本地存储的 key
const STORAGE_KEY = 'x402_captured_records';
const WAL_KEY = 'x402_wal'; // Write-Ahead Log

// ============ 工具函数 ============

/**
 * 生成唯一 ID
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成 Persistence ID（用于关联同一支付的多个事件）
 */
function generatePersistenceId(normalizedUrl, method, network, recipient, amountBaseUnits, orderId, nonce, validAfter) {
  const dayBucket = Math.floor(Date.now() / 86400000);
  const optionalPart = orderId || nonce || validAfter || '';
  const data = `${normalizedUrl}|${method}|${network}|${recipient}|${amountBaseUnits}|${optionalPart}|${dayBucket}`;
  // 简单 hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `persist_${Math.abs(hash).toString(16)}`;
}

/**
 * 从 URL 提取域名
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * 解析 x402 Header 值
 */
function parseX402Header(headerValue) {
  // x402 header 可能是 JSON 或简单值
  try {
    return JSON.parse(headerValue);
  } catch {
    return headerValue;
  }
}

/**
 * 标准化 URL（去掉 query/hash 以提升幂等性）
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * 从 payto 字段中提取地址
 */
function extractPayToAddress(paytoValue) {
  if (!paytoValue) return null;
  const trimmed = paytoValue.replace(/^payto:/i, '').trim();
  const parts = trimmed.split(':');
  return parts[parts.length - 1] || trimmed;
}

/**
 * 从 Header 中提取 key=value 参数
 */
function parseKeyValueParams(headerValue) {
  const params = {};
  if (!headerValue) return params;

  const paramRegex = /([a-zA-Z0-9_-]+)=("([^"]+)"|[^,\s]+)/g;
  let match;
  while ((match = paramRegex.exec(headerValue)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[3] || match[2];
    if (X402_PARAM_KEYS.includes(key)) {
      params[key] = value;
    }
  }
  return params;
}

/**
 * 解析 WWW-Authenticate / x-payment-required 中的 x402 参数
 */
function parseX402Challenge(headerValue) {
  if (!headerValue) return {};

  const parsedJson = parseX402Header(headerValue);
  if (parsedJson && typeof parsedJson === 'object') {
    return parsedJson;
  }

  // 只处理包含 x402 的 challenge
  if (!/x402/i.test(headerValue)) {
    return {};
  }

  return parseKeyValueParams(headerValue);
}

/**
 * 从 headers 数组构建小写 key 的 map
 */
function buildHeaderMap(headers) {
  const map = new Map();
  (headers || []).forEach(h => {
    if (!map.has(h.name.toLowerCase())) {
      map.set(h.name.toLowerCase(), h.value);
    }
  });
  return map;
}

/**
 * 解析金额字符串
 */
function parseAmount(amountValue, decimals) {
  if (!amountValue) {
    return { amountBaseUnits: '0', amountDecimal: '0' };
  }

  const amountString = amountValue.toString();
  const numericMatch = amountString.match(/[0-9]*\.?[0-9]+/);
  if (!numericMatch) {
    return { amountBaseUnits: '0', amountDecimal: '0' };
  }

  const amountNum = parseFloat(numericMatch[0]);
  if (Number.isNaN(amountNum)) {
    return { amountBaseUnits: '0', amountDecimal: '0' };
  }

  if (amountString.includes('.')) {
    return {
      amountBaseUnits: Math.round(amountNum * Math.pow(10, decimals)).toString(),
      amountDecimal: amountNum.toString()
    };
  }

  const baseUnits = Math.round(amountNum);
  return {
    amountBaseUnits: baseUnits.toString(),
    amountDecimal: (baseUnits / Math.pow(10, decimals)).toString()
  };
}

/**
 * 从 headers 数组中查找指定 header
 */
function findHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}

/**
 * 检测是否包含 x402 支付相关 header
 */
function hasX402Headers(headers) {
  return headers.some(h => {
    const headerName = h.name.toLowerCase();
    if (PAYMENT_RESPONSE_HEADERS.includes(headerName) || X402_HEADERS.includes(headerName)) {
      if (headerName === 'www-authenticate') {
        return /x402/i.test(h.value || '');
      }
      return true;
    }
    return false;
  });
}

// ============ 数据解析 ============

/**
 * 解析请求/响应中的 x402 支付数据
 */
function parseX402Data(url, method, requestHeaders, responseHeaders, statusCode) {
  const allHeaders = [...(requestHeaders || []), ...(responseHeaders || [])];
  
  if (!hasX402Headers(allHeaders)) {
    return null;
  }

  const domain = extractDomain(url);
  const now = new Date().toISOString();
  const headerMap = buildHeaderMap(allHeaders);

  const authHeader = headerMap.get('www-authenticate');
  const paymentRequiredHeader = headerMap.get('x-payment-required');
  const authParams = {
    ...parseX402Challenge(authHeader),
    ...parseX402Challenge(paymentRequiredHeader)
  };

  // 提取各种 x402 相关字段
  const payment = findHeader(allHeaders, 'x-402-payment');
  const paymentParsed = payment ? parseX402Header(payment) : null;
  const receiptHeader = findHeader(allHeaders, 'x-402-receipt');
  const receiptParsed = receiptHeader ? parseX402Header(receiptHeader) : null;

  const network =
    findHeader(allHeaders, 'x-402-network') ||
    authParams.network ||
    (paymentParsed && paymentParsed.network) ||
    'base';

  const recipient =
    findHeader(allHeaders, 'x-402-recipient') ||
    authParams.recipient ||
    extractPayToAddress(authParams.payto) ||
    (paymentParsed && (paymentParsed.recipient || paymentParsed.payee));

  const amount =
    findHeader(allHeaders, 'x-402-amount') ||
    authParams.amount ||
    (paymentParsed && paymentParsed.amount);

  const orderId =
    findHeader(allHeaders, 'x-402-order-id') ||
    authParams['order-id'] ||
    authParams['order_id'] ||
    (paymentParsed && paymentParsed.order_id);

  const nonce =
    findHeader(allHeaders, 'x-402-nonce') ||
    authParams.nonce ||
    (paymentParsed && paymentParsed.nonce);

  const validAfter =
    findHeader(allHeaders, 'x-402-valid-after') ||
    authParams['valid-after'] ||
    authParams['valid_after'];

  const txHash =
    findHeader(allHeaders, 'x-402-tx-hash') ||
    (receiptParsed && receiptParsed.tx_hash);

  const receipt =
    receiptHeader ||
    authParams.receipt;

  const paymentId =
    findHeader(allHeaders, 'x-402-payment-id') ||
    authParams['payment-id'];

  // 如果没有关键支付信息，跳过
  if (!recipient && !amount && !payment && statusCode !== 402) {
    return null;
  }

  if (statusCode === 402 && !recipient && !amount && !payment) {
    return null;
  }

  // 解析金额
  const decimals = 6; // 默认 USDC 精度
  const { amountBaseUnits, amountDecimal } = parseAmount(amount, decimals);

  // 确定状态
  let status = 'pending';
  if (statusCode === 402) {
    status = 'detected'; // 检测到支付要求
  } else if (txHash || receipt) {
    status = 'settled'; // 有 tx hash，可能已支付
  } else if (payment) {
    status = 'pending';
  }

  // 生成记录
  const persistenceId = generatePersistenceId(
    normalizeUrl(url),
    method,
    network,
    recipient || 'unknown',
    amountBaseUnits,
    orderId,
    nonce,
    validAfter
  );

  const record = {
    // 关联与证据字段
    event_id: generateEventId(),
    persistence_id: persistenceId,
    evidence_ref: `evidence_${Date.now()}`,
    header_hashes_json: JSON.stringify(
      allHeaders
        .filter(h => X402_HEADERS.includes(h.name.toLowerCase()) || PAYMENT_RESPONSE_HEADERS.includes(h.name.toLowerCase()))
        .reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {})
    ),

    // 业务识别字段
    merchant_domain: domain,
    request_url: url,
    description: `${domain} API 调用`,
    order_id: orderId || undefined,

    // 支付要素字段
    network: network,
    asset_symbol: 'USDC',
    decimals: decimals,
    amount_base_units_str: amountBaseUnits,
    amount_decimal_str: amountDecimal,

    // 角色地址字段
    payee_wallet: recipient || undefined,

    // 链上凭证字段
    tx_hash: txHash || undefined,
    paid_at: txHash || receipt ? now : undefined,

    // FX 与法币口径字段
    fx_fiat_currency: 'USD',
    fx_rate: '1.0',
    fiat_value_at_time: amountDecimal,
    fx_source: 'default',
    fx_captured_at: now,

    // 状态机与置信度字段
    status: status,
    confidence: txHash || receipt ? 90 : (payment ? 80 : (recipient && amount ? 70 : 50)),

    // 元数据字段
    created_at: now,
    updated_at: now,

    // 原始数据（用于调试）
    _raw: {
      url,
      method,
      statusCode,
      payment_id: paymentId,
      capturedHeaders: allHeaders.filter(h => 
        X402_HEADERS.includes(h.name.toLowerCase()) || 
        PAYMENT_RESPONSE_HEADERS.includes(h.name.toLowerCase())
      )
    }
  };

  return record;
}

// ============ 存储 ============

/**
 * WAL（Write-Ahead Log）- 先写入日志确保不丢失
 */
async function writeToWAL(record) {
  const result = await chrome.storage.local.get([WAL_KEY]);
  const wal = result[WAL_KEY] || [];
  wal.push({
    ...record,
    _walTimestamp: Date.now()
  });
  await chrome.storage.local.set({ [WAL_KEY]: wal });
}

/**
 * 保存捕获的记录
 */
async function saveRecord(record) {
  // 先写 WAL
  await writeToWAL(record);

  // 然后保存到主存储
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const records = result[STORAGE_KEY] || [];
  
  // 检查是否已存在（基于 persistence_id 去重）
  const existingIndex = records.findIndex(r => r.persistence_id === record.persistence_id);
  if (existingIndex >= 0) {
    // 更新现有记录（合并信息）
    records[existingIndex] = mergeRecords(records[existingIndex], record);
  } else {
    records.push(record);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: records });
  
  // 尝试同步到 Web App
  await syncToWebApp(record);
  
  // 清理 WAL 中的已处理记录
  await cleanWAL(record.event_id);

  return record;
}

/**
 * 合并两条记录（用于同一支付的多次捕获）
 */
function mergeRecords(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    // 保留更完整的信息
    tx_hash: incoming.tx_hash || existing.tx_hash,
    paid_at: incoming.paid_at || existing.paid_at,
    status: incoming.status === 'settled' || incoming.tx_hash ? 'settled' : existing.status,
    confidence: Math.max(existing.confidence || 0, incoming.confidence || 0),
    updated_at: new Date().toISOString()
  };
}

/**
 * 清理 WAL 中已处理的记录
 */
async function cleanWAL(eventId) {
  const result = await chrome.storage.local.get([WAL_KEY]);
  const wal = result[WAL_KEY] || [];
  const filtered = wal.filter(r => r.event_id !== eventId);
  await chrome.storage.local.set({ [WAL_KEY]: filtered });
}

/**
 * 获取所有已捕获的记录
 */
async function getAllRecords() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  return result[STORAGE_KEY] || [];
}

// ============ 同步到 Web App ============

/**
 * 同步记录到 Web App
 * 通过发送消息给 content script，由 content script 写入 IndexedDB
 */
async function syncToWebApp(record) {
  try {
    // 获取所有 tabs
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      // 尝试发送消息给每个 tab 的 content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'X402_SYNC_RECORD',
          record: record
        });
      } catch (e) {
        // tab 可能没有 content script，忽略
      }
    }
  } catch (error) {
    // 同步失败，记录会在本地保留，下次重试
  }
}

/**
 * 批量同步所有记录到 Web App
 */
async function syncAllToWebApp() {
  const records = await getAllRecords();
  for (const record of records) {
    await syncToWebApp(record);
  }
}

// ============ 请求拦截 ============

// 存储请求 headers（因为 onCompleted 可能拿不到请求 headers）
const requestHeadersCache = new Map();

/**
 * 拦截请求发送前
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // 缓存请求 headers
    requestHeadersCache.set(details.requestId, {
      url: details.url,
      method: details.method,
      headers: details.requestHeaders || [],
      timestamp: Date.now()
    });

    // 清理旧缓存（超过 5 分钟的）
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, data] of requestHeadersCache.entries()) {
      if (data.timestamp < fiveMinutesAgo) {
        requestHeadersCache.delete(id);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders", "extraHeaders"]
);

/**
 * 拦截响应 headers
 */
chrome.webRequest.onHeadersReceived.addListener(
  async (details) => {
    const requestData = requestHeadersCache.get(details.requestId);
    const requestHeaders = requestData?.headers || [];
    const responseHeaders = details.responseHeaders || [];

    // 检测并解析 x402 数据
    const record = parseX402Data(
      details.url,
      requestData?.method || 'GET',
      requestHeaders,
      responseHeaders,
      details.statusCode
    );

    if (record) {
      // 保存记录
      await saveRecord(record);
      
      // 通知 popup（如果打开的话）
      chrome.runtime.sendMessage({
        type: 'X402_RECORD_CAPTURED',
        record: record
      }).catch(() => {});
    }

    // 清理缓存
    requestHeadersCache.delete(details.requestId);
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

// ============ 消息处理 ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_RECORDS') {
    getAllRecords().then(records => {
      sendResponse({ success: true, records });
    });
    return true; // 异步响应
  }

  if (message.type === 'SYNC_ALL_TO_WEBAPP') {
    syncAllToWebApp().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CLEAR_RECORDS') {
    chrome.storage.local.set({ [STORAGE_KEY]: [], [WAL_KEY]: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_STATS') {
    getAllRecords().then(records => {
      const stats = {
        total: records.length,
        pending: records.filter(r => r.status === 'pending').length,
        detected: records.filter(r => r.status === 'detected').length,
        settled: records.filter(r => r.status === 'settled').length,
        lastCapture: records.length > 0 ? records[records.length - 1].created_at : null
      };
      sendResponse({ success: true, stats });
    });
    return true;
  }

  if (message.type === 'X402_PAGE_DETECTION') {
    const data = message.data || {};
    const responseHeaders = Object.entries(data.headers || {}).map(([name, value]) => ({
      name,
      value
    }));

    const record = parseX402Data(
      data.url || 'unknown',
      data.method || 'GET',
      [],
      responseHeaders,
      data.status || 0
    );

    if (record) {
      saveRecord(record).then(() => {
        sendResponse({ success: true, record });
      }).catch(() => {
        sendResponse({ success: false });
      });
      return true;
    }

    sendResponse({ success: false });
    return true;
  }
});

// ============ 初始化 ============

// 扩展安装/更新时
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    chrome.storage.local.set({ 
      [STORAGE_KEY]: [],
      [WAL_KEY]: [],
      x402_config: {
        enabled: true,
        autoSync: true,
        webAppUrl: WEB_APP_ORIGIN
      }
    });
  }
});
