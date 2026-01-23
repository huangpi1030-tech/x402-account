/**
 * 哈希显示组件（带截断）
 * 对应 PRD 第 8.3 节：安全最小化字段
 */

"use client";

import { HashString } from "@/types";
import { truncateHash } from "@/app/lib/formatters";

interface HashDisplayProps {
  hash: HashString | string | undefined;
  showFull?: boolean;
  className?: string;
}

export function HashDisplay({
  hash,
  showFull = false,
  className = "",
}: HashDisplayProps) {
  if (!hash) {
    return <span className={className}>-</span>;
  }

  const displayHash = showFull ? hash : truncateHash(hash);

  return (
    <span className={`font-mono text-sm ${className}`} title={hash}>
      {displayHash}
    </span>
  );
}
