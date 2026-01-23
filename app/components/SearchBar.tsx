"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "./ui/Input";
import { FilterPanel } from "./ui/FilterPanel";
import { useTransactionStore } from "@/app/store/useTransactionStore";

/**
 * 搜索和筛选输入框组件
 * 用于搜索交易记录和打开筛选器
 */
export default function SearchBar() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filters, setFilters } = useTransactionStore();

  const handleSearchChange = (value: string) => {
    setFilters({ searchQuery: value || undefined });
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            {/* 搜索输入框 */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="搜索交易记录、域名、金额..."
                value={filters.searchQuery || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 筛选按钮 */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>筛选</span>
            </button>
          </div>
        </div>
      </div>

      {/* 筛选面板 */}
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </>
  );
}
