/**
 * localStorage Service 层
 * 统一管理数据的增删改查
 * 提供类型安全的数据持久化接口
 */

/**
 * Storage Keys 常量
 */
const STORAGE_KEYS = {
  RULES: "x402_rules",
  WALLET_CONFIGS: "x402_wallet_configs",
  FX_CONFIG: "x402_fx_config",
  RPC_CONFIG: "x402_rpc_config",
  UI_STATE: "x402_ui_state",
  FILTERS: "x402_filters",
} as const;

/**
 * 通用存储工具函数
 */
class LocalStorageService {
  /**
   * 获取数据
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`读取 localStorage 失败 [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * 设置数据
   */
  set<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`写入 localStorage 失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 删除数据
   */
  remove(key: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除 localStorage 失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  clear(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      // 只清空项目相关的 key
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error("清空 localStorage 失败:", error);
      return false;
    }
  }
}

// 创建单例实例
const storageService = new LocalStorageService();

/**
 * 规则存储服务
 */
export const rulesStorage = {
  /**
   * 获取所有规则
   */
  getAll: <T>(): T[] => {
    return storageService.get<T[]>(STORAGE_KEYS.RULES, []) || [];
  },

  /**
   * 保存所有规则
   */
  saveAll: <T>(rules: T[]): boolean => {
    return storageService.set(STORAGE_KEYS.RULES, rules);
  },

  /**
   * 添加规则
   */
  add: <T>(rule: T): boolean => {
    const rules = rulesStorage.getAll<T>();
    rules.push(rule);
    return rulesStorage.saveAll(rules);
  },

  /**
   * 更新规则
   */
  update: <T extends { id: string }>(
    ruleId: string,
    updates: Partial<T>
  ): boolean => {
    const rules = rulesStorage.getAll<T>();
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index === -1) {
      return false;
    }
    rules[index] = { ...rules[index], ...updates };
    return rulesStorage.saveAll(rules);
  },

  /**
   * 删除规则
   */
  delete: (ruleId: string): boolean => {
    const rules = rulesStorage.getAll<{ id: string }>();
    const filtered = rules.filter((r) => r.id !== ruleId);
    return rulesStorage.saveAll(filtered);
  },
};

/**
 * 钱包配置存储服务
 */
export const walletConfigStorage = {
  /**
   * 获取所有钱包配置
   */
  getAll: <T>(): T[] => {
    return storageService.get<T[]>(STORAGE_KEYS.WALLET_CONFIGS, []) || [];
  },

  /**
   * 保存所有钱包配置
   */
  saveAll: <T>(configs: T[]): boolean => {
    return storageService.set(STORAGE_KEYS.WALLET_CONFIGS, configs);
  },

  /**
   * 添加钱包配置
   */
  add: <T>(config: T): boolean => {
    const configs = walletConfigStorage.getAll<T>();
    configs.push(config);
    return walletConfigStorage.saveAll(configs);
  },

  /**
   * 更新钱包配置
   */
  update: <T extends { address: string }>(
    address: string,
    updates: Partial<T>
  ): boolean => {
    const configs = walletConfigStorage.getAll<T>();
    const index = configs.findIndex((c) => c.address === address);
    if (index === -1) {
      return false;
    }
    configs[index] = { ...configs[index], ...updates };
    return walletConfigStorage.saveAll(configs);
  },

  /**
   * 删除钱包配置
   */
  delete: (address: string): boolean => {
    const configs = walletConfigStorage.getAll<{ address: string }>();
    const filtered = configs.filter((c) => c.address !== address);
    return walletConfigStorage.saveAll(filtered);
  },
};

/**
 * FX 配置存储服务
 */
export const fxConfigStorage = {
  /**
   * 获取 FX 配置
   */
  get: <T>(): T | null => {
    return storageService.get<T>(STORAGE_KEYS.FX_CONFIG, null);
  },

  /**
   * 保存 FX 配置
   */
  save: <T>(config: T): boolean => {
    return storageService.set(STORAGE_KEYS.FX_CONFIG, config);
  },

  /**
   * 删除 FX 配置
   */
  delete: (): boolean => {
    return storageService.remove(STORAGE_KEYS.FX_CONFIG);
  },
};

/**
 * RPC 配置存储服务
 */
export const rpcConfigStorage = {
  /**
   * 获取 RPC 配置
   */
  get: <T>(): T | null => {
    return storageService.get<T>(STORAGE_KEYS.RPC_CONFIG, null);
  },

  /**
   * 保存 RPC 配置
   */
  save: <T>(config: T): boolean => {
    return storageService.set(STORAGE_KEYS.RPC_CONFIG, config);
  },

  /**
   * 删除 RPC 配置
   */
  delete: (): boolean => {
    return storageService.remove(STORAGE_KEYS.RPC_CONFIG);
  },
};

/**
 * UI 状态存储服务
 */
export const uiStateStorage = {
  /**
   * 获取 UI 状态
   */
  get: <T>(): T | null => {
    return storageService.get<T>(STORAGE_KEYS.UI_STATE, null);
  },

  /**
   * 保存 UI 状态
   */
  save: <T>(state: T): boolean => {
    return storageService.set(STORAGE_KEYS.UI_STATE, state);
  },

  /**
   * 删除 UI 状态
   */
  delete: (): boolean => {
    return storageService.remove(STORAGE_KEYS.UI_STATE);
  },
};

/**
 * 筛选条件存储服务
 */
export const filtersStorage = {
  /**
   * 获取筛选条件
   */
  get: <T>(): T | null => {
    return storageService.get<T>(STORAGE_KEYS.FILTERS, null);
  },

  /**
   * 保存筛选条件
   */
  save: <T>(filters: T): boolean => {
    return storageService.set(STORAGE_KEYS.FILTERS, filters);
  },

  /**
   * 删除筛选条件
   */
  delete: (): boolean => {
    return storageService.remove(STORAGE_KEYS.FILTERS);
  },
};

/**
 * 导出通用服务（用于其他数据存储）
 */
export default storageService;
