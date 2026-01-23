# X402 Account 文档中心

欢迎来到 X402 Account 项目文档中心。

## 文档目录

### 📚 开发文档

- [组件使用文档](./COMPONENTS.md) - 所有组件的使用方法和示例
- [API 接口文档](./API.md) - API 接口定义和使用方法
- [数据模型文档](./DATA_MODEL.md) - 数据模型和类型定义
- [开发规范文档](./DEVELOPMENT.md) - 开发规范、最佳实践和代码风格

### 🚀 部署文档

- [部署文档](./DEPLOYMENT.md) - 部署配置和流程

### 📖 其他文档

- [项目 README](../README.md) - 项目概述和 PRD
- [任务清单](../TASKS.md) - 开发任务清单
- [类型定义说明](../types/README.md) - 类型定义说明
- [字体配置说明](../public/fonts/README.md) - PDF 中文字体配置

---

## 快速开始

### 开发环境设置

1. **安装依赖：**
```bash
npm install
```

2. **启动开发服务器：**
```bash
npm run dev
```

3. **访问应用：**
打开 [http://localhost:3000](http://localhost:3000)

### 构建项目

```bash
npm run build
npm start
```

---

## 项目结构

```
X402-Account/
├── app/                    # Next.js App Router
│   ├── components/         # 组件
│   ├── lib/               # 工具函数
│   ├── store/             # 状态管理
│   ├── api/               # API 接口
│   └── [pages]/           # 页面路由
├── types/                  # TypeScript 类型定义
├── public/                 # 静态资源
└── docs/                  # 文档（本目录）
```

---

## 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **本地存储**：IndexedDB
- **PDF 生成**：@react-pdf/renderer
- **精度计算**：decimal.js

---

## 贡献指南

1. 遵循[开发规范](./DEVELOPMENT.md)
2. 编写清晰的代码注释
3. 保持组件代码不超过 200 行
4. 使用 TypeScript 严格模式
5. 所有金额计算使用 Decimal.js

---

## 许可证

[添加许可证信息]

---

## 联系方式

[添加联系方式]
