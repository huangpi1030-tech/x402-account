# localStorage 数据持久化实现文档

## 概述

已实现基于 localStorage 的数据持久化 Service 层，统一管理数据的增删改查。

## 实现内容

### 1. Service 层 (`app/lib/storage/localStorage.ts`)

创建了统一的 localStorage Service 层，包含以下服务：

#### 通用存储服务
- `LocalStorageService` 类：提供通用的 get/set/remove/clear 方法
- 自动处理 JSON 序列化/反序列化
- 包含错误处理和类型安全

#### 专用存储服务
- `rulesStorage` - 规则存储服务
  - `getAll()` - 获取所有规则
  - `saveAll()` - 保存所有规则
  - `add()` - 添加规则
  - `update()` - 更新规则
  - `delete()` - 删除规则

- `walletConfigStorage` - 钱包配置存储服务
  - `getAll()` - 获取所有钱包配置
  - `saveAll()` - 保存所有钱包配置
  - `add()` - 添加钱包配置
  - `update()` - 更新钱包配置
  - `delete()` - 删除钱包配置

- `fxConfigStorage` - FX 配置存储服务
  - `get()` - 获取 FX 配置
  - `save()` - 保存 FX 配置
  - `delete()` - 删除 FX 配置

- `rpcConfigStorage` - RPC 配置存储服务
  - `get()` - 获取 RPC 配置
  - `save()` - 保存 RPC 配置
  - `delete()` - 删除 RPC 配置

- `filtersStorage` - 筛选条件存储服务
  - `get()` - 获取筛选条件
  - `save()` - 保存筛选条件
  - `delete()` - 删除筛选条件

### 2. Store 集成

#### useRuleStore (`app/store/useRuleStore.ts`)
- ✅ `loadRules()` - 从 localStorage 加载规则
- ✅ `addRule()` - 添加规则并保存到 localStorage
- ✅ `updateRule()` - 更新规则并保存到 localStorage
- ✅ `deleteRule()` - 删除规则并保存到 localStorage
- ✅ `toggleRule()` - 切换规则状态并保存到 localStorage

#### useConfigStore (`app/store/useConfigStore.ts`)
- ✅ `loadConfigs()` - 从 localStorage 加载配置
- ✅ `addWalletConfig()` - 添加钱包配置并保存
- ✅ `updateWalletConfig()` - 更新钱包配置并保存
- ✅ `deleteWalletConfig()` - 删除钱包配置并保存
- ✅ `setFxConfig()` - 设置 FX 配置并保存
- ✅ `setRpcPoolConfig()` - 设置 RPC 配置并保存

#### useTransactionStore (`app/store/useTransactionStore.ts`)
- ✅ 初始化时从 localStorage 恢复筛选条件
- ✅ 初始化时从 localStorage 恢复排序设置
- ✅ 初始化时从 localStorage 恢复当前页码
- ✅ `setFilters()` - 保存筛选条件到 localStorage
- ✅ `setSort()` - 保存排序设置到 localStorage
- ✅ `setPage()` - 保存当前页码到 localStorage

### 3. 页面数据加载

所有页面都已使用 `useEffect` 在加载时读取数据：

- ✅ `app/rules/page.tsx` - 使用 `useEffect` 调用 `loadRules()`
- ✅ `app/onboarding/page.tsx` - 使用 `useEffect` 调用 `loadConfigs()`
- ✅ `app/components/TransactionList.tsx` - 使用 `useEffect` 调用 `loadTransactions()`

## 存储 Key 规范

所有 localStorage key 使用统一前缀 `x402_`：

- `x402_rules` - 规则列表
- `x402_wallet_configs` - 钱包配置列表
- `x402_fx_config` - FX 配置
- `x402_rpc_config` - RPC 配置
- `x402_ui_state` - UI 状态（预留）
- `x402_filters` - 筛选条件
- `x402_sortField` - 排序字段
- `x402_sortOrder` - 排序顺序
- `x402_currentPage` - 当前页码

## 服务端渲染兼容

所有 localStorage 访问都进行了服务端渲染兼容处理：

```typescript
if (typeof window !== "undefined") {
  // localStorage 操作
}
```

确保在服务端渲染时不会报错。

## 使用示例

### 规则存储

```typescript
import { rulesStorage } from "@/app/lib/storage/localStorage";

// 获取所有规则
const rules = rulesStorage.getAll<Rule>();

// 添加规则
rulesStorage.add(rule);

// 更新规则
rulesStorage.update(ruleId, { enabled: false });

// 删除规则
rulesStorage.delete(ruleId);
```

### 配置存储

```typescript
import { walletConfigStorage, fxConfigStorage } from "@/app/lib/storage/localStorage";

// 获取钱包配置
const wallets = walletConfigStorage.getAll<WalletConfig>();

// 保存 FX 配置
fxConfigStorage.save(fxConfig);
```

### Store 使用

```typescript
import { useRuleStore } from "@/app/store/useRuleStore";

function MyComponent() {
  const { rules, loadRules, addRule } = useRuleStore();

  useEffect(() => {
    loadRules(); // 自动从 localStorage 加载
  }, [loadRules]);

  const handleAdd = () => {
    addRule(newRule); // 自动保存到 localStorage
  };
}
```

## 数据持久化流程

1. **页面加载时**：
   - `useEffect` 调用 Store 的 `load*` 方法
   - Store 从 localStorage 读取数据
   - 更新 Store 状态

2. **数据修改时**：
   - 调用 Store 的更新方法（如 `addRule`, `updateRule`）
   - Store 更新状态
   - 同时保存到 localStorage

3. **页面刷新时**：
   - Store 初始化时从 localStorage 恢复状态
   - 页面加载时再次调用 `load*` 方法确保数据同步

## 注意事项

1. **数据大小限制**：localStorage 有 5-10MB 限制，适合存储配置和规则等小数据
2. **交易记录**：交易记录仍使用 IndexedDB（支持更大数据量）
3. **服务端渲染**：所有 localStorage 访问都进行了 SSR 兼容处理
4. **类型安全**：使用 TypeScript 泛型确保类型安全

## 测试建议

1. 创建规则后刷新页面，验证规则是否保留
2. 设置筛选条件后刷新页面，验证筛选条件是否保留
3. 修改配置后刷新页面，验证配置是否保留
4. 切换排序后刷新页面，验证排序设置是否保留

## 未来扩展

如需添加新的数据持久化：

1. 在 `STORAGE_KEYS` 中添加新的 key
2. 创建对应的存储服务（如 `xxxStorage`）
3. 在 Store 中集成该服务
4. 在页面组件中使用 `useEffect` 加载数据
