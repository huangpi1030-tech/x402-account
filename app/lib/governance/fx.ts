/**
 * FX Snapshot 采集逻辑
 * 对应 PRD 第 8.2 节：增加 FX Snapshot 与多钱包归属（会计价值锚点）
 */

import { FxSnapshot, ISODateTime, DecimalString, UUID } from "@/types";
import { getFxSnapshot } from "@/app/api/mockApi";
import { multiplyAmounts } from "../decimal";

/**
 * FX Snapshot 采集逻辑（获取交易时刻汇率）
 * 对应 PRD 第 8.2 节：FX Snapshot（法币估值）
 */
export async function captureFxSnapshot(
  fromCurrency: string,
  toCurrency: string,
  timestamp: ISODateTime
): Promise<FxSnapshot | null> {
  try {
    const response = await getFxSnapshot({
      from_currency: fromCurrency,
      to_currency: toCurrency,
      timestamp,
    });

    if (response.success && response.data) {
      return {
        snapshot_id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as UUID,
        fiat_currency: toCurrency,
        fx_rate: response.data.rate,
        fx_source: response.data.source,
        captured_at: response.data.captured_at,
        transaction_time: timestamp,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 法币价值计算（amount_decimal * fx_rate）
 * 对应 PRD 第 8.2 节：fiat_value_at_time = amount_decimal * fx_rate
 */
export function calculateFiatValue(
  amountDecimal: DecimalString,
  fxRate: DecimalString
): DecimalString {
  return multiplyAmounts(amountDecimal, fxRate);
}
