/**
 * Database Connection Pool for Supabase
 *
 * IMPORTANT: Supabase JS client uses HTTP/2 and automatically reuses connections.
 * This file provides:
 * 1. Singleton pattern for client reuse
 * 2. Health monitoring
 * 3. Retry logic with exponential backoff
 * 4. Circuit breaker pattern
 * 5. Performance metrics
 *
 * For true database connection pooling, use Supabase Pooler (PgBouncer):
 * https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 *
 * @module lib/db/connection-pool
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';

// Environment variables with validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if recovered
}

/**
 * Pool configuration
 */
interface PoolConfig {
  maxRetries: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  healthCheckInterval: number;
  requestTimeout: number;
}

const DEFAULT_CONFIG: PoolConfig = {
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.DB_RETRY_DELAY_MS || '1000', 10),
  circuitBreakerThreshold: parseInt(process.env.DB_CIRCUIT_THRESHOLD || '5', 10),
  circuitBreakerTimeout: parseInt(process.env.DB_CIRCUIT_TIMEOUT || '60000', 10),
  healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000', 10),
  requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '10000', 10),
};

/**
 * Pool statistics
 */
interface PoolStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  averageResponseTime: number;
  circuitState: CircuitState;
  lastHealthCheck: Date | null;
  healthChecksPassed: number;
  healthChecksFailed: number;
  uptime: number;
}

/**
 * Connection Pool Manager
 */
class ConnectionPool {
  private serviceClient: SupabaseClient<Database> | null = null;
  private anonClient: SupabaseClient<Database> | null = null;
  private config: PoolConfig;
  private stats: PoolStats;
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      circuitState: CircuitState.CLOSED,
      lastHealthCheck: null,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
      uptime: 0,
    };

    this.initializeClients();
    this.startHealthChecks();
  }

  /**
   * Initialize Supabase clients (singleton pattern)
   */
  private initializeClients(): void {
    try {
      // Service role client (bypasses RLS, use carefully)
      this.serviceClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_SERVICE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              'x-client-info': 'unite-hub-pool-service',
            },
          },
        }
      );

      // Anonymous client (respects RLS)
      this.anonClient = createClient<Database>(
        SUPABASE_URL!,
        SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
          global: {
            headers: {
              'x-client-info': 'unite-hub-pool-anon',
            },
          },
        }
      );

      logger.info('Database connection pool initialized', {
        config: this.config,
      });
    } catch (error) {
      logger.error('Failed to initialize database clients', { error });
      throw error;
    }
  }

  /**
   * Get service role client (bypasses RLS)
   * WARNING: Use only for admin operations
   */
  getServiceClient(): SupabaseClient<Database> {
    if (!this.serviceClient) {
      throw new Error('Service client not initialized');
    }
    return this.serviceClient;
  }

  /**
   * Get anonymous client (respects RLS)
   * Use for user-facing operations
   */
  getAnonClient(): SupabaseClient<Database> {
    if (!this.anonClient) {
      throw new Error('Anonymous client not initialized');
    }
    return this.anonClient;
  }

  /**
   * Execute operation with retry logic and circuit breaker
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitState === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.config.circuitBreakerTimeout) {
        throw new Error('Circuit breaker is OPEN - database unavailable');
      }
      // Try to recover
      this.circuitState = CircuitState.HALF_OPEN;
      logger.info('Circuit breaker entering HALF_OPEN state');
    }

    this.stats.totalRequests++;
    const startTime = Date.now();

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        // Add timeout to operation
        const result = await Promise.race([
          operation(),
          this.timeout(this.config.requestTimeout),
        ]);

        // Success - update stats and circuit breaker
        const responseTime = Date.now() - startTime;
        this.updateResponseTime(responseTime);
        this.stats.successfulRequests++;

        if (attempt > 0) {
          this.stats.retriedRequests++;
          logger.info('Operation succeeded after retry', {
            context,
            attempt,
            responseTime,
          });
        }

        // Close circuit if in HALF_OPEN
        if (this.circuitState === CircuitState.HALF_OPEN) {
          this.circuitState = CircuitState.CLOSED;
          this.failureCount = 0;
          logger.info('Circuit breaker closed - service recovered');
        }

        return result as T;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        logger.warn('Database operation failed', {
          context,
          attempt,
          maxRetries: this.config.maxRetries,
          error: lastError.message,
        });

        // Don't retry on last attempt
        if (attempt >= this.config.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    // All retries failed
    this.stats.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Open circuit if threshold exceeded
    if (this.failureCount >= this.config.circuitBreakerThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.stats.circuitState = CircuitState.OPEN;
      logger.error('Circuit breaker opened', {
        failureCount: this.failureCount,
        threshold: this.config.circuitBreakerThreshold,
      });
    }

    logger.error('Database operation failed after all retries', {
      context,
      attempts: attempt,
      error: lastError?.message,
    });

    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      const { error } = await this.serviceClient!
        .from('organizations')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        this.stats.healthChecksFailed++;
        this.stats.lastHealthCheck = new Date();
        return {
          healthy: false,
          latency,
          error: error.message,
        };
      }

      this.stats.healthChecksPassed++;
      this.stats.lastHealthCheck = new Date();

      // Reset failure count on successful health check
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }

      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.stats.healthChecksFailed++;
      this.stats.lastHealthCheck = new Date();

      return {
        healthy: false,
        latency,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      const result = await this.healthCheck();

      if (!result.healthy) {
        logger.warn('Health check failed', {
          latency: result.latency,
          error: result.error,
        });
      } else {
        logger.debug('Health check passed', {
          latency: result.latency,
        });
      }
    }, this.config.healthCheckInterval);

    // Don't keep process alive just for health checks
    this.healthCheckTimer.unref();
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      ...this.stats,
      circuitState: this.circuitState,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      circuitState: this.circuitState,
      lastHealthCheck: this.stats.lastHealthCheck,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
      uptime: this.stats.uptime,
    };
    logger.info('Pool statistics reset');
  }

  /**
   * Close pool and cleanup
   */
  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Supabase clients don't need explicit closing (HTTP connections)
    logger.info('Connection pool closed');
  }

  // Helper methods
  private updateResponseTime(responseTime: number): void {
    const { totalRequests, averageResponseTime } = this.stats;
    this.stats.averageResponseTime =
      (averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    );
  }
}

