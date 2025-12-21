/**
 * M1 Memoization Engine
 *
 * Function-level result caching with automatic invalidation
 * and concurrent call deduplication
 *
 * Version: v1.0.0
 * Phase: 22 - Advanced Caching & Performance Optimization
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Memoized function metadata
 */
export interface MemoizedFunctionMetadata {
  functionId: string;
  functionName: string;
  arity: number;
  cacheHits: number;
  cacheMisses: number;
  totalExecutions: number;
  avgExecutionTime: number;
  lastInvalidated?: number;
  registeredAt: number;
}

/**
 * Memoization cache entry
 */
export interface MemoizationEntry<T> {
  key: string;
  result: T;
  error?: Error;
  timestamp: number;
  ttlMs?: number;
  hitCount: number;
  executionTime: number;
}

/**
 * Function cache key generator
 */
export type CacheKeyGenerator = (functionId: string, args: any[]) => string;

/**
 * Default cache key generator - hashes arguments
 */
function defaultCacheKeyGenerator(functionId: string, args: any[]): string {
  const argsHash = JSON.stringify(args);
  return `${functionId}:${Buffer.from(argsHash).toString('base64')}`;
}

/**
 * Memoization engine for function-level caching
 */
export class MemoizationEngine {
  private functionRegistry: Map<string, { fn: Function; metadata: MemoizedFunctionMetadata }> = new Map();
  private memoCache: Map<string, MemoizationEntry<any>> = new Map(); // key -> entry
  private concurrentCalls: Map<string, Promise<any>> = new Map(); // key -> promise (deduplication)
  private keyGenerator: CacheKeyGenerator;
  private invalidationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(keyGenerator?: CacheKeyGenerator) {
    this.keyGenerator = keyGenerator || defaultCacheKeyGenerator;
  }

  /**
   * Register function for memoization
   */
  registerFunction<T extends (...args: any[]) => any>(
    functionName: string,
    fn: T,
    ttlMs?: number
  ): string {
    const functionId = `fn_${generateUUID()}`;

    this.functionRegistry.set(functionId, {
      fn,
      metadata: {
        functionId,
        functionName,
        arity: fn.length,
        cacheHits: 0,
        cacheMisses: 0,
        totalExecutions: 0,
        avgExecutionTime: 0,
        registeredAt: Date.now(),
      },
    });

    return functionId;
  }

  /**
   * Get memoized function wrapper
   */
  memoize<T extends (...args: any[]) => any>(
    functionId: string,
    ttlMs?: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    const self = this;

    return async (...args: any[]) => {
      return self.callMemoized(functionId, args, ttlMs);
    };
  }

  /**
   * Call memoized function
   */
  async callMemoized<T = any>(functionId: string, args: any[], ttlMs?: number): Promise<T> {
    const entry = this.functionRegistry.get(functionId);
    if (!entry) {
      throw new Error(`Function ${functionId} not registered`);
    }

    const cacheKey = this.keyGenerator(functionId, args);
    const metadata = entry.metadata;

    // Check cache
    const cached = this.memoCache.get(cacheKey);
    if (cached && (!cached.ttlMs || Date.now() - cached.timestamp < cached.ttlMs)) {
      metadata.cacheHits++;
      return cached.result;
    }

    // Check for concurrent identical call (deduplication)
    if (this.concurrentCalls.has(cacheKey)) {
      return this.concurrentCalls.get(cacheKey)!;
    }

    // Execute function
    const startTime = Date.now();
    const promise = Promise.resolve().then(() => {
      return entry.fn(...args);
    });

    this.concurrentCalls.set(cacheKey, promise);

    try {
      const result = await promise;

      const executionTime = Date.now() - startTime;

      // Update metrics
      metadata.totalExecutions++;
      metadata.cacheMisses++;
      metadata.avgExecutionTime =
        (metadata.avgExecutionTime * (metadata.totalExecutions - 1) + executionTime) / metadata.totalExecutions;

      // Cache result
      const memoEntry: MemoizationEntry<T> = {
        key: cacheKey,
        result,
        timestamp: Date.now(),
        ttlMs: ttlMs,
        hitCount: 0,
        executionTime,
      };

      this.memoCache.set(cacheKey, memoEntry);

      // Set TTL invalidation if specified
      if (ttlMs) {
        if (this.invalidationTimers.has(cacheKey)) {
          clearTimeout(this.invalidationTimers.get(cacheKey)!);
        }

        const timer = setTimeout(() => {
          this.memoCache.delete(cacheKey);
          this.invalidationTimers.delete(cacheKey);
        }, ttlMs);

        this.invalidationTimers.set(cacheKey, timer);
      }

      return result;
    } finally {
      this.concurrentCalls.delete(cacheKey);
    }
  }

  /**
   * Invalidate all memoized results for a function
   */
  invalidateFunction(functionId: string): number {
    let invalidated = 0;
    const prefix = `${functionId}:`;

    for (const [key] of this.memoCache) {
      if (key.startsWith(prefix)) {
        this.memoCache.delete(key);
        if (this.invalidationTimers.has(key)) {
          clearTimeout(this.invalidationTimers.get(key)!);
          this.invalidationTimers.delete(key);
        }
        invalidated++;
      }
    }

    const metadata = this.functionRegistry.get(functionId)?.metadata;
    if (metadata) {
      metadata.lastInvalidated = Date.now();
    }

    return invalidated;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateEntry(functionId: string, args: any[]): boolean {
    const cacheKey = this.keyGenerator(functionId, args);

    const deleted = this.memoCache.delete(cacheKey);
    if (this.invalidationTimers.has(cacheKey)) {
      clearTimeout(this.invalidationTimers.get(cacheKey)!);
      this.invalidationTimers.delete(cacheKey);
    }

    return deleted;
  }

  /**
   * Clear all memoization cache
   */
  clearCache(): void {
    for (const timer of this.invalidationTimers.values()) {
      clearTimeout(timer);
    }

    this.memoCache.clear();
    this.invalidationTimers.clear();
    this.concurrentCalls.clear();
  }

  /**
   * Get function metadata
   */
  getFunctionMetadata(functionId: string): MemoizedFunctionMetadata | null {
    return this.functionRegistry.get(functionId)?.metadata || null;
  }

  /**
   * Get all function metadata
   */
  getAllFunctionMetadata(): MemoizedFunctionMetadata[] {
    return Array.from(this.functionRegistry.values()).map((entry) => entry.metadata);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    registeredFunctions: number;
    cachedEntries: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    functionStats: MemoizedFunctionMetadata[];
  } {
    const metadata = this.getAllFunctionMetadata();

    const totalHits = metadata.reduce((sum, m) => sum + m.cacheHits, 0);
    const totalMisses = metadata.reduce((sum, m) => sum + m.cacheMisses, 0);
    const totalRequests = totalHits + totalMisses;

    return {
      registeredFunctions: this.functionRegistry.size,
      cachedEntries: this.memoCache.size,
      totalHits,
      totalMisses,
      overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      functionStats: metadata,
    };
  }

  /**
   * Shutdown engine
   */
  shutdown(): void {
    for (const timer of this.invalidationTimers.values()) {
      clearTimeout(timer);
    }

    this.functionRegistry.clear();
    this.memoCache.clear();
    this.invalidationTimers.clear();
    this.concurrentCalls.clear();
  }
}

// Export singleton
export const memoizationEngine = new MemoizationEngine();
