/**
 * 状态机工具
 * 对应 PRD 第 6 节：状态机（金融级严谨：可审计、可回滚）
 */

import { TransactionStatus } from "@/types";

/**
 * 状态转换规则映射
 * 定义哪些状态可以转换到哪些状态
 */
const STATE_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  [TransactionStatus.PENDING]: [TransactionStatus.DETECTED],
  [TransactionStatus.DETECTED]: [
    TransactionStatus.SETTLED,
    TransactionStatus.VERIFYING,
  ],
  [TransactionStatus.SETTLED]: [
    TransactionStatus.ONCHAIN_VERIFIED,
    TransactionStatus.NEEDS_REVIEW,
  ],
  [TransactionStatus.VERIFYING]: [
    TransactionStatus.ONCHAIN_VERIFIED,
    TransactionStatus.NEEDS_REVIEW,
  ],
  [TransactionStatus.ONCHAIN_VERIFIED]: [TransactionStatus.ACCOUNTED],
  [TransactionStatus.NEEDS_REVIEW]: [
    TransactionStatus.ONCHAIN_VERIFIED,
    TransactionStatus.ACCOUNTED,
  ],
  [TransactionStatus.ACCOUNTED]: [], // 终态，不能再转换
};

/**
 * 状态转换验证函数（检查状态转换是否合法）
 * @param from 当前状态
 * @param to 目标状态
 * @returns 是否允许转换
 */
export function isValidStateTransition(
  from: TransactionStatus,
  to: TransactionStatus
): boolean {
  // 相同状态不需要转换
  if (from === to) {
    return true;
  }

  // 检查目标状态是否在允许的转换列表中
  const allowedTransitions = STATE_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * 状态转换函数（根据业务逻辑转换状态）
 * @param currentStatus 当前状态
 * @param targetStatus 目标状态
 * @returns 转换后的状态，如果转换不合法则返回当前状态
 */
export function transitionState(
  currentStatus: TransactionStatus,
  targetStatus: TransactionStatus
): TransactionStatus {
  if (isValidStateTransition(currentStatus, targetStatus)) {
    return targetStatus;
  }
  // 转换不合法，返回当前状态
  console.warn(
    `无效的状态转换: ${currentStatus} -> ${targetStatus}`
  );
  return currentStatus;
}

/**
 * 状态显示工具（状态到中文标签的映射）
 * @param status 交易状态
 * @returns 中文标签
 */
export function getStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: "待处理",
    [TransactionStatus.DETECTED]: "已检测",
    [TransactionStatus.SETTLED]: "已结算",
    [TransactionStatus.VERIFYING]: "验证中",
    [TransactionStatus.ONCHAIN_VERIFIED]: "已验证",
    [TransactionStatus.NEEDS_REVIEW]: "需审核",
    [TransactionStatus.ACCOUNTED]: "已入账",
  };
  return labels[status];
}

/**
 * 获取状态描述（详细说明）
 * @param status 交易状态
 * @returns 状态描述
 */
export function getStatusDescription(status: TransactionStatus): string {
  const descriptions: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: "已捕获原始快照但未完成解析",
    [TransactionStatus.DETECTED]:
      "已生成 Canonical Record（含金额/网络/收款方等）",
    [TransactionStatus.SETTLED]: "已拿到支付回执或可确认\"已支付意图\"",
    [TransactionStatus.VERIFYING]: "正在链上验证/归因",
    [TransactionStatus.ONCHAIN_VERIFIED]: "tx_hash 与链上事件匹配通过",
    [TransactionStatus.NEEDS_REVIEW]: "低置信/冲突/缺字段需人工确认",
    [TransactionStatus.ACCOUNTED]: "已归类、可入账、可汇总报表",
  };
  return descriptions[status];
}
