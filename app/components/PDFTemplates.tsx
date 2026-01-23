/**
 * PDF 报表模板组件
 * 对应 PRD 第 11.2 节：月度 Statement PDF + 单笔 Receipt PDF
 * 使用 @react-pdf/renderer
 */

"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  MonthlyStatement,
  Receipt,
  CanonicalRecord,
} from "@/types";

/**
 * PDF 样式定义
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
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
      {/* 标题 */}
      <Text style={styles.title}>月度对账报表 - {statement.month}</Text>

      {/* Executive Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>执行摘要</Text>
        <View style={styles.row}>
          <Text style={styles.label}>总支出 (USDC):</Text>
          <Text style={styles.value}>{statement.executive_summary.total_usdc}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>总支出 (法币):</Text>
          <Text style={styles.value}>
            {statement.executive_summary.total_fiat} {statement.fx_currency}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>漏抓率:</Text>
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
        <Text style={styles.sectionTitle}>商户汇总</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>商户</Text>
            <Text style={styles.tableCell}>总金额</Text>
            <Text style={styles.tableCell}>笔数</Text>
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
          <Text style={styles.sectionTitle}>异常项</Text>
          {statement.exceptions.map((exc, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.label}>{exc.reason}:</Text>
              <Text style={styles.value}>{exc.count} 笔</Text>
            </View>
          ))}
        </View>
      )}

      {/* Gap Analysis */}
      {statement.gap_analysis.suspicious_expenses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>未识别支出预警</Text>
          <Text style={styles.value}>
            发现 {statement.gap_analysis.suspicious_expenses.length} 笔未捕获的链上支出
          </Text>
        </View>
      )}

      {/* 页脚 */}
      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={styles.value}>
          规则版本: {statement.rule_version} | FX 口径: {statement.fx_currency} | 生成时间: {new Date(statement.generated_at).toLocaleString("zh-CN")}
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
      <Text style={styles.title}>交易收据</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>商户:</Text>
          <Text style={styles.value}>{transaction.merchant_domain}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>金额:</Text>
          <Text style={styles.value}>
            {transaction.amount_decimal_str} {transaction.asset_symbol}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>网络:</Text>
          <Text style={styles.value}>{transaction.network}</Text>
        </View>
        {transaction.tx_hash && (
          <View style={styles.row}>
            <Text style={styles.label}>交易哈希:</Text>
            <Text style={styles.value}>{transaction.tx_hash}</Text>
          </View>
        )}
        {transaction.paid_at && (
          <View style={styles.row}>
            <Text style={styles.label}>支付时间:</Text>
            <Text style={styles.value}>
              {new Date(transaction.paid_at).toLocaleString("zh-CN")}
            </Text>
          </View>
        )}
        {transaction.description && (
          <View style={styles.row}>
            <Text style={styles.label}>描述:</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { marginTop: 30 }]}>
        <Text style={styles.value}>
          生成时间: {new Date(receipt.generated_at).toLocaleString("zh-CN")}
        </Text>
      </View>
    </Page>
  </Document>
);
