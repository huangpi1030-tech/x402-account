/**
 * 配置状态管理
 * 使用 Zustand 实现
 * 对应 PRD 第 13 节：Web App 页面规格 - Onboarding
 */

"use client";

import { create } from "zustand";
import { WalletConfig, FxConfig, RpcPoolConfig } from "@/types";
import {
  walletConfigStorage,
  fxConfigStorage,
  rpcConfigStorage,
} from "@/app/lib/storage/localStorage";

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

  // 加载配置（从 localStorage 加载）
  loadConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const walletConfigs = walletConfigStorage.getAll<WalletConfig>();
      const fxConfig = fxConfigStorage.get<FxConfig>();
      const rpcPoolConfig = rpcConfigStorage.get<RpcPoolConfig>();

      set({
        walletConfigs,
        fxConfig,
        rpcPoolConfig,
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
      walletConfigStorage.saveAll(newConfigs);
      return { walletConfigs: newConfigs };
    });
  },

  // 更新钱包配置
  updateWalletConfig: (address: string, updates: Partial<WalletConfig>) => {
    set((state) => {
      const newConfigs = state.walletConfigs.map((config) =>
        config.wallet_address === address ? { ...config, ...updates } : config
      );
      walletConfigStorage.saveAll(newConfigs);
      return { walletConfigs: newConfigs };
    });
  },

  // 删除钱包配置
  deleteWalletConfig: (address: string) => {
    set((state) => {
      const newConfigs = state.walletConfigs.filter(
        (config) => config.wallet_address !== address
      );
      walletConfigStorage.saveAll(newConfigs);
      return { walletConfigs: newConfigs };
    });
  },

  // 设置 FX 配置
  setFxConfig: (config: FxConfig) => {
    fxConfigStorage.save(config);
    set({ fxConfig: config });
  },

  // 设置 RPC 池配置
  setRpcPoolConfig: (config: RpcPoolConfig) => {
    rpcConfigStorage.save(config);
    set({ rpcPoolConfig: config });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
