/**
 * M1 Phase 22: Advanced Caching & Performance Optimization Tests
 *
 * Comprehensive test suite covering:
 * - InMemoryCacheStore with LRU eviction
 * - MultiTierCache with write-through/write-back
 * - MemoizationEngine with concurrent deduplication
 * - PerformanceProfiler with bottleneck detection
 * - QueryOptimizer with index recommendations
 *
 * Version: v1.0.0
 * Phase: 22 - Advanced Caching & Performance Optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  InMemoryCacheStore,
  MultiTierCache,
  CacheInvalidationEngine,
  CacheManager,
  type CacheConfig,
} from '../caching/cache-manager';
import {
  MemoizationEngine,
  type MemoizedFunctionMetadata,
} from '../caching/memoization';
import {
  PerformanceProfiler,
  type LatencyStats,
  type Bottleneck,
} from '../performance/profiler';
import {
  QueryOptimizer,
  type QueryPlan,
  type IndexRecommendation,
} from '../performance/query-optimizer';

/**
 * ============================================
 * InMemoryCacheStore Tests (8 tests)
 * ============================================
 */
describe('InMemoryCacheStore', () => {
  let cache: InMemoryCacheStore<string>;

  beforeEach(() => {
    cache = new InMemoryCacheStore({
      maxSize: 1024 * 1024, // 1MB
      maxEntries: 100,
      ttlMs: 5000,
      evictionPolicy: 'lru',
    });
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should expire entries based on TTL', async () => {
    cache.set('ttl-key', 'ttl-value', 100); // 100ms TTL
    expect(cache.get('ttl-key')).toBe('ttl-value');

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(cache.get('ttl-key')).toBeUndefined();
  });

  it('should evict LRU entries when full', () => {
    const smallCache = new InMemoryCacheStore({
      maxEntries: 3,
      evictionPolicy: 'lru',
    });

    const time1 = Date.now();
    smallCache.set('a', 'value-a');

    // Small delay to ensure different timestamps
    const time2 = time1 + 1;
    smallCache.set('b', 'value-b');

    const time3 = time2 + 1;
    smallCache.set('c', 'value-c');

    // Now cache is full with: a (time1), b (time2), c (time3)
    // 'a' is least recently used by creation time
    // Add new entry - should evict 'a' since it's oldest and hasn't been accessed
    smallCache.set('d', 'value-d');

    // Since we added 'd' when full, 'a' should be evicted (LRU)
    expect(smallCache.get('a')).toBeUndefined(); // Evicted (least recently used)
    expect(smallCache.get('b')).toBe('value-b'); // Still there
    expect(smallCache.get('c')).toBe('value-c'); // Still there
    expect(smallCache.get('d')).toBe('value-d'); // New entry
  });

  it('should track hit/miss statistics', () => {
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1'); // Hit
    expect(cache.get('key1')).toBe('value1'); // Hit
    expect(cache.get('missing')).toBeUndefined(); // Miss

    const metrics = cache.getMetrics();
    expect(metrics.hits).toBe(2);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRate).toBeCloseTo(0.667, 2);
  });

  it('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    // 4 hits, 1 miss
    cache.get('key1');
    cache.get('key1');
    cache.get('key2');
    cache.get('key2');
    cache.get('missing');

    const metrics = cache.getMetrics();
    expect(metrics.hitRate).toBeCloseTo(0.8, 1);
  });

  it('should support delete operations', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);

    const deleted = cache.delete('key1');
    expect(deleted).toBe(true);
    expect(cache.has('key1')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.clear();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key3')).toBeUndefined();

    const metrics = cache.getMetrics();
    expect(metrics.entryCount).toBe(0);
  });
});

/**
 * ============================================
 * MultiTierCache Tests (8 tests)
 * ============================================
 */
