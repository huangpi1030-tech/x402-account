/**
 * 高级筛选组件
 * 对应 PRD 第 8.2 节：高级筛选（状态、置信度、时间、金额）
 * 这是 FilterPanel 的增强版本，支持更多筛选条件
 */

"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { TransactionStatus } from "@/types";
import { Select } from "../ui/Select";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Input } from "../ui/Input";
import { useTransactionStore } from "@/app/store/useTransactionStore";
import { Button } from "../ui/Button";

interface TransactionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionFilters({
  isOpen,
  onClose,
}: TransactionFiltersProps) {
  const { filters, setFilters } = useTransactionStore();
  const [localFilters, setLocalFilters] = useState(filters);

  // 状态选项
  const statusOptions = [
    { value: "", label: "全部状态" },
    { value: TransactionStatus.PENDING, label: "待处理" },
    { value: TransactionStatus.DETECTED, label: "已检测" },
    { value: TransactionStatus.SETTLED, label: "已结算" },
    { value: TransactionStatus.VERIFYING, label: "验证中" },
    { value: TransactionStatus.ONCHAIN_VERIFIED, label: "已验证" },
    { value: TransactionStatus.NEEDS_REVIEW, label: "需审核" },
    { value: TransactionStatus.ACCOUNTED, label: "已入账" },
  ];

  // 置信度选项
  const confidenceOptions = [
    { value: "", label: "全部置信度" },
    { value: "high", label: "高置信度 (≥80%)" },
    { value: "medium", label: "中置信度 (60-79%)" },
    { value: "low", label: "低置信度 (<60%)" },
  ];

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">高级筛选</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 状态筛选 */}
          <Select
            label="交易状态"
            options={statusOptions}
            value={localFilters.status || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                status: e.target.value
                  ? (e.target.value as TransactionStatus)
                  : undefined,
              })
            }
          />

          {/* 置信度筛选 */}
          <Select
            label="置信度"
            options={confidenceOptions}
            value={localFilters.confidence || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                confidence: e.target.value || undefined,
              })
            }
          />

          {/* 时间范围筛选 */}
          <DateRangePicker
            label="时间范围"
            startDate={localFilters.startDate}
            endDate={localFilters.endDate}
            onChange={(start, end) =>
              setLocalFilters({
                ...localFilters,
                startDate: start || undefined,
                endDate: end || undefined,
              })
            }
          />

          {/* 金额范围筛选 */}
          <div className="space-y-4">
            <Input
              label="最小金额"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={localFilters.minAmount || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  minAmount: e.target.value || undefined,
                })
              }
            />
            <Input
              label="最大金额"
              type="number"
              step="0.01"
              placeholder="999999.99"
              value={localFilters.maxAmount || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  minAmount: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* 网络筛选 */}
          <Select
            label="网络"
            options={[
              { value: "", label: "全部网络" },
              { value: "base", label: "Base" },
              { value: "ethereum", label: "Ethereum" },
              { value: "polygon", label: "Polygon" },
            ]}
            value={localFilters.network || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                network: e.target.value || undefined,
              })
            }
          />

          {/* 搜索查询 */}
          <Input
            label="搜索"
            placeholder="搜索域名、描述、订单ID..."
            value={localFilters.searchQuery || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                searchQuery: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* 底部操作按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <Button variant="secondary" onClick={handleReset}>
            重置
          </Button>
          <Button variant="primary" onClick={handleApply}>
            应用筛选
          </Button>
        </div>
      </div>
    </div>
  );
}
