/**
 * 报表相关类型定义
 * 对应 PRD 第 11 节：报表与闭环：Gap Analysis（缺口分析）加入月报
 */

import { DecimalString, ISODateTime, UUID } from "./common";

/**
 * Gap Analysis（缺口分析）
 * 对应 PRD 第 11.1 节：Gap Analysis（P0）
 * 用于发现漏抓支出：对比钱包全量 Transfer Events vs 插件捕获的 X402 Canonical
 */
export interface GapAnalysis {
  /** 漏抓率（0-1，如 0.05 表示 5%） */
  gap_rate: number;
  /** 可疑支出列表（未被捕获但链上存在） */
  suspicious_expenses: SuspiciousExpense[];
  /** 分析时间 */
  analyzed_at: ISODateTime;
}

/**
 * 可疑支出
 * 对应 PRD 第 11.2 节：Gap Analysis 章节
 */
export interface SuspiciousExpense {
  /** 交易哈希 */
  tx_hash: string;
  /** 收款地址 */
  to: string;
  /** 金额（Decimal 字符串） */
  value: DecimalString;
  /** 时间 */
  time: ISODateTime;
  /** 网络 */
  network: string;
}

/**
 * Executive Summary（执行摘要）
 * 对应 PRD 第 11.2 节：月度 Statement 结构 - Executive Summary
 */
export interface ExecutiveSummary {
  /** 总支出（USDC，Decimal 字符串） */
  total_usdc: DecimalString;
  /** 总支出（法币，Decimal 字符串） */
  total_fiat: DecimalString;
  /** 漏抓率 */
  gap_rate: number;
  /** Top Vendor（按金额排序） */
  top_vendors: Array<{
    vendor: string;
    amount: DecimalString;
    count: number;
  }>;
  /** Top Category（按金额排序） */
  top_categories: Array<{
    category: string;
    amount: DecimalString;
    count: number;
  }>;
}

/**
 * Vendor Breakdown（商户汇总）
 * 对应 PRD 第 11.2 节：月度 Statement 结构 - Vendor Breakdown
 */
export interface VendorBreakdown {
  /** 商户域名 */
  vendor: string;
  /** 总金额 */
  sum: DecimalString;
  /** 交易笔数 */
  count: number;
}

/**
 * Category/Cost Center（科目/部门汇总）
 * 对应 PRD 第 11.2 节：月度 Statement 结构 - Category/Cost Center
 */
export interface CategoryCostCenterBreakdown {
  /** 科目 */
  category?: string;
  /** 成本中心 */
  cost_center?: string;
  /** 总金额 */
  sum: DecimalString;
  /** 交易笔数 */
  count: number;
}

/**
 * Exceptions（异常项）
 * 对应 PRD 第 11.2 节：月度 Statement 结构 - Exceptions
 */
export interface ExceptionItem {
  /** 异常原因 */
  reason: string;
  /** 数量 */
  count: number;
}

/**
 * 月度 Statement
 * 对应 PRD 第 11.2 节：月度 Statement 结构（P0）
 */
export interface MonthlyStatement {
  /** 报表 ID */
  statement_id: UUID;
  /** 月份（YYYY-MM） */
  month: string;
  /** Executive Summary */
  executive_summary: ExecutiveSummary;
  /** Vendor Breakdown 列表 */
  vendor_breakdown: VendorBreakdown[];
  /** Category/Cost Center 汇总 */
  category_cost_center_breakdown: CategoryCostCenterBreakdown[];
  /** Exceptions 列表 */
  exceptions: ExceptionItem[];
  /** Gap Analysis */
  gap_analysis: GapAnalysis;
  /** 规则版本（报表引用规则版本） */
  rule_version: number;
  /** FX 口径（用于审计） */
  fx_currency: string;
  /** 生成时间 */
  generated_at: ISODateTime;
}

/**
 * Receipt（单笔收据）
 * 对应 PRD 核心交付：单笔 Receipt PDF
 */
export interface Receipt {
  /** 收据 ID */
  receipt_id: UUID;
  /** 关联的 Canonical Record ID */
  canonical_id: UUID;
  /** 商户域名 */
  merchant_domain: string;
  /** 金额 */
  amount: DecimalString;
  /** 资产符号 */
  asset_symbol: string;
  /** 网络 */
  network: string;
  /** 交易哈希 */
  tx_hash?: string;
  /** 支付时间 */
  paid_at?: ISODateTime;
  /** 生成时间 */
  generated_at: ISODateTime;
}
