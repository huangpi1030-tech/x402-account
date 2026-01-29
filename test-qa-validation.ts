/**
 * QA 测试验证脚本
 * 模拟用户操作，验证所有 PRD 验收点
 * 对应 PRD 第 15 节：验收标准（Definition of Done）
 */

import {
  CanonicalRecord,
  RawEvidence,
  TransactionStatus,
  Network,
  UUID,
  ISODateTime,
} from "./types";
import {
  saveCanonical,
  saveRawEvidence,
  getCanonicalByEventId,
  getCanonicalByPersistenceId,
  getAllCanonical,
  getAuditLogsByResourceId,
} from "./app/lib/storage";
import {
  bigIntToDecimal,
  decimalToBigInt,
  formatAmount,
  addAmounts,
  multiplyAmounts,
  validateAmountPrecision,
} from "./app/lib/decimal";
import {
  isValidStateTransition,
  transitionState,
  getStatusLabel,
} from "./app/lib/stateMachine";
import {
  applyTimeDecay,
  applyMultipleMatchPenalty,
  applyMissingFieldPenalty,
  needsReviewByConfidence,
  calculateFinalConfidence,
} from "./app/lib/confidence";
import { recordAuditLog } from "./app/lib/governance/audit";
import { generateMonthlyStatement, exportToCSV } from "./app/lib/reports/generator";
import { generateGapAnalysis } from "./app/lib/gapAnalysis";
import Decimal from "decimal.js";

/**
 * 测试结果
 */
interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const testResults: TestResult[] = [];

/**
 * 记录测试结果
 */
function recordTest(name: string, passed: boolean, message: string, details?: any) {
  testResults.push({ testName: name, passed, message, details });
  console.log(
    `[${passed ? "✓" : "✗"}] ${name}: ${message}${details ? `\n  详情: ${JSON.stringify(details, null, 2)}` : ""}`
  );
}

/**
 * 测试 1: 数据完整性 - Canonical 可追溯到 RawEvidence
 * 对应 PRD 第 15 节：数据完整性（每笔 Canonical 必可追溯到 RawEvidence）
 */
async function testDataIntegrity() {
  console.log("\n=== 测试 1: 数据完整性 ===");

  // 创建 RawEvidence
  const evidence: RawEvidence = {
    evidence_id: "evidence-test-001" as UUID,
    persistence_id: "persist-test-001",
    stage: "402",
    request_url: "https://api.example.com/test",
    request_method: "POST",
    header_hash: "header_hash_abc123" as any,
    headers_json: JSON.stringify({ "x-402-pay": "test" }),
    captured_at: new Date().toISOString() as ISODateTime,
    processed: false,
  };

  await saveRawEvidence(evidence);

  // 创建 CanonicalRecord，设置 evidence_ref
  const canonical: CanonicalRecord = {
    event_id: "event-test-001" as UUID,
    persistence_id: "persist-test-001",
    evidence_ref: evidence.evidence_id, // 关键：必须设置 evidence_ref
    header_hashes_json: JSON.stringify({ hash1: "abc123" }),

    merchant_domain: "api.example.com",
    request_url: "https://api.example.com/test",

    network: "base" as Network,
    asset_symbol: "USDC",
    decimals: 6,
    amount_base_units_str: "100000", // 0.1 USDC
    amount_decimal_str: "0.1",

    payee_wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",

    fx_fiat_currency: "USD",
    fx_rate: "1.0",
    fiat_value_at_time: "0.1",

    status: TransactionStatus.DETECTED,
    confidence: 90,

    created_at: new Date().toISOString() as ISODateTime,
    updated_at: new Date().toISOString() as ISODateTime,
  };

  await saveCanonical(canonical);

  // 验证：Canonical 的 evidence_ref 指向 RawEvidence
  const retrieved = await getCanonicalByEventId(canonical.event_id);
  if (!retrieved) {
    recordTest(
      "数据完整性 - Canonical 可追溯性",
      false,
      "无法检索到保存的 Canonical 记录"
    );
    return;
  }

  if (retrieved.evidence_ref !== evidence.evidence_id) {
    recordTest(
      "数据完整性 - Canonical 可追溯性",
      false,
      `evidence_ref 不匹配: 期望 ${evidence.evidence_id}, 实际 ${retrieved.evidence_ref}`
    );
    return;
  }

  recordTest(
    "数据完整性 - Canonical 可追溯性",
    true,
    `Canonical ${retrieved.event_id} 正确关联到 RawEvidence ${retrieved.evidence_ref}`
  );
}

/**
 * 测试 2: 精度安全 - 金额计算使用 BigInt/Decimal
 * 对应 PRD 第 15 节：精度（全流程 BigInt/Decimal；导出无科学计数法）
 */
