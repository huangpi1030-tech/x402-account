/**
 * Transaction Detail 页面
 * 对应 PRD 第 8.3 节：Transaction Detail 页面
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "../../components/PageLayout";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RuleMatchExplanation } from "../../components/business";
import { TransactionDetailModal } from "../../components/business/TransactionDetailModal";
import { useTransactionStore } from "../../store/useTransactionStore";
import { useRuleStore } from "../../store/useRuleStore";
import { explainRuleMatch } from "../../lib/rules";
import { recordAuditLog } from "../../lib/governance";
import { ReceiptPDF } from "../../components/PDFTemplates";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CanonicalRecord, RuleMatchResult, TransactionStatus } from "@/types";
import { ArrowLeft, Edit, FileText, Download, History } from "lucide-react";
import { formatDateTime } from "../../lib/formatters";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const { transactions, loadTransactionById, saveTransaction } = useTransactionStore();
  const { rules } = useRuleStore();

  const [transaction, setTransaction] = useState<CanonicalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    merchant_domain: "",
    status: "",
    category: "",
    project: "",
    cost_center: "",
    reason: "",
  });
  const [ruleMatches, setRuleMatches] = useState<RuleMatchResult[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  useEffect(() => {
    if (transaction && rules.length > 0) {
      const matches = explainRuleMatch(transaction, rules);
      setRuleMatches(matches);
    }
  }, [transaction, rules]);

  const loadTransaction = async () => {
    const tx = await loadTransactionById(transactionId);
    if (tx) {
      setTransaction(tx);
      setEditForm({
        merchant_domain: tx.merchant_domain,
        status: tx.status,
        category: tx.category || "",
        project: tx.project || "",
        cost_center: tx.cost_center || "",
        reason: "",
      });
    }
  };

  const handleSave = async () => {
    if (!transaction || !editForm.reason.trim()) {
      return;
    }

    const before = { ...transaction };
    const updated: CanonicalRecord = {
      ...transaction,
      merchant_domain: editForm.merchant_domain,
      status: editForm.status as TransactionStatus,
      category: editForm.category || undefined,
      project: editForm.project || undefined,
      cost_center: editForm.cost_center || undefined,
    };

    // 记录审计日志
    await recordAuditLog(
      "transaction",
      transaction.event_id,
      "update_vendor",
      "user",
      {
        before,
        after: updated,
        reason: editForm.reason,
      }
    );

    await saveTransaction(updated);
    setIsEditing(false);
    await loadTransaction();
  };

  if (!transaction) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">交易详情</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "取消编辑" : "编辑"}
                  </Button>
                  <PDFDownloadLink
                    document={
                      <ReceiptPDF
                        receipt={{
                          receipt_id: transaction.event_id,
                          canonical_id: transaction.event_id,
                          merchant_domain: transaction.merchant_domain,
                          amount: transaction.amount_decimal_str,
                          asset_symbol: transaction.asset_symbol,
                          network: transaction.network,
                          tx_hash: transaction.tx_hash,
                          paid_at: transaction.paid_at,
                          generated_at: new Date().toISOString(),
                        }}
                        transaction={transaction}
                      />
                    }
                    fileName={`receipt_${transaction.event_id}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="secondary" size="sm" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? "准备中..." : "导出 PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="商户域名"
                    value={editForm.merchant_domain}
                    onChange={(e) =>
                      setEditForm({ ...editForm, merchant_domain: e.target.value })
                    }
                  />
                  <Select
                    label="状态"
                    options={[
                      { value: TransactionStatus.PENDING, label: "待处理" },
                      { value: TransactionStatus.DETECTED, label: "已检测" },
                      { value: TransactionStatus.SETTLED, label: "已结算" },
                      { value: TransactionStatus.VERIFYING, label: "验证中" },
                      { value: TransactionStatus.ONCHAIN_VERIFIED, label: "已验证" },
                      { value: TransactionStatus.NEEDS_REVIEW, label: "需审核" },
                      { value: TransactionStatus.ACCOUNTED, label: "已入账" },
                    ]}
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                  />
                  <Input
                    label="分类"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                  />
                  <Input
                    label="项目"
                    value={editForm.project}
                    onChange={(e) =>
                      setEditForm({ ...editForm, project: e.target.value })
                    }
                  />
                  <Input
                    label="成本中心"
                    value={editForm.cost_center}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cost_center: e.target.value })
                    }
                  />
                  <Input
                    label="修改原因"
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                    required
                    helperText="请填写修改原因（必填）"
                  />
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={!editForm.reason.trim()}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">事件ID</label>
                      <p className="text-sm font-mono text-gray-900 mt-1">
                        {transaction.event_id}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">商户域名</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {transaction.merchant_domain}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">金额</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {transaction.amount_decimal_str} {transaction.asset_symbol}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">网络</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {transaction.network}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 证据链时间线 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">证据链时间线</h2>
              <div className="space-y-4">
                <TimelineItem
                  title="X402 捕获"
                  time={transaction.created_at}
                  status="completed"
                />
                {transaction.paid_at && (
                  <TimelineItem
                    title="支付回执"
                    time={transaction.paid_at}
                    status="completed"
                  />
                )}
                {transaction.verified_at && (
                  <TimelineItem
                    title="链上验证"
                    time={transaction.verified_at}
                    status="completed"
                  />
                )}
                {transaction.status === TransactionStatus.ACCOUNTED && (
                  <TimelineItem
                    title="已入账"
                    time={transaction.updated_at}
                    status="completed"
                  />
                )}
              </div>
            </div>

            {/* 链上校验详情 */}
            {transaction.tx_hash && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">链上校验详情</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">交易哈希:</span>
                    <p className="text-sm font-mono text-gray-900">{transaction.tx_hash}</p>
                  </div>
                  {transaction.block_number && (
                    <div>
                      <span className="text-sm text-gray-500">区块号:</span>
                      <p className="text-sm text-gray-900">{transaction.block_number}</p>
                    </div>
                  )}
                  {transaction.verified_at && (
                    <div>
                      <span className="text-sm text-gray-500">验证时间:</span>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(transaction.verified_at, { includeTime: true })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 命中规则解释 */}
            {ruleMatches.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">命中规则解释</h2>
                <RuleMatchExplanation matchResults={ruleMatches} />
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 审计日志入口 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">审计日志</h3>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowAuditLogs(true)}
              >
                <History className="h-4 w-4 mr-2" />
                查看修改历史
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 审计日志弹窗 */}
      {showAuditLogs && (
        <Modal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
          title="审计日志"
          size="lg"
        >
          {/* TODO: 集成 AuditLogViewer 组件 */}
          <p className="text-gray-600">审计日志查看器将在这里显示</p>
        </Modal>
      )}
    </PageLayout>
  );
}

function TimelineItem({
  title,
  time,
  status,
}: {
  title: string;
  time: string;
  status: "completed" | "pending";
}) {
  return (
    <div className="flex items-start space-x-3">
      <div
        className={`w-3 h-3 rounded-full mt-1 ${
          status === "completed" ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">
          {formatDateTime(time, { includeTime: true })}
        </p>
      </div>
    </div>
  );
}
