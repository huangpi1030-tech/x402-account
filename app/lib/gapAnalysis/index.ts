/**
 * Gap Analysis 模块
 * 对应 PRD 第 11.1 节：Gap Analysis（P0）
 * 发现漏抓支出：对比钱包全量 Transfer Events vs 插件捕获的 X402 Canonical
 */

import {
  GapAnalysis,
  SuspiciousExpense,
  CanonicalRecord,
  ISODateTime,
  DecimalString,
} from "@/types";
import { getAllCanonical } from "@/app/lib/storage";

/**
 * 链上 Transfer Event（模拟）
 * 实际应该从 RPC 获取钱包全量交易
 */
export interface OnChainTransferEvent {
  tx_hash: string;
  from: string;
  to: string;
  value: DecimalString;
  timestamp: ISODateTime;
  network: string;
}

/**
 * 链上 Transfer Events 获取（钱包全量交易）
 * 对应 PRD 第 11.1 节：对比钱包全量 Transfer Events
 * 注意：这里是 Mock 实现，实际应该从 RPC 获取
 */
export async function fetchOnChainTransfers(
  walletAddress: string,
  startTime: ISODateTime,
  endTime: ISODateTime
): Promise<OnChainTransferEvent[]> {
  // Mock 实现：生成一些模拟的链上交易
  // 实际应该调用 RPC 查询钱包的 Transfer 事件
  const mockTransfers: OnChainTransferEvent[] = [
    {
      tx_hash: "0x" + Math.random().toString(16).substr(2, 64),
      from: walletAddress,
      to: "0x" + "a".repeat(40),
      value: "0.05",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() as ISODateTime,
      network: "base",
    },
    {
      tx_hash: "0x" + Math.random().toString(16).substr(2, 64),
      from: walletAddress,
      to: "0x" + "b".repeat(40),
      value: "0.12",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() as ISODateTime,
      network: "base",
    },
  ];

  return mockTransfers;
}

/**
 * 漏抓检测逻辑（对比链上交易 vs 插件捕获）
 * 对应 PRD 第 11.1 节：发现漏抓支出
 */
export function detectMissingCaptures(
  onChainTransfers: OnChainTransferEvent[],
  capturedCanonicals: CanonicalRecord[]
): SuspiciousExpense[] {
  const suspicious: SuspiciousExpense[] = [];

  // 创建已捕获交易的 tx_hash 集合（用于快速查找）
  const capturedTxHashes = new Set(
    capturedCanonicals
      .map((c) => c.tx_hash)
      .filter((hash): hash is string => !!hash)
  );

  // 检查链上交易是否都被捕获
  for (const transfer of onChainTransfers) {
    if (!capturedTxHashes.has(transfer.tx_hash)) {
      suspicious.push({
        tx_hash: transfer.tx_hash,
        to: transfer.to,
        value: transfer.value,
        time: transfer.timestamp,
        network: transfer.network,
      });
    }
  }

  return suspicious;
}

/**
 * 漏抓率计算
 * 对应 PRD 第 11.1 节：漏抓率
 */
export function calculateGapRate(
  onChainTransfers: OnChainTransferEvent[],
  capturedCanonicals: CanonicalRecord[]
): number {
  if (onChainTransfers.length === 0) {
    return 0;
  }

  const suspicious = detectMissingCaptures(onChainTransfers, capturedCanonicals);
  return suspicious.length / onChainTransfers.length;
}

/**
 * 可疑支出列表生成
 * 对应 PRD 第 11.1 节：可疑支出列表（未被捕获但链上存在）
 */
export async function generateGapAnalysis(
  walletAddress: string,
  startTime: ISODateTime,
  endTime: ISODateTime
): Promise<GapAnalysis> {
  // 获取链上交易
  const onChainTransfers = await fetchOnChainTransfers(
    walletAddress,
    startTime,
    endTime
  );

  // 获取已捕获的交易
  const capturedCanonicals = await getAllCanonical();

  // 检测漏抓
  const suspicious = detectMissingCaptures(onChainTransfers, capturedCanonicals);

  // 计算漏抓率
  const gap_rate = calculateGapRate(onChainTransfers, capturedCanonicals);

  return {
    gap_rate,
    suspicious_expenses: suspicious,
    analyzed_at: new Date().toISOString() as ISODateTime,
  };
}
