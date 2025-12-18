/**
 * M1 Caching Tests - Phase 8
 *
 * Comprehensive tests for cache engine, strategies, and performance.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CacheEngine,
  MultiTierCache,
  type CacheConfig,
} from "../caching/cache-engine";
import {
  ToolRegistryCache,
  PolicyDecisionCache,
  MetricsCache,
  AgentRunCache,
  ApprovalTokenCache,
  CacheInvalidationEvent,
  getCacheStats,
  clearAllCaches,
} from "../caching/cache-strategies";
import {
  memoize,
  memoizeAsync,
  withAsyncCache,
  invalidateCachePrefix,
  invalidateCache,
} from "../caching/cache-decorators";

describe("M1 Caching - Phase 8", () => {
  beforeEach(() => {
    clearAllCaches();
  });

  describe("Cache Engine - Basic Operations", () => {
    let cache: CacheEngine<any>;

    beforeEach(() => {
      cache = new CacheEngine({
        maxSize: 10 * 1024 * 1024, // 10MB
        maxEntries: 1000,
        defaultTTL: 60 * 1000, // 1 minute
        evictionPolicy: "LRU",
      });
    });

    it("should set and get cache entries", () => {
      cache.set("key1", { data: "value1" });

      const value = cache.get("key1");
      expect(value).toEqual({ data: "value1" });
    });

    it("should return undefined for non-existent keys", () => {
      const value = cache.get("non-existent");
      expect(value).toBeUndefined();
    });

    it("should check if key exists", () => {
      cache.set("key1", "value1");

      expect(cache.has("key1")).toBe(true);
      expect(cache.has("non-existent")).toBe(false);
    });

    it("should delete entries", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);

      const deleted = cache.delete("key1");
      expect(deleted).toBe(true);
      expect(cache.has("key1")).toBe(false);
    });

    it("should handle TTL expiration", () => {
      cache.set("key1", "value1", 100); // 100ms TTL

      expect(cache.has("key1")).toBe(true);

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.has("key1")).toBe(false);
          resolve(null);
        }, 150);
      });
    });

    it("should track cache statistics", () => {
      cache.set("key1", "value1");
      cache.get("key1"); // hit
      cache.get("key1"); // hit
      cache.get("non-existent"); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.entries).toBe(1);
    });

    it("should calculate hit rate correctly", () => {
      cache.set("key1", "value1");
      cache.get("key1"); // hit
      cache.get("key1"); // hit
      cache.get("key1"); // hit
      cache.get("non-existent"); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });

    it("should invalidate by pattern", () => {
      cache.set("tool:registry:1", "data1");
      cache.set("tool:registry:2", "data2");
      cache.set("policy:decision:1", "data3");

      const invalidated = cache.invalidatePattern(/^tool:registry/);
      expect(invalidated).toBe(2);
      expect(cache.has("tool:registry:1")).toBe(false);
      expect(cache.has("policy:decision:1")).toBe(true);
    });

    it("should invalidate by prefix", () => {
      cache.set("agent:run:1", "data1");
      cache.set("agent:run:2", "data2");
      cache.set("agent:metric", "data3");

      const invalidated = cache.invalidatePrefix("agent:run");
      expect(invalidated).toBe(2);
      expect(cache.has("agent:metric")).toBe(true);
    });

    it("should clear all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.clear();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe("Cache Engine - Eviction Policies", () => {
    it("should evict LRU entries", () => {
      const cache = new CacheEngine<string>(
        {
          maxEntries: 3,
          evictionPolicy: "LRU",
        }
      );

      cache.set("key1", "value1");
      // Ensure time passes between sets
      let now = Date.now();
      while (Date.now() === now) {}

      cache.set("key2", "value2");
      now = Date.now();
      while (Date.now() === now) {}

      cache.set("key3", "value3");

      // Access key1 and key3 to make them recently used
      cache.get("key1");
      cache.get("key3");

      // Add small delay to ensure time difference for LRU
      const delay = 5; // milliseconds
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait to ensure time passes
      }

      // Add new entry, should evict key2 (least recently used)
      cache.set("key4", "value4");

      // Debug: Check what's actually in cache
      const stats = cache.getStats();
      expect(stats.entries).toBe(3); // Should still have 3 entries after eviction

      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(false);
      expect(cache.has("key3")).toBe(true);
      expect(cache.has("key4")).toBe(true);
    });

    it("should evict LFU entries", () => {
      const cache = new CacheEngine<string>(
        {
          maxEntries: 3,
          evictionPolicy: "LFU",
        }
      );

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      // Access key1 and key3 multiple times
      cache.get("key1");
      cache.get("key1");
      cache.get("key3");

      // key2 is least frequently used
      cache.set("key4", "value4");

      expect(cache.has("key2")).toBe(false);
    });

    it("should evict FIFO entries", () => {
      const cache = new CacheEngine<string>(
        {
          maxEntries: 3,
          evictionPolicy: "FIFO",
        }
      );

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      // Add new entry, should evict key1 (first in)
      cache.set("key4", "value4");

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
    });
  });

  describe("Multi-Tier Cache", () => {
    it("should use local cache tier", async () => {
      const cache = new MultiTierCache<any>();

      await cache.set("key1", { data: "value1" });
      const value = await cache.get("key1");

      expect(value).toEqual({ data: "value1" });
    });

    it("should fallback gracefully without distributed cache", async () => {
      const cache = new MultiTierCache<string>();

      await cache.set("key1", "value1");
      expect(await cache.has("key1")).toBe(true);

      await cache.delete("key1");
      expect(await cache.has("key1")).toBe(false);
    });
  });

  describe("Tool Registry Cache Strategy", () => {
    it("should cache tool registry data", () => {
      const toolData = { name: "test_tool", scope: "read" };
      ToolRegistryCache.cacheRegistry("test_tool", toolData);

      const cached = ToolRegistryCache.getRegistry("test_tool");
      expect(cached).toEqual(toolData);
    });

    it("should invalidate specific tool cache", () => {
      ToolRegistryCache.cacheRegistry("tool1", { data: "1" });
      ToolRegistryCache.cacheRegistry("tool2", { data: "2" });

      const invalidated = ToolRegistryCache.invalidateRegistry("tool1");
      expect(invalidated).toBe(1);
      expect(ToolRegistryCache.getRegistry("tool1")).toBeUndefined();
      expect(ToolRegistryCache.getRegistry("tool2")).toBeDefined();
    });

    it("should invalidate all tool registry caches", () => {
      ToolRegistryCache.cacheRegistry("tool1", { data: "1" });
      ToolRegistryCache.cacheRegistry("tool2", { data: "2" });

      const invalidated = ToolRegistryCache.invalidateAll();
      expect(invalidated).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Policy Decision Cache Strategy", () => {
    it("should cache policy decisions", () => {
      const decision = { allowed: true, reason: "approved" };
      PolicyDecisionCache.cacheDecision("tool1", "execute", decision);

      const cached = PolicyDecisionCache.getDecision("tool1", "execute");
      expect(cached).toEqual(decision);
    });

    it("should track cache hits and misses", () => {
      const decision = { allowed: true };
      PolicyDecisionCache.cacheDecision("tool1", "execute", decision);

      PolicyDecisionCache.getDecision("tool1", "execute"); // hit
      PolicyDecisionCache.getDecision("tool1", "execute"); // hit
      PolicyDecisionCache.getDecision("tool2", "execute"); // miss

      // Verify metrics were tracked
      const stats = getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe("Metrics Cache Strategy", () => {
    it("should cache metrics data", () => {
      const metrics = { hits: 100, misses: 10 };
      MetricsCache.cacheMetrics("agent_runs", metrics);

      const cached = MetricsCache.getMetrics("agent_runs");
      expect(cached).toEqual(metrics);
    });

    it("should cache run metrics", () => {
      const runMetrics = { duration: 1000, toolCalls: 5 };
      MetricsCache.cacheRunMetrics("run-123", runMetrics);

      const cached = MetricsCache.getRunMetrics("run-123");
      expect(cached).toEqual(runMetrics);
    });

    it("should cache tool statistics", () => {
      const toolStats = { total: 100, success: 95 };
      MetricsCache.cacheToolStats("tool_registry_list", toolStats);

      const cached = MetricsCache.getToolStats("tool_registry_list");
      expect(cached).toEqual(toolStats);
    });
  });

  describe("Agent Run Cache Strategy", () => {
    it("should cache agent run data", () => {
      const runData = { runId: "run-1", status: "completed" };
      AgentRunCache.cacheRun("run-1", runData);

      const cached = AgentRunCache.getRun("run-1");
      expect(cached).toEqual(runData);
    });

    it("should cache recent runs for an agent", () => {
      const runs = [
        { runId: "run-1", status: "completed" },
        { runId: "run-2", status: "completed" },
      ];
      AgentRunCache.cacheRecentRuns("agent1", runs);

      const cached = AgentRunCache.getRecentRuns("agent1");
      expect(cached).toEqual(runs);
    });

    it("should invalidate individual run caches", () => {
      AgentRunCache.cacheRun("run-1", { data: "1" });
      const invalidated = AgentRunCache.invalidateRun("run-1");

      expect(invalidated).toBe(1);
      expect(AgentRunCache.getRun("run-1")).toBeUndefined();
    });
  });

  describe("Approval Token Cache Strategy", () => {
    it("should cache approval tokens", () => {
      const tokenData = { toolName: "tool1", scope: "execute" };
      ApprovalTokenCache.cacheToken("token-123", tokenData);

      const cached = ApprovalTokenCache.getToken("token-123");
      expect(cached).toEqual(tokenData);
    });

    it("should revoke individual tokens", () => {
      ApprovalTokenCache.cacheToken("token-123", { data: "token" });
      const revoked = ApprovalTokenCache.revokeToken("token-123");

      expect(revoked).toBe(1);
      expect(ApprovalTokenCache.getToken("token-123")).toBeUndefined();
    });
  });

  describe("Cache Invalidation Events", () => {
    it("should invalidate on tool registry update", () => {
      ToolRegistryCache.cacheRegistry("tool1", { data: "1" });
      PolicyDecisionCache.cacheDecision("tool1", "execute", { allowed: true });

      CacheInvalidationEvent.onToolRegistryUpdate("tool1");

      expect(ToolRegistryCache.getRegistry("tool1")).toBeUndefined();
      expect(PolicyDecisionCache.getDecision("tool1", "execute")).toBeUndefined();
    });

    it("should invalidate on run completion", () => {
      AgentRunCache.cacheRun("run-1", { data: "1" });
      AgentRunCache.cacheRecentRuns("agent1", [{ runId: "run-1" }]);

      CacheInvalidationEvent.onRunComplete("run-1", "agent1");

      expect(AgentRunCache.getRun("run-1")).toBeUndefined();
      expect(AgentRunCache.getRecentRuns("agent1")).toBeUndefined();
    });

    it("should invalidate on token revocation", () => {
      ApprovalTokenCache.cacheToken("token-123", { data: "token" });

      CacheInvalidationEvent.onTokenRevocation("token-123");

      expect(ApprovalTokenCache.getToken("token-123")).toBeUndefined();
    });
  });

  describe("Cache Decorators", () => {
    it("should memoize sync function results", () => {
      let callCount = 0;
      const expensiveFunction = memoize((x: number) => {
        callCount++;
        return x * 2;
      });

      const result1 = expensiveFunction(5);
      const result2 = expensiveFunction(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(callCount).toBe(1); // Should only be called once
    });

    it("should memoize async function results", async () => {
      let callCount = 0;
      const asyncFunction = memoizeAsync(async (x: number) => {
        callCount++;
        return x * 2;
      });

      const result1 = await asyncFunction(5);
      const result2 = await asyncFunction(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(callCount).toBe(1);
    });

    it("should wrap async function with cache", async () => {
      let callCount = 0;
      const fn = async (x: number) => {
        callCount++;
        return x * 2;
      };

      const cached = withAsyncCache(fn);

      await cached(5);
      await cached(5);

      expect(callCount).toBe(1);
    });

    it("should invalidate cache by prefix", () => {
      // Create a named function so fn.name is populated
      function expensiveFunction(x: number) {
        return x * 2;
      }
      const fn = memoize(expensiveFunction);

      fn(5);
      fn(10);

      const invalidated = invalidateCachePrefix("expensiveFunction");
      expect(invalidated).toBe(2);
    });

    it("should invalidate cache by pattern", () => {
      // Create a named function so fn.name is populated
      function expensiveFunction(x: number) {
        return x * 2;
      }
      const fn = memoize(expensiveFunction);

      fn(5);
      fn(10);

      const invalidated = invalidateCache(/expensiveFunction/);
      expect(invalidated).toBe(2);
    });
  });

  describe("Cache Statistics & Monitoring", () => {
    it("should track overall cache statistics", () => {
      ToolRegistryCache.cacheRegistry("tool1", { data: "1" });
      PolicyDecisionCache.cacheDecision("tool1", "read", { allowed: true });

      // Trigger some hits
      ToolRegistryCache.getRegistry("tool1");
      PolicyDecisionCache.getDecision("tool1", "read");

      const stats = getCacheStats();
      expect(stats.entries).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
    });

    it("should calculate cache efficiency metrics", () => {
      ToolRegistryCache.cacheRegistry("tool1", { data: "1" });
      ToolRegistryCache.getRegistry("tool1"); // hit
      ToolRegistryCache.getRegistry("tool2"); // miss

      const stats = getCacheStats();
      expect(stats.efficiency).toBeDefined();
      expect(stats.efficiency.hitRate).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete caching workflow", async () => {
      // Simulate a complete workflow with caching

      // 1. Cache tool registry
      const toolData = { name: "test_tool", scope: "read" };
      ToolRegistryCache.cacheRegistry("test_tool", toolData);

      // 2. Cache policy decision
      const decision = { allowed: true, reason: "approved" };
      PolicyDecisionCache.cacheDecision("test_tool", "read", decision);

      // 3. Execute with caching
      let policyCalls = 0;
      const checkPolicy = memoizeAsync(async () => {
        policyCalls++;
        return PolicyDecisionCache.getDecision("test_tool", "read");
      });

      const result1 = await checkPolicy();
      const result2 = await checkPolicy();

      expect(result1).toEqual(decision);
      expect(result2).toEqual(decision);
      expect(policyCalls).toBe(1); // Only called once due to memoization

      // 4. Verify cache stats
      const stats = getCacheStats();
      expect(stats.entries).toBeGreaterThan(0);
    });

    it("should handle cache invalidation on data changes", () => {
      // Initial cached data
      ToolRegistryCache.cacheRegistry("tool1", { version: 1 });
      PolicyDecisionCache.cacheDecision("tool1", "execute", { allowed: true });

      // Verify cached
      expect(ToolRegistryCache.getRegistry("tool1")).toBeDefined();
      expect(PolicyDecisionCache.getDecision("tool1", "execute")).toBeDefined();

      // Simulate tool update
      CacheInvalidationEvent.onToolRegistryUpdate("tool1");

      // Verify invalidated
      expect(ToolRegistryCache.getRegistry("tool1")).toBeUndefined();
      expect(PolicyDecisionCache.getDecision("tool1", "execute")).toBeUndefined();

      // New data
      ToolRegistryCache.cacheRegistry("tool1", { version: 2 });
      expect(ToolRegistryCache.getRegistry("tool1").version).toBe(2);
    });
  });
});
