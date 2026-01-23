/**
 * 时间显示组件（相对时间 + 绝对时间）
 */

"use client";

import { ISODateTime } from "@/types";
import { formatDateTime, formatRelativeTime } from "@/app/lib/formatters";
import { useState } from "react";

interface TimeDisplayProps {
  time: ISODateTime | undefined;
  showRelative?: boolean;
  showAbsolute?: boolean;
  className?: string;
}

export function TimeDisplay({
  time,
  showRelative = true,
  showAbsolute = false,
  className = "",
}: TimeDisplayProps) {
  const [showFull, setShowFull] = useState(false);

  if (!time) {
    return <span className={className}>未知</span>;
  }

  const relative = formatRelativeTime(time);
  const absolute = formatDateTime(time, { includeTime: true });

  return (
    <span
      className={`text-sm ${className}`}
      title={absolute}
      onClick={() => setShowFull(!showFull)}
    >
      {showFull || showAbsolute ? absolute : showRelative ? relative : absolute}
    </span>
  );
}
