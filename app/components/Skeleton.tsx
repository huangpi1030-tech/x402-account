/**
 * Skeleton 加载占位组件
 * 对应 PRD 第 9.4 节：用户体验 - 加载状态指示
 */

"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  className = "",
  variant = "rectangular",
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  const variantClasses = {
    text: "h-4",
    circular: "rounded-full",
    rectangular: "rounded",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
}

/**
 * 交易列表项 Skeleton
 */
export function TransactionItemSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-32" variant="text" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" variant="text" />
          <Skeleton className="h-4 w-64" variant="text" />
          <Skeleton className="h-4 w-40" variant="text" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}
