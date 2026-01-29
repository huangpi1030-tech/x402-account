/**
 * 低置信聚合视图组件
 * 对应 PRD 第 8.2 节：低置信队列视图（聚合显示需审核的交易）
 */

"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import { CanonicalRecord, TransactionStatus } from "@/types";
import { useTransactionStore } from "@/app/store/useTransactionStore";
import { useUIStore } from "@/app/store/useUIStore";
import { Button } from "../ui/Button";
import { ConfidenceIndicator } from "../ui/ConfidenceIndicator";
import { formatAmountDisplay, formatDateTime } from "@/app/lib/formatters";
import { TransactionDetailModal } from "./TransactionDetailModal";

export function LowConfidenceQueue() {
  const { transactions, saveTransaction } = useTransactionStore();
  const { setSuccessMessage, setError } = useUIStore();
  const [selectedTransaction, setSelectedTransaction] =
    useState<CanonicalRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 筛选低置信度或需审核的交易
  const lowConfidenceTransactions = transactions.filter(
    (t) =>
      (t.confidence !== undefined && t.confidence < 60) ||
      t.status === TransactionStatus.NEEDS_REVIEW
  );

  const handleViewDetail = (transaction: CanonicalRecord) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (transaction: CanonicalRecord) => {
    setProcessingId(transaction.event_id);
    try {
      const updated: CanonicalRecord = {
        ...transaction,
        status: TransactionStatus.ONCHAIN_VERIFIED,
        confidence: 100,
        needs_review_reason: undefined,
        updated_at: new Date().toISOString() as any,
      };
      await saveTransaction(updated);
      setSuccessMessage("交易已通过审核");
    } catch (error) {
      setError(error instanceof Error ? error.message : "审核失败");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transaction: CanonicalRecord) => {
    setProcessingId(transaction.event_id);
    try {
      const updated: CanonicalRecord = {
        ...transaction,
        status: TransactionStatus.NEEDS_REVIEW,
        needs_review_reason: "已标记为拒绝",
        updated_at: new Date().toISOString() as any,
      };
      await saveTransaction(updated);
      setSuccessMessage("交易已标记为拒绝");
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setProcessingId(null);
    }
  };

  if (lowConfidenceTransactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          暂无待审核交易
        </h3>
        <p className="text-sm text-gray-500">
          所有交易都已通过审核或置信度正常
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                低置信度队列
              </h2>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {lowConfidenceTransactions.length} 笔
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {lowConfidenceTransactions.map((transaction) => (
            <div
              key={transaction.event_id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {transaction.merchant_domain}
                    </span>
                    <ConfidenceIndicator
                      confidence={transaction.confidence}
                      showLabel={false}
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>
                      {formatAmountDisplay(
                        transaction.amount_decimal_str,
                        transaction.asset_symbol
                      )}
                    </span>
                    <span>{formatDateTime(transaction.created_at)}</span>
                    {transaction.needs_review_reason && (
                      <span className="text-orange-600">
                        {transaction.needs_review_reason}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(transaction)}
                  >
                    查看详情
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(transaction)}
                    disabled={processingId === transaction.event_id}
                  >
                    {processingId === transaction.event_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "通过"
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(transaction)}
                    disabled={processingId === transaction.event_id}
                  >
                    {processingId === transaction.event_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "拒绝"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 交易详情弹窗 */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
      />
    </>
  );
}
