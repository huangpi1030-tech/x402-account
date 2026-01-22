/**
 * API 接口类型定义
 * 对应 PRD 第 14 节：API/数据接口（Extension ↔ Web App）
 */

import {
  RawEvidence,
  CanonicalRecord,
  AllowlistConfig,
  UUID,
  ISODateTime,
} from "@/types";

/**
 * API 响应基础类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * syncRawEvidence 请求参数
 * Extension → Web App，上传 WAL/RawEvidence（加密后或脱敏）
 */
export interface SyncRawEvidenceRequest {
  evidence: RawEvidence[];
  encrypted?: boolean; // 是否已加密
}

/**
 * syncRawEvidence 响应
 */
export interface SyncRawEvidenceResponse {
  synced_count: number;
  failed_count: number;
  failed_items?: Array<{
    evidence_id: UUID;
    error: string;
  }>;
}

/**
 * syncCanonical 请求参数
 * Extension/Web → Supabase，幂等写入 Canonical（event_id）
 */
export interface SyncCanonicalRequest {
  records: CanonicalRecord[];
}

/**
 * syncCanonical 响应
 */
export interface SyncCanonicalResponse {
  synced_count: number;
  skipped_count: number; // 已存在的记录（幂等）
  failed_count: number;
  failed_items?: Array<{
    event_id: UUID;
    error: string;
  }>;
}

/**
 * fetchAllowlistConfig 响应
 * Extension ← Web App，拉取动态白名单与域名策略（签名校验）
 */
export interface FetchAllowlistConfigResponse {
  config: AllowlistConfig;
  signature: string; // 配置签名（用于校验）
  version: number;
}

/**
 * requestVerify 请求参数
 * Web App → Verifier，触发批量验证/归因任务
 */
export interface RequestVerifyRequest {
  event_ids: UUID[];
  force?: boolean; // 是否强制重新验证
}

/**
 * requestVerify 响应
 */
export interface RequestVerifyResponse {
  task_id: string;
  queued_count: number;
  estimated_time?: number; // 预计完成时间（秒）
}

/**
 * getFxSnapshot 请求参数
 * Web App → FX Service，记录 fx_rate 与 fiat_value_at_time
 */
export interface GetFxSnapshotRequest {
  from_currency: string; // 源货币（如 USDC）
  to_currency: string; // 目标货币（如 USD）
  timestamp: ISODateTime; // 交易时间
}

/**
 * getFxSnapshot 响应
 */
export interface GetFxSnapshotResponse {
  rate: string; // Decimal 字符串
  source: string; // FX 来源标记
  captured_at: ISODateTime;
}
