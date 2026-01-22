/**
 * 配置相关类型定义
 * 对应 PRD 第 7.3 节：动态白名单云端更新
 * 对应 PRD 第 13 节：Web App 页面规格 - Onboarding（选择法币口径；RPC 设置）
 */

import { ISODateTime } from "./common";

/**
 * FX 配置
 * 对应 PRD 第 13 节：Onboarding（选择法币口径；FX 来源）
 */
export interface FxConfig {
  /** 法币类型（USD, CNY 等，默认 USD） */
  fiat_currency: string;
  /** FX 来源标记（用于审计口径一致性） */
  fx_source: string;
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * RPC 端点配置
 * 对应 PRD 第 9.1 节：RPC 池冗余与故障切换（P0）
 * 至少 2-3 个可用端点（官方+第三方）
 */
export interface RpcEndpoint {
  /** 端点 URL */
  url: string;
  /** 端点名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 失败率（用于动态降权） */
  failure_rate?: number;
  /** 最后成功时间 */
  last_success_at?: ISODateTime;
}

/**
 * RPC 池配置
 * 对应 PRD 第 13 节：Onboarding（RPC 设置，默认池）
 */
export interface RpcPoolConfig {
  /** RPC 端点列表 */
  endpoints: RpcEndpoint[];
  /** 轮询策略（round_robin, priority, random） */
  strategy: "round_robin" | "priority" | "random";
  /** 重试次数 */
  retry_count: number;
  /** 超时时间（毫秒） */
  timeout_ms: number;
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * Header 白名单配置
 * 对应 PRD 第 7.3 节：动态白名单云端更新 - Header 白名单
 * 内置 v1/v2/变体关键头；支持远端配置增量
 */
export interface HeaderAllowlistConfig {
  /** 配置版本号 */
  version: number;
  /** 配置签名（用于校验） */
  signature: string;
  /** Header 字段列表 */
  headers: string[];
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * 域名策略
 * 对应 PRD 第 7.3 节：动态白名单云端更新 - 站点白名单/规则
 * 支持域名级启用/禁用采集
 */
export interface DomainPolicy {
  /** 域名（支持通配符，如 *.example.com） */
  domain: string;
  /** 是否启用采集 */
  enabled: boolean;
  /** 敏感字段处理级别（none, hash, truncate） */
  sensitive_field_level: "none" | "hash" | "truncate";
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * 白名单配置
 * 对应 PRD 第 7.3 节：动态白名单云端更新
 */
export interface AllowlistConfig {
  /** Header 白名单配置 */
  header_allowlist: HeaderAllowlistConfig;
  /** 域名策略列表 */
  domain_policies: DomainPolicy[];
  /** 配置版本号 */
  version: number;
  /** 更新时间 */
  updated_at: ISODateTime;
}

/**
 * 应用配置
 * 整合所有配置项
 */
export interface AppConfig {
  /** FX 配置 */
  fx_config: FxConfig;
  /** RPC 池配置 */
  rpc_pool_config: RpcPoolConfig;
  /** 白名单配置 */
  allowlist_config: AllowlistConfig;
  /** 更新时间 */
  updated_at: ISODateTime;
}
