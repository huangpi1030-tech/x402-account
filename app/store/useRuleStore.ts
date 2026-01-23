/**
 * 规则引擎状态管理
 * 使用 Zustand 实现
 * 对应 PRD 第 10 节：会计规则引擎（Rules Engine）
 */

"use client";

import { create } from "zustand";
import { Rule, UUID } from "@/types";
import { rulesStorage } from "@/app/lib/storage/localStorage";

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
  toggleRule: (ruleId: UUID) => void;
  setCurrentEditingRule: (rule: Rule | null) => void;
  clearError: () => void;
}

export const useRuleStore = create<RuleStore>((set) => ({
  // 初始状态
  rules: [],
  currentEditingRule: null,
  isLoading: false,
  error: null,

  // 加载规则列表（从 localStorage 加载）
  loadRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const rules = rulesStorage.getAll<Rule>();
      set({ rules, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "加载规则失败",
        isLoading: false,
      });
    }
  },

  // 设置规则列表
  setRules: (rules: Rule[]) => {
    rulesStorage.saveAll(rules);
    set({ rules });
  },

  // 添加规则
  addRule: (rule: Rule) => {
    set((state) => {
      const newRules = [...state.rules, rule];
      rulesStorage.saveAll(newRules);
      return { rules: newRules };
    });
  },

  // 更新规则
  updateRule: (ruleId: UUID, updates: Partial<Rule>) => {
    set((state) => {
      const newRules = state.rules.map((rule) =>
        rule.rule_id === ruleId ? { ...rule, ...updates } : rule
      );
      rulesStorage.saveAll(newRules);
      return { rules: newRules };
    });
  },

  // 删除规则
  deleteRule: (ruleId: UUID) => {
    set((state) => {
      const newRules = state.rules.filter((rule) => rule.rule_id !== ruleId);
      rulesStorage.saveAll(newRules);
      return { rules: newRules };
    });
  },

  // 切换规则启用状态
  toggleRule: (ruleId: UUID) => {
    set((state) => {
      const newRules = state.rules.map((rule) =>
        rule.rule_id === ruleId
          ? { ...rule, enabled: !rule.enabled }
          : rule
      );
      rulesStorage.saveAll(newRules);
      return { rules: newRules };
    });
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
