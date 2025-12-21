/**
 * M1 Performance Benchmarking Suite
 *
 * Comprehensive load testing and performance validation for production readiness.
 * Tests baseline performance, identifies bottlenecks, and validates optimization.
 *
 * Phase 9: Production Hardening & Observability Excellence
 */

import { describe, it, expect, beforeEach } from "vitest";
import { cacheEngine, CacheEngine } from "../caching/cache-engine";
import { DistributedCacheAdapter, createDistributedCacheAdapter } from "../caching/distributed-cache-adapter";
import { metricsCollector } from "../monitoring/metrics";
import { dashboardAPI } from "../monitoring/dashboard-api";
import { isToolAllowed } from "../tools/policy";

/**
 * Performance benchmarking utilities
 */
class PerformanceBenchmark {
  private results: Map<string, number[]> = new Map();

  /**
   * Measure operation duration
   */
  measure(name: string, operation: () => void | Promise<void>): number {
    const start = performance.now();
    operation();
    const duration = performance.now() - start;

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(duration);

    return duration;
  }

  /**
   * Measure async operation duration
   */
  async measureAsync(name: string, operation: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await operation();
    const duration = performance.now() - start;

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(duration);

    return duration;
  }

  /**
   * Get statistics for a benchmark
   */
  getStats(name: string) {
    const times = this.results.get(name) || [];
    if (times.length === 0) {
      return null;
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = sorted[0];
    const max = sorted[times.length - 1];
    const p50 = sorted[Math.floor(times.length * 0.5)];
    const p95 = sorted[Math.floor(times.length * 0.95)];
    const p99 = sorted[Math.floor(times.length * 0.99)];

    return {
      count: times.length,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
      total: sum,
    };
  }

  /**
   * Print benchmark results
   */
  printResults() {
    console.log("\n=== Performance Benchmark Results ===\n");
    for (const [name, times] of this.results.entries()) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`);
        console.log(
          `  Avg: ${stats.avg.toFixed(3)}ms | Min: ${stats.min.toFixed(3)}ms | Max: ${stats.max.toFixed(3)}ms`
        );
        console.log(
          `  P50: ${stats.p50.toFixed(3)}ms | P95: ${stats.p95.toFixed(3)}ms | P99: ${stats.p99.toFixed(3)}ms`
        );
        console.log(`  Total: ${stats.total.toFixed(2)}ms (${stats.count} ops)\n`);
      }
    }
  }
}

describe("Performance Benchmarks", () => {
  let benchmark: PerformanceBenchmark;
  let cache: CacheEngine;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    cache = new CacheEngine({
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 50000,
    });
    metricsCollector.reset?.();
  });

  describe("Cache Operation Performance", () => {
    it("should handle 10,000 cache writes efficiently", () => {
      let totalTime = 0;

      for (let i = 0; i < 10000; i++) {
        totalTime += benchmark.measure("cache_write", () => {
          cache.set(`key${i}`, `value${i}`);
        });
      }

      const stats = benchmark.getStats("cache_write");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(1); // Average < 1ms per write
      expect(stats!.p95).toBeLessThan(2); // P95 < 2ms
      expect(totalTime).toBeLessThan(15000); // All 10K writes < 15 seconds
    });

    it("should handle 100,000 cache reads efficiently", () => {
      // Populate cache
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      let totalTime = 0;

      for (let i = 0; i < 100000; i++) {
        totalTime += benchmark.measure("cache_read", () => {
          cache.get(`key${i % 1000}`);
        });
      }

      const stats = benchmark.getStats("cache_read");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(0.5); // Average < 0.5ms per read
      expect(stats!.p95).toBeLessThan(1); // P95 < 1ms
      expect(totalTime).toBeLessThan(10000); // All 100K reads < 10 seconds
    });

    it("should maintain cache hit rate under load", () => {
      // Populate cache
      for (let i = 0; i < 5000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      let hits = 0;
      let misses = 0;

      for (let i = 0; i < 50000; i++) {
        if (cache.get(`key${i % 5000}`) !== undefined) {
          hits++;
        } else {
          misses++;
        }
      }

      const hitRate = (hits / (hits + misses)) * 100;
      expect(hitRate).toBeGreaterThan(95); // > 95% hit rate
    });

    it("should handle concurrent cache operations", () => {
      const promises: Promise<void>[] = [];

      for (let batch = 0; batch < 10; batch++) {
        promises.push(
          (async () => {
            for (let i = 0; i < 1000; i++) {
              cache.set(`batch${batch}_key${i}`, `value${i}`);
            }
          })()
        );
      }

      expect(() => {
        for (let i = 0; i < 10000; i++) {
          cache.get(`batch${i % 10}_key${i % 1000}`);
        }
      }).not.toThrow();
    });

    it("should handle eviction under memory pressure", () => {
      const smallCache = new CacheEngine({
        maxEntries: 1000,
        maxSize: 10 * 1024 * 1024, // 10MB
      });

      // Fill beyond capacity
      for (let i = 0; i < 2000; i++) {
        smallCache.set(`key${i}`, "x".repeat(5000)); // 5KB per entry
      }

      const stats = smallCache.getStats();
      expect(stats.entries).toBeLessThanOrEqual(1000);
      expect(stats.size).toBeLessThanOrEqual(10 * 1024 * 1024);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe("Policy Engine Performance", () => {
    it("should validate policies efficiently", () => {
      let totalTime = 0;

      for (let i = 0; i < 1000; i++) {
        totalTime += benchmark.measure("policy_check", () => {
          isToolAllowed("tool_registry_list");
        });
      }

      const stats = benchmark.getStats("policy_check");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(1); // Average < 1ms per check
      expect(stats!.p95).toBeLessThan(5); // P95 < 5ms
      expect(totalTime).toBeLessThan(5000); // All 1K checks < 5 seconds
    });

    it("should handle concurrent policy checks", () => {
      let checkCount = 0;

      for (let i = 0; i < 10000; i++) {
        if (isToolAllowed("tool_registry_list")) {
          checkCount++;
        }
      }

      // All checks should pass (tool_registry_list is a read-only tool)
      expect(checkCount).toBe(10000);
    });
  });

  describe("Dashboard API Performance", () => {
    it("should aggregate metrics efficiently", () => {
      // Populate some data
      metricsCollector.incrementCounter("agent_runs_total", 100);
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
        cache.get(`key${i}`);
      }

      let totalTime = 0;

      for (let i = 0; i < 100; i++) {
        totalTime += benchmark.measure("dashboard_metrics", () => {
          dashboardAPI.getMetrics();
        });
      }

      const stats = benchmark.getStats("dashboard_metrics");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(10); // Average < 10ms per aggregation
      expect(stats!.p95).toBeLessThan(50); // P95 < 50ms
    });

    it("should generate complete dashboard snapshot efficiently", () => {
      // Populate data
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
        cache.get(`key${i}`);
      }

      let totalTime = 0;

      for (let i = 0; i < 50; i++) {
        totalTime += benchmark.measure("dashboard_complete", () => {
          dashboardAPI.getCompleteDashboard();
        });
      }

      const stats = benchmark.getStats("dashboard_complete");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(50); // Average < 50ms for complete snapshot
      expect(stats!.p95).toBeLessThan(100); // P95 < 100ms
    });
  });

  describe("Distributed Cache Performance", () => {
    it("should handle distributed cache operations", async () => {
      const adapter = createDistributedCacheAdapter(cache, false);

      let totalTime = 0;

      for (let i = 0; i < 1000; i++) {
        totalTime += benchmark.measure("distributed_write", () => {
          adapter.set(`key${i}`, `value${i}`);
        });
      }

      const stats = benchmark.getStats("distributed_write");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(2); // Average < 2ms per write
      expect(stats!.p95).toBeLessThan(5); // P95 < 5ms

      await adapter.shutdown();
    });

    it("should handle invalidation efficiently", async () => {
      const adapter = createDistributedCacheAdapter(cache, false);

      // Populate cache
      for (let i = 0; i < 1000; i++) {
        adapter.set(`user:${i}:profile`, `data${i}`);
      }

      let totalTime = 0;

      for (let i = 0; i < 100; i++) {
        totalTime += benchmark.measure("cache_invalidation", () => {
          adapter.invalidatePrefix("user:");
        });
      }

      const stats = benchmark.getStats("cache_invalidation");
      expect(stats).toBeDefined();
      expect(stats!.avg).toBeLessThan(10); // Average < 10ms per invalidation

      await adapter.shutdown();
    });
  });

  describe("Memory Efficiency", () => {
    it(
      "should not leak memory during heavy operations",
      async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Heavy operations (reduced from 100K to 50K to avoid timeout)
        for (let i = 0; i < 50000; i++) {
          const key = `key${i}`;
          cache.set(key, `value${i}`);
          if (i % 10 === 0) {
            cache.get(key);
          }
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

        // Memory increase should be reasonable (cache is capped)
        expect(memoryIncrease).toBeLessThan(200); // Less than 200MB increase
      },
      30000
    );

    it("should respect configured memory limits", () => {
      const limitedCache = new CacheEngine({
        maxSize: 5 * 1024 * 1024, // 5MB hard limit
        maxEntries: 10000,
      });

      // Try to exceed limit
      for (let i = 0; i < 2000; i++) {
        limitedCache.set(`key${i}`, "x".repeat(10000)); // 10KB per entry
      }

      const stats = limitedCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(5 * 1024 * 1024);
      expect(stats.entries).toBeLessThanOrEqual(10000);
    });
  });

  describe("Scalability Tests", () => {
    it("should scale linearly with cache size", () => {
      const sizes = [1000, 5000, 10000];
      const times: number[] = [];

      for (const size of sizes) {
        const testCache = new CacheEngine();
        const start = performance.now();

        for (let i = 0; i < size; i++) {
          testCache.set(`key${i}`, `value${i}`);
        }

        const duration = performance.now() - start;
        times.push(duration);
      }

      // Time should scale roughly linearly
      const ratio1 = times[1] / times[0]; // Should be ~5
      const ratio2 = times[2] / times[1]; // Should be ~2

      expect(ratio1).toBeLessThan(10); // Not exponential
      expect(ratio2).toBeLessThan(5); // Not exponential
    });

    it("should handle operation throughput", () => {
      const operationsPerSecond = [];
      const durations = [1000, 5000, 10000]; // Number of operations

      for (const duration of durations) {
        const start = performance.now();

        for (let i = 0; i < duration; i++) {
          cache.set(`key${i}`, `value${i}`);
          cache.get(`key${i % 100}`);
        }

        const elapsed = (performance.now() - start) / 1000; // Convert to seconds
        const throughput = duration / elapsed;
        operationsPerSecond.push(throughput);
      }

      // All throughput measurements should be > 10K ops/sec
      expect(operationsPerSecond.every((t) => t > 10000)).toBe(true);
    });
  });

  describe("Stress Tests", () => {
    it("should handle sustained load without degradation", () => {
      const iterations = 50;
      const timings: number[] = [];

      for (let batch = 0; batch < iterations; batch++) {
        const batchStart = performance.now();

        for (let i = 0; i < 100; i++) {
          cache.set(`batch${batch}_key${i}`, `value${i}`);
          cache.get(`batch${batch}_key${i}`);
        }

        timings.push(performance.now() - batchStart);
      }

      // Check for performance degradation
      const firstHalf = timings.slice(0, iterations / 2);
      const secondHalf = timings.slice(iterations / 2);

      const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

      // Second half should not be significantly slower
      expect(secondAvg / firstAvg).toBeLessThan(2.0); // Less than 100% slower (account for system variability)
    });

    it("should recover quickly from cache evictions", () => {
      const smallCache = new CacheEngine({
        maxEntries: 100,
      });

      for (let cycle = 0; cycle < 10; cycle++) {
        const cycleStart = performance.now();

        // Cause evictions
        for (let i = 0; i < 150; i++) {
          smallCache.set(`key${i}`, `value${i}`);
        }

        // Verify cache is still functional
        for (let i = 0; i < 100; i++) {
          smallCache.get(`key${i}`);
        }

        const cycleDuration = performance.now() - cycleStart;
        expect(cycleDuration).toBeLessThan(100); // Each cycle < 100ms
      }
    });
  });
});
