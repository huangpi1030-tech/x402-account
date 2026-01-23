/**
 * 置信度指示器组件
 * 对应 PRD 第 9.2 节：置信度衰减算法
 */

"use client";

import { Confidence } from "@/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidence?: Confidence;
  showLabel?: boolean;
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
}: ConfidenceIndicatorProps) {
  if (confidence === undefined) {
    return null;
  }

  // 根据置信度确定颜色和图标
  const getConfidenceConfig = (conf: number) => {
    if (conf >= 80) {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle2,
        label: "高置信",
      };
    } else if (conf >= 60) {
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: AlertCircle,
        label: "中置信",
      };
    } else {
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        icon: AlertCircle,
        label: "低置信",
      };
    }
  };

  const config = getConfidenceConfig(confidence);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{confidence}%</span>
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600">{config.label}</span>
      )}
    </div>
  );
}
