/**
 * Performance Hooks
 * Phase 10: React hooks for performance optimization
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  cachedFetch,
  invalidateCache,
  debounce,
  throttle,
  measureAsync,
} from '@/lib/performance/performance-utils';

// ============================================================================
// useCachedFetch - Cached data fetching with SWR-like behavior
// ============================================================================

interface UseCachedFetchOptions<T> {
  ttl?: number;
  initialData?: T;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseCachedFetchResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseCachedFetchOptions<T>
): UseCachedFetchResult<T> {
  const { ttl, initialData, onError, enabled = true } = options || {};

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) {
return;
}

    setIsLoading(true);
    setError(null);

    try {
      const result = await cachedFetch(key, fetcher, { ttl });
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, enabled, ttl, fetcher, onError]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await cachedFetch(key, fetcher, { ttl, forceRefresh: true });
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl]);

  const invalidate = useCallback(() => {
    invalidateCache(key);
  }, [key]);

  return { data, isLoading, error, refetch, invalidate };
}

// ============================================================================
// useDebounce - Debounced value
// ============================================================================

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// ============================================================================
// useDebouncedCallback - Debounced function
// ============================================================================

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delayMs: number
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useMemo(
    () => debounce((...args: unknown[]) => callbackRef.current(...args), delayMs),
    [delayMs]
  );

  return debouncedFn as T;
}

// ============================================================================
// useThrottledCallback - Throttled function
// ============================================================================

export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limitMs: number
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useMemo(
    () => throttle((...args: unknown[]) => callbackRef.current(...args), limitMs),
    [limitMs]
  );

  return throttledFn as T;
}

// ============================================================================
// usePerformanceMeasure - Measure component render time
// ============================================================================

interface PerformanceMeasureResult {
  duration: number | null;
  startMeasure: () => void;
  endMeasure: () => number | null;
}

export function usePerformanceMeasure(name: string): PerformanceMeasureResult {
  const [duration, setDuration] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (startTimeRef.current === null) {
return null;
}

    const dur = performance.now() - startTimeRef.current;
    setDuration(dur);
    startTimeRef.current = null;

    console.debug(`[Performance] ${name}: ${dur.toFixed(2)}ms`);
    return dur;
  }, [name]);

  return { duration, startMeasure, endMeasure };
}

// ============================================================================
// useAsyncMeasure - Measure async operation
// ============================================================================

export function useAsyncMeasure<T>(
  name: string,
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): {
  data: T | null;
  isLoading: boolean;
  duration: number | null;
  execute: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    try {
      const { result, duration: dur } = await measureAsync(name, asyncFn);
      setData(result);
      setDuration(dur);
    } finally {
      setIsLoading(false);
    }
  }, [name, asyncFn, ...deps]);

  return { data, isLoading, duration, execute };
}

// ============================================================================
// useIntersectionObserver - Lazy load on visibility
// ============================================================================

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options?: UseIntersectionObserverOptions
): {
  ref: React.RefCallback<Element>;
  isIntersecting: boolean;
} {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options || {};
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        elementRef.current = node;

        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            setIsIntersecting(entry.isIntersecting);

            if (entry.isIntersecting && triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          },
          { threshold, rootMargin }
        );

        observerRef.current.observe(node);
      }
    },
    [threshold, rootMargin, triggerOnce]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isIntersecting };
}

// ============================================================================
// useIdleCallback - Execute during idle time
// ============================================================================

export function useIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(callback, options?.timeout ?? 1);
      return () => clearTimeout(timeoutId);
    }

    const idleCallbackId = requestIdleCallback(callback, options);
    return () => cancelIdleCallback(idleCallbackId);
  }, [callback, options]);
}

// ============================================================================
// usePrevious - Get previous value
// ============================================================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// Export all hooks
// ============================================================================

export const PerformanceHooks = {
  useCachedFetch,
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMeasure,
  useAsyncMeasure,
  useIntersectionObserver,
  useIdleCallback,
  usePrevious,
};

export default PerformanceHooks;
