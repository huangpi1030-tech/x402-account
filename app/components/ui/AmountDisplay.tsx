/**
 * 金额显示组件（带精度安全）
 * 对应 PRD 第 8.1 节：精度与大数安全
 */

"use client";

import { DecimalString, AssetSymbol, Decimals } from "@/types";
import { formatAmountDisplay } from "@/app/lib/formatters";

interface AmountDisplayProps {
  amount: DecimalString;
  assetSymbol: AssetSymbol;
  decimals?: Decimals;
  showFiat?: {
    fiatAmount: DecimalString;
    fiatCurrency: string;
  };
  className?: string;
}

export function AmountDisplay({
  amount,
  assetSymbol,
  decimals,
  showFiat,
  className = "",
}: AmountDisplayProps) {
  const formatted = formatAmountDisplay(amount, assetSymbol, decimals);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="font-semibold text-gray-900">{formatted}</span>
      {showFiat && (
        <span className="text-sm text-gray-500">
          ≈ {formatAmountDisplay(showFiat.fiatAmount, showFiat.fiatCurrency, 2)}
        </span>
      )}
    </div>
  );
}
