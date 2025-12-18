/**
 * M1 Cache Strategies
 *
 * Specialized caching strategies for different M1 components:
 * - Tool registry caching
 * - Policy decision caching
 * - Metrics aggregation caching
 * - Agent run caching
 *
 * Phase 8: Advanced Caching & Performance Optimization
 */

import { cacheEngine } from "./cache-engine";
import { metricsCollector } from "../monitoring/metrics";

/**
 * Tool Registry Cache Strategy
 */
export class ToolRegistryCache {
  private static readonly CACHE_PREFIX = "tool_registry";
  private static readonly TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Cache tool registry data
   */
  static cacheRegistry(toolName: string, data: any): void {
    const key = `${this.CACHE_PREFIX}:${toolName}`;
    cacheEngine.set(key, data, this.TTL);
  }

  /**
   * Get cached tool registry data
   */
  static getRegistry(toolName: string): any {
    const key = `${this.CACHE_PREFIX}:${toolName}`;
    return cacheEngine.get(key);
  }

  /**
   * Invalidate tool registry cache
   */
  static invalidateRegistry(toolName?: string): number {
    if (toolName) {
      const key = `${this.CACHE_PREFIX}:${toolName}`;
      return cacheEngine.delete(key) ? 1 : 0;
    }
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }

  /**
   * Invalidate all tool caches
   */
  static invalidateAll(): number {
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }
}

/**
 * Policy Decision Cache Strategy
 */
export class PolicyDecisionCache {
  private static readonly CACHE_PREFIX = "policy_decision";
  private static readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache policy decision
   */
  static cacheDecision(
    toolName: string,
    scope: string,
    decision: any
  ): void {
    const key = `${this.CACHE_PREFIX}:${toolName}:${scope}`;
    cacheEngine.set(key, decision, this.TTL);

    // Track cache operation in metrics
    metricsCollector.incrementCounter("policy_cache_writes_total");
  }

  /**
   * Get cached policy decision
   */
  static getDecision(toolName: string, scope: string): any {
    const key = `${this.CACHE_PREFIX}:${toolName}:${scope}`;
    const cached = cacheEngine.get(key);

    if (cached !== undefined) {
      metricsCollector.incrementCounter("policy_cache_hits_total");
    } else {
      metricsCollector.incrementCounter("policy_cache_misses_total");
    }

    return cached;
  }

  /**
   * Invalidate policy cache for a tool
   */
  static invalidatePolicy(toolName: string): number {
    return cacheEngine.invalidatePrefix(`${this.CACHE_PREFIX}:${toolName}`);
  }

  /**
   * Invalidate all policy caches
   */
  static invalidateAll(): number {
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }
}

/**
 * Metrics Aggregation Cache Strategy
 */
export class MetricsCache {
  private static readonly CACHE_PREFIX = "metrics";
  private static readonly TTL = 1 * 60 * 1000; // 1 minute for real-time data

