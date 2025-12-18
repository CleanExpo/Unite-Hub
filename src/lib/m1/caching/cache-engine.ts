/**
 * M1 Cache Engine
 *
 * Provides multi-tier caching strategy with in-memory and distributed cache support.
 * Implements TTL-based expiration, LRU eviction, and cache invalidation.
 *
 * Phase 8: Advanced Caching & Performance Optimization
 */

import { v4 as generateUUID } from "uuid";

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  size: number; // Approximate size in bytes
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number; // Maximum cache size in bytes (default: 100MB)
  maxEntries?: number; // Maximum number of entries (default: 10000)
  defaultTTL?: number; // Default TTL in milliseconds (default: 5 minutes)
  evictionPolicy?: "LRU" | "LFU" | "FIFO"; // Default: LRU
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
  hitRate: number;
}

/**
 * In-memory cache engine with LRU/LFU eviction
 */
export class CacheEngine<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private config: Required<CacheConfig> = {
    maxSize: 100 * 1024 * 1024, // 100MB default
    maxEntries: 10000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    evictionPolicy: "LRU",
  };

  private currentSize: number = 0;

  constructor(config?: CacheConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Set a cache entry
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresTTL = ttl || this.config.defaultTTL;

    // Estimate size (rough approximation)
    const size = JSON.stringify(value).length;

    // Remove old entry if exists
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
    }

    // Check if we need to evict
    while (
      this.currentSize + size > this.config.maxSize ||
      this.cache.size >= this.config.maxEntries
    ) {
      this.evictOne();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt: now + expiresTTL,
      accessCount: 0,
      lastAccessedAt: now,
      size,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Get a cache entry
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.stats.misses++;
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
return false;
}

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return true;
    }
    return false;
  }

  /**
   * Invalidate entries by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
      invalidated++;
    }

    return invalidated;
  }

  /**
   * Invalidate entries by prefix
   */
  invalidatePrefix(prefix: string): number {
    return this.invalidatePattern(new RegExp(`^${prefix}`));
  }

  /**
   * Invalidate entries by tag
   */
  invalidateTag(tag: string): number {
    // Tags are stored as metadata - this is a simple implementation
    const tagKey = `__tag__:${tag}`;
    return this.invalidatePrefix(tagKey);
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
      case "LRU":
        // Least Recently Used
        keyToEvict = this.findLRU();
        break;
      case "LFU":
        // Least Frequently Used
        keyToEvict = this.findLFU();
        break;
      case "FIFO":
        // First In First Out
        keyToEvict = this.findFIFO();
        break;
    }

    if (keyToEvict) {
      const entry = this.cache.get(keyToEvict);
      if (entry) {
        this.cache.delete(keyToEvict);
        this.currentSize -= entry.size;
        this.stats.evictions++;
      }
    }
  }

  /**
   * Find Least Recently Used entry
   */
  private findLRU(): string | undefined {
    let lruKey: string | undefined;
    let lruTime = Infinity; // Start with max value to find minimum

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    return lruKey;
  }

  /**
   * Find Least Frequently Used entry
   */
  private findLFU(): string | undefined {
    let lfuKey: string | undefined;
    let lfuCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lfuCount) {
        lfuCount = entry.accessCount;
        lfuKey = key;
      }
    }

    return lfuKey;
  }

  /**
   * Find First In First Out entry
   */
  private findFIFO(): string | undefined {
    let fifoKey: string | undefined;
    let fifoTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < fifoTime) {
        fifoTime = entry.createdAt;
        fifoKey = key;
      }
    }

    return fifoKey;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.currentSize,
      entries: this.cache.size,
      hitRate,
    };
  }

  /**
   * Get all entries (for inspection)
   */
  getAll(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
}

/**
 * Distributed cache stub (ready for Redis/Memcached integration)
 */
export interface DistributedCache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  invalidatePattern(pattern: string): Promise<number>;
  clear(): Promise<void>;
}

/**
 * Multi-tier cache with local + distributed support
 */
export class MultiTierCache<T = any> {
  private localCache: CacheEngine<T>;
  private distributedCache?: DistributedCache;

  constructor(config?: CacheConfig, distributedCache?: DistributedCache) {
    this.localCache = new CacheEngine(config);
    this.distributedCache = distributedCache;
  }

  /**
   * Set with multi-tier storage
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Store in local cache
    this.localCache.set(key, value, ttl);

    // Store in distributed cache if available
    if (this.distributedCache) {
      try {
        await this.distributedCache.set(key, value, ttl);
      } catch (error) {
        console.warn(`Failed to store in distributed cache: ${key}`, error);
      }
    }
  }

  /**
   * Get from multi-tier cache
   */
  async get(key: string): Promise<T | undefined> {
    // Try local cache first
    const localValue = this.localCache.get(key);
    if (localValue !== undefined) {
      return localValue;
    }

    // Try distributed cache if available
    if (this.distributedCache) {
      try {
        const distributedValue = await this.distributedCache.get(key);
        if (distributedValue !== undefined) {
          // Populate local cache from distributed
          this.localCache.set(key, distributedValue);
          return distributedValue;
        }
      } catch (error) {
        console.warn(`Failed to retrieve from distributed cache: ${key}`, error);
      }
    }

    return undefined;
  }

  /**
   * Check if exists in either tier
   */
  async has(key: string): Promise<boolean> {
    if (this.localCache.has(key)) {
      return true;
    }

    if (this.distributedCache) {
      try {
        return await this.distributedCache.has(key);
      } catch (error) {
        console.warn(`Failed to check distributed cache: ${key}`, error);
      }
    }

    return false;
  }

  /**
   * Delete from both tiers
   */
  async delete(key: string): Promise<boolean> {
    const localDeleted = this.localCache.delete(key);

    if (this.distributedCache) {
      try {
        await this.distributedCache.delete(key);
      } catch (error) {
        console.warn(`Failed to delete from distributed cache: ${key}`, error);
      }
    }

    return localDeleted;
  }

  /**
   * Invalidate pattern in both tiers
   */
  async invalidatePattern(pattern: RegExp): Promise<number> {
    const localInvalidated = this.localCache.invalidatePattern(pattern);

    if (this.distributedCache) {
      try {
        await this.distributedCache.invalidatePattern(pattern.source);
      } catch (error) {
        console.warn(`Failed to invalidate in distributed cache`, error);
      }
    }

    return localInvalidated;
  }

  /**
   * Get local cache stats
   */
  getStats(): CacheStats {
    return this.localCache.getStats();
  }

  /**
   * Clear both tiers
   */
  async clear(): Promise<void> {
    this.localCache.clear();

    if (this.distributedCache) {
      try {
        await this.distributedCache.clear();
      } catch (error) {
        console.warn(`Failed to clear distributed cache`, error);
      }
    }
  }
}

/**
 * Global cache instance
 */
export const cacheEngine = new CacheEngine();
