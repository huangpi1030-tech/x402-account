/**
 * 批量导出组件
 * 支持按时间范围导出交易记录为 PDF 或 CSV
 * 类似银行月流水账单功能
 */

"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { DateRangePicker } from "../ui/DateRangePicker";
import { Select } from "../ui/Select";
import { useUIStore } from "@/app/store/useUIStore";
import { exportToCSV } from "@/app/lib/reports";
import { TransactionListPDF } from "../PDFTemplates";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { getCanonicalByTimeRange } from "@/app/lib/storage";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

interface BulkExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkExport({ isOpen, onClose }: BulkExportProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const { setSuccessMessage, setError } = useUIStore();

  const handleLoadTransactions = async () => {
    if (!startDate || !endDate) {
      setError("请选择时间范围");
      return;
    }

    setIsLoading(true);
    try {
      const txList = await getCanonicalByTimeRange(startDate, endDate);
      if (txList.length === 0) {
        setError("该时间范围内没有交易记录");
        setIsLoading(false);
        return;
      }
      setTransactions(txList);
      setSuccessMessage(`找到 ${txList.length} 笔交易记录`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "加载交易记录失败"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!startDate || !endDate) {
      setError("请选择时间范围");
      return;
    }

    setIsLoading(true);
    try {
      // 加载交易数据
      const txList = await getCanonicalByTimeRange(startDate, endDate);
      if (txList.length === 0) {
        setError("该时间范围内没有交易记录");
        setIsLoading(false);
        return;
      }

      const csv = exportToCSV(txList);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `transactions_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage(`CSV 导出成功，共 ${txList.length} 笔交易`);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "CSV 导出失败"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForFilename = (date: string) => {
    return date.replace(/-/g, "");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="批量导出交易记录"
      size="md"
    >
      <div className="space-y-6">
        {/* 时间范围选择 */}
        <DateRangePicker
          label="选择时间范围"
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setTransactions([]); // 清空已加载的交易
          }}
        />

        {/* 导出格式选择 */}
        <Select
          label="导出格式"
          options={[
            { value: "pdf", label: "PDF（交易明细账单）" },
            { value: "csv", label: "CSV（表格数据）" },
          ]}
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as "pdf" | "csv")}
        />

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {exportFormat === "pdf"
              ? "PDF 格式将生成类似银行月流水账单的详细报表，包含所有交易明细。"
              : "CSV 格式适合在 Excel 等表格软件中打开和编辑。"}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          {exportFormat === "csv" ? (
            <Button
              variant="primary"
              onClick={handleExportCSV}
              disabled={!startDate || !endDate || isLoading}
            >
              {isLoading ? (
                "加载中..."
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  导出 CSV
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleLoadTransactions}
              disabled={!startDate || !endDate || isLoading}
            >
              {isLoading ? (
                "加载中..."
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  准备导出 PDF
                </>
              )}
            </Button>
          )}
        </div>

        {/* PDF 下载链接（当交易数据加载完成后显示） */}
        {exportFormat === "pdf" && transactions.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-3">
              已加载 {transactions.length} 笔交易，点击下方按钮下载 PDF：
            </p>
            <PDFDownloadLink
              document={
                <TransactionListPDF
                  transactions={transactions}
                  title="Transaction Statement"
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={`transactions_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}.pdf`}
            >
              {({ loading }) => (
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "生成中..." : `下载 PDF (${transactions.length} 笔交易)`}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        )}
      </div>
    </Modal>
  );
}
