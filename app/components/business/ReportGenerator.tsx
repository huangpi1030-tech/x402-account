/**
 * 报表生成器组件
 * 对应 PRD 第 8.4 节：Reports 页面 - 报表生成器
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { useUIStore } from "@/app/store/useUIStore";
import { generateMonthlyStatement, exportToCSV } from "@/app/lib/reports";
import { MonthlyStatementPDF, TransactionListPDF } from "../PDFTemplates";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileText, Download, Loader2 } from "lucide-react";

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fxCurrency, setFxCurrency] = useState("USD");
  const [ruleVersion, setRuleVersion] = useState("1");
  const [walletAddress, setWalletAddress] = useState("");
  const [generatedStatement, setGeneratedStatement] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const { setSuccessMessage, setError } = useUIStore();

  // 获取当前月份（YYYY-MM）
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError("请选择时间范围");
      return;
    }

    setIsGenerating(true);
    try {
      // 计算月份（使用开始日期所在月份）
      const date = new Date(startDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;

      const statement = await generateMonthlyStatement(
        monthStr,
        parseInt(ruleVersion),
        fxCurrency,
        walletAddress || undefined
      );

      // 获取该时间范围内的所有交易记录（用于明细PDF）
      const { getCanonicalByTimeRange } = await import("@/app/lib/storage");
      const txList = await getCanonicalByTimeRange(startDate, endDate);

      setGeneratedStatement(statement);
      setTransactions(txList);
      setSuccessMessage("报表生成成功");
      setIsPreviewOpen(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "报表生成失败"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    if (!generatedStatement) {
      setError("请先生成报表");
      return;
    }

    try {
      // 获取该时间范围内的所有交易
      const { getCanonicalByTimeRange } = await import("@/app/lib/storage");
      const transactions = await getCanonicalByTimeRange(startDate, endDate);
      const csv = exportToCSV(transactions);

      // 下载 CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `statement_${generatedStatement.month}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage("CSV 导出成功");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "CSV 导出失败"
      );
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">生成报表</h2>

        <div className="space-y-6">
          {/* 时间范围 */}
          <DateRangePicker
            label="时间范围"
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {/* FX 口径 */}
          <Select
            label="法币口径"
            options={[
              { value: "USD", label: "USD" },
              { value: "CNY", label: "CNY" },
              { value: "EUR", label: "EUR" },
            ]}
            value={fxCurrency}
            onChange={(e) => setFxCurrency(e.target.value)}
          />

          {/* 规则版本 */}
          <Input
            label="规则版本"
            type="number"
            value={ruleVersion}
            onChange={(e) => setRuleVersion(e.target.value)}
            helperText="报表将引用此规则版本"
          />

          {/* 钱包地址（可选，用于 Gap Analysis） */}
          <Input
            label="钱包地址（可选）"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            helperText="提供钱包地址将进行 Gap Analysis"
          />

          {/* 操作按钮 */}
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  生成报表
                </>
              )}
            </Button>
            {generatedStatement && (
              <>
                <Button variant="secondary" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  导出 CSV
                </Button>
                <PDFDownloadLink
                  document={<MonthlyStatementPDF statement={generatedStatement} />}
                  fileName={`statement_${generatedStatement.month}.pdf`}
                >
                  {({ loading }) => (
                    <Button variant="secondary" disabled={loading}>
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? "准备中..." : "下载汇总 PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
                {transactions.length > 0 && (
                  <PDFDownloadLink
                    document={
                      <TransactionListPDF
                        transactions={transactions}
                        title="Transaction Statement"
                        startDate={startDate}
                        endDate={endDate}
                      />
                    }
                    fileName={`transactions_${startDate.replace(/-/g, "")}_${endDate.replace(/-/g, "")}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="secondary" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? "准备中..." : "下载明细 PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {generatedStatement && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`报表预览 - ${generatedStatement.month}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">总支出 (USDC)</label>
                <p className="text-lg font-semibold text-gray-900">
                  {generatedStatement.executive_summary.total_usdc}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">总支出 (法币)</label>
                <p className="text-lg font-semibold text-gray-900">
                  {generatedStatement.executive_summary.total_fiat}{" "}
                  {generatedStatement.fx_currency}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">漏抓率</label>
                <p className="text-lg font-semibold text-gray-900">
                  {(generatedStatement.executive_summary.gap_rate * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">规则版本</label>
                <p className="text-lg font-semibold text-gray-900">
                  {generatedStatement.rule_version}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Top 商户</label>
              <div className="mt-2 space-y-1">
                {generatedStatement.executive_summary.top_vendors
                  .slice(0, 5)
                  .map((vendor: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{vendor.vendor}</span>
                      <span className="font-medium">{vendor.amount}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
