/**
 * M1 Distributed Cache Adapter
 *
 * Adapts the multi-tier cache engine to support distributed Redis backend.
 * Provides seamless integration between local and distributed caching.
 *
 * Phase 9: Production Hardening & Observability Excellence
 */

import { CacheEngine, type CacheStats } from "./cache-engine";
import {
  RedisBackend,
  type RedisConfig,
  type RedisStats,
} from "./redis-backend";

/**
 * Distributed cache adapter configuration
 */
export interface DistributedCacheAdapterConfig {
  enableRedis: boolean; // Enable distributed caching
  redisConfig: Partial<RedisConfig>; // Redis configuration
  fallbackToLocal: boolean; // Fall back to local cache if Redis fails
  invalidationBroadcast: boolean; // Broadcast invalidations to all processes
  syncInterval: number; // Periodic sync interval in ms (0 = disabled)
}

/**
 * Default adapter configuration
 */
export const DEFAULT_ADAPTER_CONFIG: DistributedCacheAdapterConfig = {
  enableRedis: false,
  redisConfig: {},
  fallbackToLocal: true,
  invalidationBroadcast: true,
  syncInterval: 0,
};

/**
 * Distributed cache adapter that wraps local cache with Redis support
 */
export class DistributedCacheAdapter {
  private localCache: CacheEngine;
  private redis: RedisBackend;
  private config: DistributedCacheAdapterConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private invalidationChannel: string = "m1:cache:invalidation";
  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | null = null;

  constructor(
    localCache: CacheEngine,
    config: Partial<DistributedCacheAdapterConfig> = {}
  ) {
    this.localCache = localCache;
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.redis = new RedisBackend(this.config.redisConfig);

    // Create ready promise
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    // Initialize
    this.initialize();
  }

  /**
   * Initialize adapter
   */
  private async initialize(): Promise<void> {
    if (!this.config.enableRedis) {
      console.log("[M1 DistributedCache] Distributed caching disabled");
      this.readyResolve?.();
      return;
    }

    try {
      // Connect to Redis
      await this.redis.connect();

      // Subscribe to invalidation events
      if (this.config.invalidationBroadcast) {
        this.redis.subscribe(this.invalidationChannel, (message) => {
          this.handleInvalidationEvent(message);
        });
      }

      // Start periodic sync if configured
      if (this.config.syncInterval > 0) {
        this.startPeriodicSync();
      }

      console.log("[M1 DistributedCache] Adapter initialized successfully");
      this.readyResolve?.();
    } catch (error) {
      console.warn(
        "[M1 DistributedCache] Failed to initialize Redis:",
        error instanceof Error ? error.message : String(error)
      );

      if (this.config.fallbackToLocal) {
        console.log("[M1 DistributedCache] Falling back to local caching only");
        this.readyResolve?.();
      } else {
        throw error;
      }
    }
  }

