/**
 * M1 Quota Manager
 *
 * Token pool-based quota management with automatic refill scheduling,
 * quota sharing across resources, and consumption tracking.
 *
 * Version: v1.0.0
 * Phase: 24 - Advanced Rate Limiting & Fair Queuing
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Quota pool configuration
 */
export interface QuotaPoolConfig {
  poolId: string;
  name: string;
  totalQuota: number;
  refillRate: number; // tokens per second
  refillInterval: number; // milliseconds
  maxAccumulation?: number; // max tokens that can accumulate
  priority?: number; // lower = higher priority
}

/**
 * Token consumption record
 */
export interface ConsumptionRecord {
  timestamp: number;
  resourceId: string;
  amount: number;
  reason?: string;
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  allowed: boolean;
  poolId: string;
  tokensAvailable: number;
  tokensNeeded: number;
  tokensRemaining?: number;
  nextRefillAt?: number;
  reason?: string;
}

/**
 * Token pool tracking
 */
interface TokenPool {
  poolId: string;
  tokens: number;
  lastRefillAt: number;
  refillTimer?: NodeJS.Timeout;
}

/**
 * Quota pool for managing token distribution
 */
interface QuotaPool {
  config: QuotaPoolConfig;
  tokenPool: TokenPool;
  consumptionHistory: ConsumptionRecord[];
  resourceAllocations: Map<string, number>; // resourceId -> allocated tokens
}

/**
 * Quota manager for token pool-based resource limits
 */
export class QuotaManager {
  private quotaPools: Map<string, QuotaPool> = new Map();
  private globalConsumption: ConsumptionRecord[] = [];

  /**
   * Create and register a quota pool
   */
  createPool(config: Omit<QuotaPoolConfig, 'poolId'>): string {
    const poolId = `quota_${generateUUID()}`;

    const fullConfig: QuotaPoolConfig = {
      ...config,
      poolId,
      priority: config.priority ?? 100,
    };

    const pool: QuotaPool = {
      config: fullConfig,
      tokenPool: {
        poolId,
        tokens: config.totalQuota,
        lastRefillAt: Date.now(),
      },
      consumptionHistory: [],
      resourceAllocations: new Map(),
    };

    this.quotaPools.set(poolId, pool);

    // Start automatic refill
    this.scheduleRefill(poolId);

    return poolId;
  }

  /**
   * Schedule automatic refill for a pool
   */
  private scheduleRefill(poolId: string): void {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return;
}

    // Cancel previous timer if exists
    if (pool.tokenPool.refillTimer) {
      clearInterval(pool.tokenPool.refillTimer);
    }

