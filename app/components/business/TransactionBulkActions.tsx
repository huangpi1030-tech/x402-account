/**
 * 批量操作组件
 * 对应 PRD 第 8.2 节：批量操作（批量归类、批量审核）
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { useTransactionStore } from "@/app/store/useTransactionStore";
import { useUIStore } from "@/app/store/useUIStore";
import { CanonicalRecord } from "@/types";
import { Loader2 } from "lucide-react";

interface TransactionBulkActionsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function TransactionBulkActions({
  selectedIds,
  onSelectionChange,
}: TransactionBulkActionsProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [project, setProject] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const { transactions, saveTransaction } = useTransactionStore();
  const { setSuccessMessage, setError } = useUIStore();

  const selectedTransactions = transactions.filter((t) =>
    selectedIds.includes(t.event_id)
  );

  const handleBulkCategorize = async () => {
    setIsCategorizing(true);
    try {
      // 批量更新分类信息
      for (const transaction of selectedTransactions) {
        const updated: CanonicalRecord = {
          ...transaction,
          category: category || transaction.category,
          project: project || transaction.project,
          cost_center: costCenter || transaction.cost_center,
        };
        await saveTransaction(updated);
      }

      setSuccessMessage(
        `成功更新 ${selectedTransactions.length} 笔交易的分类信息`
      );
      setIsCategoryModalOpen(false);
      onSelectionChange([]);
      setCategory("");
      setProject("");
      setCostCenter("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "批量归类失败"
      );
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleBulkReview = async () => {
    setIsReviewing(true);
    try {
      // 批量标记为需审核
      for (const transaction of selectedTransactions) {
        const updated: CanonicalRecord = {
          ...transaction,
          status: "needs_review" as any,
          needs_review_reason: reviewReason || "批量标记需审核",
        };
        await saveTransaction(updated);
      }

      setSuccessMessage(
        `成功标记 ${selectedTransactions.length} 笔交易为需审核`
      );
      setIsReviewModalOpen(false);
      onSelectionChange([]);
      setReviewReason("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "批量审核失败"
      );
    } finally {
      setIsReviewing(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              已选择 {selectedIds.length} 笔交易
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              取消选择
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              批量归类
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReviewModalOpen(true)}
            >
              批量审核
            </Button>
          </div>
        </div>
      </div>

      {/* 批量归类弹窗 */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="批量归类"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleBulkCategorize} disabled={isCategorizing}>
              {isCategorizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认归类"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将为 {selectedIds.length} 笔交易设置以下分类信息：
          </p>
          <Input
            label="分类"
            placeholder="例如：研发支出-API费"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="项目"
            placeholder="例如：Project Alpha"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          />
          <Input
            label="成本中心"
            placeholder="例如：Engineering"
            value={costCenter}
            onChange={(e) => setCostCenter(e.target.value)}
          />
        </div>
      </Modal>

      {/* 批量审核弹窗 */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="批量审核"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReviewModalOpen(false)}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleBulkReview} disabled={isReviewing}>
              {isReviewing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                "确认标记"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将标记 {selectedIds.length} 笔交易为需审核：
          </p>
          <Input
            label="审核原因"
            placeholder="请输入审核原因"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            required
          />
        </div>
      </Modal>
    </>
  );
}
