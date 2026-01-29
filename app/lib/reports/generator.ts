/**
 * 报表生成模块
 * 对应 PRD 第 11 节：报表与闭环：Gap Analysis（缺口分析）加入月报
 */

import {
  MonthlyStatement,
  ExecutiveSummary,
  VendorBreakdown,
  CategoryCostCenterBreakdown,
  ExceptionItem,
  GapAnalysis,
  CanonicalRecord,
  DecimalString,
} from "@/types";
import { getAllCanonical, getCanonicalByTimeRange } from "@/app/lib/storage";
import { addAmounts } from "../decimal";
import { generateGapAnalysis } from "../gapAnalysis";
import Decimal from "decimal.js";

/**
 * 生成月度 Statement
 * 对应 PRD 第 11.2 节：月度 Statement 结构（P0）
 */
export async function generateMonthlyStatement(
  month: string, // YYYY-MM
  ruleVersion: number,
  fxCurrency: string,
  walletAddress?: string
): Promise<MonthlyStatement> {
  // 计算月份的开始和结束时间
  const [year, monthNum] = month.split("-").map(Number);
  const startTime = new Date(year, monthNum - 1, 1).toISOString();
  const endTime = new Date(year, monthNum, 0, 23, 59, 59, 999).toISOString();

  // 获取该月的所有交易记录
  const transactions = await getCanonicalByTimeRange(
    startTime,
    endTime
  );

  // 生成各个章节
  const executiveSummary = generateExecutiveSummary(transactions);
  const vendorBreakdown = generateVendorBreakdown(transactions);
  const categoryBreakdown = generateCategoryBreakdown(transactions);
  const exceptions = generateExceptions(transactions);

  // 生成 Gap Analysis（如果提供了钱包地址）
  let gapAnalysis: GapAnalysis;
  if (walletAddress) {
    gapAnalysis = await generateGapAnalysis(
      walletAddress,
      startTime,
      endTime
    );
  } else {
    gapAnalysis = {
      gap_rate: 0,
      suspicious_expenses: [],
      analyzed_at: new Date().toISOString(),
    };
  }

  return {
    statement_id: `stmt_${month}_${Date.now()}`,
    month,
    executive_summary: {
      ...executiveSummary,
      gap_rate: gapAnalysis.gap_rate,
    },
    vendor_breakdown: vendorBreakdown,
    category_cost_center_breakdown: categoryBreakdown,
    exceptions,
    gap_analysis: gapAnalysis,
    rule_version: ruleVersion,
    fx_currency: fxCurrency,
    generated_at: new Date().toISOString(),
  };
}

/**
 * 生成 Executive Summary
 */
function generateExecutiveSummary(
  transactions: CanonicalRecord[]
): ExecutiveSummary {
  // 计算总支出
  let totalUsdc: DecimalString = "0";
  let totalFiat: DecimalString = "0";

  for (const tx of transactions) {
    totalUsdc = addAmounts(totalUsdc, tx.amount_decimal_str);
    if (tx.fiat_value_at_time) {
      totalFiat = addAmounts(totalFiat, tx.fiat_value_at_time);
    }
  }

  // 计算 Top Vendors
  const vendorMap = new Map<string, { amount: DecimalString; count: number }>();
  for (const tx of transactions) {
    const vendor = tx.merchant_domain;
    const existing = vendorMap.get(vendor) || { amount: "0", count: 0 };
    vendorMap.set(vendor, {
      amount: addAmounts(existing.amount, tx.amount_decimal_str),
      count: existing.count + 1,
    });
  }

  const topVendors = Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => {
      // 使用 Decimal 进行比较，避免精度问题
      const aDecimal = new Decimal(a.amount);
      const bDecimal = new Decimal(b.amount);
      return bDecimal.comparedTo(aDecimal);
    })
    .slice(0, 5);

  // 计算 Top Categories
  const categoryMap = new Map<string, { amount: DecimalString; count: number }>();
  for (const tx of transactions) {
    const category = tx.category || "未分类";
    const existing = categoryMap.get(category) || { amount: "0", count: 0 };
    categoryMap.set(category, {
      amount: addAmounts(existing.amount, tx.amount_decimal_str),
      count: existing.count + 1,
    });
  }

  const topCategories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => {
      // 使用 Decimal 进行比较，避免精度问题
      const aDecimal = new Decimal(a.amount);
      const bDecimal = new Decimal(b.amount);
      return bDecimal.comparedTo(aDecimal);
    })
    .slice(0, 5);

  return {
    total_usdc: totalUsdc,
    total_fiat: totalFiat || totalUsdc, // 如果没有法币价值，使用 USDC
    gap_rate: 0, // 将在调用时设置
    top_vendors: topVendors,
    top_categories: topCategories,
  };
}

