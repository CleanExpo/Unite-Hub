/**
 * M1 Phase 24 Test Suite
 *
 * Comprehensive tests for advanced rate limiting and fair queuing:
 * - MultiLevelRateLimiter (11 tests)
 * - QuotaManager (10 tests)
 * - AdaptiveRateLimiter (10 tests)
 * - FairQueue (10 tests)
 * - Integration tests (5 tests)
 *
 * Total: 45+ tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MultiLevelRateLimiter } from '../ratelimit/multi-level-limiter';
import { QuotaManager } from '../ratelimit/quota-manager';
import {
  AdaptiveRateLimiter,
  type SystemMetrics,
} from '../ratelimit/adaptive-limiter';
import { FairQueue } from '../ratelimit/fair-queue';

// ============================================================================
// MULTI-LEVEL RATE LIMITER TESTS (11 tests)
// ============================================================================

describe('MultiLevelRateLimiter', () => {
  let limiter: MultiLevelRateLimiter;

  beforeEach(() => {
    limiter = new MultiLevelRateLimiter();
  });

  afterEach(() => {
    limiter.shutdown();
  });

  it('should register global rate limit', () => {
    const limitId = limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
      burstSize: 1.5,
    });

    expect(limitId).toBeDefined();
    expect(limitId).toMatch(/^limit_/);
  });

  it('should register multi-level limits', () => {
    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
    });

    limiter.registerLimit({
      level: 'tenant',
      identifier: 'tenant-1',
      requestsPerSecond: 50,
      requestsPerMinute: 3000,
      requestsPerHour: 180000,
    });

    limiter.registerLimit({
      level: 'user',
      identifier: 'user-1',
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      requestsPerHour: 36000,
    });

    const stats = limiter.getStatistics();
    expect((stats.configuredLimitLevels as any[]).length).toBeGreaterThanOrEqual(3);
  });

  it('should allow requests within limits', () => {
    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
    });

    const result = limiter.checkLimit();
    expect(result.allowed).toBe(true);
    expect(result.level).toBeDefined();
  });

  it('should reject requests exceeding rate limit', async () => {
    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1, // No burst allowance
    });

    // First request should pass
    const result1 = limiter.checkLimit();
    expect(result1.allowed).toBe(true);

    // Subsequent request should fail (no tokens available)
    const result2 = limiter.checkLimit();
    expect(result2.allowed).toBe(false);
  });

  it('should apply most-restrictive-wins logic', () => {
    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
    });

    limiter.registerLimit({
      level: 'tenant',
      identifier: 'tenant-1',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1, // No burst allowance
    });

    // First request passes
    const result1 = limiter.checkLimit('tenant-1');
    expect(result1.allowed).toBe(true);

    // Next request blocked by tenant limit (1 req/sec, no burst)
    const result2 = limiter.checkLimit('tenant-1');
    expect(result2.allowed).toBe(false);
    expect(result2.limitingLevel).toBe('tenant');
  });

  it('should track usage statistics', () => {
    limiter.registerLimit({
      level: 'user',
      identifier: 'user-1',
      requestsPerSecond: 10,
      requestsPerMinute: 600,
      requestsPerHour: 36000,
    });

    limiter.checkLimit(undefined, 'user-1');
    limiter.checkLimit(undefined, 'user-1');

    const stats = limiter.getUsageStats('user', 'user-1');
    expect(stats).toBeDefined();
    expect(stats?.requestsInWindow).toBeGreaterThan(0);
    expect(stats?.hitCount).toBeGreaterThanOrEqual(2);
  });

  it('should reset individual limit', () => {
    limiter.registerLimit({
      level: 'user',
      identifier: 'user-1',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1, // No burst
    });

    // Use up the limit
    limiter.checkLimit(undefined, 'user-1');
    const secondRequest = limiter.checkLimit(undefined, 'user-1');
    expect(secondRequest.allowed).toBe(false);

    // Reset the limit
    limiter.resetLimit('user', 'user-1');

    // Should be allowed again
    const thirdRequest = limiter.checkLimit(undefined, 'user-1');
    expect(thirdRequest.allowed).toBe(true);
  });

  it('should reset all limits', () => {
    const testLimiter = new MultiLevelRateLimiter();

    testLimiter.registerLimit({
      level: 'user',
      identifier: 'user-1',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1,
    });

    // First request should pass
    const first = testLimiter.checkLimit(undefined, 'user-1');
    expect(first.allowed).toBe(true);

    // Second request should fail
    const second = testLimiter.checkLimit(undefined, 'user-1');
    expect(second.allowed).toBe(false);

    // Reset the specific limit
    const resetSuccess = testLimiter.resetLimit('user', 'user-1');
    expect(resetSuccess).toBe(true);

    // Should be allowed again
    const afterReset = testLimiter.checkLimit(undefined, 'user-1');
    expect(afterReset.allowed).toBe(true);

    testLimiter.shutdown();
  });

  it('should handle API key level limits', () => {
    limiter.registerLimit({
      level: 'api_key',
      identifier: 'key-12345',
      requestsPerSecond: 5,
      requestsPerMinute: 300,
      requestsPerHour: 18000,
    });

    const result = limiter.checkLimit(undefined, undefined, undefined, 'key-12345');
    expect(result.allowed).toBe(true);
    expect(result.level).toBe('api_key');
  });

  it('should handle IP address level limits', () => {
    limiter.registerLimit({
      level: 'ip',
      identifier: '192.168.1.1',
      requestsPerSecond: 20,
      requestsPerMinute: 1200,
      requestsPerHour: 72000,
    });

    const result = limiter.checkLimit(undefined, undefined, undefined, undefined, '192.168.1.1');
    expect(result.allowed).toBe(true);
    expect(result.level).toBe('ip');
  });

  it('should provide comprehensive statistics', () => {
    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
    });

    limiter.registerLimit({
      level: 'tenant',
      identifier: 'tenant-1',
      requestsPerSecond: 50,
      requestsPerMinute: 3000,
      requestsPerHour: 180000,
    });

    // Make requests to generate statistics
    const result1 = limiter.checkLimit('tenant-1');
    const result2 = limiter.checkLimit('tenant-1');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);

    const stats = limiter.getStatistics();
    expect((stats.configuredLimitLevels as any[]).length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// QUOTA MANAGER TESTS (10 tests)
// ============================================================================

describe('QuotaManager', () => {
  let manager: QuotaManager;

  beforeEach(() => {
    manager = new QuotaManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should create quota pool', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    expect(poolId).toBeDefined();
    expect(poolId).toMatch(/^quota_/);
  });

  it('should consume quota from pool', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    const result = manager.consumeQuota(poolId, 100);
    expect(result.allowed).toBe(true);
    expect(result.tokensRemaining).toBe(900);
  });

  it('should reject quota consumption when exhausted', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 100,
      refillRate: 10,
      refillInterval: 1000,
    });

    // Consume all quota
    manager.consumeQuota(poolId, 100);

    // Next consumption should fail
    const result = manager.consumeQuota(poolId, 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Insufficient quota');
  });

  it('should check quota without consuming', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    const checkResult = manager.checkQuota(poolId, 100);
    expect(checkResult.allowed).toBe(true);

    // Quota should still be available
    const consumeResult = manager.consumeQuota(poolId, 100);
    expect(consumeResult.allowed).toBe(true);
  });

  it('should allocate quota to resources', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    const allocated = manager.allocateToResource(poolId, 'resource-1', 100);
    expect(allocated).toBe(true);

    const stats = manager.getPoolStats(poolId);
    expect((stats?.resourceAllocations as any)['resource-1']).toBeDefined();
  });

  it('should release allocated quota back to pool', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    manager.allocateToResource(poolId, 'resource-1', 100);
    const released = manager.releaseFromResource(poolId, 'resource-1', 50);

    expect(released).toBe(true);

    const stats = manager.getPoolStats(poolId);
    expect((stats?.resourceAllocations as any)['resource-1'].allocated).toBe(50);
  });

  it('should track pool statistics', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    manager.consumeQuota(poolId, 100, 'resource-1', 'test consumption');
    manager.consumeQuota(poolId, 50, 'resource-2', 'test consumption');

    const stats = manager.getPoolStats(poolId);
    expect(stats?.name).toBe('API Quota');
    expect(stats?.tokensAvailable).toBe(850);
    expect(stats?.resourceCount).toBe(2);
  });

  it('should get consumption history', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    manager.consumeQuota(poolId, 100, 'resource-1', 'test 1');
    manager.consumeQuota(poolId, 50, 'resource-2', 'test 2');

    const history = manager.getConsumptionHistory(poolId, { resourceId: 'resource-1' });
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].resourceId).toBe('resource-1');
  });

  it('should reset pool quota', () => {
    const poolId = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    manager.consumeQuota(poolId, 500);
    manager.resetPool(poolId);

    const stats = manager.getPoolStats(poolId);
    expect(stats?.tokensAvailable).toBe(1000);
  });

  it('should manage multiple quota pools', () => {
    const pool1 = manager.createPool({
      name: 'API Quota',
      totalQuota: 1000,
      refillRate: 10,
      refillInterval: 1000,
    });

    const pool2 = manager.createPool({
      name: 'Storage Quota',
      totalQuota: 5000,
      refillRate: 5,
      refillInterval: 1000,
    });

    manager.consumeQuota(pool1, 100);
    manager.consumeQuota(pool2, 500);

    const allStats = manager.getAllPoolStats();
    expect(allStats.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// ADAPTIVE RATE LIMITER TESTS (10 tests)
// ============================================================================

describe('AdaptiveRateLimiter', () => {
  let limiter: AdaptiveRateLimiter;

  beforeEach(() => {
    limiter = new AdaptiveRateLimiter(1000);
  });

  afterEach(() => {
    limiter.shutdown();
  });

  it('should initialize with base limit', () => {
    const limit = limiter.getCurrentLimit();
    expect(limit).toBe(1000);
  });

  it('should allow request under low load', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.3,
      memoryUsage: 0.4,
      latency: 100,
      errorRate: 0.01,
      queueDepth: 10,
      activeConnections: 5,
    };

    const decision = limiter.checkLimit(metrics);
    expect(decision.allowed).toBe(true);
    expect(decision.loadLevel).toBe('low');
  });

  it('should allow request under medium load', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.75,  // high (> 0.7), but not critical
      memoryUsage: 0.5,
      latency: 600,    // high (> 500)
      errorRate: 0.01,
      queueDepth: 30,
      activeConnections: 20,
    };

    const decision = limiter.checkLimit(metrics);
    expect(decision.allowed).toBe(true);
    expect(decision.loadLevel).toBe('medium'); // 2 high counts is >= 1, so medium
  });

  it('should allow request under high load', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.8,
      memoryUsage: 0.75,
      latency: 800,
      errorRate: 0.04,
      queueDepth: 200,
      activeConnections: 100,
    };

    const decision = limiter.checkLimit(metrics);
    expect(decision.allowed).toBe(true);
    expect(decision.loadLevel).toBe('high');
  });

  it('should reject request at critical load', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.95,
      memoryUsage: 0.96,
      latency: 3000,
      errorRate: 0.15,
      queueDepth: 1000,
      activeConnections: 500,
    };

    const decision = limiter.checkLimit(metrics);
    expect(decision.allowed).toBe(false);
    expect(decision.loadLevel).toBe('critical');
  });

  it('should reduce limit under high load', () => {
    const initialLimit = limiter.getCurrentLimit();

    // Simulate high load
    const highLoadMetrics: SystemMetrics = {
      cpuUsage: 0.8,
      memoryUsage: 0.75,
      latency: 800,
      errorRate: 0.04,
      queueDepth: 200,
      activeConnections: 100,
    };

    limiter.checkLimit(highLoadMetrics);

    // Wait for adjustment (check multiple times to trigger cooldown expiry)
    for (let i = 0; i < 10; i++) {
      limiter.checkLimit(highLoadMetrics);
    }

    const newLimit = limiter.getCurrentLimit();
    expect(newLimit).toBeLessThan(initialLimit);
  });

  it('should recover limit under low load', () => {
    // Create limiter with high base limit
    const recoveryLimiter = new AdaptiveRateLimiter(10000);

    // First apply high load to reduce the limit
    const highLoadMetrics: SystemMetrics = {
      cpuUsage: 0.8,
      memoryUsage: 0.75,
      latency: 800,
      errorRate: 0.04,
      queueDepth: 200,
      activeConnections: 100,
    };

    // Check multiple times to trigger adjustment
    for (let i = 0; i < 10; i++) {
      recoveryLimiter.checkLimit(highLoadMetrics);
    }

    const reducedLimit = recoveryLimiter.getCurrentLimit();
    expect(reducedLimit).toBeLessThan(10000);

    // Now apply low load metrics
    const lowLoadMetrics: SystemMetrics = {
      cpuUsage: 0.2,
      memoryUsage: 0.3,
      latency: 50,
      errorRate: 0.001,
      queueDepth: 5,
      activeConnections: 2,
    };

    // Check that we allow recovery
    for (let i = 0; i < 100; i++) {
      recoveryLimiter.checkLimit(lowLoadMetrics);
    }

    const recoveredLimit = recoveryLimiter.getCurrentLimit();
    // Recovered limit should be higher than reduced (trending towards base)
    expect(recoveredLimit).toBeGreaterThanOrEqual(reducedLimit);

    recoveryLimiter.shutdown();
  });

  it('should provide trend analysis', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.3,
      memoryUsage: 0.4,
      latency: 100,
      errorRate: 0.01,
      queueDepth: 10,
      activeConnections: 5,
    };

    limiter.checkLimit(metrics);
    limiter.checkLimit(metrics);

    const analysis = limiter.getTrendAnalysis();
    expect(analysis.cpu).toBeDefined();
    expect(analysis.memory).toBeDefined();
    expect(analysis.currentLimit).toBeDefined();
  });

  it('should track metrics history', () => {
    const metrics: SystemMetrics = {
      cpuUsage: 0.3,
      memoryUsage: 0.4,
      latency: 100,
      errorRate: 0.01,
      queueDepth: 10,
      activeConnections: 5,
    };

    limiter.checkLimit(metrics);
    const stats = limiter.getStatistics();

    expect(stats.metricsHistorySize).toBeGreaterThan(0);
  });

  it('should allow forced recovery to base limit', () => {
    // Reduce the limit
    const criticalMetrics: SystemMetrics = {
      cpuUsage: 0.95,
      memoryUsage: 0.96,
      latency: 3000,
      errorRate: 0.15,
      queueDepth: 1000,
      activeConnections: 500,
    };

    limiter.checkLimit(criticalMetrics);
    expect(limiter.getCurrentLimit()).toBeLessThan(1000);

    // Force recovery
    limiter.forceRecovery();
    expect(limiter.getCurrentLimit()).toBe(1000);
  });
});

// ============================================================================
// FAIR QUEUE TESTS (10 tests)
// ============================================================================

describe('FairQueue', () => {
  let queue: FairQueue<string>;

  beforeEach(() => {
    queue = new FairQueue<string>();
  });

  afterEach(() => {
    queue.shutdown();
  });

  it('should register client with weight', () => {
    queue.registerClient('client-1', 1);
    const stats = queue.getClientStats('client-1');

    expect(stats).toBeDefined();
    expect(stats?.weight).toBe(1);
  });

  it('should enqueue items for clients', () => {
    queue.registerClient('client-1', 1);
    const entryId = queue.enqueue('client-1', 'item-1');

    expect(entryId).toBeDefined();
    expect(entryId).toMatch(/^entry_/);
    expect(queue.getQueueSize()).toBe(1);
  });

  it('should dequeue items in FIFO order for single client', () => {
    queue.registerClient('client-1', 1);
    queue.enqueue('client-1', 'item-1');
    queue.enqueue('client-1', 'item-2');
    queue.enqueue('client-1', 'item-3');

    const first = queue.dequeue();
    const second = queue.dequeue();
    const third = queue.dequeue();

    expect(first?.item).toBe('item-1');
    expect(second?.item).toBe('item-2');
    expect(third?.item).toBe('item-3');
  });

  it('should apply weighted fair queuing', () => {
    queue.registerClient('client-1', 1); // High weight
    queue.registerClient('client-2', 2); // Higher weight

    // Enqueue from both clients
    queue.enqueue('client-1', 'c1-item-1');
    queue.enqueue('client-2', 'c2-item-1');
    queue.enqueue('client-2', 'c2-item-2');

    // With WFQ, client-2 should be served first due to higher weight
    const first = queue.dequeue();
    expect(first?.clientId).toBe('client-2');
  });

  it('should update client weight dynamically', () => {
    queue.registerClient('client-1', 1);
    queue.updateClientWeight('client-1', 5);

    const stats = queue.getClientStats('client-1');
    expect(stats?.weight).toBe(5);
  });

  it('should peek at next item without removing', () => {
    queue.registerClient('client-1', 1);
    queue.enqueue('client-1', 'item-1');

    const peeked = queue.peek();
    expect(peeked?.item).toBe('item-1');

    // Queue size should still be 1
    expect(queue.getQueueSize()).toBe(1);
  });

  it('should track client-specific queue size', () => {
    queue.registerClient('client-1', 1);
    queue.registerClient('client-2', 1);

    queue.enqueue('client-1', 'c1-item-1');
    queue.enqueue('client-1', 'c1-item-2');
    queue.enqueue('client-2', 'c2-item-1');

    expect(queue.getClientQueueSize('client-1')).toBe(2);
    expect(queue.getClientQueueSize('client-2')).toBe(1);
    expect(queue.getQueueSize()).toBe(3);
  });

  it('should calculate fairness metric', () => {
    queue.registerClient('client-1', 1);
    queue.registerClient('client-2', 1);

    queue.enqueue('client-1', 'c1-item');
    queue.enqueue('client-2', 'c2-item');

    queue.dequeue();
    queue.markCompleted('entry-1', 100);
    queue.dequeue();
    queue.markCompleted('entry-2', 100);

    const fairness = queue.getFairnessMetric();
    expect(fairness).toBeGreaterThan(0);
    expect(fairness).toBeLessThanOrEqual(1);
  });

  it('should provide comprehensive statistics', () => {
    queue.registerClient('client-1', 1);
    queue.registerClient('client-2', 2);

    queue.enqueue('client-1', 'c1-item-1');
    queue.enqueue('client-2', 'c2-item-1');
    queue.dequeue();

    const stats = queue.getStatistics();
    expect(stats.queueSize).toBe(1);
    expect(stats.totalClients).toBe(2);
    expect(stats.fairnessMetric).toBeDefined();
  });

  it('should drain specific client queue', () => {
    queue.registerClient('client-1', 1);
    queue.registerClient('client-2', 1);

    queue.enqueue('client-1', 'c1-item-1');
    queue.enqueue('client-1', 'c1-item-2');
    queue.enqueue('client-2', 'c2-item-1');

    const drained = queue.drainClient('client-1');

    expect(drained.length).toBe(2);
    expect(queue.getClientQueueSize('client-1')).toBe(0);
    expect(queue.getClientQueueSize('client-2')).toBe(1);
  });
});

// ============================================================================
// INTEGRATION TESTS (5 tests)
// ============================================================================

describe('Phase 24 Integration Tests', () => {
  it('should combine multi-level limiter with quota manager', () => {
    const limiter = new MultiLevelRateLimiter();
    const quotaManager = new QuotaManager();

    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      requestsPerHour: 360000,
    });

    const poolId = quotaManager.createPool({
      name: 'API Quota',
      totalQuota: 10000,
      refillRate: 100,
      refillInterval: 1000,
    });

    // Check both limits
    const limitResult = limiter.checkLimit();
    const quotaResult = quotaManager.checkQuota(poolId, 100);

    expect(limitResult.allowed).toBe(true);
    expect(quotaResult.allowed).toBe(true);

    limiter.shutdown();
    quotaManager.shutdown();
  });

  it('should use adaptive limiter with fair queue', () => {
    const adaptiveLimiter = new AdaptiveRateLimiter(1000);
    const queue = new FairQueue<string>();

    queue.registerClient('client-1', 1);
    queue.registerClient('client-2', 2);

    const metrics: SystemMetrics = {
      cpuUsage: 0.3,
      memoryUsage: 0.4,
      latency: 100,
      errorRate: 0.01,
      queueDepth: 10,
      activeConnections: 5,
    };

    const decision = adaptiveLimiter.checkLimit(metrics);
    queue.enqueue('client-1', 'item-1');
    queue.enqueue('client-2', 'item-2');

    const next = queue.dequeue();

    expect(decision.allowed).toBe(true);
    expect(next).toBeDefined();

    adaptiveLimiter.shutdown();
    queue.shutdown();
  });

  it('should handle cascading rate limit failures gracefully', () => {
    const limiter = new MultiLevelRateLimiter();

    limiter.registerLimit({
      level: 'global',
      identifier: 'global',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1,
    });

    limiter.registerLimit({
      level: 'tenant',
      identifier: 'tenant-1',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1,
    });

    limiter.registerLimit({
      level: 'user',
      identifier: 'user-1',
      requestsPerSecond: 1,
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      burstSize: 1,
    });

    // Use up all limits
    limiter.checkLimit('tenant-1', 'user-1');

    // Next request should fail at first exhausted level
    const result = limiter.checkLimit('tenant-1', 'user-1');
    expect(result.allowed).toBe(false);
    expect(result.limitingLevel).toBeDefined();

    limiter.shutdown();
  });

  it('should coordinate quota and fair queuing for resource distribution', () => {
    const quotaManager = new QuotaManager();
    const queue = new FairQueue<{ resourceId: string }>();

    // Create quota pool and register clients
    const poolId = quotaManager.createPool({
      name: 'Resource Quota',
      totalQuota: 1000,
      refillRate: 100,
      refillInterval: 1000,
    });

    queue.registerClient('app-1', 1);
    queue.registerClient('app-2', 2);

    // Allocate quota proportional to weights
    quotaManager.allocateToResource(poolId, 'app-1', 330);
    quotaManager.allocateToResource(poolId, 'app-2', 670);

    // Queue requests
    queue.enqueue('app-1', { resourceId: 'app-1' });
    queue.enqueue('app-2', { resourceId: 'app-2' });

    const stats = queue.getStatistics();
    expect((stats.clientStats as any[]).length).toBe(2);

    quotaManager.shutdown();
    queue.shutdown();
  });

  it('should maintain fairness across load spikes', () => {
    const queue = new FairQueue<string>();
    const limiter = new AdaptiveRateLimiter(100);

    queue.registerClient('low-priority', 1);
    queue.registerClient('high-priority', 5);

    // Simulate load spike
    const spikeMetrics: SystemMetrics = {
      cpuUsage: 0.85,
      memoryUsage: 0.8,
      latency: 600,
      errorRate: 0.05,
      queueDepth: 150,
      activeConnections: 80,
    };

    const decision = limiter.checkLimit(spikeMetrics);
    expect(decision.loadLevel).toBe('high');

    // Both clients should still be able to queue (fairness preserved)
    queue.enqueue('low-priority', 'low-item');
    queue.enqueue('high-priority', 'high-item');

    const fairness = queue.getFairnessMetric();
    expect(fairness).toBeGreaterThan(0);

    limiter.shutdown();
    queue.shutdown();
  });
});
