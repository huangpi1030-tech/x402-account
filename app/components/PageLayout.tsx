/**
 * 页面布局容器组件
 * 统一管理页面布局结构
 */

"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useUIStore } from "@/app/store/useUIStore";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        {/* 主内容区域 */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "lg:ml-64" : "lg:ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
