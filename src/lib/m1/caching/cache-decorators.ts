/**
 * M1 Cache Decorators
 *
 * Provides decorators and wrappers for caching function results.
 * Supports automatic cache key generation and invalidation.
 *
 * Phase 8: Advanced Caching & Performance Optimization
 */

import { cacheEngine } from "./cache-engine";

/**
 * Cache function result with automatic key generation
 */
export function cached(ttl: number = 5 * 60 * 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and args
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = cacheEngine.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cacheEngine.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Memoize function result
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number = 5 * 60 * 1000
): T {
  return ((...args: any[]) => {
    const cacheKey = `${fn.name}:${JSON.stringify(args)}`;

    const cached = cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cacheEngine.set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Memoize async function result
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 5 * 60 * 1000
): T {
  return (async (...args: any[]) => {
    const cacheKey = `${fn.name}:${JSON.stringify(args)}`;

    const cached = cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cacheEngine.set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern: RegExp | string): number {
  const regex = typeof pattern === "string" ? new RegExp(`^${pattern}`) : pattern;
  return cacheEngine.invalidatePattern(regex);
}

/**
 * Invalidate cache entries with a prefix
 */
export function invalidateCachePrefix(prefix: string): number {
  return cacheEngine.invalidatePrefix(prefix);
}

/**
 * Wrap a function with caching
 */
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: any[]) => string,
  ttl: number = 5 * 60 * 1000
): T {
  return ((...args: any[]) => {
    const cacheKey = keyGenerator
      ? keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;

    const cached = cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cacheEngine.set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Wrap an async function with caching
 */
export function withAsyncCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: any[]) => string,
  ttl: number = 5 * 60 * 1000
): T {
  return (async (...args: any[]) => {
    const cacheKey = keyGenerator
      ? keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;

    const cached = cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cacheEngine.set(cacheKey, result, ttl);

    return result;
  }) as T;
}

/**
 * Cache options for advanced control
 */
export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
  invalidateOn?: string[]; // Patterns to invalidate on update
}

/**
 * Advanced caching wrapper with options
 */
export function withAdvancedCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {}
): T {
  const ttl = options.ttl || 5 * 60 * 1000;

  return (async (...args: any[]) => {
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;

    const cached = cacheEngine.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cacheEngine.set(cacheKey, result, ttl);

    return result;
  }) as T;
}
