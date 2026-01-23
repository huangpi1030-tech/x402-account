# 组件使用文档

本文档介绍 X402 Account 项目中所有组件的使用方法。

## 目录

- [UI 基础组件](#ui-基础组件)
- [业务组件](#业务组件)
- [布局组件](#布局组件)

---

## UI 基础组件

### Input

带验证的输入框组件。

**位置：** `app/components/ui/Input.tsx`

**Props：**
```typescript
interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

**示例：**
```tsx
import { Input } from "@/app/components/ui";

<Input
  label="钱包地址"
  placeholder="0x..."
  value={address}
  onChange={(e) => setAddress(e.target.value)}
  error={errors.address}
  helperText="请输入有效的钱包地址"
/>
```

---

### Select

下拉选择组件。

**位置：** `app/components/ui/Select.tsx`

**Props：**
```typescript
interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
}
```

**示例：**
```tsx
import { Select } from "@/app/components/ui";

<Select
  label="法币口径"
  options={[
    { value: "USD", label: "USD" },
    { value: "CNY", label: "CNY" },
  ]}
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
/>
```

---

### DateRangePicker

日期范围选择组件。

**位置：** `app/components/ui/DateRangePicker.tsx`

**Props：**
```typescript
interface DateRangePickerProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  onChange?: (startDate: string, endDate: string) => void;
  error?: string;
}
```

**示例：**
```tsx
import { DateRangePicker } from "@/app/components/ui";

<DateRangePicker
  label="时间范围"
  startDate={startDate}
  endDate={endDate}
  onChange={(start, end) => {
    setStartDate(start);
    setEndDate(end);
  }}
/>
```

---

### Button

按钮组件，支持多种变体。

**位置：** `app/components/ui/Button.tsx`

**Props：**
```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**示例：**
```tsx
import { Button } from "@/app/components/ui";

<Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
  提交
</Button>
```

---

### Modal

模态框组件。

**位置：** `app/components/ui/Modal.tsx`

**Props：**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

**示例：**
```tsx
import { Modal } from "@/app/components/ui";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="确认操作"
  size="md"
>
  <p>确定要执行此操作吗？</p>
</Modal>
```

---

### Pagination

分页组件。

**位置：** `app/components/ui/Pagination.tsx`

**Props：**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
```

**示例：**
```tsx
import { Pagination } from "@/app/components/ui";

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  pageSize={pageSize}
  total={total}
  onPageChange={setPage}
/>
```

---

### Toast

提示消息组件。

**位置：** `app/components/ui/Toast.tsx`

**使用方式：**
通过 `useUIStore` 的 `setSuccessMessage` 和 `setError` 方法显示提示。

**示例：**
```tsx
import { useUIStore } from "@/app/store/useUIStore";

const { setSuccessMessage, setError } = useUIStore();

// 显示成功消息
setSuccessMessage("操作成功");

// 显示错误消息
setError("操作失败");
```

---

## 业务组件

### TransactionList

交易列表组件，显示所有交易记录。

**位置：** `app/components/TransactionList.tsx`

**Props：**
```typescript
interface TransactionListProps {
  onTransactionClick?: (eventId: string) => void;
}
```

**功能：**
- 显示交易列表
- 支持排序（按时间、金额、置信度）
- 支持分页
- 点击交易项跳转到详情页

**示例：**
```tsx
import TransactionList from "@/app/components/TransactionList";

<TransactionList
  onTransactionClick={(eventId) => router.push(`/transactions/${eventId}`)}
/>
```

---

### TransactionFilters

高级筛选组件。

**位置：** `app/components/business/TransactionFilters.tsx`

**Props：**
```typescript
interface TransactionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**功能：**
- 按状态筛选
- 按时间范围筛选
- 按金额范围筛选
- 按置信度筛选
- 按网络筛选
- 搜索查询

**示例：**
```tsx
import { TransactionFilters } from "@/app/components/business";

<TransactionFilters
  isOpen={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
/>
```

---

### BulkExport

批量导出组件，支持按时间范围导出 PDF 和 CSV。

**位置：** `app/components/business/BulkExport.tsx`

**Props：**
```typescript
interface BulkExportProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**功能：**
- 选择时间范围
- 选择导出格式（PDF 或 CSV）
- 导出交易明细

**示例：**
```tsx
import { BulkExport } from "@/app/components/business";

<BulkExport
  isOpen={isExportOpen}
  onClose={() => setIsExportOpen(false)}
/>
```

---

### ReportGenerator

报表生成器组件。

**位置：** `app/components/business/ReportGenerator.tsx`

**功能：**
- 生成月度报表
- 导出 PDF 和 CSV
- 预览报表

**示例：**
```tsx
import { ReportGenerator } from "@/app/components/business";

<ReportGenerator />
```

---

### RuleEditor

规则编辑器组件。

**位置：** `app/components/business/RuleEditor.tsx`

**功能：**
- 创建/编辑规则
- 设置规则条件
- 设置规则动作
- 测试规则匹配

**示例：**
```tsx
import { RuleEditor } from "@/app/components/business";

<RuleEditor
  rule={rule}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

---

## 布局组件

### Header

顶部标题栏组件。

**位置：** `app/components/Header.tsx`

**功能：**
- 显示应用标题
- 钱包管理入口
- 设置入口
- 移动端菜单按钮

**示例：**
```tsx
import Header from "@/app/components/Header";

<Header />
```

---

### Sidebar

侧边栏导航组件。

**位置：** `app/components/Sidebar.tsx`

**功能：**
- 导航菜单
- 响应式设计（移动端可折叠）

**示例：**
```tsx
import Sidebar from "@/app/components/Sidebar";

<Sidebar />
```

---

### PageLayout

页面布局容器组件。

**位置：** `app/components/PageLayout.tsx`

**功能：**
- 统一页面布局
- 集成面包屑导航
- 集成 Toast 提示

**示例：**
```tsx
import PageLayout from "@/app/components/PageLayout";

<PageLayout>
  <div>页面内容</div>
</PageLayout>
```

---

## 组件导出

所有组件都通过统一的导出文件导出：

- UI 组件：`app/components/ui/index.ts`
- 业务组件：`app/components/business/index.ts`

**使用方式：**
```tsx
// UI 组件
import { Input, Button, Modal } from "@/app/components/ui";

// 业务组件
import { TransactionFilters, ReportGenerator } from "@/app/components/business";
```