// Singleton instance
let poolInstance: ConnectionPool | null = null;

/**
 * Get connection pool singleton
 */
export function getConnectionPool(config?: Partial<PoolConfig>): ConnectionPool {
  if (!poolInstance) {
    poolInstance = new ConnectionPool(config);
  }
  return poolInstance;
}

/**
 * Execute operation with service client (bypasses RLS)
 */
export async function withServiceClient<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>,
  context?: string
): Promise<T> {
  const pool = getConnectionPool();
  return pool.withRetry(
    () => operation(pool.getServiceClient()),
    context
  );
}

/**
 * Execute operation with anonymous client (respects RLS)
 */
export async function withAnonClient<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>,
  context?: string
): Promise<T> {
  const pool = getConnectionPool();
  return pool.withRetry(
    () => operation(pool.getAnonClient()),
    context
  );
}

/**
 * Get pool statistics
 */
export function getPoolStats(): PoolStats {
  const pool = getConnectionPool();
  return pool.getStats();
}

/**
 * Perform health check
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  latency: number;
  stats: PoolStats;
  error?: string;
}> {
  const pool = getConnectionPool();
  const healthResult = await pool.healthCheck();
  const stats = pool.getStats();

  return {
    ...healthResult,
    stats,
  };
}

/**
 * Close connection pool
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close();
    poolInstance = null;
  }
}

// Export types
export type { PoolConfig, PoolStats };
export { CircuitState };
