"use client";

"use client";

import { useEffect } from "react";
import { CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { TransactionStatus, CanonicalRecord } from "@/types";
import {
  formatDateTime,
  formatAmountDisplay,
  truncateHash,
  maskAddress,
} from "@/app/lib/formatters";
import { useTransactionStore } from "@/app/store/useTransactionStore";

/**
 * 交易记录状态徽章组件
 * 使用 TransactionStatus 枚举，对应 PRD 第 6 节：状态机
 */
function StatusBadge({ status }: { status: TransactionStatus }) {
  const statusConfig: Record<
    TransactionStatus,
    { label: string; icon: typeof CheckCircle2; className: string }
  > = {
    [TransactionStatus.PENDING]: {
      label: "待处理",
      icon: Clock,
      className: "bg-gray-100 text-gray-800",
    },
    [TransactionStatus.DETECTED]: {
      label: "已检测",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800",
    },
    [TransactionStatus.SETTLED]: {
      label: "已结算",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800",
    },
    [TransactionStatus.VERIFYING]: {
      label: "验证中",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-800",
    },
    [TransactionStatus.ONCHAIN_VERIFIED]: {
      label: "已验证",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800",
    },
    [TransactionStatus.NEEDS_REVIEW]: {
      label: "需审核",
      icon: AlertCircle,
      className: "bg-orange-100 text-orange-800",
    },
    [TransactionStatus.ACCOUNTED]: {
      label: "已入账",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * 交易记录列表项组件
 * 使用 CanonicalRecord 类型，对应 PRD 第 8.3 节：Canonical Record v2
 */
function TransactionItem({ transaction }: { transaction: CanonicalRecord }) {
  // 格式化网络显示（首字母大写）
  const formatNetwork = (network: string) => {
    return network.charAt(0).toUpperCase() + network.slice(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* 左侧：交易信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {transaction.description || transaction.merchant_domain}
            </h3>
            <StatusBadge status={transaction.status} />
            {/* 显示置信度（如果存在且低于阈值） */}
            {transaction.confidence !== undefined && transaction.confidence < 60 && (
              <span className="text-xs text-orange-600 font-medium">
                置信度: {transaction.confidence}%
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center space-x-2">
              <span className="font-medium">域名:</span>
              <span className="truncate">{transaction.merchant_domain}</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="font-medium">金额:</span>
              <span className="text-gray-900 font-semibold">
                {formatAmountDisplay(
                  transaction.amount_decimal_str,
                  transaction.asset_symbol,
                  transaction.decimals
                )}
              </span>
              <span className="text-gray-500">
                ({formatNetwork(transaction.network)})
              </span>
              {/* 显示法币价值（如果存在） */}
              {transaction.fiat_value_at_time && (
                <span className="text-gray-500">
                  ≈ {formatAmountDisplay(
                    transaction.fiat_value_at_time,
                    transaction.fx_fiat_currency,
                    2
                  )}
                </span>
              )}
            </p>
            {transaction.paid_at && (
              <p className="text-xs text-gray-500">
                支付时间: {formatDateTime(transaction.paid_at, { includeTime: true })}
              </p>
            )}
            {/* 显示钱包地址（脱敏） */}
            {transaction.payee_wallet && (
              <p className="text-xs text-gray-500">
                收款地址: {maskAddress(transaction.payee_wallet)}
              </p>
            )}
            {/* 显示分类信息（如果存在） */}
            {transaction.category && (
              <p className="text-xs text-gray-500">
                分类: {transaction.category}
                {transaction.project && ` · ${transaction.project}`}
              </p>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="ml-4 flex items-start space-x-2">
          {transaction.tx_hash && (
            <button
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="查看链上交易"
              onClick={() => {
                // 暂时只在控制台输出，后续可跳转到区块链浏览器
                console.log("查看交易:", truncateHash(transaction.tx_hash));
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 交易历史列表组件
 * 显示所有交易记录的列表
 * 使用 Zustand 状态管理和 IndexedDB 存储
 */
export default function TransactionList() {
  const {
    filteredTransactions,
    isLoading,
    error,
    loadTransactions,
  } = useTransactionStore();

  // 组件挂载时加载交易记录
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 列表标题和统计 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          交易记录 ({filteredTransactions.length})
        </h2>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      )}

      {/* 交易列表 */}
      {!isLoading && (
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.event_id}
                transaction={transaction}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-gray-500">暂无交易记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
