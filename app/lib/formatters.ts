/**
 * 数据格式化工具
 * 对应 PRD 第 8.3 节：安全最小化字段
 */

import { ISODateTime, DecimalString, HashString } from "@/types";

/**
 * 地址脱敏函数（显示前 6 位 + 后 4 位）
 * 对应 PRD 第 12.1 节：最小敏感存储
 * @param address 钱包地址
 * @returns 脱敏后的地址（如：0x1234...5678）
 */
export function maskAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }

  // 处理 0x 前缀
  const hasPrefix = address.startsWith("0x");
  const cleanAddress = hasPrefix ? address.slice(2) : address;

  if (cleanAddress.length < 10) {
    return address;
  }

  const prefix = cleanAddress.slice(0, 6);
  const suffix = cleanAddress.slice(-4);
  const masked = hasPrefix ? `0x${prefix}...${suffix}` : `${prefix}...${suffix}`;

  return masked;
}

/**
 * 时间格式化函数（ISO 转本地时间显示）
 * @param isoString ISO 8601 时间字符串
 * @param options 格式化选项
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(
  isoString: ISODateTime | undefined,
  options?: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    locale?: string;
  }
): string {
  if (!isoString) {
    return "未知";
  }

  try {
    const date = new Date(isoString);
    const locale = options?.locale || "zh-CN";

    if (options?.includeTime) {
      return date.toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: options?.includeSeconds ? "2-digit" : undefined,
      });
    }

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "无效时间";
  }
}

/**
 * 相对时间格式化（如：2 小时前）
 * @param isoString ISO 8601 时间字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(isoString: ISODateTime | undefined): string {
  if (!isoString) {
    return "未知";
  }

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "刚刚";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return formatDateTime(isoString);
    }
  } catch {
    return "无效时间";
  }
}

/**
 * 金额显示函数（带货币符号、千分位）
 * @param amount 金额（Decimal 字符串）
 * @param assetSymbol 资产符号（如 USDC）
 * @param decimals 小数位数（用于格式化）
 * @returns 格式化后的金额字符串
 */
export function formatAmountDisplay(
  amount: DecimalString,
  assetSymbol: string,
  decimals?: number
): string {
  try {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      return `${amount} ${assetSymbol}`;
    }

    // 格式化小数位
    const formatted = decimals !== undefined
      ? num.toFixed(decimals)
      : num.toString();

    // 添加千分位
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return `${parts.join(".")} ${assetSymbol}`;
  } catch {
    return `${amount} ${assetSymbol}`;
  }
}

/**
 * 哈希截断函数（显示前 8 位 + 后 4 位）
 * 对应 PRD 第 8.3 节：安全最小化字段
 * @param hash 哈希字符串
 * @returns 截断后的哈希（如：0x12345678...abcd）
 */
export function truncateHash(hash: HashString | string | undefined): string {
  if (!hash) {
    return "";
  }

  // 处理 0x 前缀
  const hasPrefix = hash.startsWith("0x");
  const cleanHash = hasPrefix ? hash.slice(2) : hash;

  if (cleanHash.length <= 12) {
    return hash;
  }

  const prefix = cleanHash.slice(0, 8);
  const suffix = cleanHash.slice(-4);
  const truncated = hasPrefix
    ? `0x${prefix}...${suffix}`
    : `${prefix}...${suffix}`;

  return truncated;
}