async function testPrecisionSafety() {
  console.log("\n=== 测试 2: 精度安全 ===");

  // 测试 BigInt 转换
  const bigIntStr = "1000000"; // 1 USDC (6 decimals)
  const decimals = 6;
  const decimal = bigIntToDecimal(bigIntStr, decimals);
  const backToBigInt = decimalToBigInt(decimal, decimals);

  if (backToBigInt !== bigIntStr) {
    recordTest(
      "精度安全 - BigInt 转换",
      false,
      `BigInt 转换失败: 期望 ${bigIntStr}, 实际 ${backToBigInt}`
    );
  } else {
    recordTest("精度安全 - BigInt 转换", true, "BigInt ↔ Decimal 转换正确");
  }

  // 测试金额计算（使用 Decimal）
  const amount1 = "0.1";
  const amount2 = "0.2";
  const sum = addAmounts(amount1, amount2);
  const expectedSum = "0.3";

  if (sum !== expectedSum) {
    recordTest(
      "精度安全 - 金额加法",
      false,
      `金额加法失败: 期望 ${expectedSum}, 实际 ${sum}`
    );
  } else {
    recordTest("精度安全 - 金额加法", true, `金额加法正确: ${amount1} + ${amount2} = ${sum}`);
  }

  // 测试金额乘法
  const amount = "0.1";
  const rate = "1.5";
  const product = multiplyAmounts(amount, rate);
  const expectedProduct = "0.15";

  if (product !== expectedProduct) {
    recordTest(
      "精度安全 - 金额乘法",
      false,
      `金额乘法失败: 期望 ${expectedProduct}, 实际 ${product}`
    );
  } else {
    recordTest("精度安全 - 金额乘法", true, `金额乘法正确: ${amount} × ${rate} = ${product}`);
  }

  // 测试格式化（避免科学计数法）
  const largeAmount = "1234567890.123456";
  const formatted = formatAmount(largeAmount, 6);
  
  // 检查是否包含科学计数法（e/E）
  if (formatted.includes("e") || formatted.includes("E")) {
    recordTest(
      "精度安全 - 格式化（无科学计数法）",
      false,
      `格式化结果包含科学计数法: ${formatted}`
    );
  } else {
    recordTest("精度安全 - 格式化（无科学计数法）", true, `格式化正确: ${formatted}`);
  }

  // 测试 CSV 导出（无科学计数法）
  const testTransactions: CanonicalRecord[] = [
    {
      event_id: "event-csv-test" as UUID,
      persistence_id: "persist-csv-test",
      evidence_ref: "evidence-csv-test",
      header_hashes_json: "{}",
      merchant_domain: "test.com",
      request_url: "https://test.com",
      network: "base" as Network,
      asset_symbol: "USDC",
      decimals: 6,
      amount_base_units_str: "1000000",
      amount_decimal_str: "1.0",
      payee_wallet: "0x" + "a".repeat(40),
      fx_fiat_currency: "USD",
      status: TransactionStatus.DETECTED,
      created_at: new Date().toISOString() as ISODateTime,
      updated_at: new Date().toISOString() as ISODateTime,
    },
  ];

  const csv = exportToCSV(testTransactions);
  if (csv.includes("e") || csv.includes("E") || csv.includes("1e")) {
    recordTest(
      "精度安全 - CSV 导出（无科学计数法）",
      false,
      `CSV 导出包含科学计数法`
    );
  } else {
    recordTest("精度安全 - CSV 导出（无科学计数法）", true, "CSV 导出无科学计数法");
  }
}

/**
 * 测试 3: 状态机 - 状态转换规则
 * 对应 PRD 第 6 节：状态机
 */