    // Schedule refill at specified interval
    pool.tokenPool.refillTimer = setInterval(() => {
      this.refillPool(poolId);
    }, pool.config.refillInterval);
  }

  /**
   * Manually refill a pool
   */
  private refillPool(poolId: string): void {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return;
}

    const now = Date.now();
    const timeSinceRefill = (now - pool.tokenPool.lastRefillAt) / 1000; // seconds
    const tokensToAdd = timeSinceRefill * pool.config.refillRate;

    const maxTokens = pool.config.maxAccumulation || pool.config.totalQuota;
    pool.tokenPool.tokens = Math.min(pool.tokenPool.tokens + tokensToAdd, maxTokens);
    pool.tokenPool.lastRefillAt = now;
  }

  /**
   * Consume quota from a pool
   */
  consumeQuota(poolId: string, amount: number, resourceId?: string, reason?: string): QuotaCheckResult {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
      return {
        allowed: false,
        poolId,
        tokensAvailable: 0,
        tokensNeeded: amount,
        reason: `Pool ${poolId} not found`,
      };
    }

    // Refill before checking
    this.refillPool(poolId);

    const tokensAvailable = pool.tokenPool.tokens;

    if (tokensAvailable >= amount) {
      // Consume tokens
      pool.tokenPool.tokens -= amount;

      // Record consumption
      const record: ConsumptionRecord = {
        timestamp: Date.now(),
        resourceId: resourceId || 'unknown',
        amount,
        reason,
      };

      pool.consumptionHistory.push(record);
      this.globalConsumption.push(record);

      // Update resource allocation
      if (resourceId) {
        const current = pool.resourceAllocations.get(resourceId) || 0;
        pool.resourceAllocations.set(resourceId, current + amount);
      }

      // Clean old records (older than 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      pool.consumptionHistory = pool.consumptionHistory.filter((r) => r.timestamp > oneHourAgo);

      return {
        allowed: true,
        poolId,
        tokensAvailable: pool.tokenPool.tokens,
        tokensNeeded: amount,
        tokensRemaining: pool.tokenPool.tokens,
      };
    }

    // Calculate next refill time
    const shortfall = amount - tokensAvailable;
    const secondsUntilRefill = shortfall / pool.config.refillRate;
    const nextRefillAt = Date.now() + secondsUntilRefill * 1000;

    return {
      allowed: false,
      poolId,
      tokensAvailable,
      tokensNeeded: amount,
      nextRefillAt,
      reason: `Insufficient quota: need ${amount}, have ${tokensAvailable}`,
    };
  }

  /**
   * Check if quota is available (without consuming)
   */
  checkQuota(poolId: string, amount: number): QuotaCheckResult {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
      return {
        allowed: false,
        poolId,
        tokensAvailable: 0,
        tokensNeeded: amount,
        reason: `Pool ${poolId} not found`,
      };
    }

    // Refill before checking
    this.refillPool(poolId);

    const tokensAvailable = pool.tokenPool.tokens;
    const allowed = tokensAvailable >= amount;

    if (!allowed) {
      const shortfall = amount - tokensAvailable;
      const secondsUntilRefill = shortfall / pool.config.refillRate;
      const nextRefillAt = Date.now() + secondsUntilRefill * 1000;

      return {
        allowed: false,
        poolId,
        tokensAvailable,
        tokensNeeded: amount,
        nextRefillAt,
        reason: `Insufficient quota: need ${amount}, have ${tokensAvailable}`,
      };
    }

    return {
      allowed: true,
      poolId,
      tokensAvailable,
      tokensNeeded: amount,
      tokensRemaining: tokensAvailable - amount,
    };
  }

  /**
   * Allocate quota to a specific resource
   */
  allocateToResource(poolId: string, resourceId: string, amount: number): boolean {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return false;
}

    this.refillPool(poolId);

    if (pool.tokenPool.tokens < amount) {
      return false;
    }

    pool.tokenPool.tokens -= amount;
    const current = pool.resourceAllocations.get(resourceId) || 0;
    pool.resourceAllocations.set(resourceId, current + amount);

    return true;
  }

  /**
   * Release allocated quota back to pool
   */
  releaseFromResource(poolId: string, resourceId: string, amount: number): boolean {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return false;
}

    const allocated = pool.resourceAllocations.get(resourceId) || 0;
    if (allocated < amount) {
      return false;
    }

    pool.resourceAllocations.set(resourceId, allocated - amount);
    pool.tokenPool.tokens += amount;

    return true;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolId: string): Record<string, unknown> | null {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return null;
}

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentConsumption = pool.consumptionHistory.filter((r) => r.timestamp > oneHourAgo);
    const totalConsumed = recentConsumption.reduce((sum, r) => sum + r.amount, 0);

    const resourceStats: Record<string, unknown> = {};
    for (const [resourceId, allocated] of pool.resourceAllocations) {
      resourceStats[resourceId] = {
        allocated,
        consumed: recentConsumption
          .filter((r) => r.resourceId === resourceId)
          .reduce((sum, r) => sum + r.amount, 0),
      };
    }

    return {
      poolId,
      name: pool.config.name,
      totalQuota: pool.config.totalQuota,
      tokensAvailable: pool.tokenPool.tokens,
      refillRate: pool.config.refillRate,
      consumedInLastHour: totalConsumed,
      consumptionRate: pool.config.refillRate > 0 ? totalConsumed / (60 * 60) : 0,
      resourceAllocations: resourceStats,
      resourceCount: pool.resourceAllocations.size,
    };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats(): Array<Record<string, unknown>> {
    const stats: Array<Record<string, unknown>> = [];

    for (const poolId of this.quotaPools.keys()) {
      const poolStats = this.getPoolStats(poolId);
      if (poolStats) {
        stats.push(poolStats);
      }
    }

    return stats;
  }

  /**
   * Get consumption history for a pool
   */
  getConsumptionHistory(
    poolId: string,
    filterOptions?: { resourceId?: string; fromTime?: number; toTime?: number }
  ): ConsumptionRecord[] {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return [];
}

    let records = [...pool.consumptionHistory];

    if (filterOptions?.resourceId) {
      records = records.filter((r) => r.resourceId === filterOptions.resourceId);
    }

    if (filterOptions?.fromTime) {
      records = records.filter((r) => r.timestamp >= filterOptions.fromTime!);
    }

    if (filterOptions?.toTime) {
      records = records.filter((r) => r.timestamp <= filterOptions.toTime!);
    }

    return records;
  }

  /**
   * Get global consumption statistics
   */
  getGlobalStats(): Record<string, unknown> {
    const poolStats = this.getAllPoolStats();
    const totalPools = this.quotaPools.size;
    const totalTokensAvailable = poolStats.reduce(
      (sum, p) => sum + ((p.tokensAvailable as number) || 0),
      0
    );

    return {
      totalPools,
      totalTokensAvailable,
      poolStats,
      globalConsumptionRecords: this.globalConsumption.length,
    };
  }

  /**
   * Reset a pool
   */
  resetPool(poolId: string): boolean {
    const pool = this.quotaPools.get(poolId);
    if (!pool) {
return false;
}

    pool.tokenPool.tokens = pool.config.totalQuota;
    pool.tokenPool.lastRefillAt = Date.now();
    pool.consumptionHistory = [];
    pool.resourceAllocations.clear();

    return true;
  }

  /**
   * Reset all pools
   */
  resetAll(): void {
    const now = Date.now();

    for (const pool of this.quotaPools.values()) {
      pool.tokenPool.tokens = pool.config.totalQuota;
      pool.tokenPool.lastRefillAt = now;
      pool.consumptionHistory = [];
      pool.resourceAllocations.clear();
    }

    this.globalConsumption = [];
  }

  /**
   * Clear all state
   */
  clear(): void {
    for (const pool of this.quotaPools.values()) {
      if (pool.tokenPool.refillTimer) {
        clearInterval(pool.tokenPool.refillTimer);
      }
    }

    this.quotaPools.clear();
    this.globalConsumption = [];
  }

  /**
   * Shutdown manager
   */
  shutdown(): void {
    this.clear();
  }
}

// Export singleton
export const quotaManager = new QuotaManager();