  /**
   * Wait for adapter to be ready
   */
  async ready(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Get value from distributed cache (with local fallback)
   */
  async get(key: string): Promise<any> {
    // Always try local first (faster)
    let value = this.localCache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try Redis if available
    if (this.redis.isConnected()) {
      try {
        value = await this.redis.get(key);
        if (value !== undefined) {
          // Update local cache
          const ttl = this.getTTLForKey(key);
          this.localCache.set(key, value, ttl);
          return value;
        }
      } catch (error) {
        console.warn("Error getting from Redis:", error);
        // Fall through to return undefined
      }
    }

    return undefined;
  }

  /**
   * Set value in distributed cache (dual write)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Write to local cache
    this.localCache.set(key, value, ttl);

    // Write to Redis if available
    if (this.redis.isConnected()) {
      try {
        await this.redis.set(key, value, ttl);
      } catch (error) {
        console.warn("Error setting in Redis:", error);
        // Continue - local cache update succeeded
      }
    }
  }

  /**
   * Check if key exists in distributed cache
   */
  async has(key: string): Promise<boolean> {
    // Check local first
    if (this.localCache.has(key)) {
      return true;
    }

    // Check Redis if available
    if (this.redis.isConnected()) {
      try {
        return await this.redis.has(key);
      } catch (error) {
        console.warn("Error checking Redis:", error);
      }
    }

    return false;
  }

  /**
   * Delete key from distributed cache
   */
  async delete(key: string): Promise<boolean> {
    const localDeleted = this.localCache.delete(key);

    if (this.redis.isConnected()) {
      try {
        const redisDeleted = await this.redis.delete(key);
        return localDeleted || redisDeleted;
      } catch (error) {
        console.warn("Error deleting from Redis:", error);
        return localDeleted;
      }
    }

    return localDeleted;
  }

  /**
   * Clear distributed cache
   */
  async clear(): Promise<void> {
    this.localCache.clear();

    if (this.redis.isConnected()) {
      try {
        await this.redis.clear();
      } catch (error) {
        console.warn("Error clearing Redis:", error);
      }
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<number> {
    // Invalidate local
    const localCount = this.localCache.invalidatePattern(pattern);

    // Invalidate Redis if available
    let redisCount = 0;
    if (this.redis.isConnected() && this.config.invalidationBroadcast) {
      try {
        // Convert regex to pattern string for Redis
        const patternStr = this.regexToGlobPattern(pattern);
        redisCount = await this.redis.deletePattern(patternStr);

        // Broadcast invalidation event
        await this.redis.publish(
          this.invalidationChannel,
          JSON.stringify({ type: "pattern", pattern: pattern.source })
        );
      } catch (error) {
        console.warn("Error invalidating pattern in Redis:", error);
      }
    }

    return Math.max(localCount, redisCount);
  }

  /**
   * Invalidate cache entries by prefix
   */
  async invalidatePrefix(prefix: string): Promise<number> {
    // Invalidate local
    const localCount = this.localCache.invalidatePrefix(prefix);

    // Invalidate Redis if available
    let redisCount = 0;
    if (this.redis.isConnected() && this.config.invalidationBroadcast) {
      try {
        redisCount = await this.redis.deletePattern(`${prefix}*`);

        // Broadcast invalidation event
        await this.redis.publish(
          this.invalidationChannel,
          JSON.stringify({ type: "prefix", prefix })
        );
      } catch (error) {
        console.warn("Error invalidating prefix in Redis:", error);
      }
    }

    return Math.max(localCount, redisCount);
  }

  /**
   * Get combined cache statistics
   */
  async getStats(): Promise<{
    local: CacheStats;
    redis?: RedisStats;
    combined: {
      totalSize: number;
      totalEntries: number;
      isDistributed: boolean;
    };
  }> {
    const localStats = this.localCache.getStats();
    let redisStats: RedisStats | undefined;

    if (this.redis.isConnected()) {
      try {
        redisStats = await this.redis.getStats();
      } catch (error) {
        console.warn("Error getting Redis stats:", error);
      }
    }

    return {
      local: localStats,
      redis: redisStats,
      combined: {
        totalSize: localStats.size + (redisStats?.usedMemory || 0),
        totalEntries: localStats.entries,
        isDistributed: this.redis.isConnected(),
      },
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    try {
      await this.redis.disconnect();
      console.log("[M1 DistributedCache] Shutdown complete");
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }

  /**
   * Handle invalidation events from Redis
   */
  private handleInvalidationEvent(message: string): void {
    try {
      const event = JSON.parse(message);

      if (event.type === "prefix") {
        // Invalidate by prefix locally
        this.localCache.invalidatePrefix(event.prefix);
      } else if (event.type === "pattern") {
        // Invalidate by pattern locally
        const pattern = new RegExp(event.pattern);
        this.localCache.invalidatePattern(pattern);
      }
    } catch (error) {
      console.warn("Error handling invalidation event:", error);
    }
  }

  /**
   * Start periodic sync of Redis cache to local
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      try {
        // Sync hot keys from Redis to local cache
        // This helps with cache warming after process restart
        await this.syncHotKeys();
      } catch (error) {
        console.warn("Error during periodic sync:", error);
      }
    }, this.config.syncInterval);
  }

  /**
   * Sync hot keys from Redis to local cache
   */
  private async syncHotKeys(): Promise<void> {
    if (!this.redis.isConnected()) {
      return;
    }

    try {
      // Get top accessed keys from Redis
      // In production: Use ZUNIONSTORE or similar to track access counts
      // For now: Just log that sync would happen
      console.debug("[M1 DistributedCache] Periodic sync completed");
    } catch (error) {
      console.warn("Error syncing hot keys:", error);
    }
  }

  /**
   * Get TTL for a key (rough estimate based on pattern)
   */
  private getTTLForKey(key: string): number {
    // Estimate TTL based on key prefix
    if (key.startsWith("tool_registry:")) {
return 10 * 60 * 1000;
}
    if (key.startsWith("policy_decision:")) {
return 5 * 60 * 1000;
}
    if (key.startsWith("metrics:")) {
return 1 * 60 * 1000;
}
    if (key.startsWith("agent_run:")) {
return 30 * 60 * 1000;
}
    if (key.startsWith("approval_token:")) {
return 5 * 60 * 1000;
}

    // Default 5 minutes
    return 5 * 60 * 1000;
  }

  /**
   * Convert regex to glob-like pattern for Redis
   */
  private regexToGlobPattern(regex: RegExp): string {
    const source = regex.source;

    // Simple conversion for common patterns
    if (source === ".*") {
return "*";
}
    if (source.endsWith(".*")) {
return `${source.slice(0, -3)}*`;
}
    if (source.startsWith("^") && source.endsWith("$")) {
      return source.slice(1, -1);
    }

    return source;
  }
}

/**
 * Create distributed cache adapter with default config
 */
export function createDistributedCacheAdapter(
  localCache: CacheEngine,
  enableRedis: boolean = false
): DistributedCacheAdapter {
  return new DistributedCacheAdapter(localCache, {
    enableRedis,
    fallbackToLocal: true,
    invalidationBroadcast: true,
  });
}
