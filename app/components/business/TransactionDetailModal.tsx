/**
 * 交易详情弹窗组件
 * 对应 PRD 第 8.3 节：Transaction Detail 页面
 */

"use client";

import { CanonicalRecord, TransactionStatus } from "@/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import {
  formatDateTime,
  formatAmountDisplay,
  truncateHash,
  maskAddress,
} from "@/app/lib/formatters";
import { getStatusLabel } from "@/app/lib/stateMachine";
import { ConfidenceIndicator } from "../ui/ConfidenceIndicator";
import { HashDisplay } from "../ui/HashDisplay";
import { AddressDisplay } from "../ui/AddressDisplay";
import { TimeDisplay } from "../ui/TimeDisplay";
import { CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CanonicalRecord | null;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

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
      icon: AlertCircle,
      className: "bg-blue-100 text-blue-800",
    },
    [TransactionStatus.SETTLED]: {
      label: "已结算",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800",
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
      className: "bg-purple-100 text-purple-800",
    },
  };

  const status = statusConfig[transaction.status];
  const StatusIcon = status.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="交易详情"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          关闭
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">事件ID</label>
              <p className="text-sm font-mono text-gray-900 mt-1">
                {transaction.event_id}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">状态</label>
              <div className="mt-1 flex items-center space-x-2">
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  <span>{status.label}</span>
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">商户域名</label>
              <p className="text-sm text-gray-900 mt-1">
                {transaction.merchant_domain}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">网络</label>
              <p className="text-sm text-gray-900 mt-1">
                {transaction.network}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">金额</label>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {formatAmountDisplay(
                  transaction.amount_decimal_str,
                  transaction.asset_symbol
                )}
              </p>
            </div>
            {transaction.confidence !== undefined && (
              <div>
                <label className="text-xs text-gray-500">置信度</label>
                <div className="mt-1">
                  <ConfidenceIndicator confidence={transaction.confidence} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 支付信息 */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">支付信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {transaction.payer_wallet && (
              <div>
                <label className="text-xs text-gray-500">付款地址</label>
                <div className="mt-1">
                  <AddressDisplay address={transaction.payer_wallet} />
                </div>
              </div>
            )}
            {transaction.payee_wallet && (
              <div>
                <label className="text-xs text-gray-500">收款地址</label>
                <div className="mt-1">
                  <AddressDisplay address={transaction.payee_wallet} />
                </div>
              </div>
            )}
            {transaction.tx_hash && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500">交易哈希</label>
                <div className="mt-1 flex items-center space-x-2">
                  <HashDisplay hash={transaction.tx_hash} />
                  <a
                    href={`https://basescan.org/tx/${transaction.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
            {transaction.paid_at && (
              <div>
                <label className="text-xs text-gray-500">支付时间</label>
                <div className="mt-1">
                  <TimeDisplay time={transaction.paid_at} />
                </div>
              </div>
            )}
            {transaction.created_at && (
              <div>
                <label className="text-xs text-gray-500">创建时间</label>
                <div className="mt-1">
                  <TimeDisplay time={transaction.created_at} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 分类信息 */}
        {(transaction.category ||
          transaction.project ||
          transaction.cost_center) && (
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">分类信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {transaction.category && (
                <div>
                  <label className="text-xs text-gray-500">分类</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {transaction.category}
                  </p>
                </div>
              )}
              {transaction.project && (
                <div>
                  <label className="text-xs text-gray-500">项目</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {transaction.project}
                  </p>
                </div>
              )}
              {transaction.cost_center && (
                <div>
                  <label className="text-xs text-gray-500">成本中心</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {transaction.cost_center}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 其他信息 */}
        {(transaction.description || transaction.order_id) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">其他信息</h3>
            <div className="space-y-4">
              {transaction.description && (
                <div>
                  <label className="text-xs text-gray-500">描述</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {transaction.description}
                  </p>
                </div>
              )}
              {transaction.order_id && (
                <div>
                  <label className="text-xs text-gray-500">订单ID</label>
                  <p className="text-sm font-mono text-gray-900 mt-1">
                    {transaction.order_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 审核原因 */}
        {transaction.needs_review_reason && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">
              需要审核原因
            </h4>
            <p className="text-sm text-orange-800">
              {transaction.needs_review_reason}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
