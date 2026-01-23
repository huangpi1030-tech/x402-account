/**
 * 规则引擎
 * 对应 PRD 第 10 节：会计规则引擎（Rules Engine）：批量映射与可解释性
 */

import {
  Rule,
  RuleCondition,
  RuleAction,
  RuleMatchResult,
  RuleOperator,
  RuleConditionField,
} from "@/types";
import { CanonicalRecord, TransactionStatus, Network } from "@/types";
import { multiplyAmounts } from "../decimal";

/**
 * 规则条件匹配函数
 * 对应 PRD 第 10.1 节：规则条件（domain/path/description/amount/network/status 等）
 */
export function matchCondition(
  condition: RuleCondition,
  transaction: CanonicalRecord
): { matched: boolean; reason?: string } {
  const { field, operator, value } = condition;

  // 获取交易记录中的字段值
  let fieldValue: string | number | Network | TransactionStatus | undefined;

  switch (field) {
    case "domain":
    case "merchant_domain":
      fieldValue = transaction.merchant_domain;
      break;
    case "path":
      fieldValue = transaction.request_url.split("?")[0]; // 提取路径部分
      break;
    case "description":
      fieldValue = transaction.description || "";
      break;
    case "amount":
      fieldValue = parseFloat(transaction.amount_decimal_str);
      break;
    case "network":
      fieldValue = transaction.network;
      break;
    case "status":
      fieldValue = transaction.status;
      break;
    case "asset_symbol":
      fieldValue = transaction.asset_symbol;
      break;
    case "order_id":
      fieldValue = transaction.order_id || "";
      break;
    default:
      return { matched: false, reason: `未知字段: ${field}` };
  }

  // 如果字段值为空且不是空字符串比较，则不匹配
  if (fieldValue === undefined || fieldValue === null) {
    return { matched: false, reason: `字段 ${field} 为空` };
  }

  // 执行匹配逻辑
  return evaluateOperator(operator, fieldValue, value, field);
}

/**
 * 评估操作符
 */
