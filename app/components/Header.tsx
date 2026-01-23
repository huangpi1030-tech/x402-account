"use client";

import { Wallet, Settings, Menu } from "lucide-react";
import { useUIStore } from "@/app/store/useUIStore";

/**
 * 顶部标题栏组件
 * 包含应用标题、钱包信息和设置入口
 */
export default function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：应用标题和菜单按钮 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Wallet className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">X402 Account</h1>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">钱包管理</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
