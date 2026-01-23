/**
 * 加载状态指示器组件
 * 对应 PRD 第 9.4 节：用户体验 - 加载状态指示
 */

"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
}
