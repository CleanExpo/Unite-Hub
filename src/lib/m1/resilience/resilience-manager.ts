/**
 * M1 Resilience Manager
 *
 * Comprehensive resilience patterns including circuit breakers,
 * retries, timeouts, bulkheads, and rate limiting
 *
 * Version: v3.2.0
 * Phase: 19A - Advanced Resilience Patterns
 */

import { v4 as generateUUID } from 'uuid';

export type CircuitState = 'closed' | 'open' | 'half_open';
export type RetryPolicy = 'exponential' | 'linear' | 'fixed';
export type BulkheadMode = 'thread_pool' | 'semaphore';
export type RateLimitStrategy = 'token_bucket' | 'sliding_window' | 'fixed_window';

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  id: string;
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastStateChange: number;
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  halfOpenRequests: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  policy: RetryPolicy;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Bulkhead configuration
 */
export interface BulkheadConfig {
  id: string;
  name: string;
  mode: BulkheadMode;
  maxConcurrent: number;
  queueSize: number;
  timeoutMs: number;
  activeRequests: number;
  queuedRequests: number;
  rejectedRequests: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  id: string;
  name: string;
  strategy: RateLimitStrategy;
  requestsPerSecond: number;
  burstCapacity: number;
  windowSizeMs: number;
  currentTokens: number;
  lastRefillTime: number;
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  id: string;
  name: string;
  timeoutMs: number;
  enabled: boolean;
}

/**
 * Resilience metrics
 */
export interface ResilienceMetrics {
  successRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalRequests: number;
  failedRequests: number;
  timedOutRequests: number;
  rejectedRequests: number;
}

/**
 * Resilience Manager
 */
export class ResilienceManager {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private bulkheads: Map<string, BulkheadConfig> = new Map();
  private rateLimiters: Map<string, RateLimitConfig> = new Map();
  private timeouts: Map<string, TimeoutConfig> = new Map();
  private metrics: Map<string, ResilienceMetrics> = new Map();
  private requestLog: Array<{
    id: string;
    timestamp: number;
    success: boolean;
    latency: number;
    circuitBreaker?: string;
    bulkhead?: string;
    rateLimit?: string;
  }> = [];

  /**
   * Create circuit breaker
   */
  createCircuitBreaker(
    name: string,
    failureThreshold: number = 5,
    successThreshold: number = 2,
    timeoutMs: number = 60000
  ): string {
    const id = `cb_${generateUUID()}`;

    const breaker: CircuitBreakerState = {
      id,
      name,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastStateChange: Date.now(),
      failureThreshold,
      successThreshold,
      timeout: timeoutMs,
      halfOpenRequests: 0,
    };

    this.circuitBreakers.set(id, breaker);
    return id;
  }

  /**
   * Record request result for circuit breaker
   */
  recordCircuitBreakerResult(
    circuitBreakerId: string,
    success: boolean
  ): boolean {
    const breaker = this.circuitBreakers.get(circuitBreakerId);
    if (!breaker) {
return false;
}

    const now = Date.now();

    if (success) {
      breaker.successCount++;

      // If in half-open state and successful, transition to closed
      if (breaker.state === 'half_open' && breaker.successCount >= breaker.successThreshold) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount = 0;
        breaker.lastStateChange = now;
        breaker.halfOpenRequests = 0;
      }
    } else {
      breaker.failureCount++;

      // If failure threshold exceeded, open circuit
      if (breaker.state === 'closed' && breaker.failureCount >= breaker.failureThreshold) {
        breaker.state = 'open';
        breaker.lastStateChange = now;
      }

      // If in half-open and failed, go back to open
      if (breaker.state === 'half_open') {
        breaker.state = 'open';
        breaker.failureCount = breaker.failureThreshold;
        breaker.lastStateChange = now;
        breaker.halfOpenRequests = 0;
      }
    }

