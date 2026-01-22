# TypeScript 类型定义说明

本文档说明所有 TypeScript 类型定义与 PRD 的对应关系。

---

## 文件结构

```
types/
├── common.ts      # 基础类型（状态机、网络、精度安全等）
├── canonical.ts   # Canonical Schema v2 核心类型
├── rules.ts       # 规则引擎类型
├── reports.ts     # 报表相关类型
├── audit.ts       # 审计日志类型
├── wallet.ts      # 钱包相关类型
├── config.ts      # 配置相关类型
├── index.ts       # 统一导出
└── README.md      # 本文档
```

---

## 类型定义与 PRD 对应关系

### 1. `types/common.ts` - 基础类型

#### 对应 PRD 章节：
- **第 6 节**：状态机（金融级严谨：可审计、可回滚）
- **第 8.1 节**：精度与大数安全（P0 强制）

#### 核心类型：

**`TransactionStatus` 枚举**
- 对应 PRD 第 6 节：7 个交易状态
- `pending`: 已捕获原始快照但未完成解析
- `detected`: 已生成 Canonical Record
- `settled`: 已拿到支付回执
- `verifying`: 正在链上验证/归因
- `onchain_verified`: tx_hash 与链上事件匹配通过
- `needs_review`: 低置信/冲突/缺字段需人工确认
- `accounted`: 已归类、可入账、可汇总报表

**精度安全类型**
- `BigIntString`: 对应 PRD 第 8.1 节，`amount_base_units` 用 BigInt
- `DecimalString`: 对应 PRD 第 8.1 节，`amount_decimal` 用 Decimal，避免科学计数法

---

### 2. `types/canonical.ts` - Canonical Schema v2

#### 对应 PRD 章节：
- **第 8.3 节**：Canonical Record v2（最终"唯一真相表"）
- **第 7.2 节**：WAL（Write-Ahead Logging）与并发冲突

#### 核心接口：

**`CanonicalRecord` 接口**
- 对应 PRD 第 8.3 节：包含所有 9 个字段组
  1. **关联与证据字段**：`event_id`, `persistence_id`, `evidence_ref`, `header_hashes_json`
     - 必须可追溯到 WAL/RawEvidence
  2. **业务识别字段**：`merchant_domain`, `request_url`, `description`, `order_id`
     - 至少 domain + url 必填
  3. **支付要素字段**：`network`, `asset_symbol`, `decimals`, `amount_base_units_str`, `amount_decimal_str`
     - 精度安全强制
  4. **角色地址字段**：`payer_wallet`, `payee_wallet`, `internal_wallet_alias`, `wallet_entity_id`
     - payee 必填，payer 尽力补全
  5. **链上凭证字段**：`tx_hash`, `paid_at`, `block_number`, `verified_at`
     - 有 tx_hash 必须校验一致性
  6. **FX 与法币口径字段**：`fx_fiat_currency`, `fx_rate`, `fiat_value_at_time`, `fx_source`, `fx_captured_at`
     - 对应 PRD 第 8.2 节：FX Snapshot 与多钱包归属
     - 有 paid_at 则尽量同步采集
  7. **会计归类字段**：`category`, `project`, `cost_center`, `rule_id_applied`
     - 规则命中必须可解释
  8. **状态机与置信度字段**：`status`, `confidence`, `needs_review_reason`
     - 低置信必须可解释原因
  9. **安全最小化字段**：`signature_hash`, `authorization_hash`
     - 只存 hash/截断，不存原文

**`RawEvidence` 接口**
- 对应 PRD 第 7.2 节：WAL 快照先落盘
- 用于存储浏览器扩展采集的原始数据

---

### 3. `types/rules.ts` - 规则引擎

#### 对应 PRD 章节：
- **第 10 节**：会计规则引擎（Rules Engine）：批量映射与可解释性
- **第 10.1 节**：Gmail-like 过滤器规则（P0）
- **第 10.2 节**：批量应用与回填

#### 核心接口：

**`Rule` 接口**
- 对应 PRD 第 10.1 节：Gmail-like 过滤器规则
- `conditions`: 规则条件列表（domain/path/description/amount/network/status 等）
- `action`: 规则动作（设置 category/project/cost_center/vendor_alias）
- `priority`: 优先级（支持优先级字段）
- `version`: 规则版本号（对应 PRD 第 10.2 节：版本化）

**`RuleMatchResult` 接口**
- 对应 PRD 第 10.1 节：可解释性（每笔显示"命中哪条规则/为何命中"）

---

### 4. `types/reports.ts` - 报表

#### 对应 PRD 章节：
- **第 11 节**：报表与闭环：Gap Analysis（缺口分析）加入月报
- **第 11.1 节**：Gap Analysis（P0）
- **第 11.2 节**：月度 Statement 结构（P0）

#### 核心接口：

