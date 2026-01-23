/**
 * 交易记录状态管理
 * 使用 Zustand 实现
 * 对应 PRD 第 13 节：Web App 页面规格 - Transactions
 */

"use client";

import { create } from "zustand";
import { CanonicalRecord, TransactionStatus, UUID } from "@/types";
import {
  getAllCanonical,
  getCanonicalByEventId,
  saveCanonical,
  getCanonicalByTimeRange,
  initIndexedDB,
} from "@/app/lib/storage";
import { generateMockTransactions } from "@/app/lib/mockData";

interface TransactionFilters {
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  minAmount?: string;
  maxAmount?: string;
}

interface TransactionStore {
  // 状态
  transactions: CanonicalRecord[];
  filteredTransactions: CanonicalRecord[];
  selectedTransactionId: UUID | null;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;

  // 操作
  loadTransactions: () => Promise<void>;
  loadTransactionById: (eventId: UUID) => Promise<CanonicalRecord | null>;
  saveTransaction: (transaction: CanonicalRecord) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  applyFilters: () => void;
  setSelectedTransaction: (eventId: UUID | null) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // 初始状态
  transactions: [],
  filteredTransactions: [],
  selectedTransactionId: null,
  filters: {},
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 20,

  // 加载所有交易记录
  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      // 初始化 IndexedDB
      await initIndexedDB();
      
      // 从 IndexedDB 加载数据
      let transactions = await getAllCanonical();
      
      // 如果 IndexedDB 为空，初始化 Mock 数据
      if (transactions.length === 0) {
        console.log("IndexedDB 为空，初始化 Mock 数据...");
        const mockTransactions = generateMockTransactions();
        
        // 保存 Mock 数据到 IndexedDB
        for (const transaction of mockTransactions) {
          await saveCanonical(transaction);
        }
        
        transactions = mockTransactions;
        console.log(`已初始化 ${transactions.length} 条 Mock 交易记录`);
      }
      
      set({ transactions, filteredTransactions: transactions, isLoading: false });
      // 自动应用筛选
      get().applyFilters();
    } catch (error) {
      console.error("加载交易记录失败:", error);
      set({
        error: error instanceof Error ? error.message : "加载交易记录失败",
        isLoading: false,
      });
    }
  },

  // 根据 ID 加载交易记录
  loadTransactionById: async (eventId: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const transaction = await getCanonicalByEventId(eventId);
      set({ isLoading: false });
      return transaction;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "加载交易记录失败",
        isLoading: false,
      });
      return null;
    }
  },

  // 保存交易记录
  saveTransaction: async (transaction: CanonicalRecord) => {
    set({ isLoading: true, error: null });
    try {
      await saveCanonical(transaction);
      // 重新加载列表
      await get().loadTransactions();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "保存交易记录失败",
        isLoading: false,
      });
    }
  },

  // 设置筛选条件
  setFilters: (newFilters: Partial<TransactionFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    // 自动应用筛选
    get().applyFilters();
  },

  // 应用筛选
  applyFilters: () => {
    const { transactions, filters } = get();
    let filtered = [...transactions];

    // 状态筛选
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    // 时间范围筛选
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((t) => {
        if (!t.created_at) return false;
        const createdAt = new Date(t.created_at);
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          if (createdAt < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999); // 包含整天
          if (createdAt > end) return false;
        }
        return true;
      });
    }

    // 搜索查询（域名、描述、订单ID）
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.merchant_domain.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.order_id?.toLowerCase().includes(query)
      );
    }

    // 金额范围筛选
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      filtered = filtered.filter(
        (t) => parseFloat(t.amount_decimal_str) >= min
      );
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      filtered = filtered.filter(
        (t) => parseFloat(t.amount_decimal_str) <= max
      );
    }

    set({ filteredTransactions: filtered, currentPage: 1 });
  },

  // 设置选中的交易记录
  setSelectedTransaction: (eventId: UUID | null) => {
    set({ selectedTransactionId: eventId });
  },

  // 设置页码
  setPage: (page: number) => {
    set({ currentPage: page });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