async function testStateMachine() {
  console.log("\n=== 测试 3: 状态机 ===");

  // 测试合法状态转换
  const validTransitions = [
    { from: TransactionStatus.PENDING, to: TransactionStatus.DETECTED },
    { from: TransactionStatus.DETECTED, to: TransactionStatus.SETTLED },
    { from: TransactionStatus.SETTLED, to: TransactionStatus.ONCHAIN_VERIFIED },
    { from: TransactionStatus.ONCHAIN_VERIFIED, to: TransactionStatus.ACCOUNTED },
  ];

  for (const { from, to } of validTransitions) {
    if (!isValidStateTransition(from, to)) {
      recordTest(
        `状态机 - 合法转换 ${from} → ${to}`,
        false,
        "应该允许此状态转换"
      );
    } else {
      recordTest(
        `状态机 - 合法转换 ${from} → ${to}`,
        true,
        "状态转换验证通过"
      );
    }
  }

  // 测试非法状态转换
  const invalidTransitions = [
    { from: TransactionStatus.PENDING, to: TransactionStatus.ACCOUNTED },
    { from: TransactionStatus.ACCOUNTED, to: TransactionStatus.PENDING },
  ];

  for (const { from, to } of invalidTransitions) {
    if (isValidStateTransition(from, to)) {
      recordTest(
        `状态机 - 非法转换 ${from} → ${to}`,
        false,
        "不应该允许此状态转换"
      );
    } else {
      recordTest(
        `状态机 - 非法转换 ${from} → ${to}`,
        true,
        "正确拒绝非法状态转换"
      );
    }
  }

  // 测试状态转换函数
  const result = transitionState(TransactionStatus.PENDING, TransactionStatus.DETECTED);
  if (result !== TransactionStatus.DETECTED) {
    recordTest("状态机 - 状态转换函数", false, `状态转换失败: 期望 DETECTED, 实际 ${result}`);
  } else {
    recordTest("状态机 - 状态转换函数", true, "状态转换函数工作正常");
  }
}

/**
 * 测试 4: 置信度计算
 * 对应 PRD 第 9.2 节：置信度衰减算法
 */
async function testConfidenceCalculation() {
  console.log("\n=== 测试 4: 置信度计算 ===");

  // 测试时间差衰减
  const httpTime = new Date().toISOString() as ISODateTime;
  const blockTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() as ISODateTime; // 10 分钟前
  const baseConfidence = 90;

  const decayed = applyTimeDecay(httpTime, blockTime, baseConfidence);
  if (decayed >= baseConfidence) {
    recordTest(
      "置信度 - 时间差衰减",
      false,
      `时间差超过 5 分钟，置信度应该降低: 基础 ${baseConfidence}, 实际 ${decayed}`
    );
  } else {
    recordTest(
      "置信度 - 时间差衰减",
      true,
      `时间差衰减正确: ${baseConfidence} → ${decayed}`
    );
  }

  // 测试多命中惩罚
  const matchCount = 3;
  const penalized = applyMultipleMatchPenalty(baseConfidence, matchCount);
  const expectedPenalty = (matchCount - 1) * 15; // 每条惩罚 15
  const expectedConfidence = Math.max(baseConfidence - expectedPenalty, 0);

  if (Math.abs(penalized - expectedConfidence) > 1) {
    recordTest(
      "置信度 - 多命中惩罚",
      false,
      `多命中惩罚不正确: 期望约 ${expectedConfidence}, 实际 ${penalized}`
    );
  } else {
    recordTest(
      "置信度 - 多命中惩罚",
      true,
      `多命中惩罚正确: ${baseConfidence} → ${penalized} (${matchCount} 条匹配)`
    );
  }

  // 测试字段缺失惩罚
  const missingFields = ["payer_wallet", "tx_hash"];
  const { confidence: fieldPenalized, reason } = applyMissingFieldPenalty(
    baseConfidence,
    missingFields
  );

  if (fieldPenalized >= baseConfidence) {
    recordTest(
      "置信度 - 字段缺失惩罚",
      false,
      `关键字段缺失，置信度应该降低: 基础 ${baseConfidence}, 实际 ${fieldPenalized}`
    );
  } else {
    recordTest(
      "置信度 - 字段缺失惩罚",
      true,
      `字段缺失惩罚正确: ${baseConfidence} → ${fieldPenalized}, 原因: ${reason}`
    );
  }

  // 测试置信度阈值判断
  const lowConfidence = 50;
  const highConfidence = 80;

  if (!needsReviewByConfidence(lowConfidence)) {
    recordTest(
      "置信度 - 阈值判断",
      false,
      `低置信度 ${lowConfidence} 应该需要审核`
    );
  } else {
    recordTest("置信度 - 阈值判断", true, `低置信度 ${lowConfidence} 正确标记为需要审核`);
  }

  if (needsReviewByConfidence(highConfidence)) {
    recordTest(
      "置信度 - 阈值判断",
      false,
      `高置信度 ${highConfidence} 不应该需要审核`
    );
  } else {
    recordTest("置信度 - 阈值判断", true, `高置信度 ${highConfidence} 正确标记为不需要审核`);
  }
}

/**
 * 测试 5: 审计日志
 * 对应 PRD 第 12.2 节：审计日志（Audit Trail）
 */
