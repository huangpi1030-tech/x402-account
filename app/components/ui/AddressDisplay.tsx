/**
 * 地址显示组件（带脱敏）
 * 对应 PRD 第 12.1 节：最小敏感存储
 */

"use client";

import { maskAddress } from "@/app/lib/formatters";

interface AddressDisplayProps {
  address: string;
  showFull?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  showFull = false,
  className = "",
}: AddressDisplayProps) {
  const displayAddress = showFull ? address : maskAddress(address);

  return (
    <span className={`font-mono text-sm ${className}`} title={address}>
      {displayAddress}
    </span>
  );
}
