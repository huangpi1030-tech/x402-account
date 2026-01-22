/**
 * Mock API 服务
 * 开发阶段模拟后端接口
 * 对应 PRD 第 14 节：API/数据接口（Extension ↔ Web App）
 */

import {
  ApiResponse,
  SyncRawEvidenceRequest,
  SyncRawEvidenceResponse,
  SyncCanonicalRequest,
  SyncCanonicalResponse,
  FetchAllowlistConfigResponse,
  RequestVerifyRequest,
  RequestVerifyResponse,
  GetFxSnapshotRequest,
  GetFxSnapshotResponse,
} from "./types";
import { AllowlistConfig, HeaderAllowlistConfig, DomainPolicy } from "@/types";

/**
 * 模拟网络延迟
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 模拟 API 调用
 */
async function mockApiCall<T>(
  handler: () => Promise<T>,
  minDelay: number = 200,
  maxDelay: number = 800
): Promise<ApiResponse<T>> {
  try {
    // 模拟网络延迟
    const delayMs = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);
    await delay(delayMs);

    // 模拟 5% 的失败率
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: "网络错误：请求超时",
      };
    }

    const data = await handler();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * syncRawEvidence - 上传 WAL/RawEvidence
 * Extension → Web App，上传 WAL/RawEvidence（加密后或脱敏）
 */
export async function syncRawEvidence(
  request: SyncRawEvidenceRequest
): Promise<ApiResponse<SyncRawEvidenceResponse>> {
  return mockApiCall(async () => {
    // 模拟处理逻辑
    const synced_count = request.evidence.length;
    const failed_count = 0;

    console.log(`[Mock API] syncRawEvidence: 同步 ${synced_count} 条 RawEvidence`);

    return {
      synced_count,
      failed_count,
    };
  });
}

/**
 * syncCanonical - 幂等写入 Canonical
 * Extension/Web → Supabase，幂等写入 Canonical（event_id）
 */
export async function syncCanonical(
  request: SyncCanonicalRequest
): Promise<ApiResponse<SyncCanonicalResponse>> {
  return mockApiCall(async () => {
    // 模拟幂等写入逻辑
    // 假设 20% 的记录已存在（幂等跳过）
    const total = request.records.length;
    const skipped_count = Math.floor(total * 0.2);
    const synced_count = total - skipped_count;
    const failed_count = 0;

    console.log(
      `[Mock API] syncCanonical: 同步 ${synced_count} 条，跳过 ${skipped_count} 条（幂等）`
    );

    return {
      synced_count,
      skipped_count,
      failed_count,
    };
  });
}

/**
 * fetchAllowlistConfig - 拉取动态白名单
 * Extension ← Web App，拉取动态白名单与域名策略（签名校验）
 */
export async function fetchAllowlistConfig(): Promise<
  ApiResponse<FetchAllowlistConfigResponse>
> {
  return mockApiCall(async () => {
    // 生成 Mock 白名单配置
    const headerAllowlist: HeaderAllowlistConfig = {
      version: 1,
      signature: "mock_signature_abc123",
      headers: [
        "x-402-payment",
        "x-402-network",
        "x-402-recipient",
        "x-402-amount",
        "x-402-order-id",
        "x-402-nonce",
      ],
      updated_at: new Date().toISOString(),
    };

    const domainPolicies: DomainPolicy[] = [
      {
        domain: "*.heurist.ai",
        enabled: true,
        sensitive_field_level: "hash",
        updated_at: new Date().toISOString(),
      },
      {
        domain: "*.openrouter.ai",
        enabled: true,
        sensitive_field_level: "truncate",
        updated_at: new Date().toISOString(),
      },
    ];

    const config: AllowlistConfig = {
      header_allowlist: headerAllowlist,
      domain_policies: domainPolicies,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    console.log("[Mock API] fetchAllowlistConfig: 返回白名单配置");

    return {
      config,
      signature: "mock_signature_abc123",
      version: 1,
    };
  });
}

/**
 * requestVerify - 触发批量验证
 * Web App → Verifier，触发批量验证/归因任务
 */
export async function requestVerify(
  request: RequestVerifyRequest
): Promise<ApiResponse<RequestVerifyResponse>> {
  return mockApiCall(async () => {
    const task_id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queued_count = request.event_ids.length;
    const estimated_time = queued_count * 2; // 每条记录预计 2 秒

    console.log(
      `[Mock API] requestVerify: 创建验证任务 ${task_id}，队列 ${queued_count} 条`
    );

    return {
      task_id,
      queued_count,
      estimated_time,
    };
  });
}

/**
 * getFxSnapshot - 获取汇率快照
 * Web App → FX Service，记录 fx_rate 与 fiat_value_at_time
 */
export async function getFxSnapshot(
  request: GetFxSnapshotRequest
): Promise<ApiResponse<GetFxSnapshotResponse>> {
  return mockApiCall(async () => {
    // 模拟汇率数据
    // USDC ≈ USD，所以汇率接近 1.0
    const baseRate = 1.0;
    const variation = (Math.random() - 0.5) * 0.001; // ±0.05% 波动
    const rate = (baseRate + variation).toFixed(6);

    console.log(
      `[Mock API] getFxSnapshot: ${request.from_currency} → ${request.to_currency} = ${rate}`
    );

    return {
      rate,
      source: "coinbase",
      captured_at: new Date().toISOString(),
    };
  });
}