async function testAuditLog() {
  console.log("\n=== 测试 5: 审计日志 ===");

  const eventId = "event-audit-test" as UUID;
  const operator = "test-user";

  // 记录审计日志
  await recordAuditLog(
    "transaction",
    eventId,
    "update_category",
    operator,
    {
      before: { category: "旧分类" },
      after: { category: "新分类" },
      reason: "测试审计日志",
    }
  );

  // 查询审计日志
  const logs = await getAuditLogsByResourceId(eventId);
  if (logs.length === 0) {
    recordTest("审计日志 - 记录和查询", false, "无法查询到审计日志");
    return;
  }

  const log = logs[0];
  if (log.resource_id !== eventId || log.operator !== operator) {
    recordTest(
      "审计日志 - 记录和查询",
      false,
      `审计日志信息不匹配: 期望 resource_id=${eventId}, operator=${operator}`
    );
    return;
  }

  recordTest(
    "审计日志 - 记录和查询",
    true,
    `审计日志正确记录: ${logs.length} 条记录，操作人: ${log.operator}`
  );

  // 验证 append-only（再次记录，应该增加而不是覆盖）
  await recordAuditLog(
    "transaction",
    eventId,
    "update_category",
    operator,
    {
      before: { category: "新分类" },
      after: { category: "更新分类" },
      reason: "第二次测试",
    }
  );

  const logsAfter = await getAuditLogsByResourceId(eventId);
  if (logsAfter.length <= logs.length) {
    recordTest(
      "审计日志 - Append-only",
      false,
      `审计日志应该追加而不是覆盖: 之前 ${logs.length} 条，之后 ${logsAfter.length} 条`
    );
  } else {
    recordTest(
      "审计日志 - Append-only",
      true,
      `审计日志正确追加: ${logs.length} → ${logsAfter.length} 条`
    );
  }
}

/**
 * 测试 6: 报表生成 - Gap Analysis 和版本引用
 * 对应 PRD 第 11 节：报表与闭环
 */
async function testReportGeneration() {
  console.log("\n=== 测试 6: 报表生成 ===");

  // 生成月度报表
  const month = "2024-01";
  const ruleVersion = 1;
  const fxCurrency = "USD";
  const walletAddress = "0x" + "a".repeat(40);

  const statement = await generateMonthlyStatement(
    month,
    ruleVersion,
    fxCurrency,
    walletAddress
  );

  // 验证 Gap Analysis
  if (!statement.gap_analysis) {
    recordTest("报表生成 - Gap Analysis", false, "月报缺少 Gap Analysis");
  } else {
    recordTest(
      "报表生成 - Gap Analysis",
      true,
      `Gap Analysis 存在: 漏抓率 ${statement.gap_analysis.gap_rate}, 可疑支出 ${statement.gap_analysis.suspicious_expenses.length} 条`
    );
  }

  // 验证规则版本引用
  if (statement.rule_version !== ruleVersion) {
    recordTest(
      "报表生成 - 规则版本引用",
      false,
      `规则版本不匹配: 期望 ${ruleVersion}, 实际 ${statement.rule_version}`
    );
  } else {
    recordTest(
      "报表生成 - 规则版本引用",
      true,
      `规则版本正确引用: ${statement.rule_version}`
    );
  }

  // 验证 FX 口径引用
  if (statement.fx_currency !== fxCurrency) {
    recordTest(
      "报表生成 - FX 口径引用",
      false,
      `FX 口径不匹配: 期望 ${fxCurrency}, 实际 ${statement.fx_currency}`
    );
  } else {
    recordTest("报表生成 - FX 口径引用", true, `FX 口径正确引用: ${statement.fx_currency}`);
  }

  // 验证 Executive Summary 包含 gap_rate
  if (statement.executive_summary.gap_rate === undefined) {
    recordTest("报表生成 - Executive Summary gap_rate", false, "Executive Summary 缺少 gap_rate");
  } else {
    recordTest(
      "报表生成 - Executive Summary gap_rate",
      true,
      `Executive Summary 包含 gap_rate: ${statement.executive_summary.gap_rate}`
    );
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log("========================================");
  console.log("QA 测试验证 - 开始");
  console.log("========================================");

  try {
    await testDataIntegrity();
    await testPrecisionSafety();
    await testStateMachine();
    await testConfidenceCalculation();
    await testAuditLog();
    await testReportGeneration();

    // 汇总结果
    console.log("\n========================================");
    console.log("测试结果汇总");
    console.log("========================================");

    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;
    const total = testResults.length;

    console.log(`总计: ${total} 项测试`);
    console.log(`通过: ${passed} 项`);
    console.log(`失败: ${failed} 项`);
    console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n失败的测试:");
      testResults
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ✗ ${r.testName}: ${r.message}`);
        });
    }

    console.log("\n========================================");
  } catch (error) {
    console.error("测试执行出错:", error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests();
}

export { runAllTests, testResults };
