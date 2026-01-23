/**
 * Reports 页面
 * 对应 PRD 第 8.5 节：Reports 页面
 */

"use client";

import { useState } from "react";
import PageLayout from "../components/PageLayout";
import {
  ReportGenerator,
  ReportDownloadHistory,
  GapAnalysisView,
} from "../components/business";
import { Button } from "../components/ui/Button";
import { FileText, Download, AlertTriangle } from "lucide-react";

type TabType = "generate" | "history" | "gap";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("generate");

  return (
    <PageLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">报表管理</h1>
          <p className="text-gray-600 mt-1">
            生成月度报表、查看下载历史和进行 Gap Analysis
          </p>
        </div>

        {/* 标签页 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "generate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              生成报表
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Download className="h-4 w-4 inline mr-2" />
              下载历史
            </button>
            <button
              onClick={() => setActiveTab("gap")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "gap"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Gap Analysis
            </button>
          </nav>
        </div>

        {/* 内容区 */}
        <div>
          {activeTab === "generate" && <ReportGenerator />}
          {activeTab === "history" && <ReportDownloadHistory />}
          {activeTab === "gap" && <GapAnalysisView />}
        </div>
      </div>
    </PageLayout>
  );
}
