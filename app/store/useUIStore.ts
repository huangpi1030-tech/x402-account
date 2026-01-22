/**
 * UI 状态管理
 * 使用 Zustand 实现
 * 管理全局 UI 状态（加载状态、错误状态、选中项等）
 */

"use client";

import { create } from "zustand";

interface UIStore {
  // 状态
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  sidebarOpen: boolean;
  selectedItems: Set<string>;

  // 操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // 初始状态
  isLoading: false,
  error: null,
  successMessage: null,
  sidebarOpen: false,
  selectedItems: new Set(),

  // 设置加载状态
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // 设置错误
  setError: (error: string | null) => {
    set({ error });
    // 3 秒后自动清除错误
    if (error) {
      setTimeout(() => {
        set({ error: null });
      }, 3000);
    }
  },

  // 设置成功消息
  setSuccessMessage: (message: string | null) => {
    set({ successMessage: message });
    // 3 秒后自动清除消息
    if (message) {
      setTimeout(() => {
        set({ successMessage: null });
      }, 3000);
    }
  },

  // 切换侧边栏
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // 设置侧边栏状态
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  // 选中项
  selectItem: (itemId: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedItems);
      newSelection.add(itemId);
      return { selectedItems: newSelection };
    });
  },

  // 取消选中项
  deselectItem: (itemId: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedItems);
      newSelection.delete(itemId);
      return { selectedItems: newSelection };
    });
  },

  // 切换选中状态
  toggleItemSelection: (itemId: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedItems);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return { selectedItems: newSelection };
    });
  },

  // 清除所有选中项
  clearSelection: () => {
    set({ selectedItems: new Set() });
  },
}));
