/**
 * Settings 页面
 * 对应 PRD 第 8.6 节：Security/Settings 页面
 */

"use client";

import { useState } from "react";
import PageLayout from "../components/PageLayout";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useConfigStore } from "../store/useConfigStore";
import { useUIStore } from "../store/useUIStore";
import { exportToCSV } from "../lib/reports";
import { getAllCanonical } from "../lib/storage";
import { Download, Trash2, Shield, Key, Globe } from "lucide-react";

export default function SettingsPage() {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [domainPolicy, setDomainPolicy] = useState("allow_all");
  const [whitelistVersion, setWhitelistVersion] = useState("v1.0.0");

  const { setSuccessMessage, setError } = useUIStore();

  const handleExportData = async () => {
    try {
      const transactions = await getAllCanonical();
      const csv = exportToCSV(transactions);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `x402_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage("数据导出成功");
    } catch (error) {
      setError(error instanceof Error ? error.message : "数据导出失败");
    }
  };

  const handleClearData = async () => {
    try {
      // TODO: 实现清空所有存储的功能
      // 暂时只清空 localStorage
      localStorage.clear();
      setSuccessMessage("数据已清空");
      setIsClearDialogOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "数据清空失败");
    }
  };

  const handleExportAuditLogs = async () => {
    // TODO: 实现审计日志导出
    setSuccessMessage("审计日志导出功能开发中");
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-600 mt-1">管理应用设置和安全选项</p>
        </div>

        <div className="space-y-6">
          {/* 数据管理 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">数据管理</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">导出数据</h3>
                  <p className="text-sm text-gray-500">导出所有交易记录为 CSV 格式</p>
                </div>
                <Button variant="secondary" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  导出 CSV
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">清空数据</h3>
                  <p className="text-sm text-gray-500">清空所有本地存储的数据（不可恢复）</p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setIsClearDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空数据
                </Button>
              </div>
            </div>
          </div>

          {/* 采集策略 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">采集域名策略</h2>
            </div>
            <div className="space-y-4">
              <Select
                label="域名策略"
                options={[
                  { value: "allow_all", label: "允许所有域名" },
                  { value: "whitelist_only", label: "仅白名单域名" },
                  { value: "blacklist", label: "黑名单模式" },
                ]}
                value={domainPolicy}
                onChange={(e) => setDomainPolicy(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-gray-700">白名单版本</label>
                <p className="text-sm text-gray-500 mt-1">
                  当前版本: {whitelistVersion}
                </p>
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">安全设置</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">加密密钥</label>
                <p className="text-sm text-gray-500 mt-1">
                  密钥用于加密本地存储的敏感数据
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="flex-1"
                  />
                  <Button variant="secondary" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    重置密钥
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 审计日志 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">审计日志</h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">导出审计日志</h3>
                <p className="text-sm text-gray-500">导出所有审计日志记录</p>
              </div>
              <Button variant="secondary" onClick={handleExportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                导出日志
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 清空数据确认对话框 */}
      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleClearData}
        title="确认清空数据"
        message="此操作将清空所有本地存储的数据，包括交易记录、规则和配置。此操作不可恢复，确定要继续吗？"
        confirmText="确认清空"
        cancelText="取消"
        variant="danger"
      />
    </PageLayout>
  );
}
