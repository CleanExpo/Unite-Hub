/**
 * Performance Utilities
 * Phase 10: Pre-Hard-Launch Performance Tuning
 *
 * Features:
 * - Request deduplication
 * - API response caching
 * - Component lazy loading helpers
 * - Memory-efficient data structures
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'Performance' });

// ============================================================================
// Request Deduplication
// ============================================================================

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
const REQUEST_DEDUP_WINDOW_MS = 100; // Dedupe requests within 100ms

/**
 * Deduplicate identical concurrent requests
 * Returns the same promise for duplicate requests made within the window
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = pendingRequests.get(key);

  // If there's a pending request within the window, reuse it
  if (existing && now - existing.timestamp < REQUEST_DEDUP_WINDOW_MS) {
    logger.debug('Deduplicating request', { key });
    return existing.promise as Promise<T>;
  }

  // Create new request
  const promise = fetcher().finally(() => {
    // Clean up after completion (with small delay to handle late duplicates)
    setTimeout(() => {
      const current = pendingRequests.get(key);
      if (current?.promise === promise) {
        pendingRequests.delete(key);
      }
    }, REQUEST_DEDUP_WINDOW_MS);
  });

  pendingRequests.set(key, { promise, timestamp: now });
  return promise;
}

// ============================================================================
// API Response Cache
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache: Map<string, CacheEntry<unknown>> = new Map();
const DEFAULT_CACHE_TTL_MS = 60000; // 1 minute
const MAX_CACHE_SIZE = 100;

/**
 * Get cached value or fetch and cache
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; forceRefresh?: boolean }
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_CACHE_TTL_MS;
  const now = Date.now();

  // Check cache
  if (!options?.forceRefresh) {
    const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (cached && now - cached.timestamp < cached.ttl) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }
  }

  // Fetch and cache
  const data = await deduplicatedFetch(key, fetcher);

  // Evict oldest if cache is full
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, { data, timestamp: now, ttl });
  return data;
}

/**
 * Invalidate cache entry or pattern
 */
export function invalidateCache(keyOrPattern: string | RegExp): number {
  let invalidated = 0;

  if (typeof keyOrPattern === 'string') {
    if (memoryCache.delete(keyOrPattern)) {
      invalidated++;
    }
  } else {
    for (const key of memoryCache.keys()) {
      if (keyOrPattern.test(key)) {
        memoryCache.delete(key);
        invalidated++;
      }
    }
  }

  logger.debug('Cache invalidated', { pattern: keyOrPattern.toString(), count: invalidated });
  return invalidated;
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear();
  logger.info('Cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
  oldestEntry: number | null;
} {
  const entries = Array.from(memoryCache.values());
  const oldest = entries.length > 0
    ? Math.min(...entries.map((e) => e.timestamp))
    : null;

  return {
    size: memoryCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0, // Would need tracking to calculate
    oldestEntry: oldest,
  };
}

// ============================================================================
// Lazy Loading Helpers
// ============================================================================

/**
 * Create a lazy-loaded component wrapper
 * Use with React.lazy() for optimal bundle splitting
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options?: { preload?: boolean }
): {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  // Can't use React here directly, but we return the import function for use with React.lazy
  const lazyImport = importFn;

  // Preload function for pre-fetching
  const preload = async () => {
    await lazyImport();
  };

  // Auto-preload if specified
  if (options?.preload && typeof window !== 'undefined') {
    // Preload after initial render
    requestIdleCallback(() => preload());
  }

  // Note: Actual React.lazy() call should be done in the component file
  // This returns the import function for use with React.lazy()
  return {
    Component: null as unknown as React.LazyExoticComponent<T>, // Placeholder
    preload,
  };
}

/**
 * Preload multiple components during idle time
 */
export function preloadComponents(
  importFns: Array<() => Promise<unknown>>
): void {
  if (typeof window === 'undefined') return;

  requestIdleCallback(() => {
    importFns.forEach((fn) => {
      fn().catch(() => {
        // Silently ignore preload failures
      });
    });
  });
}

// ============================================================================
// Debounce and Throttle
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

// ============================================================================
// Memory-Efficient Data Structures
// ============================================================================

/**
 * LRU Cache with size limit
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first entry)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

const performanceMarks: Map<string, PerformanceMark> = new Map();

/**
 * Start a performance measurement
 */
export function startMeasure(name: string): void {
  performanceMarks.set(name, {
    name,
    startTime: performance.now(),
  });
}

/**
 * End a performance measurement
 */
export function endMeasure(name: string): number | null {
  const mark = performanceMarks.get(name);
  if (!mark) return null;

  const duration = performance.now() - mark.startTime;
  mark.duration = duration;

  logger.debug('Performance measure', { name, duration: `${duration.toFixed(2)}ms` });
  return duration;
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  startMeasure(name);
  const result = await fn();
  const duration = endMeasure(name) || 0;
  return { result, duration };
}

/**
 * Get all performance marks
 */
export function getPerformanceMarks(): PerformanceMark[] {
  return Array.from(performanceMarks.values());
}

/**
 * Clear performance marks
 */
export function clearPerformanceMarks(): void {
  performanceMarks.clear();
}

// ============================================================================
// Image Optimization Helpers
// ============================================================================

/**
 * Generate optimized image URL with resize parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  // For Supabase storage URLs, add transformation parameters
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (options.width) params.set('width', String(options.width));
    if (options.height) params.set('height', String(options.height));
    if (options.quality) params.set('quality', String(options.quality));

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // For Unsplash URLs, use their API
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', String(options.width));
    if (options.height) params.set('h', String(options.height));
    if (options.quality) params.set('q', String(options.quality));
    params.set('auto', 'format');
    params.set('fit', 'crop');

    const baseUrl = url.split('?')[0];
    return `${baseUrl}?${params.toString()}`;
  }

  return url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

// ============================================================================
// Export all utilities
// ============================================================================

export const PerformanceUtils = {
  // Request deduplication
  deduplicatedFetch,

  // Caching
  cachedFetch,
  invalidateCache,
  clearCache,
  getCacheStats,

  // Lazy loading
  createLazyComponent,
  preloadComponents,

  // Debounce/throttle
  debounce,
  throttle,

  // Data structures
  LRUCache,

  // Performance monitoring
  startMeasure,
  endMeasure,
  measureAsync,
  getPerformanceMarks,
  clearPerformanceMarks,

  // Image optimization
  getOptimizedImageUrl,
  generateSrcSet,
};

export default PerformanceUtils;
