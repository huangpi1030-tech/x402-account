/**
 * RPC 池管理
 * 对应 PRD 第 9.1 节：RPC 池冗余与故障切换（P0）
 * 至少 2-3 个可用端点（官方+第三方）；轮询/熔断/重试；按失败率动态降权
 */

import { RpcEndpoint, RpcPoolConfig } from "@/types";

/**
 * RPC 池管理器
 */
export class RpcPool {
  private endpoints: RpcEndpoint[];
  private strategy: "round_robin" | "priority" | "random";
  private currentIndex: number = 0;
  private failureCounts: Map<string, number> = new Map();

  constructor(config: RpcPoolConfig) {
    this.endpoints = [...config.endpoints].filter((e) => e.enabled);
    this.strategy = config.strategy;
    this.endpoints.forEach((endpoint) => {
      this.failureCounts.set(endpoint.url, 0);
    });
  }

  /**
   * 获取下一个可用的 RPC 端点
   */
  getNextEndpoint(): RpcEndpoint | null {
    if (this.endpoints.length === 0) {
      return null;
    }

    // 按失败率排序（失败率低的优先）
    const sortedEndpoints = [...this.endpoints].sort((a, b) => {
      const aFailureRate = a.failure_rate || 0;
      const bFailureRate = b.failure_rate || 0;
      if (aFailureRate !== bFailureRate) {
        return aFailureRate - bFailureRate;
      }
      // 如果失败率相同，按优先级排序
      return b.priority - a.priority;
    });

    switch (this.strategy) {
      case "round_robin":
        const endpoint = sortedEndpoints[this.currentIndex % sortedEndpoints.length];
        this.currentIndex++;
        return endpoint;

      case "priority":
        // 返回优先级最高的可用端点
        return sortedEndpoints[0];

      case "random":
        const randomIndex = Math.floor(Math.random() * sortedEndpoints.length);
        return sortedEndpoints[randomIndex];

      default:
        return sortedEndpoints[0];
    }
  }

  /**
   * 记录成功
   */
  recordSuccess(url: string): void {
    this.failureCounts.set(url, 0);
    const endpoint = this.endpoints.find((e) => e.url === url);
    if (endpoint) {
      endpoint.failure_rate = 0;
      endpoint.last_success_at = new Date().toISOString();
    }
  }

  /**
   * 记录失败（按失败率动态降权）
   */
  recordFailure(url: string): void {
    const currentCount = this.failureCounts.get(url) || 0;
    const newCount = currentCount + 1;
    this.failureCounts.set(url, newCount);

    // 计算失败率（基于最近 10 次请求）
    const failureRate = Math.min(newCount / 10, 1.0);
    const endpoint = this.endpoints.find((e) => e.url === url);
    if (endpoint) {
      endpoint.failure_rate = failureRate;

      // 如果失败率过高，暂时禁用（熔断）
      if (failureRate > 0.8) {
        console.warn(`[RPC Pool] 端点 ${url} 失败率过高 (${failureRate})，暂时禁用`);
        endpoint.enabled = false;
      }
    }
  }

  /**
   * 重置端点状态（用于恢复）
   */
  resetEndpoint(url: string): void {
    this.failureCounts.set(url, 0);
    const endpoint = this.endpoints.find((e) => e.url === url);
    if (endpoint) {
      endpoint.failure_rate = 0;
      endpoint.enabled = true;
    }
  }

  /**
   * 获取所有可用端点
   */
  getAvailableEndpoints(): RpcEndpoint[] {
    return this.endpoints.filter((e) => e.enabled);
  }
}
