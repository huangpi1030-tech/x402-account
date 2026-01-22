/**
 * 审计日志类型定义
 * 对应 PRD 第 12.2 节：审计日志（Audit Trail）（P0）
 */

import { UUID, ISODateTime } from "./common";
import { TransactionStatus } from "./common";

/**
 * 审计操作类型
 * 对应 PRD 第 12.2 节：记录范围（用户手动修改 vendor/status/category/project/rule）
 */
export type AuditOperationType =
  | "update_vendor" // 修改商户
  | "update_status" // 修改状态
  | "update_category" // 修改科目
  | "update_project" // 修改项目
  | "update_cost_center" // 修改成本中心
  | "create_rule" // 创建规则
  | "update_rule" // 修改规则
  | "delete_rule" // 删除规则
  | "apply_rule" // 应用规则
  | "manual_review" // 人工审核
  | "verify_transaction"; // 验证交易

/**
 * 审计日志
 * 对应 PRD 第 12.2 节：审计字段（before/after、operator、timestamp、reason）
 * 不可抵赖性：审计日志不可被静默覆盖（append-only）
 */
export interface AuditLog {
  /** 审计日志 ID */
  audit_id: UUID;
  /** 关联的资源类型 */
  resource_type: "transaction" | "rule" | "config";
  /** 关联的资源 ID */
  resource_id: UUID;
  /** 操作类型 */
  operation_type: AuditOperationType;
  /** 操作人（用户 ID 或系统） */
  operator: string;
  /** 操作时间 */
  timestamp: ISODateTime;
  /** 操作原因（可选但推荐） */
  reason?: string;
  /** 修改前的值（JSON 字符串） */
  before?: string;
  /** 修改后的值（JSON 字符串） */
  after?: string;
  /** 额外信息（JSON 字符串） */
  metadata?: string;
}
