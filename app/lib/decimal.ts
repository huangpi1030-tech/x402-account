/**
 * 精度计算工具
 * 对应 PRD 第 8.1 节：精度与大数安全（P0 强制）
 * 严禁使用 JS Number 进行金额计算
 */

import Decimal from "decimal.js";
import { BigIntString, DecimalString, Decimals } from "@/types";

/**
 * 将 BigInt 转换为 Decimal
 * @param bigIntStr BigInt 字符串
 * @param decimals 小数位数
 * @returns Decimal 实例
 */
export function bigIntToDecimal(
  bigIntStr: BigIntString,
  decimals: Decimals
): Decimal {
  const bigIntValue = BigInt(bigIntStr);
  const divisor = BigInt(10 ** decimals);
  const quotient = bigIntValue / divisor;
  const remainder = bigIntValue % divisor;

  // 构建小数部分字符串
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const decimalStr = `${quotient.toString()}.${remainderStr}`;

  return new Decimal(decimalStr);
}

/**
 * 将 Decimal 转换为 BigInt
 * @param decimal Decimal 实例或字符串
 * @param decimals 小数位数
 * @returns BigInt 字符串
 */
export function decimalToBigInt(
  decimal: Decimal | DecimalString,
  decimals: Decimals
): BigIntString {
  const decimalInstance =
    decimal instanceof Decimal ? decimal : new Decimal(decimal);
  const multiplier = new Decimal(10).pow(decimals);
  const bigIntValue = decimalInstance.mul(multiplier).floor();
  return bigIntValue.toString();
}

/**
 * 金额格式化函数（避免科学计数法）
 * @param amount 金额（Decimal 字符串）
 * @param decimals 小数位数
 * @returns 格式化后的字符串（固定小数位）
 */
export function formatAmount(
  amount: DecimalString,
  decimals: Decimals
): DecimalString {
  const decimal = new Decimal(amount);
  return decimal.toFixed(decimals);
}

/**
 * 金额加法（使用 Decimal）
 * @param a 第一个金额
 * @param b 第二个金额
 * @returns 结果（Decimal 字符串）
 */
export function addAmounts(
  a: DecimalString,
  b: DecimalString
): DecimalString {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);
  return decimalA.add(decimalB).toString();
}

/**
 * 金额减法（使用 Decimal）
 * @param a 被减数
 * @param b 减数
 * @returns 结果（Decimal 字符串）
 */
export function subtractAmounts(
  a: DecimalString,
  b: DecimalString
): DecimalString {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);
  return decimalA.sub(decimalB).toString();
}

/**
 * 金额乘法（使用 Decimal）
 * @param a 第一个金额
 * @param b 乘数
 * @returns 结果（Decimal 字符串）
 */
export function multiplyAmounts(
  a: DecimalString,
  b: DecimalString | number
): DecimalString {
  const decimalA = new Decimal(a);
  const decimalB = typeof b === "number" ? new Decimal(b) : new Decimal(b);
  return decimalA.mul(decimalB).toString();
}

/**
 * 精度验证函数（确保金额字段符合精度要求）
 * @param amount 金额（Decimal 字符串）
 * @param decimals 期望的小数位数
 * @returns 是否有效
 */
export function validateAmountPrecision(
  amount: DecimalString,
  decimals: Decimals
): boolean {
  try {
    const decimal = new Decimal(amount);
    const parts = decimal.toString().split(".");
    const decimalPlaces = parts.length > 1 ? parts[1].length : 0;
    return decimalPlaces <= decimals && decimal.gte(0);
  } catch {
    return false;
  }
}
