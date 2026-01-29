/**
 * 数据同步逻辑
 * 对应 PRD 第 14 节：API/数据接口（Extension ↔ Web App）
 * 实现幂等写入、增量同步、冲突处理、重试机制
 */

import {
  CanonicalRecord,
  RawEvidence,
  UUID,
  ISODateTime,
} from "@/types";
import {
  ApiResponse,
  SyncCanonicalResponse,
} from "./types";
import {
  syncRawEvidence,
  syncCanonical,
} from "./mockApi";
import { getCanonicalByEventId, saveCanonical } from "@/app/lib/storage";

/**
 * 重试配置
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // 毫秒
  backoffMultiplier: number; // 退避倍数
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
};

/**
 * 带重试的 API 调用
 */
async function withRetry<T>(
  fn: () => Promise<ApiResponse<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T> | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const result = await fn();

    if (result.success) {
      return result;
    }

    lastError = result;

    // 如果不是最后一次尝试，等待后重试
    if (attempt < config.maxRetries) {
      const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastError || { success: false, error: "重试次数已用完" };
}

/**
 * 幂等写入逻辑（基于 event_id 去重）
 * 对应 PRD：幂等写入 Canonical（event_id）
 */
export async function idempotentWriteCanonical(
  record: CanonicalRecord
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  try {
    // 检查记录是否已存在
    const existing = await getCanonicalByEventId(record.event_id);

    if (existing) {
      // 记录已存在，幂等跳过
      return { success: true, skipped: true };
    }

    // 保存新记录
    await saveCanonical(record);
    return { success: true, skipped: false };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

/**
 * 批量幂等写入
 */
export async function idempotentWriteCanonicalBatch(
  records: CanonicalRecord[]
): Promise<{
  synced: number;
  skipped: number;
  failed: number;
  errors: Array<{ event_id: UUID; error: string }>;
}> {
  const results = {
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ event_id: UUID; error: string }>,
  };

  for (const record of records) {
    const result = await idempotentWriteCanonical(record);
    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.synced++;
      }
    } else {
      results.failed++;
      results.errors.push({
        event_id: record.event_id,
        error: result.error || "未知错误",
      });
    }
  }

  return results;
}

/**
 * 增量同步逻辑（只同步新数据）
 * 基于时间戳或版本号判断
 */
export interface IncrementalSyncOptions {
  lastSyncTime?: ISODateTime; // 上次同步时间
  eventIds?: UUID[]; // 已存在的 event_id 列表
}

export async function incrementalSyncCanonical(
  records: CanonicalRecord[],
  options: IncrementalSyncOptions = {}
): Promise<{
  new_records: number;
  skipped: number;
  errors: Array<{ event_id: UUID; error: string }>;
}> {
  const { lastSyncTime, eventIds = [] } = options;
  const results = {
    new_records: 0,
    skipped: 0,
    errors: [] as Array<{ event_id: UUID; error: string }>,
  };

  for (const record of records) {
    // 检查是否已存在
    if (eventIds.includes(record.event_id)) {
      results.skipped++;
      continue;
    }

    // 检查时间戳（如果提供了 lastSyncTime）
    if (lastSyncTime && record.created_at < lastSyncTime) {
      results.skipped++;
      continue;
    }

    // 尝试保存
    const result = await idempotentWriteCanonical(record);
    if (result.success && !result.skipped) {
      results.new_records++;
    } else if (!result.success) {
      results.errors.push({
        event_id: record.event_id,
        error: result.error || "保存失败",
      });
    } else {
      results.skipped++;
    }
  }

  return results;
}

/**
 * 冲突处理逻辑（并发写入冲突解决）
 * 使用最后写入获胜（Last Write Wins）策略
 */
export async function resolveConflict(
  existing: CanonicalRecord,
  incoming: CanonicalRecord
): Promise<CanonicalRecord> {
  // 比较更新时间，选择较新的记录
  const existingTime = new Date(existing.updated_at).getTime();
  const incomingTime = new Date(incoming.updated_at).getTime();

  if (incomingTime > existingTime) {
    return incoming;
  } else {
    return existing;
  }
}

/**
 * 同步 Canonical 到远程（带重试和幂等）
 */
export async function syncCanonicalToRemote(
  records: CanonicalRecord[]
): Promise<ApiResponse<SyncCanonicalResponse>> {
  return withRetry(async () => {
    // 先本地幂等写入
    const localResults = await idempotentWriteCanonicalBatch(records);

    // 然后同步到远程
    const remoteResponse = await syncCanonical({ records });

    if (remoteResponse.success && remoteResponse.data) {
      // 合并本地和远程结果
      return {
        success: true,
        data: {
          synced_count: remoteResponse.data.synced_count + localResults.synced,
          skipped_count: remoteResponse.data.skipped_count + localResults.skipped,
          failed_count: remoteResponse.data.failed_count + localResults.failed,
          failed_items: [
            ...(remoteResponse.data.failed_items || []),
            ...localResults.errors,
          ],
        },
      };
    }

    return remoteResponse;
  });
}

/**
 * 同步 RawEvidence 到远程（带重试）
 */
export async function syncRawEvidenceToRemote(
  evidence: RawEvidence[]
): Promise<ApiResponse<any>> {
  return withRetry(async () => {
    return await syncRawEvidence({ evidence });
  });
}
