/**
 * 审计日志筛选组件
 * 对应 PRD 第 12.2 节：审计日志（Audit Trail）
 */

"use client";

import { AuditOperationType } from "@/types";
import { Select } from "../ui/Select";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Input } from "../ui/Input";
import { Filter } from "lucide-react";

interface AuditLogFilterProps {
  filters: {
    startDate?: string;
    endDate?: string;
    operationType?: AuditOperationType;
    operator?: string;
  };
  onFiltersChange: (filters: {
    startDate?: string;
    endDate?: string;
    operationType?: AuditOperationType;
    operator?: string;
  }) => void;
}

export function AuditLogFilter({
  filters,
  onFiltersChange,
}: AuditLogFilterProps) {
  const operationTypeOptions = [
    { value: "", label: "全部操作类型" },
    { value: "update_vendor", label: "修改商户" },
    { value: "update_status", label: "修改状态" },
    { value: "update_category", label: "修改科目" },
    { value: "update_project", label: "修改项目" },
    { value: "update_cost_center", label: "修改成本中心" },
    { value: "create_rule", label: "创建规则" },
    { value: "update_rule", label: "修改规则" },
    { value: "delete_rule", label: "删除规则" },
    { value: "apply_rule", label: "应用规则" },
    { value: "manual_review", label: "人工审核" },
    { value: "verify_transaction", label: "验证交易" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-md font-semibold text-gray-900">筛选条件</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateRangePicker
          label="时间范围"
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(start, end) =>
            onFiltersChange({
              ...filters,
              startDate: start || undefined,
              endDate: end || undefined,
            })
          }
        />
        <Select
          label="操作类型"
          options={operationTypeOptions}
          value={filters.operationType || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              operationType: e.target.value
                ? (e.target.value as AuditOperationType)
                : undefined,
            })
          }
        />
        <Input
          label="操作人"
          placeholder="搜索操作人..."
          value={filters.operator || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              operator: e.target.value || undefined,
            })
          }
        />
      </div>
    </div>
  );
}