    return true;
  }

  /**
   * Check circuit breaker state
   */
  getCircuitBreakerState(circuitBreakerId: string): CircuitState | null {
    const breaker = this.circuitBreakers.get(circuitBreakerId);
    if (!breaker) {
return null;
}

    // If open and timeout expired, transition to half-open
    if (
      breaker.state === 'open' &&
      Date.now() - breaker.lastStateChange > breaker.timeout
    ) {
      breaker.state = 'half_open';
      breaker.successCount = 0;
      breaker.lastStateChange = Date.now();
    }

    return breaker.state;
  }

  /**
   * Create bulkhead
   */
  createBulkhead(
    name: string,
    maxConcurrent: number = 10,
    queueSize: number = 100,
    timeoutMs: number = 30000
  ): string {
    const id = `bh_${generateUUID()}`;

    const bulkhead: BulkheadConfig = {
      id,
      name,
      mode: 'semaphore',
      maxConcurrent,
      queueSize,
      timeoutMs,
      activeRequests: 0,
      queuedRequests: 0,
      rejectedRequests: 0,
    };

    this.bulkheads.set(id, bulkhead);
    return id;
  }

  /**
   * Acquire bulkhead slot
   */
  acquireBulkheadSlot(bulkheadId: string): boolean {
    const bulkhead = this.bulkheads.get(bulkheadId);
    if (!bulkhead) {
return false;
}

    if (bulkhead.activeRequests < bulkhead.maxConcurrent) {
      bulkhead.activeRequests++;
      return true;
    }

    if (bulkhead.queuedRequests < bulkhead.queueSize) {
      bulkhead.queuedRequests++;
      return true; // Queued
    }

    // Reject if full
    bulkhead.rejectedRequests++;
    return false;
  }

  /**
   * Release bulkhead slot
   */
  releaseBulkheadSlot(bulkheadId: string, wasQueued: boolean = false): boolean {
    const bulkhead = this.bulkheads.get(bulkheadId);
    if (!bulkhead) {
return false;
}

    if (wasQueued) {
      if (bulkhead.queuedRequests > 0) {
        bulkhead.queuedRequests--;
      }
    } else {
      if (bulkhead.activeRequests > 0) {
        bulkhead.activeRequests--;
      }
    }

    return true;
  }

  /**
   * Create rate limiter
   */
  createRateLimiter(
    name: string,
    requestsPerSecond: number,
    burstCapacity?: number
  ): string {
    const id = `rl_${generateUUID()}`;
    const burst = burstCapacity || Math.ceil(requestsPerSecond * 2);

    const rateLimiter: RateLimitConfig = {
      id,
      name,
      strategy: 'token_bucket',
      requestsPerSecond,
      burstCapacity: burst,
      windowSizeMs: 1000,
      currentTokens: burst,
      lastRefillTime: Date.now(),
    };

    this.rateLimiters.set(id, rateLimiter);
    return id;
  }

  /**
   * Allow request through rate limiter
   */
  allowRequest(rateLimiterId: string, tokensNeeded: number = 1): boolean {
    const limiter = this.rateLimiters.get(rateLimiterId);
    if (!limiter) {
return false;
}

    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsedMs = now - limiter.lastRefillTime;
    const tokensToAdd = (elapsedMs / limiter.windowSizeMs) * limiter.requestsPerSecond;

    limiter.currentTokens = Math.min(
      limiter.burstCapacity,
      limiter.currentTokens + tokensToAdd
    );
    limiter.lastRefillTime = now;

    if (limiter.currentTokens >= tokensNeeded) {
      limiter.currentTokens -= tokensNeeded;
      return true;
    }

    return false;
  }

  /**
   * Create timeout
   */
  createTimeout(name: string, timeoutMs: number): string {
    const id = `to_${generateUUID()}`;

    const timeout: TimeoutConfig = {
      id,
      name,
      timeoutMs,
      enabled: true,
    };

    this.timeouts.set(id, timeout);
    return id;
  }

  /**
   * Check if timeout exceeded
   */
  isTimeoutExceeded(timeoutId: string, elapsedMs: number): boolean {
    const timeout = this.timeouts.get(timeoutId);
    if (!timeout || !timeout.enabled) {
return false;
}

    return elapsedMs > timeout.timeoutMs;
  }

  /**
   * Calculate retry delay
   */
  calculateRetryDelay(
    config: RetryConfig,
    attempt: number
  ): number {
    let delay = config.initialDelayMs;

    switch (config.policy) {
      case 'exponential':
        delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
        break;
      case 'linear':
        delay = config.initialDelayMs * attempt;
        break;
      case 'fixed':
        delay = config.initialDelayMs;
        break;
    }

    delay = Math.min(delay, config.maxDelayMs);

    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.round(delay);
  }

  /**
   * Record request metrics
   */
  recordRequest(
    resourceName: string,
    success: boolean,
    latency: number,
    circuitBreaker?: string,
    bulkhead?: string,
    rateLimit?: string
  ): void {
    const logEntry = {
      id: generateUUID(),
      timestamp: Date.now(),
      success,
      latency,
      circuitBreaker,
      bulkhead,
      rateLimit,
    };

    this.requestLog.push(logEntry);

    // Keep only last 10000 requests
    if (this.requestLog.length > 10000) {
      this.requestLog.shift();
    }

    // Update metrics
    this.updateMetrics(resourceName);
  }

  /**
   * Update metrics for resource
   */
  private updateMetrics(resourceName: string): void {
    const relevantRequests = this.requestLog.filter((r) => {
      const resources = [r.circuitBreaker, r.bulkhead, r.rateLimit].filter(Boolean);
      return resources.length > 0; // Simplified: in real scenario would match by name
    });

    if (relevantRequests.length === 0) {
return;
}

    const successCount = relevantRequests.filter((r) => r.success).length;
    const failedCount = relevantRequests.filter((r) => !r.success).length;
    const latencies = relevantRequests.map((r) => r.latency).sort((a, b) => a - b);

    const metrics: ResilienceMetrics = {
      successRate: successCount / relevantRequests.length,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      totalRequests: relevantRequests.length,
      failedRequests: failedCount,
      timedOutRequests: 0, // Would track separately
      rejectedRequests: 0, // Would track separately
    };

    this.metrics.set(resourceName, metrics);
  }

  /**
   * Get resilience metrics
   */
  getMetrics(resourceName: string): ResilienceMetrics | null {
    return this.metrics.get(resourceName) || null;
  }

  /**
   * Get all circuit breakers
   */
  getAllCircuitBreakers(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Get all bulkheads
   */
  getAllBulkheads(): BulkheadConfig[] {
    return Array.from(this.bulkheads.values());
  }

  /**
   * Get all rate limiters
   */
  getAllRateLimiters(): RateLimitConfig[] {
    return Array.from(this.rateLimiters.values());
  }

  /**
   * Get resilience statistics
   */
  getStatistics(): Record<string, unknown> {
    const circuitBreakers = Array.from(this.circuitBreakers.values());
    const openBreakers = circuitBreakers.filter((cb) => cb.state === 'open');
    const halfOpenBreakers = circuitBreakers.filter((cb) => cb.state === 'half_open');

    const bulkheads = Array.from(this.bulkheads.values());
    const activeBulkheads = bulkheads.filter((b) => b.activeRequests > 0);

    return {
      totalCircuitBreakers: circuitBreakers.length,
      openCircuitBreakers: openBreakers.length,
      halfOpenCircuitBreakers: halfOpenBreakers.length,
      totalBulkheads: bulkheads.length,
      activeBulkheads: activeBulkheads.length,
      totalQueuedRequests: bulkheads.reduce((sum, b) => sum + b.queuedRequests, 0),
      totalRejectedRequests: bulkheads.reduce((sum, b) => sum + b.rejectedRequests, 0),
      totalRateLimiters: this.rateLimiters.size,
      totalTimeouts: this.timeouts.size,
      requestsLogged: this.requestLog.length,
      metricsTracked: this.metrics.size,
    };
  }

  /**
   * Shutdown manager
   */
  shutdown(): void {
    this.circuitBreakers.clear();
    this.bulkheads.clear();
    this.rateLimiters.clear();
    this.timeouts.clear();
    this.metrics.clear();
    this.requestLog = [];
  }
}

// Export singleton
export const resilienceManager = new ResilienceManager();
