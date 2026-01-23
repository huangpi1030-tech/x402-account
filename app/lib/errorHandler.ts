/**
 * 统一错误处理模块
 * 对应 PRD 第 9.2 节：错误处理
 */

import { useUIStore } from "../store/useUIStore";

/**
 * API 错误处理
 * 统一处理 API 调用错误，显示用户友好的错误提示
 */
export function handleApiError(error: unknown, defaultMessage = "操作失败"): void {
  const { setError } = useUIStore.getState();

  let errorMessage = defaultMessage;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  // 根据错误类型提供更友好的提示
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    errorMessage = "网络连接失败，请检查网络设置";
  } else if (errorMessage.includes("timeout")) {
    errorMessage = "请求超时，请稍后重试";
  } else if (errorMessage.includes("404")) {
    errorMessage = "资源未找到";
  } else if (errorMessage.includes("500")) {
    errorMessage = "服务器错误，请稍后重试";
  }

  setError(errorMessage);
}

/**
 * 表单验证错误处理
 */
export function handleValidationError(
  field: string,
  message: string
): void {
  const { setError } = useUIStore.getState();
  setError(`${field}: ${message}`);
}

/**
 * 数据加载错误处理（带重试机制）
 */
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        onRetry?.();
      }
    }
  }

  throw lastError || new Error("重试失败");
}
