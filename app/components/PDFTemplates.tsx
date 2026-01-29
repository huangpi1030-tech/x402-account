/**
 * PDF 报表模板组件
 * 对应 PRD 第 11.2 节：月度 Statement PDF + 单笔 Receipt PDF
 * 使用 @react-pdf/renderer
 * 
 * 注意：@react-pdf/renderer 默认不支持中文，需要配置中文字体
 * 解决方案：
 * 1. 下载中文字体文件（如 Noto Sans SC）到 public/fonts/ 目录
 * 2. 使用 Font.register() 注册字体
 * 3. 在样式中使用注册的字体族名
 * 
 * 当前使用 Helvetica 作为基础字体，中文可能显示为方块
 * 临时解决方案：使用英文标签或拼音，或等待中文字体配置
 */

"use client";

import React, { useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  MonthlyStatement,
  Receipt,
  CanonicalRecord,
} from "@/types";

/**
 * 注册中文字体
 * 支持方案：
 * 1. 使用本地字体文件（推荐）：将字体文件放到 public/fonts/ 目录
 * 2. 使用在线字体 URL：从 CDN 加载字体
 */
let fontRegistered = false;

const registerChineseFont = () => {
  if (fontRegistered) return;

  try {
    // 方案一：使用本地字体文件（如果存在）
    // 注意：需要将字体文件放到 public/fonts/ 目录
    Font.register({
      family: "NotoSansSC",
      fonts: [
        {
          src: "/fonts/NotoSansSC-Regular.ttf",
          fontWeight: "normal",
        },
        {
          src: "/fonts/NotoSansSC-Bold.ttf",
          fontWeight: "bold",
        },
      ],
    });
    fontRegistered = true;
  } catch (error) {
    // 方案二：如果本地文件不存在，尝试使用在线字体
    try {
      Font.register({
        family: "NotoSansSC",
        fonts: [
          {
            src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeALhLp0Tszw.woff2",
            fontWeight: "normal",
          },
          {
            src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kPo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnY8.woff2",
            fontWeight: "bold",
          },
        ],
      });
      fontRegistered = true;
    } catch (onlineError) {
      // 字体注册失败，使用默认字体
    }
  }
};

// 在组件加载时注册字体
if (typeof window !== "undefined") {
  registerChineseFont();
}

/**
 * PDF 样式定义
 * 使用 NotoSansSC 字体支持中文显示
 * 如果字体未注册，会回退到 Helvetica（中文可能显示为方块）
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "NotoSansSC", // 使用中文字体
    // 如果字体未注册，会回退到系统默认字体
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: "1pt solid #000",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  transactionRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #eee",
    paddingVertical: 4,
    fontSize: 9,
  },
  transactionCell: {
    flex: 1,
    paddingHorizontal: 3,
  },
});

/**
 * 月度 Statement PDF 模板
 * 对应 PRD 第 11.2 节：月度 Statement 结构
 */
export const MonthlyStatementPDF = ({
  statement,
}: {
  statement: MonthlyStatement;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 标题 - 使用英文避免乱码 */}
      <Text style={styles.title}>
        Monthly Statement - {statement.month}
      </Text>

      {/* Executive Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total USDC:</Text>
          <Text style={styles.value}>{statement.executive_summary.total_usdc}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Fiat:</Text>
          <Text style={styles.value}>
            {statement.executive_summary.total_fiat} {statement.fx_currency}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gap Rate:</Text>
          <Text style={styles.value}>
            {(statement.executive_summary.gap_rate * 100).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Top Vendors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 商户</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>商户</Text>
            <Text style={styles.tableCell}>金额</Text>
            <Text style={styles.tableCell}>笔数</Text>
          </View>
          {statement.executive_summary.top_vendors.map((vendor, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{vendor.vendor}</Text>
              <Text style={styles.tableCell}>{vendor.amount}</Text>
              <Text style={styles.tableCell}>{vendor.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 分类</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>分类</Text>
            <Text style={styles.tableCell}>金额</Text>
            <Text style={styles.tableCell}>笔数</Text>
          </View>
          {statement.executive_summary.top_categories.map((cat, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{cat.category}</Text>
              <Text style={styles.tableCell}>{cat.amount}</Text>
              <Text style={styles.tableCell}>{cat.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vendor Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendor Breakdown</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Vendor</Text>
            <Text style={styles.tableCell}>Total</Text>
            <Text style={styles.tableCell}>Count</Text>
          </View>
          {statement.vendor_breakdown.slice(0, 10).map((vendor, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{vendor.vendor}</Text>
              <Text style={styles.tableCell}>{vendor.sum}</Text>
              <Text style={styles.tableCell}>{vendor.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Exceptions */}
      {statement.exceptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exceptions</Text>
          {statement.exceptions.map((exc, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.label}>{exc.reason}:</Text>
              <Text style={styles.value}>{exc.count} items</Text>
            </View>
          ))}
        </View>
      )}

      {/* Gap Analysis */}
      {statement.gap_analysis.suspicious_expenses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suspicious Expenses Alert</Text>
          <Text style={styles.value}>
            Found {statement.gap_analysis.suspicious_expenses.length} uncaptured on-chain expenses
          </Text>
        </View>
      )}

      {/* 页脚 */}
      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={styles.value}>
          Rule Version: {statement.rule_version} | FX Currency: {statement.fx_currency} | Generated: {new Date(statement.generated_at).toLocaleString("en-US")}
        </Text>
      </View>
    </Page>
  </Document>
);

