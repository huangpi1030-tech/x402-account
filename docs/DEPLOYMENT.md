# 部署文档

本文档介绍 X402 Account 项目的部署配置和流程。

## 目录

- [环境变量配置](#环境变量配置)
- [构建配置](#构建配置)
- [生产环境部署](#生产环境部署)
- [监控配置](#监控配置)

---

## 环境变量配置

### 开发环境

创建 `.env.local` 文件：

```bash
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 加密配置（开发环境使用固定密钥，生产环境必须更换）
ENCRYPTION_KEY=dev-key-change-in-production

# IndexedDB 配置
NEXT_PUBLIC_DB_NAME=x402_account_dev
NEXT_PUBLIC_DB_VERSION=1
```

### 生产环境

创建 `.env.production` 文件：

```bash
# API 配置
NEXT_PUBLIC_API_URL=https://api.example.com

# 加密配置（必须使用强随机密钥）
ENCRYPTION_KEY=<generate-strong-random-key>

# IndexedDB 配置
NEXT_PUBLIC_DB_NAME=x402_account
NEXT_PUBLIC_DB_VERSION=1

# 监控配置
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
NEXT_PUBLIC_ANALYTICS_ID=<analytics-id>
```

### 环境变量生成

**生成加密密钥：**
```bash
# 使用 Node.js 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 构建配置

### Next.js 配置

`next.config.js` 已配置基础设置，生产环境可能需要额外优化：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // 安全头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 构建命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

### 构建优化

**检查构建大小：**
```bash
npm run build
# 查看输出中的 First Load JS 大小
```

**优化建议：**
- 使用动态导入减少初始包大小
- 启用代码分割
- 优化图片资源
- 使用 CDN 加载字体文件

---

## 生产环境部署

### Vercel 部署（推荐）

1. **安装 Vercel CLI：**
```bash
npm i -g vercel
```

2. **部署：**
```bash
vercel
```

3. **配置环境变量：**
在 Vercel 控制台设置环境变量。

### Docker 部署

**Dockerfile：**
```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**构建和运行：**
```bash
docker build -t x402-account .
docker run -p 3000:3000 x402-account
```

### 传统服务器部署

1. **构建项目：**
```bash
npm run build
```

2. **启动服务：**
```bash
npm start
```

3. **使用 PM2 管理进程：**
```bash
npm install -g pm2
pm2 start npm --name "x402-account" -- start
pm2 save
pm2 startup
```

---

## 监控配置

### 错误监控（Sentry）

**安装：**
```bash
npm install @sentry/nextjs
```

**配置：**
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**集成到 Next.js：**
```bash
npx @sentry/wizard@latest -i nextjs
```

### 性能监控

**Web Vitals：**
```typescript
// app/layout.tsx
export function reportWebVitals(metric: any) {
  // 发送到分析服务
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
    // 发送指标
  }
}
```

### 日志监控

**生产环境日志：**
- 使用结构化日志
- 避免记录敏感信息
- 使用日志聚合服务（如 Logtail、Datadog）

---

## 安全检查清单

- [ ] 环境变量已正确配置
- [ ] 加密密钥已更换为强随机密钥
- [ ] API 端点已配置为生产环境
- [ ] 安全头已配置
- [ ] HTTPS 已启用
- [ ] 错误监控已配置
- [ ] 性能监控已配置
- [ ] 日志监控已配置

---

## 故障排查

### 构建失败

**检查：**
1. Node.js 版本是否符合要求（>= 18）
2. 依赖是否正确安装
3. 环境变量是否配置

**解决：**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 运行时错误

**检查：**
1. 环境变量是否正确
2. 数据库连接是否正常
3. API 端点是否可访问

**查看日志：**
```bash
# PM2
pm2 logs x402-account

# Docker
docker logs <container-id>
```

---

## 备份与恢复

### 数据备份

IndexedDB 数据存储在浏览器本地，建议：

1. **导出功能**：使用应用内的数据导出功能
2. **定期备份**：提醒用户定期导出数据
3. **云端同步**：未来可集成云端同步功能

### 恢复数据

用户可以通过导入功能恢复数据（未来功能）。

---

## 更新部署

### 零停机部署

**使用 Vercel：**
- 自动零停机部署
- 支持回滚

**使用 Docker：**
```bash
# 滚动更新
docker-compose up -d --no-deps --build x402-account
```

### 版本管理

- 使用 Git 标签管理版本
- 记录每次部署的版本号
- 保留部署历史

---

## 性能优化

### 生产环境优化

1. **启用压缩：**
```javascript
// next.config.js
compress: true
```

2. **启用缓存：**
```javascript
// 静态资源缓存
headers: [
  {
    source: '/static/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
]
```

3. **CDN 配置：**
- 静态资源使用 CDN
- 字体文件使用 CDN

---

## 参考资源

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 文档](https://vercel.com/docs)
- [Docker 文档](https://docs.docker.com/)
