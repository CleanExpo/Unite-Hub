/**
 * Redis Client & Cache Manager
 * Handles caching for alert queries and analytics
 */

import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // seconds (default: 3600)
  prefix?: string;
}

class CacheManager {
  private redis: Redis;
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  constructor() {
    // Initialize Redis connection
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD;

    this.redis = new Redis({
      host,
      port,
      password,
      db: 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    });

    this.redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
      this.metrics.errors++;
    });

    this.redis.on('connect', () => {
      console.log('[Redis] Connected');
    });

    this.redis.on('disconnect', () => {
      console.log('[Redis] Disconnected');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key, options?.prefix);
      const value = await this.redis.get(prefixedKey);

      if (value) {
        this.metrics.hits++;
        return JSON.parse(value);
      }

      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key, options?.prefix);
      const ttl = options?.ttl || 3600;

      await this.redis.setex(prefixedKey, ttl, JSON.stringify(value));
      this.metrics.sets++;
    } catch (error) {
      console.error('[Redis] Set error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string, prefix?: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key, prefix);
      await this.redis.del(prefixedKey);
      this.metrics.deletes++;
    } catch (error) {
      console.error('[Redis] Delete error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Invalidate cache keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.metrics.deletes += keys.length;
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error('[Redis] Pattern invalidation error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.redis.incrby(key, amount);
      return result;
    } catch (error) {
      console.error('[Redis] Increment error:', error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Set with expiration
   */
  async setex(key: string, ttl: number, value: any): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      this.metrics.sets++;
    } catch (error) {
      console.error('[Redis] Setex error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async getPattern(pattern: string): Promise<Map<string, any>> {
    try {
      const keys = await this.redis.keys(pattern);
      const result = new Map<string, any>();

      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          result.set(key, JSON.parse(value));
        }
      }

      return result;
    } catch (error) {
      console.error('[Redis] Get pattern error:', error);
      this.metrics.errors++;
      return new Map();
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      console.log('[Redis] Cache flushed');
    } catch (error) {
      console.error('[Redis] Flush error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Get cache health metrics
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : '0.00';

    return {
      ...this.metrics,
      hit_rate: `${hitRate}%`,
      total_operations: total,
    };
  }

  /**
   * Get connection status
   */
  async getStatus(): Promise<string> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'healthy' : 'unhealthy';
    } catch (error) {
      return 'disconnected';
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('[Redis] Connection closed');
    } catch (error) {
      console.error('[Redis] Close error:', error);
    }
  }

  private getPrefixedKey(key: string, prefix?: string): string {
    const p = prefix || 'app';
    return `${p}:${key}`;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

export default CacheManager;