function evaluateOperator(
  operator: RuleOperator,
  fieldValue: string | number | Network | TransactionStatus,
  conditionValue: string | number | Network | TransactionStatus,
  fieldName: string
): { matched: boolean; reason?: string } {
  switch (operator) {
    case "equals":
      return {
        matched: fieldValue === conditionValue,
        reason:
          fieldValue === conditionValue
            ? `${fieldName} 等于 ${conditionValue}`
            : `${fieldName} (${fieldValue}) 不等于 ${conditionValue}`,
      };

    case "not_equals":
      return {
        matched: fieldValue !== conditionValue,
        reason:
          fieldValue !== conditionValue
            ? `${fieldName} 不等于 ${conditionValue}`
            : `${fieldName} (${fieldValue}) 等于 ${conditionValue}`,
      };

    case "contains":
      if (typeof fieldValue === "string" && typeof conditionValue === "string") {
        const matched = fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
        return {
          matched,
          reason: matched
            ? `${fieldName} 包含 "${conditionValue}"`
            : `${fieldName} (${fieldValue}) 不包含 "${conditionValue}"`,
        };
      }
      return { matched: false, reason: "contains 操作符仅支持字符串类型" };

    case "not_contains":
      if (typeof fieldValue === "string" && typeof conditionValue === "string") {
        const matched = !fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
        return {
          matched,
          reason: matched
            ? `${fieldName} 不包含 "${conditionValue}"`
            : `${fieldName} (${fieldValue}) 包含 "${conditionValue}"`,
        };
      }
      return { matched: false, reason: "not_contains 操作符仅支持字符串类型" };

    case "matches":
      if (typeof fieldValue === "string" && typeof conditionValue === "string") {
        // 支持通配符匹配（如 *.heurist.ai）
        const pattern = conditionValue.replace(/\*/g, ".*").replace(/\?/g, ".");
        const regex = new RegExp(`^${pattern}$`, "i");
        const matched = regex.test(fieldValue);
        return {
          matched,
          reason: matched
            ? `${fieldName} 匹配模式 "${conditionValue}"`
            : `${fieldName} (${fieldValue}) 不匹配模式 "${conditionValue}"`,
        };
      }
      return { matched: false, reason: "matches 操作符仅支持字符串类型" };

    case "not_matches":
      if (typeof fieldValue === "string" && typeof conditionValue === "string") {
        const pattern = conditionValue.replace(/\*/g, ".*").replace(/\?/g, ".");
        const regex = new RegExp(`^${pattern}$`, "i");
        const matched = !regex.test(fieldValue);
        return {
          matched,
          reason: matched
            ? `${fieldName} 不匹配模式 "${conditionValue}"`
            : `${fieldName} (${fieldValue}) 匹配模式 "${conditionValue}"`,
        };
      }
      return { matched: false, reason: "not_matches 操作符仅支持字符串类型" };

    case "greater_than":
      if (typeof fieldValue === "number" && typeof conditionValue === "number") {
        const matched = fieldValue > conditionValue;
        return {
          matched,
          reason: matched
            ? `${fieldName} (${fieldValue}) > ${conditionValue}`
            : `${fieldName} (${fieldValue}) <= ${conditionValue}`,
        };
      }
      return { matched: false, reason: "greater_than 操作符仅支持数字类型" };

    case "less_than":
      if (typeof fieldValue === "number" && typeof conditionValue === "number") {
        const matched = fieldValue < conditionValue;
        return {
          matched,
          reason: matched
            ? `${fieldName} (${fieldValue}) < ${conditionValue}`
            : `${fieldName} (${fieldValue}) >= ${conditionValue}`,
        };
      }
      return { matched: false, reason: "less_than 操作符仅支持数字类型" };

    case "greater_or_equal":
      if (typeof fieldValue === "number" && typeof conditionValue === "number") {
        const matched = fieldValue >= conditionValue;
        return {
          matched,
          reason: matched
            ? `${fieldName} (${fieldValue}) >= ${conditionValue}`
            : `${fieldName} (${fieldValue}) < ${conditionValue}`,
        };
      }
      return { matched: false, reason: "greater_or_equal 操作符仅支持数字类型" };

    case "less_or_equal":
      if (typeof fieldValue === "number" && typeof conditionValue === "number") {
        const matched = fieldValue <= conditionValue;
        return {
          matched,
          reason: matched
            ? `${fieldName} (${fieldValue}) <= ${conditionValue}`
            : `${fieldName} (${fieldValue}) > ${conditionValue}`,
        };
      }
      return { matched: false, reason: "less_or_equal 操作符仅支持数字类型" };

    default:
      return { matched: false, reason: `未知操作符: ${operator}` };
  }
}

/**
 * 匹配规则（检查所有条件是否都满足）
 */
export function matchRule(
  rule: Rule,
  transaction: CanonicalRecord
): RuleMatchResult {
  // 如果规则未启用，直接返回不匹配
  if (!rule.enabled) {
    return {
      rule_id: rule.rule_id,
      rule_name: rule.name,
      matched: false,
      match_reason: "规则未启用",
      matched_conditions: [],
    };
  }

  // 检查所有条件（AND 关系）
  const matchedConditions = rule.conditions.map((condition) => {
    const result = matchCondition(condition, transaction);
    return {
      condition,
      matched: result.matched,
      reason: result.reason,
    };
  });

  // 所有条件都必须匹配
  const allMatched = matchedConditions.every((c) => c.matched);

  // 生成匹配原因
  const matchReason = allMatched
    ? `所有条件都匹配: ${matchedConditions.map((c) => c.reason).join("; ")}`
    : `部分条件不匹配: ${matchedConditions
        .filter((c) => !c.matched)
        .map((c) => c.reason)
        .join("; ")}`;

  return {
    rule_id: rule.rule_id,
    rule_name: rule.name,
    matched: allMatched,
    match_reason: matchReason,
    matched_conditions: matchedConditions,
  };
}

/**
 * 规则优先级排序（支持优先级字段）
 * 对应 PRD 第 10.1 节：优先级与冲突（支持优先级；冲突可提示）
 */
