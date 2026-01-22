/**
 * 配置状态管理
 * 使用 Zustand 实现
 * 对应 PRD 第 13 节：Web App 页面规格 - Onboarding
 */

"use client";

import { create } from "zustand";
import { WalletConfig, FxConfig, RpcPoolConfig } from "@/types";

interface ConfigStore {
  // 状态
  walletConfigs: WalletConfig[];
  fxConfig: FxConfig | null;
  rpcPoolConfig: RpcPoolConfig | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  loadConfigs: () => Promise<void>;
  addWalletConfig: (config: WalletConfig) => void;
  updateWalletConfig: (address: string, updates: Partial<WalletConfig>) => void;
  deleteWalletConfig: (address: string) => void;
  setFxConfig: (config: FxConfig) => void;
  setRpcPoolConfig: (config: RpcPoolConfig) => void;
  clearError: () => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  // 初始状态
  walletConfigs: [],
  fxConfig: null,
  rpcPoolConfig: null,
  isLoading: false,
  error: null,

  // 加载配置（暂时使用 localStorage，后续连接 IndexedDB）
  loadConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: 从 IndexedDB 加载配置
      // 暂时从 localStorage 读取
      const walletConfigsStr = localStorage.getItem("x402_wallet_configs");
      const fxConfigStr = localStorage.getItem("x402_fx_config");
      const rpcConfigStr = localStorage.getItem("x402_rpc_config");

      set({
        walletConfigs: walletConfigsStr ? JSON.parse(walletConfigsStr) : [],
        fxConfig: fxConfigStr ? JSON.parse(fxConfigStr) : null,
        rpcPoolConfig: rpcConfigStr ? JSON.parse(rpcConfigStr) : null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "加载配置失败",
        isLoading: false,
      });
    }
  },

  // 添加钱包配置
  addWalletConfig: (config: WalletConfig) => {
    set((state) => {
      const newConfigs = [...state.walletConfigs, config];
      localStorage.setItem("x402_wallet_configs", JSON.stringify(newConfigs));
      return { walletConfigs: newConfigs };
    });
  },

  // 更新钱包配置
  updateWalletConfig: (address: string, updates: Partial<WalletConfig>) => {
    set((state) => {
      const newConfigs = state.walletConfigs.map((config) =>
        config.wallet_address === address ? { ...config, ...updates } : config
      );
      localStorage.setItem("x402_wallet_configs", JSON.stringify(newConfigs));
      return { walletConfigs: newConfigs };
    });
  },

  // 删除钱包配置
  deleteWalletConfig: (address: string) => {
    set((state) => {
      const newConfigs = state.walletConfigs.filter(
        (config) => config.wallet_address !== address
      );
      localStorage.setItem("x402_wallet_configs", JSON.stringify(newConfigs));
      return { walletConfigs: newConfigs };
    });
  },

  // 设置 FX 配置
  setFxConfig: (config: FxConfig) => {
    localStorage.setItem("x402_fx_config", JSON.stringify(config));
    set({ fxConfig: config });
  },

  // 设置 RPC 池配置
  setRpcPoolConfig: (config: RpcPoolConfig) => {
    localStorage.setItem("x402_rpc_config", JSON.stringify(config));
    set({ rpcPoolConfig: config });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
