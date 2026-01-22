/**
 * 规则引擎状态管理
 * 使用 Zustand 实现
 * 对应 PRD 第 10 节：会计规则引擎（Rules Engine）
 */

"use client";

import { create } from "zustand";
import { Rule, UUID } from "@/types";

interface RuleStore {
  // 状态
  rules: Rule[];
  currentEditingRule: Rule | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  loadRules: () => Promise<void>;
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: UUID, updates: Partial<Rule>) => void;
  deleteRule: (ruleId: UUID) => void;
  setCurrentEditingRule: (rule: Rule | null) => void;
  clearError: () => void;
}

export const useRuleStore = create<RuleStore>((set) => ({
  // 初始状态
  rules: [],
  currentEditingRule: null,
  isLoading: false,
  error: null,

  // 加载规则列表（暂时使用 Mock 数据，后续连接 IndexedDB）
  loadRules: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: 从 IndexedDB 加载规则
      // 暂时使用空数组
      set({ rules: [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "加载规则失败",
        isLoading: false,
      });
    }
  },

  // 设置规则列表
  setRules: (rules: Rule[]) => {
    set({ rules });
  },

  // 添加规则
  addRule: (rule: Rule) => {
    set((state) => ({
      rules: [...state.rules, rule],
    }));
  },

  // 更新规则
  updateRule: (ruleId: UUID, updates: Partial<Rule>) => {
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.rule_id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  },

  // 删除规则
  deleteRule: (ruleId: UUID) => {
    set((state) => ({
      rules: state.rules.filter((rule) => rule.rule_id !== ruleId),
    }));
  },

  // 设置当前编辑的规则
  setCurrentEditingRule: (rule: Rule | null) => {
    set({ currentEditingRule: rule });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