  /**
   * Cache aggregated metrics
   */
  static cacheMetrics(category: string, metrics: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIX}:${category}`;
    const cacheTTL = ttl || this.TTL;
    cacheEngine.set(key, metrics, cacheTTL);
  }

  /**
   * Get cached metrics
   */
  static getMetrics(category: string): any {
    const key = `${this.CACHE_PREFIX}:${category}`;
    return cacheEngine.get(key);
  }

  /**
   * Invalidate metrics cache
   */
  static invalidateMetrics(category?: string): number {
    if (category) {
      const key = `${this.CACHE_PREFIX}:${category}`;
      return cacheEngine.delete(key) ? 1 : 0;
    }
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }

  /**
   * Cache agent run metrics
   */
  static cacheRunMetrics(runId: string, metrics: any): void {
    const key = `${this.CACHE_PREFIX}:run:${runId}`;
    cacheEngine.set(key, metrics, 30 * 60 * 1000); // 30 minutes for run data
  }

  /**
   * Get cached agent run metrics
   */
  static getRunMetrics(runId: string): any {
    const key = `${this.CACHE_PREFIX}:run:${runId}`;
    return cacheEngine.get(key);
  }

  /**
   * Cache tool execution stats
   */
  static cacheToolStats(toolName: string, stats: any): void {
    const key = `${this.CACHE_PREFIX}:tool:${toolName}`;
    cacheEngine.set(key, stats, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get cached tool stats
   */
  static getToolStats(toolName: string): any {
    const key = `${this.CACHE_PREFIX}:tool:${toolName}`;
    return cacheEngine.get(key);
  }
}

/**
 * Agent Run Cache Strategy
 */
export class AgentRunCache {
  private static readonly CACHE_PREFIX = "agent_run";
  private static readonly TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Cache agent run data
   */
  static cacheRun(runId: string, runData: any): void {
    const key = `${this.CACHE_PREFIX}:${runId}`;
    cacheEngine.set(key, runData, this.TTL);
  }

  /**
   * Get cached agent run
   */
  static getRun(runId: string): any {
    const key = `${this.CACHE_PREFIX}:${runId}`;
    return cacheEngine.get(key);
  }

  /**
   * Cache agent's recent runs
   */
  static cacheRecentRuns(agentName: string, runs: any[]): void {
    const key = `${this.CACHE_PREFIX}:recent:${agentName}`;
    cacheEngine.set(key, runs, 5 * 60 * 1000); // 5 minutes for lists
  }

  /**
   * Get cached recent runs
   */
  static getRecentRuns(agentName: string): any[] | undefined {
    const key = `${this.CACHE_PREFIX}:recent:${agentName}`;
    return cacheEngine.get(key);
  }

  /**
   * Invalidate run cache
   */
  static invalidateRun(runId: string): number {
    const key = `${this.CACHE_PREFIX}:${runId}`;
    return cacheEngine.delete(key) ? 1 : 0;
  }

  /**
   * Invalidate recent runs for an agent
   */
  static invalidateRecentRuns(agentName: string): number {
    const key = `${this.CACHE_PREFIX}:recent:${agentName}`;
    return cacheEngine.delete(key) ? 1 : 0;
  }

  /**
   * Invalidate all run caches
   */
  static invalidateAll(): number {
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }
}

/**
 * Approval Token Cache Strategy
 */
export class ApprovalTokenCache {
  private static readonly CACHE_PREFIX = "approval_token";
  private static readonly TTL = 5 * 60 * 1000; // 5 minutes (matches token TTL)

  /**
   * Cache approval token
   */
  static cacheToken(tokenId: string, tokenData: any): void {
    const key = `${this.CACHE_PREFIX}:${tokenId}`;
    cacheEngine.set(key, tokenData, this.TTL);
  }

  /**
   * Get cached approval token
   */
  static getToken(tokenId: string): any {
    const key = `${this.CACHE_PREFIX}:${tokenId}`;
    return cacheEngine.get(key);
  }

  /**
   * Invalidate token (revocation)
   */
  static revokeToken(tokenId: string): number {
    const key = `${this.CACHE_PREFIX}:${tokenId}`;
    return cacheEngine.delete(key) ? 1 : 0;
  }

  /**
   * Invalidate all tokens for a tool
   */
  static revokeTokensForTool(toolName: string): number {
    return cacheEngine.invalidatePrefix(`${this.CACHE_PREFIX}:${toolName}`);
  }

  /**
   * Invalidate all tokens
   */
  static revokeAll(): number {
    return cacheEngine.invalidatePrefix(this.CACHE_PREFIX);
  }
}

/**
 * Cache Invalidation Events
 * Triggered when data changes
 */
export class CacheInvalidationEvent {
  /**
   * Trigger on tool registry update
   */
  static onToolRegistryUpdate(toolName: string): void {
    ToolRegistryCache.invalidateRegistry(toolName);
    PolicyDecisionCache.invalidatePolicy(toolName);
    MetricsCache.invalidateMetrics(`tool:${toolName}`);
  }

  /**
   * Trigger on policy change
   */
  static onPolicyChange(): void {
    PolicyDecisionCache.invalidateAll();
    MetricsCache.invalidateMetrics();
  }

  /**
   * Trigger on run completion
   */
  static onRunComplete(runId: string, agentName: string): void {
    AgentRunCache.invalidateRun(runId);
    AgentRunCache.invalidateRecentRuns(agentName);
    MetricsCache.invalidateMetrics("run");
  }

  /**
   * Trigger on metrics update
   */
  static onMetricsUpdate(): void {
    MetricsCache.invalidateMetrics();
  }

  /**
   * Trigger on token revocation
   */
  static onTokenRevocation(tokenId?: string): void {
    if (tokenId) {
      ApprovalTokenCache.revokeToken(tokenId);
    } else {
      ApprovalTokenCache.revokeAll();
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = cacheEngine.getStats();
  return {
    ...stats,
    efficiency: {
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      totalRequests: stats.hits + stats.misses,
      avgEfficiency: stats.evictions > 0 ? stats.hits / (stats.hits + stats.misses) : 1,
    },
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  cacheEngine.clear();
}
