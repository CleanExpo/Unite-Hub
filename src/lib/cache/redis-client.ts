/**
 * Redis Client & Cache Manager with Circuit Breaker
 * Handles caching for alert queries and analytics with resilient fallback
 *
 * CIRCUIT BREAKER PATTERN:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, all requests use in-memory fallback
 * - HALF_OPEN: Testing if Redis recovered
 *
 * RESILIENCE:
 * - Automatic fallback to in-memory cache when Redis fails
 * - Circuit breaker prevents cascading failures
 * - Graceful degradation (always returns a value, even if from memory)
 */

import Redis from 'ioredis';
import { apm } from '@/lib/monitoring/apm';

export interface CacheOptions {
  ttl?: number; // seconds (default: 3600)
  prefix?: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Failures before opening circuit
  successThreshold: number; // Successes to close from half-open
  timeout: number; // ms before testing recovery
}

class CacheManager {
  private redis: Redis;
  private inMemoryCache: Map<string, CacheEntry> = new Map();
  private circuitState: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime = 0;
  private circuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 60 seconds
  };
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    fallbackHits: 0,
    circuitBreakerTrips: 0,
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

    // Start in-memory cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Check if circuit breaker allows execution
   */
  private canExecute(): boolean {
    if (this.circuitState === 'CLOSED') {
      return true;
    }

    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.circuitConfig.timeout) {
        console.log('[Redis] Circuit breaker transitioning to HALF_OPEN');
        this.circuitState = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
        return true;
      }
      return false;
    }

    if (this.circuitState === 'HALF_OPEN') {
      return true; // Allow one request to test
    }

    return false;
  }

  /**
   * Handle successful Redis operation
   */
  private handleSuccess(): void {
    this.consecutiveFailures = 0;

    if (this.circuitState === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.circuitConfig.successThreshold) {
        console.log('[Redis] Circuit breaker closing (service recovered)');
        this.circuitState = 'CLOSED';
        this.consecutiveSuccesses = 0;
      }
    }
  }

  /**
   * Handle failed Redis operation
   */
  private handleFailure(error: Error): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === 'HALF_OPEN') {
      console.log('[Redis] Circuit breaker opening (test request failed)');
      this.circuitState = 'OPEN';
      this.metrics.circuitBreakerTrips++;
      this.consecutiveSuccesses = 0;
      apm.trackError(error, { component: 'redis', circuitBreaker: 'opened' });
      return;
    }

    if (
      this.circuitState === 'CLOSED' &&
      this.consecutiveFailures >= this.circuitConfig.failureThreshold
    ) {
      console.log(
        `[Redis] Circuit breaker opening (${this.consecutiveFailures} consecutive failures)`
      );
      this.circuitState = 'OPEN';
      this.metrics.circuitBreakerTrips++;
      apm.trackError(error, { component: 'redis', circuitBreaker: 'opened' });
    }
  }

  /**
   * Get from in-memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.inMemoryCache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set in in-memory cache
   */
  private setInMemory<T>(key: string, value: T, ttl: number = 3600): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.inMemoryCache.set(key, { value, expiresAt });
  }

  /**
   * Start cleanup interval for in-memory cache
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.inMemoryCache.entries()) {
        if (now > entry.expiresAt) {
          this.inMemoryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Redis] Cleaned ${cleaned} expired entries from memory cache`);
      }
    }, 60000); // Every minute
  }

  /**
   * Get value from cache (with circuit breaker and fallback)
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const span = apm.startSpan('redis.get', { key });
    const prefixedKey = this.getPrefixedKey(key, options?.prefix);

    try {
      // Check circuit breaker
      if (!this.canExecute()) {
        console.log(`[Redis] Circuit OPEN, using fallback for GET ${key}`);
        const memValue = this.getFromMemory<T>(prefixedKey);
        if (memValue !== null) {
          this.metrics.fallbackHits++;
          span.setTag('source', 'memory-fallback');
          return memValue;
        }
        this.metrics.misses++;
        span.setTag('cache', 'miss');
        return null;
      }

      // Try Redis
      const value = await this.redis.get(prefixedKey);

      if (value) {
        this.metrics.hits++;
        this.handleSuccess();
        span.setTag('cache', 'hit');
        span.setTag('source', 'redis');
        return JSON.parse(value);
      }

      // Not in Redis, check memory fallback
      const memValue = this.getFromMemory<T>(prefixedKey);
      if (memValue !== null) {
        this.metrics.fallbackHits++;
        span.setTag('cache', 'hit');
        span.setTag('source', 'memory');
        return memValue;
      }

      this.metrics.misses++;
      span.setTag('cache', 'miss');
      return null;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      this.metrics.errors++;
      this.handleFailure(error as Error);
      span.setError(error as Error);

      // Fallback to memory
      const memValue = this.getFromMemory<T>(prefixedKey);
      if (memValue !== null) {
        this.metrics.fallbackHits++;
        span.setTag('source', 'memory-error-fallback');
        return memValue;
      }

      return null;
    } finally {
      span.finish();
    }
  }

  /**
   * Set value in cache (with circuit breaker and fallback)
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const span = apm.startSpan('redis.set', { key, ttl: options?.ttl });
    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    const ttl = options?.ttl || 3600;

    try {
      // Always set in memory as backup
      this.setInMemory(prefixedKey, value, ttl);

      // Check circuit breaker
      if (!this.canExecute()) {
        console.log(`[Redis] Circuit OPEN, set ${key} in memory only`);
        this.metrics.sets++;
        span.setTag('destination', 'memory-only');
        return;
      }

      // Try Redis
      await this.redis.setex(prefixedKey, ttl, JSON.stringify(value));
      this.metrics.sets++;
      this.handleSuccess();
      span.setTag('destination', 'redis');
    } catch (error) {
      console.error('[Redis] Set error:', error);
      this.metrics.errors++;
      this.handleFailure(error as Error);
      span.setError(error as Error);
      span.setTag('destination', 'memory-fallback');
      // Already set in memory above
    } finally {
      span.finish();
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
   * Get cache health metrics (with circuit breaker status)
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : '0.00';

    return {
      ...this.metrics,
      hit_rate: `${hitRate}%`,
      total_operations: total,
      circuit_breaker_state: this.circuitState,
      consecutive_failures: this.consecutiveFailures,
      in_memory_cache_size: this.inMemoryCache.size,
    };
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState(): CircuitBreakerState {
    return this.circuitState;
  }

  /**
   * Manually open circuit breaker (for testing/maintenance)
   */
  openCircuit(): void {
    console.log('[Redis] Circuit breaker manually opened');
    this.circuitState = 'OPEN';
    this.lastFailureTime = Date.now();
    this.metrics.circuitBreakerTrips++;
  }

  /**
   * Manually close circuit breaker (after manual fix)
   */
  closeCircuit(): void {
    console.log('[Redis] Circuit breaker manually closed');
    this.circuitState = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
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
