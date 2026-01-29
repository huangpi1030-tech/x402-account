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
import { filtersStorage } from "@/app/lib/storage/localStorage";
import { generateMockTransactions } from "@/app/lib/mockData";

interface TransactionFilters {
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  minAmount?: string;
  maxAmount?: string;
  confidence?: string; // "high" | "medium" | "low"
  network?: string;
}

type SortField = "time" | "amount" | "confidence";
type SortOrder = "asc" | "desc";

interface TransactionStore {
  // 状态
  transactions: CanonicalRecord[];
  filteredTransactions: CanonicalRecord[];
  paginatedTransactions: CanonicalRecord[];
  selectedTransactionId: UUID | null;
  filters: TransactionFilters;
  sortField: SortField | null;
  sortOrder: SortOrder;
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
  setSort: (field: SortField | null, order?: SortOrder) => void;
  setSelectedTransaction: (eventId: UUID | null) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => {
  // 从 localStorage 加载保存的筛选条件（仅在客户端）
  const savedFilters = typeof window !== "undefined" ? (filtersStorage.get<TransactionFilters>() || {}) : {};
  const savedSortField = typeof window !== "undefined" ? ((localStorage.getItem("x402_sortField") || "time") as SortField) : ("time" as SortField);
  const savedSortOrder = typeof window !== "undefined" ? ((localStorage.getItem("x402_sortOrder") || "desc") as SortOrder) : ("desc" as SortOrder);
  const savedPage = typeof window !== "undefined" ? parseInt(localStorage.getItem("x402_currentPage") || "1", 10) : 1;

  return {
    // 初始状态（从 localStorage 恢复）
    transactions: [],
    filteredTransactions: [],
    paginatedTransactions: [],
    selectedTransactionId: null,
    filters: savedFilters,
    sortField: savedSortField,
    sortOrder: savedSortOrder,
    isLoading: false,
    error: null,
    currentPage: savedPage,
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
        const mockTransactions = generateMockTransactions();
        
        // 保存 Mock 数据到 IndexedDB
        for (const transaction of mockTransactions) {
          await saveCanonical(transaction);
        }
        
        transactions = mockTransactions;
      }
      
      set({ transactions, filteredTransactions: transactions, isLoading: false });
      // 自动应用筛选
      get().applyFilters();
    } catch (error) {
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
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      // 保存到 localStorage
      filtersStorage.save(updatedFilters);
      return { filters: updatedFilters };
    });
    // 自动应用筛选
    get().applyFilters();
  },

  // 设置排序
  setSort: (field: SortField | null, order?: SortOrder) => {
    const { sortField, sortOrder } = get();
    const newField = field;
    const newOrder =
      order || (field === sortField && sortOrder === "desc" ? "asc" : "desc");
    // 保存到 localStorage（仅在客户端）
    if (typeof window !== "undefined" && newField) {
      localStorage.setItem("x402_sortField", newField);
      localStorage.setItem("x402_sortOrder", newOrder);
    }
    set({ sortField: newField, sortOrder: newOrder, currentPage: 1 });
    get().applyFilters();
  },

  // 应用筛选和排序
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

    // 置信度筛选
    if (filters.confidence) {
      filtered = filtered.filter((tx) => {
        const conf = tx.confidence ?? 100;
        if (filters.confidence === "high") return conf >= 80;
        if (filters.confidence === "medium") return conf >= 60 && conf < 80;
        if (filters.confidence === "low") return conf < 60;
        return true;
      });
    }

    // 网络筛选
    if (filters.network) {
      filtered = filtered.filter((tx) => tx.network === filters.network);
    }

    // 排序
    const { sortField, sortOrder } = get();
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortField === "time") {
          aVal = a.paid_at || a.created_at || "";
          bVal = b.paid_at || b.created_at || "";
        } else if (sortField === "amount") {
          aVal = parseFloat(a.amount_decimal_str);
          bVal = parseFloat(b.amount_decimal_str);
        } else if (sortField === "confidence") {
          aVal = a.confidence ?? 100;
          bVal = b.confidence ?? 100;
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    // 分页
    const { currentPage, pageSize } = get();
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);

    set({
      filteredTransactions: filtered,
      paginatedTransactions: paginated,
      currentPage: 1, // 重置到第一页
    });
  },

  // 设置选中的交易记录
  setSelectedTransaction: (eventId: UUID | null) => {
    set({ selectedTransactionId: eventId });
  },

  // 设置页码
  setPage: (page: number) => {
    // 保存到 localStorage（仅在客户端）
    if (typeof window !== "undefined") {
      localStorage.setItem("x402_currentPage", page.toString());
    }
    set({ currentPage: page });
    get().applyFilters();
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
  };
});