**`MonthlyStatement` 接口**
- 对应 PRD 第 11.2 节：月度 Statement 结构
- 包含 5 个章节：
  1. `executive_summary`: Executive Summary（总支出、Top Vendor、Top Category、漏抓率）
  2. `vendor_breakdown`: Vendor Breakdown（按 vendor/domain 汇总）
  3. `category_cost_center_breakdown`: Category/Cost Center（按科目/部门汇总）
  4. `exceptions`: Exceptions（needs_review、unmatched、校验失败）
  5. `gap_analysis`: Gap Analysis（未捕获链上支出列表）
- `rule_version`: 报表引用规则版本（对应 PRD 第 11.2 节）
- `fx_currency`: FX 口径（用于审计）

**`GapAnalysis` 接口**
- 对应 PRD 第 11.1 节：Gap Analysis（P0）
- 用于发现漏抓支出：对比钱包全量 Transfer Events vs 插件捕获的 X402 Canonical

**`Receipt` 接口**
- 对应 PRD 核心交付：单笔 Receipt PDF

---

### 5. `types/audit.ts` - 审计日志

#### 对应 PRD 章节：
- **第 12.2 节**：审计日志（Audit Trail）（P0）

#### 核心接口：

**`AuditLog` 接口**
- 对应 PRD 第 12.2 节：审计字段
- `operation_type`: 操作类型（用户手动修改 vendor/status/category/project/rule）
- `before/after`: 修改前后的值
- `operator`: 操作人
- `timestamp`: 操作时间
- `reason`: 操作原因（可选但推荐）
- **不可抵赖性**：审计日志不可被静默覆盖（append-only）

---

### 6. `types/wallet.ts` - 钱包

#### 对应 PRD 章节：
- **第 8.2 节**：增加 FX Snapshot 与多钱包归属（会计价值锚点）
- **第 13 节**：Web App 页面规格 - Onboarding（钱包绑定+别名+实体归属）

#### 核心接口：

**`WalletConfig` 接口**
- 对应 PRD 第 13 节：Onboarding（钱包绑定+别名+实体归属）
- `alias`: 钱包别名（如"研发部 Agent-01"、"公司主钱包"）
- `entity_id`: 关联的实体 ID（多钱包归属）

**`WalletEntity` 接口**
- 对应 PRD 第 8.2 节：多钱包实体归属（公司/部门/个人）

**`FxSnapshot` 接口**
- 对应 PRD 第 8.2 节：FX Snapshot（汇率快照）
- 用于记录交易时刻的汇率，满足审计口径一致性

---

### 7. `types/config.ts` - 配置

#### 对应 PRD 章节：
- **第 7.3 节**：动态白名单云端更新（无需发版适配新变体）
- **第 9.1 节**：RPC 池冗余与故障切换（P0）
- **第 13 节**：Web App 页面规格 - Onboarding（选择法币口径；RPC 设置）

#### 核心接口：

**`FxConfig` 接口**
- 对应 PRD 第 13 节：Onboarding（选择法币口径；FX 来源）

**`RpcPoolConfig` 接口**
- 对应 PRD 第 9.1 节：RPC 池冗余与故障切换（P0）
- 至少 2-3 个可用端点（官方+第三方）
- 轮询/熔断/重试；按失败率动态降权

**`AllowlistConfig` 接口**
- 对应 PRD 第 7.3 节：动态白名单云端更新
- `header_allowlist`: Header 白名单（内置 v1/v2/变体关键头；支持远端配置增量）
- `domain_policies`: 站点白名单/规则（支持域名级启用/禁用采集）

---

## 使用示例

```typescript
import {
  CanonicalRecord,
  TransactionStatus,
  Rule,
  MonthlyStatement,
  AuditLog,
} from "@/types";

// 创建交易记录
const transaction: CanonicalRecord = {
  event_id: "uuid-here",
  persistence_id: "persistence-id",
  status: TransactionStatus.ONCHAIN_VERIFIED,
  // ... 其他字段
};

// 创建规则
const rule: Rule = {
  rule_id: "uuid-here",
  name: "Heurist API 规则",
  conditions: [
    {
      field: "domain",
      operator: "matches",
      value: "*.heurist.ai",
    },
  ],
  action: {
    category: "研发支出-API费",
  },
  priority: 100,
  enabled: true,
  version: 1,
  // ... 其他字段
};
```

---

## 注意事项

1. **精度安全**：所有金额字段使用 `BigIntString` 或 `DecimalString`，严禁使用 JS Number
2. **状态机**：严格遵循 `TransactionStatus` 枚举，不允许非法状态
3. **审计日志**：所有用户修改操作必须记录 `AuditLog`（append-only）
4. **可追溯性**：每笔 `CanonicalRecord` 必须可追溯到 `RawEvidence`
5. **最小敏感存储**：不存储签名/授权原文，只存储 hash/截断

---

**最后更新**：基于 PRD v1.0（金融级严谨增强版）