/**
 * 生成 Vendor Breakdown
 */
function generateVendorBreakdown(
  transactions: CanonicalRecord[]
): VendorBreakdown[] {
  const vendorMap = new Map<string, { amount: DecimalString; count: number }>();

  for (const tx of transactions) {
    const vendor = tx.merchant_domain;
    const existing = vendorMap.get(vendor) || { amount: "0", count: 0 };
    vendorMap.set(vendor, {
      amount: addAmounts(existing.amount, tx.amount_decimal_str),
      count: existing.count + 1,
    });
  }

  return Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      sum: data.amount,
      count: data.count,
    }))
    .sort((a, b) => {
      // 使用 Decimal 进行比较，避免精度问题
      const aDecimal = new Decimal(a.sum);
      const bDecimal = new Decimal(b.sum);
      return bDecimal.comparedTo(aDecimal);
    });
}

/**
 * 生成 Category/Cost Center Breakdown
 */
function generateCategoryBreakdown(
  transactions: CanonicalRecord[]
): CategoryCostCenterBreakdown[] {
  const breakdownMap = new Map<
    string,
    { amount: DecimalString; count: number }
  >();

  for (const tx of transactions) {
    const key = `${tx.category || "未分类"}|${tx.cost_center || "未分类"}`;
    const existing = breakdownMap.get(key) || { amount: "0", count: 0 };
    breakdownMap.set(key, {
      amount: addAmounts(existing.amount, tx.amount_decimal_str),
      count: existing.count + 1,
    });
  }

  return Array.from(breakdownMap.entries())
    .map(([key, data]) => {
      const [category, costCenter] = key.split("|");
      return {
        category: category !== "未分类" ? category : undefined,
        cost_center: costCenter !== "未分类" ? costCenter : undefined,
        sum: data.amount,
        count: data.count,
      };
    })
    .sort((a, b) => {
      // 使用 Decimal 进行比较，避免精度问题
      const aDecimal = new Decimal(a.sum);
      const bDecimal = new Decimal(b.sum);
      return bDecimal.comparedTo(aDecimal);
    });
}

/**
 * 生成 Exceptions
 */
function generateExceptions(transactions: CanonicalRecord[]): ExceptionItem[] {
  const exceptionMap = new Map<string, number>();

  for (const tx of transactions) {
    // needs_review
    if (tx.status === "needs_review") {
      const reason = tx.needs_review_reason || "需要审核";
      exceptionMap.set(`needs_review: ${reason}`, (exceptionMap.get(`needs_review: ${reason}`) || 0) + 1);
    }

    // unmatched（无 tx_hash）
    if (!tx.tx_hash) {
      exceptionMap.set("unmatched: 无链上交易哈希", (exceptionMap.get("unmatched: 无链上交易哈希") || 0) + 1);
    }

    // 校验失败（低置信度）
    if (tx.confidence !== undefined && tx.confidence < 60) {
      exceptionMap.set(`校验失败: 置信度 ${tx.confidence}%`, (exceptionMap.get(`校验失败: 置信度 ${tx.confidence}%`) || 0) + 1);
    }
  }

  return Array.from(exceptionMap.entries()).map(([reason, count]) => ({
    reason,
    count,
  }));
}

/**
 * 导出 CSV（明细数据，无科学计数法）
 * 对应 PRD 第 11.2 节：CSV 导出功能
 */
export function exportToCSV(transactions: CanonicalRecord[]): string {
  // CSV 表头
  const headers = [
    "事件ID",
    "商户域名",
    "金额",
    "资产",
    "网络",
    "状态",
    "支付时间",
    "交易哈希",
    "分类",
    "项目",
    "成本中心",
  ];

  // CSV 数据行
  const rows = transactions.map((tx) => [
    tx.event_id,
    tx.merchant_domain,
    tx.amount_decimal_str, // 使用 Decimal 字符串，避免科学计数法
    tx.asset_symbol,
    tx.network,
    tx.status,
    tx.paid_at || "",
    tx.tx_hash || "",
    tx.category || "",
    tx.project || "",
    tx.cost_center || "",
  ]);

  // 组合 CSV
  const csvLines = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))];

  return csvLines.join("\n");
}
