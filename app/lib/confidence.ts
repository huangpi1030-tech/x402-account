/**
 * 置信度计算工具
 * 对应 PRD 第 9.2 节：置信度衰减算法（解决同额同收款并发误配）
 */

import { Confidence, ISODateTime } from "@/types";

/**
 * 时间差衰减算法
 * 对应 PRD 第 9.2 节：时间差衰减
 * `Δt = http_time - block_time` 超过 5 分钟显著降权
 * @param httpTime HTTP 请求时间（ISO 8601）
 * @param blockTime 区块时间（ISO 8601）
 * @param baseConfidence 基础置信度（0-100）
 * @returns 衰减后的置信度
 */
export function applyTimeDecay(
  httpTime: ISODateTime,
  blockTime: ISODateTime,
  baseConfidence: Confidence
): Confidence {
  const httpTimestamp = new Date(httpTime).getTime();
  const blockTimestamp = new Date(blockTime).getTime();
  const deltaMs = Math.abs(httpTimestamp - blockTimestamp);
  const deltaMinutes = deltaMs / (1000 * 60);

  // 超过 5 分钟开始降权
  if (deltaMinutes <= 5) {
    return baseConfidence;
  }

  // 衰减函数：每超过 5 分钟，置信度降低 10%
  const penalty = Math.min((deltaMinutes - 5) * 2, 50); // 最多降低 50%
  const decayedConfidence = Math.max(baseConfidence - penalty, 0);

  return Math.round(decayedConfidence);
}

/**
 * 多命中惩罚算法
 * 对应 PRD 第 9.2 节：多命中惩罚
 * 同一时间窗命中多条 Transfer，每多一条命中 confidence -= penalty
 * @param baseConfidence 基础置信度
 * @param matchCount 匹配数量
 * @param penaltyPerMatch 每条匹配的惩罚值（默认 15）
 * @returns 惩罚后的置信度
 */
export function applyMultipleMatchPenalty(
  baseConfidence: Confidence,
  matchCount: number,
  penaltyPerMatch: number = 15
): Confidence {
  if (matchCount <= 1) {
    return baseConfidence;
  }

  // 第一条不惩罚，后续每条惩罚
  const penalty = (matchCount - 1) * penaltyPerMatch;
  const penalizedConfidence = Math.max(baseConfidence - penalty, 0);

  return Math.round(penalizedConfidence);
}

/**
 * 字段缺失惩罚算法
 * 对应 PRD 第 9.2 节：字段缺失惩罚
 * 缺 payer 或缺 amount 等，降低 confidence，并标记原因
 * @param baseConfidence 基础置信度
 * @param missingFields 缺失的字段列表
 * @returns 惩罚后的置信度和原因
 */
export function applyMissingFieldPenalty(
  baseConfidence: Confidence,
  missingFields: string[]
): { confidence: Confidence; reason: string } {
  if (missingFields.length === 0) {
    return { confidence: baseConfidence, reason: "" };
  }

  // 关键字段惩罚更重
  const criticalFields = ["payer_wallet", "amount", "tx_hash"];
  const criticalMissing = missingFields.filter((field) =>
    criticalFields.includes(field)
  );

  let penalty = 0;
  let reason = "";

  if (criticalMissing.length > 0) {
    // 关键字段缺失：每个降低 20%
    penalty = criticalMissing.length * 20;
    reason = `缺少关键字段: ${criticalMissing.join(", ")}`;
  } else {
    // 非关键字段缺失：每个降低 5%
    penalty = missingFields.length * 5;
    reason = `缺少字段: ${missingFields.join(", ")}`;
  }

  const penalizedConfidence = Math.max(baseConfidence - penalty, 0);

  return {
    confidence: Math.round(penalizedConfidence),
    reason,
  };
}

/**
 * 置信度阈值判断
 * 对应 PRD 第 9.2 节：最低阈值
 * `confidence < 60` 强制进入 needs_review
 * @param confidence 置信度
 * @param threshold 阈值（默认 60）
 * @returns 是否需要审核
 */
export function needsReviewByConfidence(
  confidence: Confidence,
  threshold: Confidence = 60
): boolean {
  return confidence < threshold;
}

/**
 * 综合置信度计算
 * 结合所有惩罚因素计算最终置信度
 * @param baseConfidence 基础置信度
 * @param options 其他因素
 * @returns 最终置信度和需要审核的原因
 */
export function calculateFinalConfidence(
  baseConfidence: Confidence,
  options?: {
    httpTime?: ISODateTime;
    blockTime?: ISODateTime;
    matchCount?: number;
    missingFields?: string[];
  }
): { confidence: Confidence; needsReview: boolean; reason?: string } {
  let finalConfidence = baseConfidence;
  const reasons: string[] = [];

  // 应用时间差衰减
  if (options?.httpTime && options?.blockTime) {
    finalConfidence = applyTimeDecay(
      options.httpTime,
      options.blockTime,
      finalConfidence
    );
    if (finalConfidence < baseConfidence) {
      reasons.push("时间差过大");
    }
  }

  // 应用多命中惩罚
  if (options?.matchCount && options.matchCount > 1) {
    finalConfidence = applyMultipleMatchPenalty(
      finalConfidence,
      options.matchCount
    );
    reasons.push(`多条匹配 (${options.matchCount}条)`);
  }

  // 应用字段缺失惩罚
  if (options?.missingFields && options.missingFields.length > 0) {
    const result = applyMissingFieldPenalty(
      finalConfidence,
      options.missingFields
    );
    finalConfidence = result.confidence;
    if (result.reason) {
      reasons.push(result.reason);
    }
  }

  // 判断是否需要审核
  const needsReview = needsReviewByConfidence(finalConfidence);

  return {
    confidence: finalConfidence,
    needsReview,
    reason: reasons.length > 0 ? reasons.join("; ") : undefined,
  };
}
