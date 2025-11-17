'use client';

import { lazy, Suspense, ComponentType } from 'react';

/**
 * Lazy load component with loading fallback
 *
 * @example
 * ```tsx
 * const HeavyChart = lazyLoad(() => import('./HeavyChart'));
 * <HeavyChart />
 * ```
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Default loading fallback
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loading fallback for cards
 */
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white p-6">
      <div className="h-4 w-3/4 rounded bg-gray-200"></div>
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full rounded bg-gray-200"></div>
        <div className="h-3 w-5/6 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading fallback for tables
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-10 w-full rounded bg-gray-200"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-2 h-16 w-full rounded bg-gray-100"></div>
      ))}
    </div>
  );
}
