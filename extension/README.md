# X402 Account Recorder - Chrome Extension

这是 X402 Account 的浏览器扩展，用于自动捕获 X402 微支付请求数据。

## 功能特性

- **自动捕获**：自动检测并捕获所有包含 X402 支付信息的 HTTP 请求
- **WAL 保护**：使用 Write-Ahead Log 确保数据不丢失
- **实时同步**：自动同步数据到 X402 Account Web App
- **本地存储**：所有数据都存储在本地，保护隐私

## 安装步骤

### 1. 准备图标文件

在 `icons/` 目录下放入以下图标文件：
- `icon16.png` (16x16 像素)
- `icon48.png` (48x48 像素)  
- `icon128.png` (128x128 像素)

### 2. 配置 Web App 地址

编辑以下文件，将 `WEB_APP_URL` / `WEB_APP_ORIGIN` 更新为你的实际部署地址：

- `background.js` 第 21 行
- `popup.js` 第 5 行

例如：
```javascript
const WEB_APP_URL = 'https://your-app.vercel.app';
```

### 3. 加载扩展到 Chrome

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension` 文件夹

### 4. 验证安装

1. 扩展图标应该出现在 Chrome 工具栏
2. 点击图标查看 Popup 界面
3. 访问支持 X402 的网站，扩展会自动捕获支付数据

## 使用说明

### 自动捕获

扩展会自动监听所有 HTTP 请求，检测以下 header：

**请求 Headers：**
- `x-402-payment`
- `x-402-network`
- `x-402-recipient`
- `x-402-amount`
- `x-402-order-id`
- `x-402-nonce`

**响应 Headers：**
- `x-402-receipt`
- `x-402-tx-hash`
- `x-402-payment-id`

**HTTP 状态码：**
- `402 Payment Required`

### 手动同步

点击 Popup 中的「同步到 Web App」按钮，将所有捕获的数据同步到 Web App。

### 查看数据

1. 点击「打开 X402 Account」进入 Web App
2. 在交易记录页面查看所有捕获的支付数据

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                   Chrome Extension               │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │ background.js │───▶│ chrome.webRequest    │  │
│  │ (Service      │    │ - 拦截 HTTP 请求     │  │
│  │  Worker)      │    │ - 解析 x402 headers  │  │
│  └──────────────┘    └──────────────────────┘  │
│          │                                       │
│          ▼                                       │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │ chrome.storage│◀──▶│ WAL + Records        │  │
│  │ .local        │    │ - Write-Ahead Log    │  │
│  └──────────────┘    │ - Canonical Records  │  │
│          │            └──────────────────────┘  │
│          ▼                                       │
│  ┌──────────────┐                               │
│  │ content.js   │──────────────────────────────┤
│  │ (注入页面)    │                               │
│  └──────────────┘                               │
│          │                                       │
└──────────│──────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              X402 Account Web App                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │ IndexedDB    │◀──▶│ Canonical Records    │  │
│  │ (共享存储)    │    │ - 交易记录           │  │
│  └──────────────┘    │ - 审计日志           │  │
│          │            └──────────────────────┘  │
│          ▼                                       │
│  ┌──────────────┐                               │
│  │ React UI     │                               │
│  │ - 交易列表    │                               │
│  │ - 报表生成    │                               │
│  └──────────────┘                               │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 数据流程

1. **捕获**：background.js 通过 webRequest API 拦截 HTTP 请求/响应
2. **解析**：检测 x402 相关 headers，解析支付数据
3. **存储**：先写入 WAL，再写入主存储（chrome.storage.local）
4. **同步**：通过 content script 将数据写入 Web App 的 IndexedDB
5. **展示**：Web App 从 IndexedDB 读取并显示数据

## 常见问题

### Q: 扩展没有捕获到数据？

1. 确认扩展已启用（Popup 中的开关为开启状态）
2. 确认访问的网站确实发送了 x402 相关的 headers
3. 在 Chrome DevTools 的 Network 面板中检查请求 headers

### Q: 数据没有同步到 Web App？

1. 确认 Web App 地址配置正确
2. 确认 Web App 页面已打开
3. 手动点击「同步到 Web App」按钮

### Q: 如何查看扩展日志？

1. 访问 `chrome://extensions/`
2. 找到 X402 Account Recorder
3. 点击「Service Worker」查看 background.js 日志
4. 右键扩展图标 → 检查弹出式窗口，查看 popup.js 日志

## 开发调试

```bash
# 修改代码后，需要在 chrome://extensions/ 页面点击刷新按钮
```

## 隐私说明

- 所有数据都存储在本地浏览器中
- 扩展不会将数据发送到任何第三方服务器
- 数据仅在用户主动同步时才会写入 Web App 的 IndexedDB
