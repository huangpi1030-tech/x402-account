/**
 * 空状态组件
 * 复用 Tailwind CSS 设计语言
 */

"use client";

import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title = "暂无数据",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center">
        {icon || <Inbox className="h-12 w-12 text-gray-400" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
