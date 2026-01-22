/**
 * Canonical Schema v2 核心类型定义
 * 对应 PRD 第 8 节：解析引擎与数据治理：增强版 Canonical Schema v2
 * 这是系统的"唯一真相表"
 */

import {
  TransactionStatus,
  Network,
  AssetSymbol,
  Decimals,
  BigIntString,
  DecimalString,
  ISODateTime,
  HashString,
  Confidence,
  UUID,
} from "./common";

/**
 * Canonical Record v2
 * 对应 PRD 第 8.3 节：Canonical Record v2（最终"唯一真相表"）
 * 
 * 字段组说明：
 * - 关联与证据：必须可追溯到 WAL/RawEvidence
 * - 业务识别：至少 domain + url 必填
 * - 支付要素：精度安全强制
 * - 角色地址：payee 必填，payer 尽力补全
 * - 链上凭证：有 tx_hash 必须校验一致性
 * - FX 与法币口径：有 paid_at 则尽量同步采集
 * - 会计归类：规则命中必须可解释
 * - 状态机与置信度：低置信必须可解释原因
 * - 安全最小化：只存 hash/截断，不存原文
 */
export interface CanonicalRecord {
  // ========== 关联与证据字段 ==========
  /** 事件唯一标识符（UUID） */
  event_id: UUID;
  /** 业务幂等关联令牌（Persistence Id） */
  persistence_id: string;
  /** 证据引用（指向 RawEvidence） */
  evidence_ref: string;
  /** Header 哈希 JSON（用于追溯） */
  header_hashes_json: string; // JSON 字符串

  // ========== 业务识别字段 ==========
  /** 商户域名（必填） */
  merchant_domain: string;
  /** 请求 URL（必填） */
  request_url: string;
  /** 描述信息 */
  description?: string;
  /** 订单 ID */
  order_id?: string;

  // ========== 支付要素字段 ==========
  /** 网络（Base, Ethereum 等） */
  network: Network;
  /** 资产符号（USDC, ETH 等） */
  asset_symbol: AssetSymbol;
  /** 小数位数 */
  decimals: Decimals;
  /** 金额（基础单位，BigInt 字符串） */
  amount_base_units_str: BigIntString;
  /** 金额（小数形式，Decimal 字符串） */
  amount_decimal_str: DecimalString;

  // ========== 角色地址字段 ==========
  /** 付款方钱包地址 */
  payer_wallet?: string;
  /** 收款方钱包地址（必填） */
  payee_wallet: string;
  /** 内部钱包别名（如"研发部 Agent-01"） */
  internal_wallet_alias?: string;
  /** 钱包实体 ID（多钱包归属） */
  wallet_entity_id?: UUID;

  // ========== 链上凭证字段 ==========
  /** 交易哈希 */
  tx_hash?: string;
  /** 支付时间（ISO 8601） */
  paid_at?: ISODateTime;
  /** 区块号 */
  block_number?: number;
  /** 验证时间（ISO 8601） */
  verified_at?: ISODateTime;

  // ========== FX 与法币口径字段 ==========
  /** 法币类型（USD, CNY 等，默认 USD） */
  fx_fiat_currency: string;
  /** 汇率快照（Decimal 字符串） */
  fx_rate?: DecimalString;
  /** 法币价值（amount_decimal * fx_rate） */
  fiat_value_at_time?: DecimalString;
  /** FX 来源标记（用于审计口径一致性） */
  fx_source?: string;
  /** FX 快照采集时间（尽量贴近 paid_at） */
  fx_captured_at?: ISODateTime;

  // ========== 会计归类字段 ==========
  /** 科目分类 */
  category?: string;
  /** 项目 */
  project?: string;
  /** 成本中心 */
  cost_center?: string;
  /** 应用的规则 ID */
  rule_id_applied?: UUID;

  // ========== 状态机与置信度字段 ==========
  /** 交易状态 */
  status: TransactionStatus;
  /** 置信度（0-100） */
  confidence?: Confidence;
  /** 需要审核的原因 */
  needs_review_reason?: string;

  // ========== 安全最小化字段 ==========
  /** 签名哈希（不存原文） */
  signature_hash?: HashString;
  /** 授权哈希（不存原文） */
  authorization_hash?: HashString;

  // ========== 元数据字段 ==========
  /** 创建时间 */
  created_at: ISODateTime;
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * RawEvidence（WAL 原始证据）
 * 对应 PRD 第 7.2 节：WAL（Write-Ahead Logging）与并发冲突
 * 用于存储浏览器扩展采集的原始数据
 */
export interface RawEvidence {
  /** 证据 ID */
  evidence_id: UUID;
  /** Persistence Id（业务幂等关联令牌） */
  persistence_id: string;
  /** 阶段（402/auth/receipt） */
  stage: "402" | "auth" | "receipt";
  /** 请求 URL */
  request_url: string;
  /** 请求方法 */
  request_method: string;
  /** Header 哈希（用于幂等去重） */
  header_hash: HashString;
  /** 白名单 Header 字段（JSON） */
  headers_json: string; // 仅存储白名单字段
  /** 捕获时间 */
  captured_at: ISODateTime;
  /** 是否已处理 */
  processed: boolean;
}
