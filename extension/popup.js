/**
 * X402 Account Recorder - Popup Script
 */

// Web App URL（部署后需要更新）
const WEB_APP_URL = 'https://x402-account-git-main-huangpi1030-techs-projects.vercel.app/'; // TODO: 更新为你的实际部署地址

// DOM 元素
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const settledCount = document.getElementById('settledCount');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const enableToggle = document.getElementById('enableToggle');
const recordList = document.getElementById('recordList');
const syncBtn = document.getElementById('syncBtn');
const openWebApp = document.getElementById('openWebApp');
const clearBtn = document.getElementById('clearBtn');
const webAppLink = document.getElementById('webAppLink');

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化金额
 */
function formatAmount(amount, symbol = 'USDC') {
  if (!amount) return '0 ' + symbol;
  const num = parseFloat(amount);
  if (num < 0.01) {
    return num.toFixed(6) + ' ' + symbol;
  }
  return num.toFixed(2) + ' ' + symbol;
}

/**
 * 获取状态标签
 */
function getStatusLabel(status) {
  const labels = {
    'pending': '待处理',
    'detected': '已检测',
    'settled': '已确认',
    'verifying': '验证中',
    'onchain_verified': '已验证',
    'needs_review': '需审核',
    'accounted': '已入账'
  };
  return labels[status] || status;
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    if (response.success) {
      const stats = response.stats;
      totalCount.textContent = stats.total;
      pendingCount.textContent = stats.pending + stats.detected;
      settledCount.textContent = stats.settled;
    }
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

/**
 * 加载记录列表
 */
async function loadRecords() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_RECORDS' });
    if (response.success && response.records.length > 0) {
      // 按时间倒序，取最近 5 条
      const recentRecords = response.records
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      recordList.innerHTML = recentRecords.map(record => `
        <div class="record-item">
          <div class="record-header">
            <span class="record-domain">${record.merchant_domain || '未知'}</span>
            <span class="record-amount">${formatAmount(record.amount_decimal_str, record.asset_symbol)}</span>
          </div>
          <div class="record-meta">
            <span class="record-status ${record.status}">${getStatusLabel(record.status)}</span>
            <span>${formatDate(record.created_at)}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('加载记录失败:', error);
  }
}

/**
 * 加载配置
 */
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['x402_config']);
    const config = result.x402_config || { enabled: true };
    enableToggle.checked = config.enabled;
    updateStatusDisplay(config.enabled);
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

/**
 * 更新状态显示
 */
function updateStatusDisplay(enabled) {
  if (enabled) {
    statusDot.classList.remove('inactive');
    statusText.textContent = '监听中...';
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = '已暂停';
  }
}

/**
 * 保存配置
 */
async function saveConfig(config) {
  try {
    const result = await chrome.storage.local.get(['x402_config']);
    const currentConfig = result.x402_config || {};
    await chrome.storage.local.set({
      x402_config: { ...currentConfig, ...config }
    });
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

// ============ 事件监听 ============

// 启用/禁用切换
enableToggle.addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  await saveConfig({ enabled });
  updateStatusDisplay(enabled);
});

// 同步按钮
syncBtn.addEventListener('click', async () => {
  syncBtn.disabled = true;
  syncBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="animate-spin">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    同步中...
  `;
  
  try {
    await chrome.runtime.sendMessage({ type: 'SYNC_ALL_TO_WEBAPP' });
    syncBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      同步完成
    `;
    setTimeout(() => {
      syncBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        同步到 Web App
      `;
      syncBtn.disabled = false;
    }, 2000);
  } catch (error) {
    syncBtn.innerHTML = '同步失败';
    syncBtn.disabled = false;
  }
});

// 打开 Web App
openWebApp.addEventListener('click', () => {
  chrome.tabs.create({ url: WEB_APP_URL });
});

// 清空记录
clearBtn.addEventListener('click', async () => {
  if (confirm('确定要清空所有记录吗？此操作不可恢复。')) {
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_RECORDS' });
      await loadStats();
      await loadRecords();
    } catch (error) {
      console.error('清空记录失败:', error);
    }
  }
});

// 更新 Web App 链接
webAppLink.href = WEB_APP_URL;
webAppLink.textContent = new URL(WEB_APP_URL).hostname;

// 监听来自 background 的新记录通知
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'X402_RECORD_CAPTURED') {
    loadStats();
    loadRecords();
  }
});

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadStats();
  await loadRecords();
});