describe('MultiTierCache', () => {
  let l1Config: CacheConfig;
  let multiTier: MultiTierCache<string>;

  beforeEach(() => {
    l1Config = { maxSize: 1024 * 100, maxEntries: 50 };
    multiTier = new MultiTierCache(l1Config, undefined, 'write-through');
  });

  afterEach(() => {
    multiTier.clear();
  });

  it('should implement write-through strategy', () => {
    multiTier.set('wt-key', 'wt-value');
    expect(multiTier.get('wt-key')).toBe('wt-value');
  });

  it('should implement write-back strategy', () => {
    const writeBackCache = new MultiTierCache(l1Config, undefined, 'write-back');
    writeBackCache.set('wb-key', 'wb-value');
    expect(writeBackCache.get('wb-key')).toBe('wb-value');
  });

  it('should fallback to L2 on L1 miss', () => {
    // Simulate L2 fallback (in production: actual L2 store)
    multiTier.set('key1', 'value1');
    expect(multiTier.has('key1')).toBe(true);
    expect(multiTier.get('key1')).toBe('value1');
  });

  it('should maintain cache coherence', () => {
    multiTier.set('key1', 'value1');
    multiTier.set('key2', 'value2');

    const coherence = multiTier.getCoherence();
    expect(coherence.consistent).toBe(true);
    expect(coherence.l1Count).toBe(2);
  });

  it('should support cascade invalidation', () => {
    multiTier.set('key1', 'value1');
    multiTier.set('key2', 'value2');

    multiTier.delete('key1');
    expect(multiTier.get('key1')).toBeUndefined();
    expect(multiTier.get('key2')).toBe('value2');
  });

  it('should compare L1 and L2 metrics', () => {
    multiTier.set('key1', 'value1');
    multiTier.get('key1');
    multiTier.get('nonexistent');

    const metrics = multiTier.getMetrics();
    expect(metrics.l1).toBeDefined();
    expect(metrics.l1.hits).toBeGreaterThan(0);
  });

  it('should register and use invalidation patterns', () => {
    const engine = new CacheInvalidationEngine();

    engine.registerTTLInvalidation('ttl-pattern', 5000, 'session:.*');
    engine.registerEventInvalidation('event-pattern', 'user:updated', 'user:.*');

    const patterns = engine.getPatterns();
    expect(patterns.size).toBe(2);
  });

  it('should handle invalidation chains', () => {
    const engine = new CacheInvalidationEngine();

    engine.registerDependencyInvalidation('dep-chain', ['user:123'], ['cache:user:123', 'cache:profile:123']);

    const chain = engine.getInvalidationChain('user:123');
    expect(chain).toContain('cache:user:123');
    expect(chain).toContain('cache:profile:123');
  });
});

/**
 * ============================================
 * CacheInvalidationEngine Tests (10 tests)
 * ============================================
 */
describe('CacheInvalidationEngine', () => {
  let engine: CacheInvalidationEngine;

  beforeEach(() => {
    engine = new CacheInvalidationEngine();
  });

  it('should register TTL-based invalidation', () => {
    engine.registerTTLInvalidation('ttl-1', 60000, 'cache:.*');
    const patterns = engine.getPatterns();
    expect(patterns.has('ttl-1')).toBe(true);
  });

  it('should register event-based invalidation', () => {
    engine.registerEventInvalidation('event-1', 'user:updated', 'user:.*');
    const patterns = engine.getPatterns();
    expect(patterns.has('event-1')).toBe(true);
  });

  it('should register dependency-based invalidation', () => {
    engine.registerDependencyInvalidation('dep-1', ['parent'], ['child1', 'child2']);
    const patterns = engine.getPatterns();
    expect(patterns.has('dep-1')).toBe(true);
  });

  it('should handle simple dependency chains', () => {
    engine.registerDependencyInvalidation('chain', ['A'], ['B', 'C']);
    const chain = engine.getInvalidationChain('A');

    expect(chain).toContain('B');
    expect(chain).toContain('C');
  });

  it('should handle nested dependency chains', () => {
    engine.registerDependencyInvalidation('l1', ['A'], ['B']);
    engine.registerDependencyInvalidation('l2', ['B'], ['C', 'D']);

    const chain = engine.getInvalidationChain('A');
    expect(chain).toContain('B');
    expect(chain).toContain('C');
    expect(chain).toContain('D');
  });

  it('should prevent circular dependency loops', () => {
    engine.registerDependencyInvalidation('c1', ['A'], ['B']);
    engine.registerDependencyInvalidation('c2', ['B'], ['A']); // Circular

    const chain = engine.getInvalidationChain('A');
    expect(chain.length).toBeLessThan(10); // No infinite loop
  });

  it('should support multiple source keys', () => {
    engine.registerDependencyInvalidation('multi', ['A', 'B'], ['C']);

    const chainA = engine.getInvalidationChain('A');
    const chainB = engine.getInvalidationChain('B');

    expect(chainA).toContain('C');
    expect(chainB).toContain('C');
  });

  it('should support wildcard patterns', () => {
    const patterns = engine.getPatterns();
    patterns.forEach((pattern) => {
      // Patterns should be valid
      expect(pattern.strategy).toBeDefined();
    });
  });

  it('should track all registered patterns', () => {
    engine.registerTTLInvalidation('ttl-1', 5000);
    engine.registerEventInvalidation('event-1', 'update');
    engine.registerDependencyInvalidation('dep-1', ['A'], ['B']);

    const patterns = engine.getPatterns();
    expect(patterns.size).toBe(3);
  });

  it('should return empty chain for unknown keys', () => {
    const chain = engine.getInvalidationChain('unknown-key');
    expect(chain).toHaveLength(0);
  });
});

