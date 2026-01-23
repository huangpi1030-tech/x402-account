# API 接口文档

本文档介绍 X402 Account 项目的 API 接口定义和使用方法。

## 目录

- [接口概览](#接口概览)
- [数据同步接口](#数据同步接口)
- [配置接口](#配置接口)
- [验证接口](#验证接口)
- [汇率接口](#汇率接口)

---

## 接口概览

所有 API 接口定义在 `app/api/types.ts` 中，Mock 实现位于 `app/api/mockApi.ts`。

### 接口类型

```typescript
// 通用响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 数据同步接口

### syncRawEvidence

上传原始证据（WAL）到 Web App。

**接口定义：**
```typescript
syncRawEvidence(
  evidence: RawEvidence[]
): Promise<ApiResponse<SyncRawEvidenceResponse>>
```

**请求参数：**
- `evidence`: RawEvidence[] - 原始证据数组

**响应：**
```typescript
interface SyncRawEvidenceResponse {
  synced_count: number;
  failed_count: number;
}
```

**示例：**
```typescript
import { syncRawEvidence } from "@/app/api";

const response = await syncRawEvidence(rawEvidenceList);
if (response.success) {
  console.log(`已同步 ${response.data.synced_count} 条记录`);
}
```

---

### syncCanonical

同步 Canonical 记录到远程（幂等写入）。

**接口定义：**
```typescript
syncCanonical(
  records: CanonicalRecord[]
): Promise<ApiResponse<SyncCanonicalResponse>>
```

**请求参数：**
- `records`: CanonicalRecord[] - Canonical 记录数组

**响应：**
```typescript
interface SyncCanonicalResponse {
  synced_count: number;
  failed_count: number;
  conflicts: Array<{
    event_id: string;
    reason: string;
  }>;
}
```

**特性：**
- 幂等写入（基于 `event_id` 去重）
- 冲突检测和处理
- 自动重试机制

**示例：**
```typescript
import { syncCanonical } from "@/app/api";

const response = await syncCanonical(canonicalRecords);
if (response.success) {
  console.log(`已同步 ${response.data.synced_count} 条记录`);
  if (response.data.conflicts.length > 0) {
    console.warn("存在冲突:", response.data.conflicts);
  }
}
```

---

### 数据同步工具函数

#### idempotentWriteCanonical

幂等写入 Canonical 记录。

**位置：** `app/api/sync.ts`

```typescript
idempotentWriteCanonical(
  record: CanonicalRecord
): Promise<CanonicalRecord>
```

#### incrementalSyncCanonical

增量同步 Canonical 记录。

**位置：** `app/api/sync.ts`

```typescript
incrementalSyncCanonical(
  lastSyncTime: string
): Promise<CanonicalRecord[]>
```

#### resolveConflict

解决并发写入冲突（Last Write Wins）。

**位置：** `app/api/sync.ts`

```typescript
resolveConflict(
  local: CanonicalRecord,
  remote: CanonicalRecord
): CanonicalRecord
```

---

## 配置接口

### fetchAllowlistConfig

拉取动态白名单配置。

**接口定义：**
```typescript
fetchAllowlistConfig(): Promise<ApiResponse<AllowlistConfig>>
```

**响应：**
```typescript
interface AllowlistConfig {
  header_allowlist: HeaderAllowlistConfig;
  domain_policy: DomainPolicy[];
  version: string;
  updated_at: string;
}
```

**特性：**
- 支持签名校验
- 版本控制
- 动态更新

**示例：**
```typescript
import { fetchAllowlistConfig } from "@/app/api";

const response = await fetchAllowlistConfig();
if (response.success) {
  const config = response.data;
  console.log(`白名单版本: ${config.version}`);
}
```

---

## 验证接口

### requestVerify

触发批量链上验证/归因任务。

**接口定义：**
```typescript
requestVerify(
  eventIds: string[]
): Promise<ApiResponse<VerifyResponse>>
```

**请求参数：**
- `eventIds`: string[] - 需要验证的事件 ID 数组

**响应：**
```typescript
interface VerifyResponse {
  task_id: string;
  queued_count: number;
  estimated_time: number; // 秒
}
```

**特性：**
- 批量验证
- 任务队列管理
- 进度跟踪

**示例：**
```typescript
import { requestVerify } from "@/app/api";

const response = await requestVerify(["event-1", "event-2"]);
if (response.success) {
  console.log(`任务 ID: ${response.data.task_id}`);
  console.log(`预计完成时间: ${response.data.estimated_time} 秒`);
}
```

---

## 汇率接口

### getFxSnapshot

获取汇率快照。

**接口定义：**
```typescript
getFxSnapshot(
  timestamp: string,
  fromCurrency: string,
  toCurrency: string
): Promise<ApiResponse<FxSnapshot>>
```

**请求参数：**
- `timestamp`: string - 时间戳（ISO 格式）
- `fromCurrency`: string - 源货币（如 "USDC"）
- `toCurrency`: string - 目标货币（如 "USD"）

**响应：**
```typescript
interface FxSnapshot {
  rate: string; // DecimalString
  source: string;
  timestamp: string;
  from_currency: string;
  to_currency: string;
}
```

**特性：**
- 历史汇率查询
- 多货币支持
- 汇率来源追踪

**示例：**
```typescript
import { getFxSnapshot } from "@/app/api";

const response = await getFxSnapshot(
  "2024-01-01T00:00:00Z",
  "USDC",
  "USD"
);
if (response.success) {
  const snapshot = response.data;
  console.log(`汇率: ${snapshot.rate}`);
  console.log(`来源: ${snapshot.source}`);
}
```

---

## 错误处理

所有 API 接口都包含错误处理：

```typescript
try {
  const response = await syncCanonical(records);
  if (response.success) {
    // 处理成功
  } else {
    // 处理错误
    console.error(response.error);
  }
} catch (error) {
  // 处理异常
  console.error("API 调用失败:", error);
}
```

---

## Mock 数据

开发阶段使用 Mock 数据，所有接口都有对应的 Mock 实现：

**位置：** `app/api/mockApi.ts`

**使用方式：**
Mock 实现会自动返回模拟数据，无需真实后端。

---

## 重试机制

数据同步接口支持自动重试（指数退避）：

**位置：** `app/api/sync.ts`

```typescript
withRetry<T>(
  fn: () => Promise<T>,
  maxRetries?: number
): Promise<T>
```

**特性：**
- 指数退避策略
- 最大重试次数限制
- 错误类型过滤

---

## 类型定义

所有 API 类型定义在 `app/api/types.ts` 中，包括：

- `ApiResponse<T>` - 通用响应类型
- `SyncRawEvidenceResponse` - 原始证据同步响应
- `SyncCanonicalResponse` - Canonical 同步响应
- `AllowlistConfig` - 白名单配置
- `VerifyResponse` - 验证响应
- `GetFxSnapshotResponse` - 汇率快照响应
