"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "./components/PageLayout";
import SearchBar from "./components/SearchBar";
import TransactionList from "./components/TransactionList";
import { TransactionBulkActions, LowConfidenceQueue, TransactionFilters } from "./components/business";
import { BulkExport } from "./components/business/BulkExport";
import { Button } from "./components/ui/Button";
import { useTransactionStore } from "./store/useTransactionStore";
import { useUIStore } from "./store/useUIStore";
import { Filter, AlertTriangle, Download } from "lucide-react";

/**
 * Transactions 页面（主页面）
 * 对应 PRD 第 8.2 节：Transactions 页面
 */
export default function Home() {
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { transactions, filteredTransactions } = useTransactionStore();
  const { selectedItems, toggleItemSelection, clearSelection } = useUIStore();

  const handleTransactionClick = (eventId: string) => {
    router.push(`/transactions/${eventId}`);
  };

  return (
    <PageLayout>
      <div>
        {/* 页面标题和操作 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
            <p className="text-gray-600 mt-1">
              共 {filteredTransactions.length} 笔交易
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => setIsExportOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              批量导出
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              高级筛选
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowLowConfidence(!showLowConfidence)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              低置信队列
            </Button>
          </div>
        </div>

        {/* 低置信队列 */}
        {showLowConfidence && (
          <div className="mb-6">
            <LowConfidenceQueue />
          </div>
        )}

        {/* 批量操作 */}
        {selectedIds.length > 0 && (
          <div className="mb-4">
            <TransactionBulkActions
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        )}

        {/* 搜索栏 */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* 交易列表 */}
        <TransactionList onTransactionClick={handleTransactionClick} />

        {/* 高级筛选面板 */}
        <TransactionFilters
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />

        {/* 批量导出面板 */}
        <BulkExport
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </div>
    </PageLayout>
  );
}
