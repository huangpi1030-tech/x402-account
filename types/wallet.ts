/**
 * 钱包相关类型定义
 * 对应 PRD 第 8.2 节：增加 FX Snapshot 与多钱包归属（会计价值锚点）
 * 对应 PRD 第 13 节：Web App 页面规格 - Onboarding（钱包绑定+别名+实体归属）
 */

import { UUID, ISODateTime, DecimalString } from "./common";

/**
 * 钱包实体类型
 * 对应 PRD 第 8.2 节：多钱包实体归属（公司/部门/个人）
 */
export type WalletEntityType = "company" | "department" | "individual";

/**
 * 钱包实体
 * 对应 PRD 第 8.2 节：wallet_entity_id（多钱包归属的实体维度）
 */
export interface WalletEntity {
  /** 实体 ID */
  entity_id: UUID;
  /** 实体名称 */
  name: string;
  /** 实体类型 */
  type: WalletEntityType;
  /** 父实体 ID（用于层级结构） */
  parent_entity_id?: UUID;
  /** 创建时间 */
  created_at: ISODateTime;
}

/**
 * 钱包配置
 * 对应 PRD 第 13 节：Onboarding（钱包绑定+别名+实体归属）
 */
export interface WalletConfig {
  /** 钱包地址 */
  wallet_address: string;
  /** 钱包别名（如"研发部 Agent-01"、"公司主钱包"） */
  alias: string;
  /** 关联的实体 ID */
  entity_id?: UUID;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  created_at: ISODateTime;
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * FX Snapshot（汇率快照）
 * 对应 PRD 第 8.2 节：增加 FX Snapshot 与多钱包归属
 * 用于记录交易时刻的汇率，满足审计口径一致性
 */
export interface FxSnapshot {
  /** 快照 ID */
  snapshot_id: UUID;
  /** 法币类型（USD, CNY 等） */
  fiat_currency: string;
  /** 汇率（Decimal 字符串） */
  fx_rate: DecimalString;
  /** FX 来源标记（用于审计口径一致性） */
  fx_source: string;
  /** 快照时间（尽量贴近交易时间） */
  captured_at: ISODateTime;
  /** 关联的交易时间（用于匹配） */
  transaction_time?: ISODateTime;
}
