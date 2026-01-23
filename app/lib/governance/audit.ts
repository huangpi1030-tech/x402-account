/**
 * 审计日志记录
 * 对应 PRD 第 12.2 节：审计日志（Audit Trail）（P0）
 */

import { AuditLog, AuditOperationType, UUID, ISODateTime } from "@/types";
import { saveAuditLog, getAuditLogsByResourceId } from "@/app/lib/storage";

/**
 * 审计日志记录（append-only，记录所有修改）
 * 对应 PRD 第 12.2 节：不可抵赖性（审计日志不可被静默覆盖，append-only）
 */
export async function recordAuditLog(
  resourceType: "transaction" | "rule" | "config",
  resourceId: UUID,
  operationType: AuditOperationType,
  operator: string,
  changes?: {
    before?: any;
    after?: any;
    reason?: string;
    metadata?: any;
  }
): Promise<void> {
  const auditLog: AuditLog = {
    audit_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as UUID,
    resource_type: resourceType,
    resource_id: resourceId,
    operation_type: operationType,
    operator,
    timestamp: new Date().toISOString() as ISODateTime,
    reason: changes?.reason,
    before: changes?.before ? JSON.stringify(changes.before) : undefined,
    after: changes?.after ? JSON.stringify(changes.after) : undefined,
    metadata: changes?.metadata ? JSON.stringify(changes.metadata) : undefined,
  };

  try {
    await saveAuditLog(auditLog);
    console.log(`[Audit] 记录审计日志: ${operationType} on ${resourceType}:${resourceId}`);
  } catch (error) {
    console.error("保存审计日志失败:", error);
    throw error;
  }
}

/**
 * 审计日志查询（按时间、操作类型查询）
 */
export async function queryAuditLogs(
  resourceId: UUID
): Promise<AuditLog[]> {
  try {
    return await getAuditLogsByResourceId(resourceId);
  } catch (error) {
    console.error("查询审计日志失败:", error);
    return [];
  }
}
