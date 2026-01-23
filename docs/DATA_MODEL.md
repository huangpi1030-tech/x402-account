# 数据模型文档

本文档介绍 X402 Account 项目的数据模型和类型定义。

## 目录

- [核心数据模型](#核心数据模型)
- [状态机](#状态机)
- [规则引擎](#规则引擎)
- [报表模型](#报表模型)
- [配置模型](#配置模型)

---

## 核心数据模型

### CanonicalRecord

Canonical Record v2，标准化的交易记录。

**位置：** `types/canonical.ts`

**字段说明：**

#### 关联与证据字段
- `event_id`: UUID - 事件唯一标识
- `persistence_id`: HashString - 持久化 ID（SHA256）
- `evidence_ref`: string - 原始证据引用
- `header_hashes_json`: string - Header 哈希 JSON

#### 业务识别字段
- `merchant_domain`: string - 商户域名
- `request_url`: string - 请求 URL
- `description`: string? - 描述
- `order_id`: string? - 订单 ID

#### 支付要素字段
- `network`: Network - 网络（Base, Ethereum 等）
- `asset_symbol`: AssetSymbol - 资产符号（USDC 等）
- `decimals`: Decimals - 精度
- `amount_base_units_str`: BigIntString - 基础单位金额（BigInt）
- `amount_decimal_str`: DecimalString - 十进制金额（Decimal）

#### 角色地址字段
- `payer_wallet`: string? - 付款方钱包地址
- `payee_wallet`: string - 收款方钱包地址
- `internal_wallet_alias`: string? - 内部钱包别名

#### 链上凭证字段
- `tx_hash`: HashString? - 交易哈希
- `paid_at`: ISODateTime? - 支付时间
- `block_number`: number? - 区块号
- `verified_at`: ISODateTime? - 验证时间

#### FX 与法币口径字段
- `fx_fiat_currency`: string - 法币货币（USD, CNY 等）
- `fx_rate`: DecimalString? - 汇率
- `fiat_value_at_time`: DecimalString? - 法币价值
- `fx_source`: string? - 汇率来源
- `fx_captured_at`: ISODateTime? - 汇率捕获时间

#### 会计归类字段
- `category`: string? - 分类
- `project`: string? - 项目
- `cost_center`: string? - 成本中心
- `rule_id_applied`: UUID? - 应用的规则 ID

#### 状态机与置信度字段
- `status`: TransactionStatus - 交易状态
- `confidence`: Confidence? - 置信度（0-100）
- `needs_review_reason`: string? - 需审核原因

#### 安全最小化字段
- `signature_hash`: HashString? - 签名哈希
- `authorization_hash`: HashString? - 授权哈希

#### 时间戳字段
- `created_at`: ISODateTime - 创建时间
- `updated_at`: ISODateTime - 更新时间

**示例：**
```typescript
import { CanonicalRecord } from "@/types";

const record: CanonicalRecord = {
  event_id: "550e8400-e29b-41d4-a716-446655440000",
  persistence_id: "abc123...",
  merchant_domain: "example.com",
  network: "base",
  asset_symbol: "USDC",
  decimals: 6,
  amount_decimal_str: "100.50",
  amount_base_units_str: "100500000",
  payee_wallet: "0x1234...",
  status: "detected",
  confidence: 85,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  // ... 其他字段
};
```

---

### RawEvidence

原始证据（WAL 记录）。

**位置：** `types/canonical.ts`

**字段说明：**
- `persistence_id`: HashString - 持久化 ID
- `stage`: string - 阶段（402, authorization, receipt）
- `header_hash`: HashString - Header 哈希
- `timestamp`: UnixTimestamp - 时间戳
- `url`: string - URL
- `headers_json`: string - Header JSON
- `body_hash`: HashString? - Body 哈希（可选）

---

## 状态机

### TransactionStatus

交易状态枚举。

**位置：** `types/common.ts`

**状态定义：**

| 状态 | 说明 | 进入条件 | 退出条件 |
|------|------|----------|----------|
| `pending` | 待处理 | WAL 写入成功 | 解析出基础字段 → `detected` |
| `detected` | 已检测 | 解析器成功 | 捕获授权/回执 → `settled` 或进入验证 → `verifying` |
| `settled` | 已结算 | 有 PAYMENT-RESPONSE 或足够授权证据 | 拿到 tx_hash 并链上校验 → `onchain_verified` |
| `verifying` | 验证中 | 触发验证任务 | 成功→`onchain_verified`，失败/超时→`needs_review` |
| `onchain_verified` | 已验证 | 校验通过 | 规则归类完成 → `accounted` |
| `needs_review` | 需审核 | 归因冲突或置信度衰减到阈值 | 人工确认/补录后→`onchain_verified` 或 `accounted` |
| `accounted` | 已入账 | 命中规则或人工归类 | 月报生成不改变状态 |

**使用方式：**
```typescript
import { TransactionStatus } from "@/types";

const status: TransactionStatus = TransactionStatus.DETECTED;

// 状态转换验证
import { isValidTransition } from "@/app/lib/stateMachine";
const canTransition = isValidTransition(
  TransactionStatus.DETECTED,
  TransactionStatus.SETTLED
);
```

---

## 规则引擎

### Rule

规则定义。

**位置：** `types/rules.ts`

**字段说明：**
- `id`: UUID - 规则 ID
- `name`: string - 规则名称
- `priority`: number - 优先级（数字越大优先级越高）
- `enabled`: boolean - 是否启用
- `conditions`: RuleCondition[] - 条件数组
- `actions`: RuleAction[] - 动作数组
- `version`: number - 版本号
- `created_at`: ISODateTime - 创建时间
- `updated_at`: ISODateTime - 更新时间

### RuleCondition

规则条件。

**字段说明：**
- `field`: string - 字段名（domain, path, description, amount, network, status）
- `operator`: string - 操作符（equals, contains, greater_than, less_than 等）
- `value`: string - 值

**示例：**
```typescript
const condition: RuleCondition = {
  field: "merchant_domain",
  operator: "equals",
  value: "example.com",
};
```

### RuleAction

规则动作。

**字段说明：**
- `field`: string - 字段名（category, project, cost_center, vendor_alias）
- `value`: string - 值

**示例：**
```typescript
const action: RuleAction = {
  field: "category",
  value: "研发支出-API费",
};
```

---

## 报表模型

### MonthlyStatement

月度报表。

**位置：** `types/reports.ts`

**字段说明：**
- `month`: string - 月份（YYYY-MM）
- `rule_version`: number - 规则版本
- `fx_currency`: string - FX 货币
- `executive_summary`: ExecutiveSummary - 执行摘要
- `vendor_breakdown`: VendorBreakdown[] - 商户汇总
- `category_breakdown`: CategoryBreakdown[] - 分类汇总
- `exceptions`: Exception[] - 异常项
- `gap_analysis`: GapAnalysis - 缺口分析
- `generated_at`: ISODateTime - 生成时间

### Receipt

单笔收据。

**位置：** `types/reports.ts`

**字段说明：**
- `transaction_id`: UUID - 交易 ID
- `merchant`: string - 商户
- `amount`: DecimalString - 金额
- `currency`: string - 货币
- `paid_at`: ISODateTime - 支付时间
- `tx_hash`: HashString? - 交易哈希
- `generated_at`: ISODateTime - 生成时间

---

## 配置模型

### WalletConfig

钱包配置。

**位置：** `types/wallet.ts`

**字段说明：**
- `address`: string - 钱包地址
- `alias`: string - 别名
- `entity`: string? - 实体归属
- `created_at`: ISODateTime - 创建时间

### FxConfig

FX 配置。

**位置：** `types/config.ts`

**字段说明：**
- `fiat_currency`: string - 法币货币（USD, CNY 等）
- `source`: string - 汇率来源
- `updated_at`: ISODateTime - 更新时间

### RpcPoolConfig

RPC 池配置。

**位置：** `types/config.ts`

**字段说明：**
- `endpoints`: RpcEndpoint[] - RPC 端点列表
- `retry_count`: number - 重试次数
- `timeout`: number - 超时时间（毫秒）

---

## 类型定义位置

所有类型定义位于 `types/` 目录：

- `types/common.ts` - 通用类型（状态、网络、资产等）
- `types/canonical.ts` - Canonical Record 和 RawEvidence
- `types/rules.ts` - 规则引擎类型
- `types/reports.ts` - 报表类型
- `types/wallet.ts` - 钱包类型
- `types/config.ts` - 配置类型
- `types/audit.ts` - 审计日志类型
- `types/index.ts` - 统一导出

**使用方式：**
```typescript
import {
  CanonicalRecord,
  TransactionStatus,
  Rule,
  MonthlyStatement,
} from "@/types";
```
