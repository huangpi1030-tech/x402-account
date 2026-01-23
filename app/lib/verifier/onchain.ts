/**
 * 链上验证模块
 * 对应 PRD 第 9 节：链上验证（Verifier）：防御性设计增强
 */

import { CanonicalRecord, UUID, ISODateTime } from "@/types";
import { RpcPool } from "./rpcPool";
import { RpcPoolConfig } from "@/types";

/**
 * 验证结果
 */
export interface VerificationResult {
  verified: boolean;
  confidence: number; // 0-100
  block_number?: number;
  block_time?: ISODateTime;
  error?: string;
  matched_transfer?: {
    from: string;
    to: string;
    value: string;
    tx_hash: string;
  };
}

/**
 * 验证结果缓存（TTL 缓存，避免重复请求）
 */
interface CachedVerification {
  result: VerificationResult;
  timestamp: number;
  ttl: number; // 缓存时间（毫秒）
}

const verificationCache = new Map<string, CachedVerification>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * tx_hash 验证函数（查询链上交易）
 * 对应 PRD 第 9.1 节：tx_hash 查询与 token decimals 缓存
 */
export async function verifyTxHash(
  txHash: string,
  expectedTo: string,
  expectedAmount: string,
  rpcPool: RpcPool
): Promise<VerificationResult> {
  // 检查缓存
  const cacheKey = `tx_${txHash}`;
  const cached = verificationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`[Verifier] 使用缓存结果: ${txHash}`);
    return cached.result;
  }

  try {
    const endpoint = rpcPool.getNextEndpoint();
    if (!endpoint) {
      return {
        verified: false,
        confidence: 0,
        error: "没有可用的 RPC 端点",
      };
    }

    // 模拟链上查询（实际应该调用真实的 RPC）
    // 这里使用 Mock 逻辑
    const mockResult = await mockVerifyTxHash(txHash, expectedTo, expectedAmount);

    // 记录成功
    rpcPool.recordSuccess(endpoint.url);

    // 缓存结果
    verificationCache.set(cacheKey, {
      result: mockResult,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL,
    });

    return mockResult;
  } catch (error) {
    const endpoint = rpcPool.getNextEndpoint();
    if (endpoint) {
      rpcPool.recordFailure(endpoint.url);
    }

    return {
      verified: false,
      confidence: 0,
      error: error instanceof Error ? error.message : "验证失败",
    };
  }
}

/**
 * Mock 验证函数（模拟链上查询）
 */
async function mockVerifyTxHash(
  txHash: string,
  expectedTo: string,
  expectedAmount: string
): Promise<VerificationResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 模拟验证逻辑（90% 成功率）
  const success = Math.random() > 0.1;

  if (success) {
    return {
      verified: true,
      confidence: 95,
      block_number: Math.floor(Math.random() * 10000000) + 10000000,
      block_time: new Date().toISOString(),
      matched_transfer: {
        from: "0x" + "1".repeat(40),
        to: expectedTo,
        value: expectedAmount,
        tx_hash: txHash,
      },
    };
  } else {
    return {
      verified: false,
      confidence: 30,
      error: "链上交易未找到或金额不匹配",
    };
  }
}

/**
 * 链上归因函数（无 tx_hash 时的归因逻辑）
 * 对应 PRD 第 9.1 节：无 tx_hash 的链上归因
 */
export async function attributeOnChain(
  transaction: CanonicalRecord,
  rpcPool: RpcPool
): Promise<VerificationResult> {
  // 如果没有收款地址或金额，无法归因
  if (!transaction.payee_wallet || !transaction.amount_decimal_str) {
    return {
      verified: false,
      confidence: 0,
      error: "缺少必要字段（payee_wallet 或 amount）",
    };
  }

  try {
    const endpoint = rpcPool.getNextEndpoint();
    if (!endpoint) {
      return {
        verified: false,
        confidence: 0,
        error: "没有可用的 RPC 端点",
      };
    }

    // 模拟链上归因（查询时间窗口内的 Transfer 事件）
    const mockResult = await mockAttributeOnChain(transaction);

    rpcPool.recordSuccess(endpoint.url);

    return mockResult;
  } catch (error) {
    const endpoint = rpcPool.getNextEndpoint();
    if (endpoint) {
      rpcPool.recordFailure(endpoint.url);
    }

    return {
      verified: false,
      confidence: 0,
      error: error instanceof Error ? error.message : "归因失败",
    };
  }
}

/**
 * Mock 归因函数
 */
async function mockAttributeOnChain(
  transaction: CanonicalRecord
): Promise<VerificationResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 模拟归因逻辑（70% 成功率，因为归因比直接验证更困难）
  const success = Math.random() > 0.3;

  if (success) {
    return {
      verified: true,
      confidence: 75, // 归因的置信度通常低于直接验证
      block_number: Math.floor(Math.random() * 10000000) + 10000000,
      block_time: transaction.paid_at || new Date().toISOString(),
      matched_transfer: {
        from: transaction.payer_wallet || "0x" + "1".repeat(40),
        to: transaction.payee_wallet,
        value: transaction.amount_decimal_str,
        tx_hash: "0x" + Math.random().toString(16).substr(2, 64),
      },
    };
  } else {
    return {
      verified: false,
      confidence: 40,
      error: "未找到匹配的链上交易",
    };
  }
}

/**
 * 批量验证任务队列
 * 对应 PRD 第 9.1 节：批量验证任务队列
 */
export interface VerificationTask {
  event_id: UUID;
  transaction: CanonicalRecord;
  priority: number;
}

export class VerificationQueue {
  private queue: VerificationTask[] = [];
  private processing: Set<UUID> = new Set();
  private maxConcurrent: number = 3;

  /**
   * 添加验证任务
   */
  addTask(task: VerificationTask): void {
    this.queue.push(task);
    // 按优先级排序
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 批量添加任务
   */
  addTasks(tasks: VerificationTask[]): void {
    this.queue.push(...tasks);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 处理队列
   */
  async processQueue(
    rpcPool: RpcPool,
    onResult: (eventId: UUID, result: VerificationResult) => void
  ): Promise<void> {
    while (this.queue.length > 0 || this.processing.size > 0) {
      // 启动并发任务
      while (
        this.processing.size < this.maxConcurrent &&
        this.queue.length > 0
      ) {
        const task = this.queue.shift();
        if (task && !this.processing.has(task.event_id)) {
          this.processing.add(task.event_id);
          this.processTask(task, rpcPool, onResult).finally(() => {
            this.processing.delete(task.event_id);
          });
        }
      }

      // 等待一段时间再检查
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async processTask(
    task: VerificationTask,
    rpcPool: RpcPool,
    onResult: (eventId: UUID, result: VerificationResult) => void
  ): Promise<void> {
    try {
      let result: VerificationResult;

      if (task.transaction.tx_hash) {
        // 有 tx_hash，直接验证
        result = await verifyTxHash(
          task.transaction.tx_hash,
          task.transaction.payee_wallet,
          task.transaction.amount_decimal_str,
          rpcPool
        );
      } else {
        // 无 tx_hash，进行归因
        result = await attributeOnChain(task.transaction, rpcPool);
      }

      onResult(task.event_id, result);
    } catch (error) {
      onResult(task.event_id, {
        verified: false,
        confidence: 0,
        error: error instanceof Error ? error.message : "验证失败",
      });
    }
  }

  /**
   * 获取队列状态
   */
  getStatus(): { queued: number; processing: number } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
    };
  }
}
