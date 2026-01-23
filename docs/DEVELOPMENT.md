# 开发规范文档

本文档介绍 X402 Account 项目的开发规范、最佳实践和代码风格。

## 目录

- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [组件开发规范](#组件开发规范)
- [状态管理规范](#状态管理规范)
- [精度安全规范](#精度安全规范)
- [错误处理规范](#错误处理规范)

---

## 项目结构

```
X402-Account/
├── app/                    # Next.js App Router
│   ├── components/         # 组件
│   │   ├── ui/            # UI 基础组件
│   │   └── business/      # 业务组件
│   ├── lib/               # 工具函数
│   ├── store/             # 状态管理（Zustand）
│   ├── api/               # API 接口
│   └── [pages]/           # 页面路由
├── types/                  # TypeScript 类型定义
├── public/                 # 静态资源
└── docs/                  # 文档
```

---

## 代码规范

### TypeScript

- **严格模式**：启用 TypeScript 严格模式
- **类型定义**：所有函数、组件必须有类型定义
- **禁止 any**：尽量避免使用 `any`，使用 `unknown` 或具体类型
- **类型导入**：使用 `import type` 导入类型

**示例：**
```typescript
// ✅ 正确
import type { CanonicalRecord } from "@/types";

// ❌ 错误
import { CanonicalRecord } from "@/types"; // 如果只用于类型
```

### 命名规范

- **组件**：PascalCase（`TransactionList.tsx`）
- **函数/变量**：camelCase（`formatAmount`）
- **常量**：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- **类型/接口**：PascalCase（`TransactionStatus`）

### 文件组织

- **一个文件一个组件**：每个组件单独一个文件
- **组件代码不超过 200 行**：复杂功能必须拆分
- **统一导出**：使用 `index.ts` 统一导出

---

## 组件开发规范

### 组件结构

```tsx
/**
 * 组件说明
 * 对应 PRD 章节
 */

"use client"; // 如果需要客户端功能

import React from "react";
import { ComponentProps } from "@/types";

interface ComponentProps {
  // Props 定义
}

export default function Component({ ...props }: ComponentProps) {
  // 组件逻辑
  return (
    // JSX
  );
}
```

### 组件拆分原则

1. **单一职责**：每个组件只负责一个功能
2. **可复用性**：提取通用逻辑为独立组件
3. **代码行数**：单个组件不超过 200 行

**示例：**
```tsx
// ✅ 正确：拆分复杂组件
function TransactionList() {
  return (
    <div>
      <TransactionFilters />
      <TransactionItems />
      <Pagination />
    </div>
  );
}

// ❌ 错误：组件过于复杂
function TransactionList() {
  // 500+ 行代码
}
```

### 样式规范

- **使用 Tailwind CSS**：不使用传统 CSS 文件
- **响应式设计**：使用 Tailwind 响应式类（`sm:`, `md:`, `lg:`）
- **设计一致性**：复用相同的设计语言（圆角、配色、阴影、间距）

**示例：**
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  {/* 内容 */}
</div>
```

---

## 状态管理规范

### Zustand Store

使用 Zustand 进行状态管理。

**Store 结构：**
```typescript
interface Store {
  // 状态
  data: DataType[];
  isLoading: boolean;
  error: string | null;

  // 操作
  loadData: () => Promise<void>;
  saveData: (data: DataType) => Promise<void>;
  clearError: () => void;
}

export const useStore = create<Store>((set, get) => ({
  // 初始状态
  data: [],
  isLoading: false,
  error: null,

  // 操作实现
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchData();
      set({ data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

### Store 组织

- **按功能模块拆分**：每个功能模块一个 Store
- **统一导出**：通过 `app/store/index.ts` 统一导出

**Store 文件：**
- `useTransactionStore.ts` - 交易记录状态
- `useRuleStore.ts` - 规则状态
- `useConfigStore.ts` - 配置状态
- `useUIStore.ts` - UI 状态

---

## 精度安全规范

### 金额计算

**严禁使用 JavaScript Number**，必须使用 `Decimal.js` 和 `BigInt`。

**示例：**
```typescript
// ✅ 正确
import Decimal from "decimal.js";

const amount1 = new Decimal("100.50");
const amount2 = new Decimal("200.30");
const total = amount1.plus(amount2); // "300.80"

// ❌ 错误
const total = 100.50 + 200.30; // 可能产生精度问题
```

### 金额字段

- **存储**：使用 `DecimalString` 和 `BigIntString`
- **显示**：使用格式化函数（`formatAmountDisplay`）
- **计算**：使用 `Decimal.js` 库

**工具函数：**
```typescript
import {
  decimalToBigInt,
  bigIntToDecimal,
  formatAmountDisplay,
} from "@/app/lib/decimal";
```

---

## 错误处理规范

### Try-Catch

所有异步操作必须使用 try-catch。

**示例：**
```typescript
try {
  const result = await apiCall();
  // 处理成功
} catch (error) {
  // 处理错误
  console.error("操作失败:", error);
  setError(error instanceof Error ? error.message : "未知错误");
}
```

### 错误提示

使用 `useUIStore` 的 `setError` 和 `setSuccessMessage` 显示错误和成功消息。

**示例：**
```typescript
import { useUIStore } from "@/app/store/useUIStore";

const { setError, setSuccessMessage } = useUIStore();

try {
  await saveTransaction(transaction);
  setSuccessMessage("保存成功");
} catch (error) {
  setError("保存失败: " + error.message);
}
```

### 错误边界

使用 `ErrorBoundary` 组件捕获 React 错误。

**位置：** `app/components/ErrorBoundary.tsx`

**使用方式：**
```tsx
import ErrorBoundary from "@/app/components/ErrorBoundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## 注释规范

### 组件注释

```tsx
/**
 * 组件名称
 * 对应 PRD 章节
 * 
 * @param props - 组件属性
 */
```

### 函数注释

```typescript
/**
 * 函数说明
 * 
 * @param param1 - 参数说明
 * @returns 返回值说明
 */
```

### 复杂逻辑注释

对于复杂的业务逻辑，必须添加中文注释说明。

---

## 测试规范

### 单元测试

关键工具函数必须有单元测试。

**示例：**
```typescript
// decimal.test.ts
import { decimalToBigInt } from "./decimal";

describe("decimalToBigInt", () => {
  it("应该正确转换 Decimal 到 BigInt", () => {
    const result = decimalToBigInt("100.50", 6);
    expect(result).toBe("100500000");
  });
});
```

---

## Git 提交规范

使用 Conventional Commits 规范：

- `feat:` - 新功能
- `fix:` - 修复 bug
- `docs:` - 文档更新
- `style:` - 代码格式
- `refactor:` - 重构
- `test:` - 测试
- `chore:` - 构建/工具

**示例：**
```bash
git commit -m "feat: 添加批量导出功能"
git commit -m "fix: 修复 PDF 中文乱码问题"
```

---

## 性能优化

### 代码分割

使用 Next.js 动态导入进行代码分割。

**示例：**
```typescript
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <LoadingSpinner />,
});
```

### 列表优化

大量数据时使用虚拟滚动或分页。

---

## 安全规范

### 敏感数据

- **不存储签名原文**：只存储 hash/截断
- **加密存储**：敏感数据使用加密存储
- **最小权限**：遵循最小权限原则

### 数据验证

所有用户输入必须验证。

**示例：**
```typescript
if (!address || !isValidAddress(address)) {
  setError("无效的钱包地址");
  return;
}
```

---

## 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
