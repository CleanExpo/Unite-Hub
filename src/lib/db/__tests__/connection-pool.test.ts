/**
 * Connection Pool Tests
 *
 * Tests for:
 * - Retry logic with exponential backoff
 * - Circuit breaker state transitions
 * - Health checks
 * - Performance metrics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getConnectionPool, closePool, CircuitState } from '../connection-pool';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Connection Pool', () => {
  beforeEach(async () => {
    await closePool();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await closePool();
  });

  describe('Retry Logic', () => {
    it('should retry failed operations with exponential backoff', async () => {
      const pool = getConnectionPool({ maxRetries: 3, retryDelayMs: 100 });
      let attempts = 0;

      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await pool.withRetry(operation, 'test-operation');

      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded', async () => {
      const pool = getConnectionPool({ maxRetries: 2, retryDelayMs: 10 });

      const operation = vi.fn(async () => {
        throw new Error('Permanent failure');
      });

      await expect(
        pool.withRetry(operation, 'test-operation')
      ).rejects.toThrow('Permanent failure');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delays', async () => {
      const pool = getConnectionPool({ maxRetries: 3, retryDelayMs: 100 });
      const delays: number[] = [];
      let attempts = 0;

      const operation = vi.fn(async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now - lastAttempt);
        }
        lastAttempt = now;
        attempts++;

        if (attempts < 3) {
          throw new Error('Retry me');
        }
        return 'success';
      });

      let lastAttempt = Date.now();
      await pool.withRetry(operation, 'test-operation');

      // Verify exponential backoff: delay1 ≈ 100ms, delay2 ≈ 200ms
      expect(delays[0]).toBeGreaterThanOrEqual(90);
      expect(delays[0]).toBeLessThan(150);
      expect(delays[1]).toBeGreaterThanOrEqual(180);
      expect(delays[1]).toBeLessThan(250);
    });

    it('should succeed on first attempt', async () => {
      const pool = getConnectionPool();

      const operation = vi.fn(async () => 'immediate-success');

      const result = await pool.withRetry(operation);

      expect(result).toBe('immediate-success');
      expect(operation).toHaveBeenCalledTimes(1);

      const stats = pool.getStats();
      expect(stats.successfulRequests).toBe(1);
      expect(stats.retriedRequests).toBe(0);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const pool = getConnectionPool({
        circuitBreakerThreshold: 3,
        maxRetries: 1,
        retryDelayMs: 10,
      });

      const failingOperation = vi.fn(async () => {
        throw new Error('Service down');
      });

      // Fail threshold times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(
          pool.withRetry(failingOperation)
        ).rejects.toThrow();
      }

      const stats = pool.getStats();
      expect(stats.circuitState).toBe(CircuitState.OPEN);
    });

    it('should reject requests when circuit is open', async () => {
      const pool = getConnectionPool({
        circuitBreakerThreshold: 2,
        maxRetries: 1,
        retryDelayMs: 10,
      });

      const operation = vi.fn(async () => {
        throw new Error('Fail');
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(pool.withRetry(operation)).rejects.toThrow();
      }

      // Next request should be rejected immediately
      await expect(
        pool.withRetry(async () => 'test')
      ).rejects.toThrow('Circuit breaker is OPEN');

      // Operation should not have been called again
      expect(operation).toHaveBeenCalledTimes(2); // Only from opening circuit
    });

    it('should transition to half-open after timeout', async () => {
      const pool = getConnectionPool({
        circuitBreakerThreshold: 2,
        circuitBreakerTimeout: 100, // 100ms timeout
        maxRetries: 1,
        retryDelayMs: 10,
      });

      const operation = vi.fn(async () => {
        throw new Error('Fail');
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(pool.withRetry(operation)).rejects.toThrow();
      }

      expect(pool.getStats().circuitState).toBe(CircuitState.OPEN);

      // Wait for circuit timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next request should try (HALF_OPEN state)
      const successOperation = vi.fn(async () => 'recovered');
      const result = await pool.withRetry(successOperation);

      expect(result).toBe('recovered');
      expect(pool.getStats().circuitState).toBe(CircuitState.CLOSED);
    });

    it('should close circuit on successful recovery', async () => {
      const pool = getConnectionPool({
        circuitBreakerThreshold: 2,
        circuitBreakerTimeout: 50,
        maxRetries: 1,
        retryDelayMs: 10,
      });

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          pool.withRetry(async () => { throw new Error('Fail'); })
        ).rejects.toThrow();
      }

      expect(pool.getStats().circuitState).toBe(CircuitState.OPEN);

      // Wait for timeout to enter HALF_OPEN
      await new Promise(resolve => setTimeout(resolve, 100));

      // Successful operation should close circuit
      await pool.withRetry(async () => 'success');

      expect(pool.getStats().circuitState).toBe(CircuitState.CLOSED);
    });
  });

  describe('Health Checks', () => {
    it('should perform health check successfully', async () => {
      const pool = getConnectionPool();

      const health = await pool.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0); // Can be 0 with mocked DB
      expect(health.error).toBeUndefined();
    });

    it('should track health check statistics', async () => {
      const pool = getConnectionPool();

      await pool.healthCheck();
      await pool.healthCheck();

      const stats = pool.getStats();
      expect(stats.healthChecksPassed).toBeGreaterThanOrEqual(2);
      expect(stats.lastHealthCheck).toBeInstanceOf(Date);
    });

    it('should reduce failure count on successful health check', async () => {
      const pool = getConnectionPool({
        maxRetries: 1,
        retryDelayMs: 10,
      });

      // Cause some failures (but not enough to open circuit)
      await expect(
        pool.withRetry(async () => { throw new Error('Fail'); })
      ).rejects.toThrow();

      // Health check should reduce failure count
      await pool.healthCheck();

      const stats = pool.getStats();
      expect(stats.circuitState).toBe(CircuitState.CLOSED);
    });
  });

  describe('Performance Metrics', () => {
    it('should track total requests', async () => {
      const pool = getConnectionPool();

      await pool.withRetry(async () => 'op1');
      await pool.withRetry(async () => 'op2');
      await pool.withRetry(async () => 'op3');

      const stats = pool.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(0);
    });

    it('should track failed requests', async () => {
      const pool = getConnectionPool({ maxRetries: 1, retryDelayMs: 10 });

      await pool.withRetry(async () => 'success');
      await expect(
        pool.withRetry(async () => { throw new Error('Fail'); })
      ).rejects.toThrow();

      const stats = pool.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });

    it('should track retried requests', async () => {
      const pool = getConnectionPool({ maxRetries: 3, retryDelayMs: 10 });
      let attempts = 0;

      await pool.withRetry(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Retry');
        return 'success';
      });

      const stats = pool.getStats();
      expect(stats.retriedRequests).toBe(1); // Successfully retried
    });

    it('should calculate average response time', async () => {
      const pool = getConnectionPool();

      await pool.withRetry(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'op1';
      });

      await pool.withRetry(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'op2';
      });

      const stats = pool.getStats();
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeLessThan(200); // Should average around 75ms
    });

    it('should reset statistics', async () => {
      const pool = getConnectionPool();

      await pool.withRetry(async () => 'test');

      let stats = pool.getStats();
      expect(stats.totalRequests).toBe(1);

      pool.resetStats();

      stats = pool.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });

    it('should track uptime', async () => {
      const pool = getConnectionPool();

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = pool.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const pool = getConnectionPool({
        maxRetries: 5,
        retryDelayMs: 500,
        circuitBreakerThreshold: 10,
        requestTimeout: 30000,
      });

      // Configuration is applied (tested indirectly through behavior)
      expect(pool).toBeDefined();
    });

    it('should use default configuration', () => {
      const pool = getConnectionPool();
      expect(pool).toBeDefined();
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running operations', async () => {
      const pool = getConnectionPool({
        requestTimeout: 100,
        maxRetries: 1,
        retryDelayMs: 10,
      });

      await expect(
        pool.withRetry(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return 'too-slow';
        })
      ).rejects.toThrow('Operation timeout');
    });

    it('should not timeout fast operations', async () => {
      const pool = getConnectionPool({ requestTimeout: 1000 });

      const result = await pool.withRetry(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'fast-enough';
      });

      expect(result).toBe('fast-enough');
    });
  });
});