export function sortRulesByPriority(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    // 优先级高的在前（数字越大优先级越高）
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // 如果优先级相同，按创建时间排序
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * 规则冲突检测（多规则命中时提示）
 * 对应 PRD 第 10.1 节：优先级与冲突（支持优先级；冲突可提示）
 */
export interface RuleConflict {
  transaction_id: string;
  matched_rules: Array<{
    rule_id: string;
    rule_name: string;
    priority: number;
  }>;
  recommended_rule: string; // 推荐的规则（优先级最高的）
}

export function detectRuleConflicts(
  transaction: CanonicalRecord,
  rules: Rule[]
): RuleConflict | null {
  const sortedRules = sortRulesByPriority(rules);
  const matchedRules = sortedRules
    .map((rule) => ({
      rule,
      matchResult: matchRule(rule, transaction),
    }))
    .filter(({ matchResult }) => matchResult.matched);

  if (matchedRules.length <= 1) {
    return null; // 没有冲突
  }

  return {
    transaction_id: transaction.event_id,
    matched_rules: matchedRules.map(({ rule, matchResult }) => ({
      rule_id: rule.rule_id,
      rule_name: matchResult.rule_name,
      priority: rule.priority,
    })),
    recommended_rule: matchedRules[0].rule.rule_id, // 优先级最高的
  };
}

/**
 * 应用规则动作到交易记录
 */
export function applyRuleAction(
  transaction: CanonicalRecord,
  action: RuleAction
): Partial<CanonicalRecord> {
  const updates: Partial<CanonicalRecord> = {};

  if (action.category) {
    updates.category = action.category;
  }
  if (action.project) {
    updates.project = action.project;
  }
  if (action.cost_center) {
    updates.cost_center = action.cost_center;
  }
  // vendor_alias 可以映射到 description 或其他字段
  if (action.vendor_alias) {
    // 这里可以根据业务需求决定如何存储 vendor_alias
    // 暂时不修改 transaction，因为类型中没有 vendor_alias 字段
  }

  return updates;
}

/**
 * 规则批量应用函数（对历史交易批量归类）
 * 对应 PRD 第 10.2 节：批量应用与回填
 */
export interface BatchApplyResult {
  total: number;
  matched: number;
  applied: number;
  conflicts: number;
  errors: Array<{ event_id: string; error: string }>;
}

export async function batchApplyRules(
  transactions: CanonicalRecord[],
  rules: Rule[]
): Promise<BatchApplyResult> {
  const sortedRules = sortRulesByPriority(rules);
  const result: BatchApplyResult = {
    total: transactions.length,
    matched: 0,
    applied: 0,
    conflicts: 0,
    errors: [],
  };

  for (const transaction of transactions) {
    try {
      // 查找匹配的规则
      const matchedRules = sortedRules
        .map((rule) => ({
          rule,
          matchResult: matchRule(rule, transaction),
        }))
        .filter(({ matchResult }) => matchResult.matched);

      if (matchedRules.length === 0) {
        continue; // 没有匹配的规则
      }

      result.matched++;

      // 检查冲突
      if (matchedRules.length > 1) {
        result.conflicts++;
        // 使用优先级最高的规则
      }

      // 应用第一个（优先级最高）规则的动作
      const { rule, matchResult } = matchedRules[0];
      const updates = applyRuleAction(transaction, rule.action);
      
      // 更新交易记录（这里只是返回更新内容，实际保存由调用者处理）
      result.applied++;
    } catch (error) {
      result.errors.push({
        event_id: transaction.event_id,
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  return result;
}

/**
 * 规则版本化（规则变更产生版本号）
 * 对应 PRD 第 10.2 节：版本化（规则变更产生版本号，报表引用规则版本）
 */
export function incrementRuleVersion(rule: Rule): Rule {
  return {
    ...rule,
    version: rule.version + 1,
    updated_at: new Date().toISOString(),
  };
}

/**
 * 规则可解释性（返回命中原因）
 * 对应 PRD 第 10.1 节：可解释性（每笔显示"命中哪条规则/为何命中"）
 */
export function explainRuleMatch(
  transaction: CanonicalRecord,
  rules: Rule[]
): RuleMatchResult[] {
  const sortedRules = sortRulesByPriority(rules);
  return sortedRules.map((rule) => matchRule(rule, transaction));
}