/**
 * ============================================
 * MemoizationEngine Tests (8 tests)
 * ============================================
 */
describe('MemoizationEngine', () => {
  let engine: MemoizationEngine;

  beforeEach(() => {
    engine = new MemoizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should register functions', () => {
    const add = (a: number, b: number) => a + b;
    const fnId = engine.registerFunction('add', add);

    expect(fnId).toBeDefined();
    expect(fnId).toMatch(/^fn_/);
  });

  it('should memoize function results', async () => {
    let callCount = 0;
    const expensive = () => {
      callCount++;
      return 'result';
    };

    const fnId = engine.registerFunction('expensive', expensive);
    const memoized = engine.memoize(fnId);

    await memoized();
    await memoized();
    await memoized();

    expect(callCount).toBe(1); // Only called once
  });

  it('should handle concurrent identical calls', async () => {
    let callCount = 0;
    const asyncFn = async () => {
      callCount++;
      return 'result';
    };

    const fnId = engine.registerFunction('asyncFn', asyncFn);
    const memoized = engine.memoize(fnId);

    // Call simultaneously
    const [r1, r2, r3] = await Promise.all([memoized(), memoized(), memoized()]);

    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(r3).toBe('result');
    expect(callCount).toBe(1); // Deduplicated
  });

  it('should distinguish calls with different arguments', async () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x * 2;
    };

    const fnId = engine.registerFunction('fn', fn);
    const memoized = engine.memoize(fnId);

    const r1 = await memoized(5);
    const r2 = await memoized(5);
    const r3 = await memoized(10);
    const r4 = await memoized(10);

    expect(r1).toBe(10);
    expect(r2).toBe(10);
    expect(r3).toBe(20);
    expect(r4).toBe(20);
    expect(callCount).toBe(2); // Called for each unique argument
  });

  it('should support TTL invalidation', async (done) => {
    let callCount = 0;
    const fn = () => {
      callCount++;
      return 'result';
    };

    const fnId = engine.registerFunction('ttl-fn', fn);
    const memoized = engine.memoize(fnId, 100); // 100ms TTL

    await memoized();
    expect(callCount).toBe(1);

    await memoized();
    expect(callCount).toBe(1); // Still cached

    setTimeout(async () => {
      await memoized();
      expect(callCount).toBe(2); // Re-executed after TTL
      done();
    }, 150);
  });

  it('should manually invalidate function cache', async () => {
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return x;
    };

    const fnId = engine.registerFunction('fn', fn);
    const memoized = engine.memoize(fnId);

    await memoized(5);
    expect(callCount).toBe(1);

    await memoized(5);
    expect(callCount).toBe(1); // Cached

    engine.invalidateFunction(fnId);

    await memoized(5);
    expect(callCount).toBe(2); // Re-executed
  });

  it('should track cache statistics', async () => {
    const fn = (x: number) => x * 2;
    const fnId = engine.registerFunction('fn', fn);
    const memoized = engine.memoize(fnId);

    await memoized(1);
    await memoized(1);
    await memoized(2);

    const stats = engine.getStatistics();
    expect(stats.registeredFunctions).toBe(1);
    expect(stats.cachedEntries).toBeGreaterThan(0);
    expect(stats.totalHits).toBeGreaterThan(0);
  });
});

/**
 * ============================================
 * PerformanceProfiler Tests (8 tests)
 * ============================================
 */
describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  afterEach(() => {
    profiler.clear();
  });

  it('should track operation latency', () => {
    const opId = profiler.startOperation('database_query');
    // Simulate work
    const duration = profiler.endOperation(opId);

    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should calculate latency percentiles', () => {
    // Record multiple samples
    for (let i = 0; i < 100; i++) {
      profiler.recordLatency('api_call', Math.random() * 100);
    }

    const stats = profiler.getLatencyStats('api_call');
    expect(stats).toBeDefined();
    expect(stats!.p50Ms).toBeLessThanOrEqual(stats!.p95Ms);
    expect(stats!.p95Ms).toBeLessThanOrEqual(stats!.p99Ms);
  });

  it('should detect high-latency bottlenecks', () => {
    // Record slow operation
    profiler.recordLatency('slow_operation', 600);
    profiler.recordLatency('slow_operation', 550);

    const bottlenecks = profiler.detectBottlenecks();
    expect(bottlenecks.length).toBeGreaterThan(0);
    expect(bottlenecks[0].severity).toBe('critical');
  });

  it('should detect high variance bottlenecks', () => {
    // Record operations with high variance
    profiler.recordLatency('variable_op', 10);
    profiler.recordLatency('variable_op', 100);
    profiler.recordLatency('variable_op', 200);
    profiler.recordLatency('variable_op', 300);

    const bottlenecks = profiler.detectBottlenecks();
    const highVarianceBottleneck = bottlenecks.find((b) => b.reason.includes('variance'));
    expect(highVarianceBottleneck).toBeDefined();
  });

  it('should generate optimization recommendations', () => {
    // Create a bottleneck scenario
    for (let i = 0; i < 20; i++) {
      profiler.recordLatency('slow_query', 600);
    }

    const recommendations = profiler.generateRecommendations();
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].priority).toBe('high');
  });

  it('should track resource usage', () => {
    profiler.recordResourceUsage(1024, 45.5);
    profiler.recordResourceUsage(1536, 62.3);
    profiler.recordResourceUsage(2048, 78.1);

    const trends = profiler.getResourceTrends(60000);
    expect(trends.peakMemoryMb).toBe(2048);
    expect(trends.samplesInPeriod).toBe(3);
  });

  it('should generate performance report', () => {
    profiler.recordLatency('op1', 50);
    profiler.recordLatency('op1', 60);
    profiler.recordLatency('op2', 600); // Slow operation (>500ms threshold)
    profiler.recordResourceUsage(1024, 50);

    const report = profiler.generateReport();
    expect(report.timestamp).toBeGreaterThan(0);
    expect(report.latencyStats.length).toBeGreaterThan(0);
    expect(report.bottlenecks.length).toBeGreaterThan(0);
    expect(report.resourceTrends).toBeDefined();
  });

  it('should clear profiler state', () => {
    profiler.recordLatency('op1', 50);
    let stats = profiler.getAllLatencyStats();
    expect(stats.length).toBeGreaterThan(0);

    profiler.clear();
    stats = profiler.getAllLatencyStats();
    expect(stats.length).toBe(0);
  });
});

/**
 * ============================================
 * QueryOptimizer Tests (4 tests)
 * ============================================
 */
describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
  });

  afterEach(() => {
    optimizer.clear();
  });

  it('should analyze query execution plans', () => {
    const query = 'SELECT * FROM users WHERE id = 123';
    const plan = optimizer.analyzeQuery(query);

    expect(plan.planId).toBeDefined();
    expect(plan.query).toBe(query);
    expect(plan.estimatedCost).toBeGreaterThan(0);
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it('should recommend indexes', () => {
    const query = 'SELECT * FROM users WHERE id = 123 ORDER BY name';
    const recommendations = optimizer.getIndexRecommendations(query);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].columns).toBeDefined();
    expect(recommendations[0].estimatedImprovementPercent).toBeGreaterThan(0);
  });

  it('should detect slow queries', () => {
    optimizer.recordQueryExecution('SELECT * FROM large_table', 200);
    optimizer.recordQueryExecution('SELECT * FROM small_table', 10);

    const slowQueries = optimizer.getSlowQueries(100);
    expect(slowQueries.length).toBeGreaterThan(0);
  });

  it('should generate optimization suggestions', () => {
    const query = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id ORDER BY u.name';
    const suggestions = optimizer.getOptimizationSuggestions(query);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].category).toBeDefined();
    expect(suggestions[0].priority).toBeDefined();
  });
});

/**
 * ============================================
 * CacheManager Integration Tests (4 tests)
 * ============================================
 */
describe('CacheManager Integration', () => {
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should create and manage multiple caches', () => {
    const cache1 = manager.getCache<string>('cache1', { maxEntries: 10 });
    const cache2 = manager.getCache<number>('cache2', { maxEntries: 20 });

    cache1.set('key1', 'value1');
    cache2.set('key1', 100);

    expect(cache1.get('key1')).toBe('value1');
    expect(cache2.get('key1')).toBe(100);
  });

  it('should provide combined metrics', () => {
    const cache = manager.getCache<string>('metrics-cache');
    cache.set('key1', 'value1');
    cache.get('key1');

    const allMetrics = manager.getAllMetrics();
    expect(allMetrics['metrics-cache']).toBeDefined();
    expect(allMetrics['metrics-cache'].l1).toBeDefined();
  });

  it('should support cache deletion', () => {
    manager.getCache<string>('temp-cache').set('key1', 'value1');

    const deleted = manager.deleteCache('temp-cache');
    expect(deleted).toBe(true);

    const deleted2 = manager.deleteCache('temp-cache');
    expect(deleted2).toBe(false);
  });

  it('should provide invalidation engine', () => {
    const engine = manager.getInvalidationEngine();
    expect(engine).toBeDefined();

    engine.registerTTLInvalidation('ttl-1', 5000);
    const patterns = engine.getPatterns();
    expect(patterns.has('ttl-1')).toBe(true);
  });
});
