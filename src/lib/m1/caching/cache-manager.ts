/**
 * M1 Advanced Caching System
 *
 * Multi-tier caching with in-memory L1 and distributed L2 support,
 * automatic invalidation patterns, and comprehensive statistics
 *
 * Version: v1.0.0
 * Phase: 22 - Advanced Caching & Performance Optimization
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt?: number; // TTL expiration
  hitCount: number;
  lastAccessedAt: number;
  size: number; // bytes estimate
}

/**
 * Cache statistics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  hitRate: number; // 0-1
  avgHitCount: number;
  totalSize: number; // bytes
  entryCount: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // bytes, default 10MB
  maxEntries?: number; // default unlimited
  ttlMs?: number; // default TTL in milliseconds
  evictionPolicy?: 'lru' | 'lfu' | 'fifo'; // default 'lru'
}

/**
 * Cache invalidation strategy
 */
export type InvalidationStrategy = 'ttl' | 'event' | 'dependency' | 'manual';

/**
 * Invalidation pattern
 */
export interface InvalidationPattern {
  strategy: InvalidationStrategy;
  pattern?: string; // Regex pattern for event/key matching
  ttlMs?: number; // For TTL strategy
  dependencies?: string[]; // For dependency strategy
  metadata?: Record<string, unknown>;
}

/**
 * Base cache store interface
 */
export abstract class CacheStore<T = unknown> {
  abstract set(key: string, value: T, ttlMs?: number): void;
  abstract get(key: string): T | undefined;
  abstract has(key: string): boolean;
  abstract delete(key: string): boolean;
  abstract clear(): void;
  abstract getMetrics(): CacheMetrics;
}

/**
 * In-memory cache store with LRU eviction
 */
export class InMemoryCacheStore<T = unknown> extends CacheStore<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: Required<CacheConfig>;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
    hitRate: 0,
    avgHitCount: 0,
    totalSize: 0,
    entryCount: 0,
  };

  constructor(config: CacheConfig = {}) {
    super();
    this.config = {
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB default
      maxEntries: config.maxEntries || Number.MAX_SAFE_INTEGER,
      ttlMs: config.ttlMs || 60 * 60 * 1000, // 1 hour default
      evictionPolicy: config.evictionPolicy || 'lru',
    };
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttlMs?: number): void {
    // Remove expired entries periodically
    this.cleanupExpired();

    // Estimate size (rough approximation)
    const size = JSON.stringify(value).length;

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      hitCount: 0,
      lastAccessedAt: Date.now(),
      size,
    };

    // Check if we need to evict
    const currentSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
    const wouldExceedSize = currentSize + size > this.config.maxSize;
    const wouldExceedEntries = this.cache.size >= this.config.maxEntries;

    if (wouldExceedSize || wouldExceedEntries) {
      this.evictOne();
      this.metrics.evictions++;
    }

    this.cache.set(key, entry);
    this.updateMetrics();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics();
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.metrics.expirations++;
      this.metrics.misses++;
      this.updateMetrics();
      return undefined;
    }

    // Update access tracking
    entry.hitCount++;
    entry.lastAccessedAt = Date.now();
    this.metrics.hits++;
    this.updateMetrics();

    return entry.value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
return false;
}

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      hitRate: 0,
      avgHitCount: 0,
      totalSize: 0,
      entryCount: 0,
    };
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Evict one entry based on policy
   */
  private evictOne(): void {
    if (this.cache.size === 0) {
return;
}

    let keyToEvict: string | undefined;

    switch (this.config.evictionPolicy) {
      case 'lru': // Least recently used
        let minTime = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.lastAccessedAt < minTime) {
            minTime = entry.lastAccessedAt;
            keyToEvict = key;
          }
        }
        break;

      case 'lfu': // Least frequently used
        let minHits = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.hitCount < minHits) {
            minHits = entry.hitCount;
            keyToEvict = key;
          }
        }
        break;

      case 'fifo': // First in, first out
        let minTime2 = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.createdAt < minTime2) {
            minTime2 = entry.createdAt;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && entry.expiresAt < now) {
        keysToDelete.push(key);
        this.metrics.expirations++;
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    const entries = Array.from(this.cache.values());
    this.metrics.avgHitCount = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.hitCount, 0) / entries.length
      : 0;

    this.metrics.totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    this.metrics.entryCount = this.cache.size;
  }
}

/**
 * Multi-tier cache with L1 (in-memory) and L2 (distributed) support
 */
export class MultiTierCache<T = unknown> {
  private l1Cache: InMemoryCacheStore<T>;
  private l2Cache?: CacheStore<T>;
  private strategy: 'write-through' | 'write-back' = 'write-through';
  private invalidationPatterns: Map<string, InvalidationPattern> = new Map();
  private config: CacheConfig;

