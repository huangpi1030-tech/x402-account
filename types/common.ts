/**
 * 基础类型定义
 * 对应 PRD 第 6 节：状态机
 * 对应 PRD 第 8.1 节：精度与大数安全
 */

/**
 * 交易状态枚举
 * 对应 PRD 第 6 节：状态机（金融级严谨：可审计、可回滚）
 * 7 个状态：pending, detected, settled, verifying, onchain_verified, needs_review, accounted
 */
export enum TransactionStatus {
  /** 已捕获原始快照但未完成解析 */
  PENDING = "pending",
  /** 已生成 Canonical Record（含金额/网络/收款方等） */
  DETECTED = "detected",
  /** 已拿到支付回执或可确认"已支付意图" */
  SETTLED = "settled",
  /** 正在链上验证/归因 */
  VERIFYING = "verifying",
  /** tx_hash 与链上事件匹配通过 */
  ONCHAIN_VERIFIED = "onchain_verified",
  /** 低置信/冲突/缺字段需人工确认 */
  NEEDS_REVIEW = "needs_review",
  /** 已归类、可入账、可汇总报表 */
  ACCOUNTED = "accounted",
}

/**
 * 网络类型
 * P0 支持 Base，后续可扩展
 */
export type Network = "base" | "ethereum" | "polygon" | "arbitrum";

/**
 * 资产符号
 * 如：USDC, ETH, DAI 等
 */
export type AssetSymbol = string;

/**
 * 小数位数
 * 用于精度计算
 */
export type Decimals = number;

/**
 * 精度安全类型
 * 对应 PRD 第 8.1 节：精度与大数安全（P0 强制）
 * 严禁使用 JS Number 进行金额计算
 * - amount_base_units 用 BigInt
 * - amount_decimal 用 Decimal（如 Decimal.js）
 * - 所有导出必须字符串化并固定小数位策略
 */
export type BigIntString = string; // BigInt 的字符串表示
export type DecimalString = string; // Decimal 的字符串表示，避免科学计数法

/**
 * 时间戳类型
 */
export type ISODateTime = string; // ISO 8601 格式：2024-01-15T14:32:15Z
export type UnixTimestamp = number; // Unix 时间戳（秒）

/**
 * UUID 类型
 */
export type UUID = string;

/**
 * 哈希类型（用于签名、授权等敏感信息的 hash）
 * 对应 PRD 第 8.3 节：安全最小化字段
 * 只存 hash/截断，不存原文
 */
export type HashString = string; // 通常是 64 字符的十六进制字符串

/**
 * 置信度（0-100）
 * 对应 PRD 第 9.2 节：置信度衰减算法
 * confidence < 60 强制进入 needs_review
 */
export type Confidence = number; // 0-100
