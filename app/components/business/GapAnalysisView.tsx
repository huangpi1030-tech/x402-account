/**
 * Gap Analysis 可视化展示组件
 * 对应 PRD 第 11.1 节：Gap Analysis（P0）
 */

"use client";

// React
import { useState, useEffect } from "react";

// Third-party
import { AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";

// Types
import { GapAnalysis, SuspiciousExpense } from "@/types";

// Components
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DateRangePicker } from "../ui/DateRangePicker";
import { AddressDisplay } from "../ui/AddressDisplay";
import { HashDisplay } from "../ui/HashDisplay";

// Store
import { useConfigStore } from "@/app/store/useConfigStore";
import { useUIStore } from "@/app/store/useUIStore";

// Lib
import { generateGapAnalysis } from "@/app/lib/gapAnalysis";
import { formatAmountDisplay, formatDateTime } from "@/app/lib/formatters";

export function GapAnalysisView() {
  const [walletAddress, setWalletAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);

  const { walletConfigs } = useConfigStore();
  const { setError } = useUIStore();

  useEffect(() => {
    // 如果有钱包配置，默认使用第一个
    if (walletConfigs.length > 0 && !walletAddress) {
      setWalletAddress(walletConfigs[0].wallet_address);
    }
  }, [walletConfigs, walletAddress]);

  const handleAnalyze = async () => {
    if (!walletAddress) {
      setError("请选择钱包地址");
      return;
    }
    if (!startDate || !endDate) {
      setError("请选择时间范围");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await generateGapAnalysis(
        walletAddress,
        startDate as any,
        endDate as any
      );
      setGapAnalysis(analysis);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gap Analysis 失败"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 分析配置 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Gap Analysis 配置
        </h2>
        <div className="space-y-4">
          <Input
            label="钱包地址"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            helperText="选择要分析的钱包地址"
          />
          <DateRangePicker
            label="时间范围"
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <Button
            variant="primary"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={isAnalyzing}
          >
            开始分析
          </Button>
        </div>
      </div>

      {/* 分析结果 */}
      {gapAnalysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            分析结果
          </h2>

          {/* 漏抓率指标 */}
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg ${
                gapAnalysis.gap_rate > 0.1
                  ? "bg-orange-50 border border-orange-200"
                  : gapAnalysis.gap_rate > 0.05
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                {gapAnalysis.gap_rate > 0.1 ? (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                ) : gapAnalysis.gap_rate > 0.05 ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    漏抓率: {(gapAnalysis.gap_rate * 100).toFixed(2)}%
                  </h3>
                  <p className="text-sm text-gray-600">
                    发现 {gapAnalysis.suspicious_expenses.length} 笔未捕获的链上支出
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 可疑支出列表 */}
          {gapAnalysis.suspicious_expenses.length > 0 ? (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">
                可疑支出列表
              </h3>
              <div className="divide-y divide-gray-200">
                {gapAnalysis.suspicious_expenses.map((expense, idx) => (
                  <SuspiciousExpenseItem key={idx} expense={expense} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p>未发现可疑支出，所有链上交易都已捕获</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuspiciousExpenseItem({
  expense,
}: {
  expense: SuspiciousExpense;
}) {
  return (
    <div className="py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <HashDisplay hash={expense.tx_hash} />
            <a
              href={`https://basescan.org/tx/${expense.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">收款地址:</span>
              <div className="mt-1">
                <AddressDisplay address={expense.to} />
              </div>
            </div>
            <div>
              <span className="text-gray-500">金额:</span>
              <p className="font-semibold text-gray-900 mt-1">
                {formatAmountDisplay(expense.value, "USDC")}
              </p>
            </div>
            <div>
              <span className="text-gray-500">时间:</span>
              <p className="text-gray-900 mt-1">
                {formatDateTime(expense.time, { includeTime: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
