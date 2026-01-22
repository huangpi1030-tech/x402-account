/**
 * 规则引擎类型定义
 * 对应 PRD 第 10 节：会计规则引擎（Rules Engine）：批量映射与可解释性
 */

import { UUID, Network, TransactionStatus, DecimalString } from "./common";

/**
 * 规则条件操作符
 * 对应 PRD 第 10.1 节：Gmail-like 过滤器规则
 */
export type RuleOperator =
  | "equals" // 等于
  | "not_equals" // 不等于
  | "contains" // 包含
  | "not_contains" // 不包含
  | "matches" // 匹配（支持通配符，如 *.heurist.ai）
  | "not_matches" // 不匹配
  | "greater_than" // 大于
  | "less_than" // 小于
  | "greater_or_equal" // 大于等于
  | "less_or_equal"; // 小于等于

/**
 * 规则条件字段类型
 * 对应 PRD 第 10.1 节：规则条件（domain/path/description/amount/network/status 等）
 */
export type RuleConditionField =
  | "domain" // 域名
  | "path" // 路径
  | "description" // 描述
  | "amount" // 金额
  | "network" // 网络
  | "status" // 状态
  | "asset_symbol" // 资产符号
  | "merchant_domain" // 商户域名
  | "order_id"; // 订单 ID

/**
 * 规则条件
 * 对应 PRD 第 10.1 节：规则条件
 * 示例：domain matches *.heurist.ai AND amount < 1
 */
export interface RuleCondition {
  /** 字段名 */
  field: RuleConditionField;
  /** 操作符 */
  operator: RuleOperator;
  /** 值（根据字段类型可能是字符串、数字等） */
  value: string | number | Network | TransactionStatus;
}

/**
 * 规则动作
 * 对应 PRD 第 10.1 节：动作（设置 category/project/cost_center/vendor_alias）
 * 示例：category=研发支出-API费
 */
export interface RuleAction {
  /** 设置科目分类 */
  category?: string;
  /** 设置项目 */
  project?: string;
  /** 设置成本中心 */
  cost_center?: string;
  /** 设置商户别名 */
  vendor_alias?: string;
}

/**
 * 规则
 * 对应 PRD 第 10.1 节：Gmail-like 过滤器规则
 * 对应 PRD 第 10.2 节：版本化（规则变更产生版本号）
 */
export interface Rule {
  /** 规则 ID */
  rule_id: UUID;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description?: string;
  /** 规则条件列表（AND 关系） */
  conditions: RuleCondition[];
  /** 规则动作 */
  action: RuleAction;
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 规则版本号 */
  version: number;
  /** 创建时间 */
  created_at: string; // ISODateTime
  /** 更新时间 */
  updated_at: string; // ISODateTime
}

/**
 * 规则匹配结果
 * 对应 PRD 第 10.1 节：可解释性（每笔显示"命中哪条规则/为何命中"）
 */
export interface RuleMatchResult {
  /** 命中的规则 ID */
  rule_id: UUID;
  /** 规则名称 */
  rule_name: string;
  /** 是否匹配 */
  matched: boolean;
  /** 匹配原因（解释为何命中） */
  match_reason?: string;
  /** 命中的条件详情 */
  matched_conditions: Array<{
    condition: RuleCondition;
    matched: boolean;
    reason?: string;
  }>;
}