/**
 * 交易明细 PDF 模板（按时间范围导出所有交易）
 * 类似银行月账单，每一笔交易都清晰列出
 */
export const TransactionListPDF = ({
  transactions,
  title = "Transaction List",
  startDate,
  endDate,
}: {
  transactions: CanonicalRecord[];
  title?: string;
  startDate?: string;
  endDate?: string;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 标题 */}
      <Text style={styles.title}>
        {title}
        {startDate && endDate && ` (${startDate} to ${endDate})`}
      </Text>

      {/* 统计信息 */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Transactions:</Text>
          <Text style={styles.value}>{transactions.length}</Text>
        </View>
        {startDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{startDate}</Text>
          </View>
        )}
        {endDate && (
          <View style={styles.row}>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{endDate}</Text>
          </View>
        )}
      </View>

      {/* 交易明细表格 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        <View style={styles.table}>
          {/* 表头 */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.transactionCell, { flex: 0.5 }]}>Date</Text>
            <Text style={[styles.transactionCell, { flex: 1.5 }]}>Merchant</Text>
            <Text style={[styles.transactionCell, { flex: 1 }]}>Amount</Text>
            <Text style={[styles.transactionCell, { flex: 0.8 }]}>Asset</Text>
            <Text style={[styles.transactionCell, { flex: 0.7 }]}>Status</Text>
            <Text style={[styles.transactionCell, { flex: 1 }]}>Category</Text>
          </View>
          {/* 交易行 */}
          {transactions.map((tx, idx) => (
            <View key={tx.event_id || idx} style={styles.transactionRow}>
              <Text style={[styles.transactionCell, { flex: 0.5 }]}>
                {tx.paid_at
                  ? new Date(tx.paid_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "-"}
              </Text>
              <Text style={[styles.transactionCell, { flex: 1.5 }]}>
                {tx.merchant_domain || "-"}
              </Text>
              <Text style={[styles.transactionCell, { flex: 1 }]}>
                {tx.amount_decimal_str}
              </Text>
              <Text style={[styles.transactionCell, { flex: 0.8 }]}>
                {tx.asset_symbol}
              </Text>
              <Text style={[styles.transactionCell, { flex: 0.7 }]}>
                {tx.status}
              </Text>
              <Text style={[styles.transactionCell, { flex: 1 }]}>
                {tx.category || "-"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 页脚 */}
      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={styles.value}>
          Generated: {new Date().toLocaleString("en-US")}
        </Text>
      </View>
    </Page>
  </Document>
);

/**
 * 单笔 Receipt PDF 模板
 * 对应 PRD 核心交付：单笔 Receipt PDF
 */
export const ReceiptPDF = ({
  receipt,
  transaction,
}: {
  receipt: Receipt;
  transaction: CanonicalRecord;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Transaction Receipt</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Merchant:</Text>
          <Text style={styles.value}>{transaction.merchant_domain}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>
            {transaction.amount_decimal_str} {transaction.asset_symbol}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Network:</Text>
          <Text style={styles.value}>{transaction.network}</Text>
        </View>
        {transaction.tx_hash && (
          <View style={styles.row}>
            <Text style={styles.label}>Tx Hash:</Text>
            <Text style={styles.value}>{transaction.tx_hash}</Text>
          </View>
        )}
        {transaction.paid_at && (
          <View style={styles.row}>
            <Text style={styles.label}>Paid At:</Text>
            <Text style={styles.value}>
              {new Date(transaction.paid_at).toLocaleString("en-US")}
            </Text>
          </View>
        )}
        {transaction.description && (
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={styles.value}>
          Generated: {new Date(receipt.generated_at).toLocaleString("en-US")}
        </Text>
      </View>
    </Page>
  </Document>
);
