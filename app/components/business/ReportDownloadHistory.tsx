/**
 * 报表下载历史组件
 * 对应 PRD 第 8.4 节：Reports 页面 - 下载历史
 */

"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { TimeDisplay } from "../ui/TimeDisplay";
import { formatDateTime } from "@/app/lib/formatters";

interface ReportHistoryItem {
  id: string;
  month: string;
  type: "PDF" | "CSV";
  generatedAt: string;
  fileSize?: string;
  downloadUrl?: string;
}

export function ReportDownloadHistory() {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    // 从 localStorage 加载下载历史
    const stored = localStorage.getItem("x402_report_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (error) {
        console.error("加载下载历史失败:", error);
      }
    }
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条记录吗？")) {
      const newHistory = history.filter((item) => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem("x402_report_history", JSON.stringify(newHistory));
    }
  };

  if (history.length === 0) {
    return (
      <EmptyState
        title="暂无下载记录"
        description="生成的报表将显示在这里"
        icon={<FileText className="h-12 w-12 text-gray-400" />}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
      {history.map((item) => (
        <div
          key={item.id}
          className="p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.month} 报表
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.type === "PDF"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {item.type}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>生成时间:</span>
                  <TimeDisplay time={item.generatedAt} />
                </div>
                {item.fileSize && (
                  <div className="text-sm text-gray-600">
                    文件大小: {item.fileSize}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {item.downloadUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(item.downloadUrl, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
