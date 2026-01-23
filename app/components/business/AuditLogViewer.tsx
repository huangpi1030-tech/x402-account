/**
 * 审计日志查看器组件
 * 对应 PRD 第 12.2 节：审计日志（Audit Trail）（P0）
 */

"use client";

import { useState, useEffect } from "react";
import { AuditLog, AuditOperationType } from "@/types";
import { queryAuditLogs } from "@/app/lib/governance";
import { EmptyState } from "../ui/EmptyState";
import { TimeDisplay } from "../ui/TimeDisplay";
import { AuditLogFilter } from "./AuditLogFilter";
import { formatDateTime } from "@/app/lib/formatters";
import { FileText, User, Clock } from "lucide-react";

interface AuditLogViewerProps {
  resourceId?: string;
  resourceType?: "transaction" | "rule" | "config";
}

export function AuditLogViewer({
  resourceId,
  resourceType,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    operationType?: AuditOperationType;
    operator?: string;
  }>({});

  useEffect(() => {
    loadLogs();
  }, [resourceId, resourceType, filters]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      let allLogs: AuditLog[] = [];

      if (resourceId) {
        // 查询特定资源的审计日志
        allLogs = await queryAuditLogs(resourceId as any);
      } else {
        // TODO: 查询所有审计日志（需要实现 getAllAuditLogs）
        // 暂时使用空数组
        allLogs = [];
      }

      // 应用筛选
      let filtered = allLogs;
      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter((log) => {
          const logDate = new Date(log.timestamp);
          if (filters.startDate) {
            const start = new Date(filters.startDate);
            if (logDate < start) return false;
          }
          if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) return false;
          }
          return true;
        });
      }
      if (filters.operationType) {
        filtered = filtered.filter(
          (log) => log.operation_type === filters.operationType
        );
      }
      if (filters.operator) {
        filtered = filtered.filter((log) =>
          log.operator.toLowerCase().includes(filters.operator!.toLowerCase())
        );
      }

      setLogs(filtered);
    } catch (error) {
      console.error("加载审计日志失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationLabel = (type: AuditOperationType): string => {
    const labels: Record<AuditOperationType, string> = {
      update_vendor: "修改商户",
      update_status: "修改状态",
      update_category: "修改科目",
      update_project: "修改项目",
      update_cost_center: "修改成本中心",
      create_rule: "创建规则",
      update_rule: "修改规则",
      delete_rule: "删除规则",
      apply_rule: "应用规则",
      manual_review: "人工审核",
      verify_transaction: "验证交易",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <>
        <AuditLogFilter
          filters={filters}
          onFiltersChange={setFilters}
        />
        <EmptyState
          title="暂无审计日志"
          description="操作记录将显示在这里"
          icon={<FileText className="h-12 w-12 text-gray-400" />}
        />
      </>
    );
  }

  return (
    <>
      <AuditLogFilter
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {logs.map((log) => (
          <div
            key={log.audit_id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getOperationLabel(log.operation_type)}
                  </h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                    {log.resource_type}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>操作人: {log.operator}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <TimeDisplay time={log.timestamp} />
                  </div>
                  {log.reason && (
                    <div className="text-gray-700">
                      <span className="font-medium">原因:</span> {log.reason}
                    </div>
                  )}
                  {log.before && log.after && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            修改前:
                          </span>
                          <pre className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(log.before), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            修改后:
                          </span>
                          <pre className="mt-1 text-xs text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(log.after), null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