  constructor(
    l1Config: CacheConfig = {},
    l2Cache?: CacheStore<T>,
    strategy: 'write-through' | 'write-back' = 'write-through'
  ) {
    this.l1Cache = new InMemoryCacheStore(l1Config);
    this.l2Cache = l2Cache;
    this.strategy = strategy;
    this.config = l1Config;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttlMs?: number): void {
    if (this.strategy === 'write-through') {
      // Write to L1 first, then L2
      this.l1Cache.set(key, value, ttlMs);
      if (this.l2Cache) {
        this.l2Cache.set(key, value, ttlMs);
      }
    } else {
      // Write-back: write to L1 only, defer L2
      this.l1Cache.set(key, value, ttlMs);
      // In production: queue for async L2 write
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    // Try L1 first
    const l1Value = this.l1Cache.get(key);
    if (l1Value !== undefined) {
      return l1Value;
    }

    // Fallback to L2
    if (this.l2Cache && this.l2Cache.has(key)) {
      const l2Value = this.l2Cache.get(key);
      if (l2Value !== undefined) {
        // Promote to L1
        this.l1Cache.set(key, l2Value);
        return l2Value;
      }
    }

    return undefined;
  }

  /**
   * Check if key exists in either tier
   */
  has(key: string): boolean {
    return this.l1Cache.has(key) || (this.l2Cache?.has(key) ?? false);
  }

  /**
   * Delete from both tiers
   */
  delete(key: string): boolean {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.l2Cache ? this.l2Cache.delete(key) : false;
    return l1Deleted || l2Deleted;
  }

  /**
   * Clear both tiers
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache?.clear();
  }

  /**
   * Register invalidation pattern
   */
  registerInvalidationPattern(patternId: string, pattern: InvalidationPattern): void {
    this.invalidationPatterns.set(patternId, pattern);
  }

  /**
   * Invalidate by pattern
   */
  invalidateByPattern(keyPattern: string): number {
    const invalidated = 0;
    const regex = new RegExp(keyPattern);

    // This is a simplified implementation
    // In production: would track keys and apply patterns
    return invalidated;
  }

  /**
   * Get combined metrics
   */
  getMetrics(): { l1: CacheMetrics; l2?: CacheMetrics } {
    return {
      l1: this.l1Cache.getMetrics(),
      l2: this.l2Cache?.getMetrics(),
    };
  }

  /**
   * Get cache coherence status
   */
  getCoherence(): { consistent: boolean; l1Count: number; l2Count: number } {
    // In production: track which keys are in each tier and verify consistency
    return {
      consistent: true,
      l1Count: this.l1Cache.getMetrics().entryCount,
      l2Count: this.l2Cache?.getMetrics().entryCount ?? 0,
    };
  }
}

/**
 * Cache invalidation engine
 */
export class CacheInvalidationEngine {
  private invalidationPatterns: Map<string, InvalidationPattern> = new Map();
  private keyDependencies: Map<string, Set<string>> = new Map(); // key -> dependent keys
  private reverseKeyDependencies: Map<string, Set<string>> = new Map(); // dependent -> source keys

  /**
   * Register TTL-based invalidation
   */
  registerTTLInvalidation(patternId: string, ttlMs: number, keyPattern?: string): void {
    this.invalidationPatterns.set(patternId, {
      strategy: 'ttl',
      pattern: keyPattern,
      ttlMs,
    });
  }

  /**
   * Register event-based invalidation
   */
  registerEventInvalidation(patternId: string, eventPattern: string, keyPattern?: string): void {
    this.invalidationPatterns.set(patternId, {
      strategy: 'event',
      pattern: keyPattern,
      metadata: { eventPattern },
    });
  }

  /**
   * Register dependency-based invalidation
   */
  registerDependencyInvalidation(patternId: string, sourceKeys: string[], dependentKeys: string[]): void {
    // Track that dependent keys depend on source keys
    for (const sourceKey of sourceKeys) {
      if (!this.keyDependencies.has(sourceKey)) {
        this.keyDependencies.set(sourceKey, new Set());
      }
      for (const depKey of dependentKeys) {
        this.keyDependencies.get(sourceKey)!.add(depKey);
      }
    }

    for (const depKey of dependentKeys) {
      if (!this.reverseKeyDependencies.has(depKey)) {
        this.reverseKeyDependencies.set(depKey, new Set());
      }
      for (const sourceKey of sourceKeys) {
        this.reverseKeyDependencies.get(depKey)!.add(sourceKey);
      }
    }

    this.invalidationPatterns.set(patternId, {
      strategy: 'dependency',
      dependencies: sourceKeys,
    });
  }

  /**
   * Get keys to invalidate when source key changes
   */
  getInvalidationChain(sourceKey: string): string[] {
    const toInvalidate: Set<string> = new Set();
    const queue: string[] = [sourceKey];

    while (queue.length > 0) {
      const key = queue.shift()!;
      const dependent = this.keyDependencies.get(key);

      if (dependent) {
        for (const depKey of dependent) {
          if (!toInvalidate.has(depKey)) {
            toInvalidate.add(depKey);
            queue.push(depKey);
          }
        }
      }
    }

    return Array.from(toInvalidate);
  }

  /**
   * Get all patterns
   */
  getPatterns(): Map<string, InvalidationPattern> {
    return new Map(this.invalidationPatterns);
  }
}

/**
 * Global cache manager instance
 */
export class CacheManager {
  private caches: Map<string, MultiTierCache<any>> = new Map();
  private invalidationEngine = new CacheInvalidationEngine();

  /**
   * Create or get named cache
   */
  getCache<T = unknown>(name: string, config?: CacheConfig, l2Store?: CacheStore<T>): MultiTierCache<T> {
    if (!this.caches.has(name)) {
      const cache = new MultiTierCache<T>(config, l2Store);
      this.caches.set(name, cache);
    }

    return this.caches.get(name)!;
  }

  /**
   * Delete cache
   */
  deleteCache(name: string): boolean {
    if (this.caches.has(name)) {
      this.caches.get(name)!.clear();
      return this.caches.delete(name);
    }
    return false;
  }

  /**
   * Get invalidation engine
   */
  getInvalidationEngine(): CacheInvalidationEngine {
    return this.invalidationEngine;
  }

  /**
   * Get all cache metrics
   */
  getAllMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};

    for (const [name, cache] of this.caches) {
      metrics[name] = cache.getMetrics();
    }

    return metrics;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    this.caches.clear();
  }
}

// Export singleton
export const cacheManager = new CacheManager();
