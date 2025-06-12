/**
 * Redis utility functions using the RedisService abstraction
 * This provides a simple interface for Redis operations throughout the application
 */

import { getRedis, RedisService } from '../services/redis';

/**
 * Cache utilities using Redis
 */
export class CacheManager {
  private static redis: RedisService | null = null;

  /**
   * Initialize the Redis connection
   */
  private static async init(): Promise<RedisService | null> {
    if (!this.redis) {
      try {
        this.redis = await getRedis();
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        return null;
      }
    }
    return this.redis;
  }

  /**
   * Get a cached value
   */
  static async get<T = string>(key: string): Promise<T | null> {
    const redis = await this.init();
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      if (!value) return null;
      
      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a cached value
   */
  static async set(
    key: string, 
    value: unknown, 
    ttl?: number
  ): Promise<boolean> {
    const redis = await this.init();
    if (!redis) return false;

    try {
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      
      return await redis.set(key, serialized, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a cached value
   */
  static async delete(key: string): Promise<boolean> {
    const redis = await this.init();
    if (!redis) return false;

    try {
      return await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  static async exists(key: string): Promise<boolean> {
    const redis = await this.init();
    if (!redis) return false;

    try {
      return await redis.exists(key);
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  static async flush(): Promise<void> {
    const redis = await this.init();
    if (!redis) return;

    try {
      await redis.flushall();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly SESSION_TTL = 86400; // 24 hours

  /**
   * Store session data
   */
  static async setSession(
    sessionId: string, 
    data: Record<string, unknown>
  ): Promise<boolean> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await CacheManager.set(key, data, this.SESSION_TTL);
  }

  /**
   * Get session data
   */
  static async getSession(
    sessionId: string
  ): Promise<Record<string, unknown> | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await CacheManager.get<Record<string, unknown>>(key);
  }

  /**
   * Update session expiry
   */
  static async touchSession(sessionId: string): Promise<boolean> {
    const redis = await getRedis();
    if (!redis) return false;

    const key = `${this.SESSION_PREFIX}${sessionId}`;
    try {
      return await redis.expire(key, this.SESSION_TTL);
    } catch (error) {
      console.error(`Session touch error for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await CacheManager.delete(key);
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static readonly RATE_LIMIT_PREFIX = 'rate:';
  
  /**
   * Check if rate limit is exceeded
   */
  static async checkLimit(
    identifier: string,
    maxAttempts: number = 10,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const redis = await getRedis();
    if (!redis) {
      // If Redis is not available, allow the request
      return { allowed: true, remaining: maxAttempts, resetAt: 0 };
    }

    const key = `${this.RATE_LIMIT_PREFIX}${identifier}`;
    const now = Date.now();

    try {
      // Increment counter
      const count = await redis.incr(key);
      
      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const allowed = count <= maxAttempts;
      const remaining = Math.max(0, maxAttempts - count);
      const resetAt = now + (windowSeconds * 1000);

      return { allowed, remaining, resetAt };
    } catch (error) {
      console.error(`Rate limit check error for ${identifier}:`, error);
      // On error, allow the request
      return { allowed: true, remaining: maxAttempts, resetAt: 0 };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  static async resetLimit(identifier: string): Promise<boolean> {
    const key = `${this.RATE_LIMIT_PREFIX}${identifier}`;
    return await CacheManager.delete(key);
  }
}

/**
 * Queue management utilities
 */
export class QueueManager {
  private static readonly QUEUE_PREFIX = 'queue:';

  /**
   * Add item to queue
   */
  static async enqueue(
    queueName: string,
    item: unknown
  ): Promise<boolean> {
    const redis = await getRedis();
    if (!redis) return false;

    const key = `${this.QUEUE_PREFIX}${queueName}`;
    const serialized = JSON.stringify(item);

    try {
      const result = await redis.getClient()?.rpush(key, serialized);
      return result !== undefined && result > 0;
    } catch (error) {
      console.error(`Queue enqueue error for ${queueName}:`, error);
      return false;
    }
  }

  /**
   * Get item from queue
   */
  static async dequeue<T = unknown>(
    queueName: string
  ): Promise<T | null> {
    const redis = await getRedis();
    if (!redis) return null;

    const key = `${this.QUEUE_PREFIX}${queueName}`;

    try {
      const value = await redis.getClient()?.lpop(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Queue dequeue error for ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Get queue length
   */
  static async getQueueLength(queueName: string): Promise<number> {
    const redis = await getRedis();
    if (!redis) return 0;

    const key = `${this.QUEUE_PREFIX}${queueName}`;

    try {
      const length = await redis.getClient()?.llen(key);
      return length || 0;
    } catch (error) {
      console.error(`Queue length error for ${queueName}:`, error);
      return 0;
    }
  }
}

/**
 * Export convenience functions
 */

// Cache operations
export const cache = {
  get: CacheManager.get.bind(CacheManager),
  set: CacheManager.set.bind(CacheManager),
  delete: CacheManager.delete.bind(CacheManager),
  exists: CacheManager.exists.bind(CacheManager),
  flush: CacheManager.flush.bind(CacheManager),
};

// Session operations
export const session = {
  set: SessionManager.setSession.bind(SessionManager),
  get: SessionManager.getSession.bind(SessionManager),
  touch: SessionManager.touchSession.bind(SessionManager),
  delete: SessionManager.deleteSession.bind(SessionManager),
};

// Rate limiting operations
export const rateLimit = {
  check: RateLimiter.checkLimit.bind(RateLimiter),
  reset: RateLimiter.resetLimit.bind(RateLimiter),
};

// Queue operations
export const queue = {
  enqueue: QueueManager.enqueue.bind(QueueManager),
  dequeue: QueueManager.dequeue.bind(QueueManager),
  length: QueueManager.getQueueLength.bind(QueueManager),
};

// Re-export the Redis service for advanced use cases
export { getRedis, RedisService } from '../services/redis';
