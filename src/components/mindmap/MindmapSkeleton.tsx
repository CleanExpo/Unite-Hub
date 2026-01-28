/**
 * Loading skeleton for Mindmap Canvas
 * Displayed while ReactFlow is being dynamically loaded
 */

import { Skeleton } from "@/components/ui/skeleton";

export function MindmapSkeleton() {
  return (
    <div className="w-full h-full relative bg-gray-50 dark:bg-gray-900">
      {/* Canvas skeleton */}
      <div className="absolute inset-0">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Toolbar skeleton (top-right) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Controls skeleton (bottom-left) */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Stats panel skeleton (bottom-left above controls) */}
      <div className="absolute bottom-28 left-4 bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Node skeletons (scattered) */}
      <div className="absolute top-1/4 left-1/4">
        <Skeleton className="h-20 w-40 rounded-lg" />
      </div>
      <div className="absolute top-1/3 right-1/4">
        <Skeleton className="h-20 w-40 rounded-lg" />
      </div>
      <div className="absolute bottom-1/3 left-1/3">
        <Skeleton className="h-20 w-40 rounded-lg" />
      </div>
      <div className="absolute top-1/2 right-1/3">
        <Skeleton className="h-20 w-40 rounded-lg" />
      </div>

      {/* Loading text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading mindmap...
        </p>
      </div>
    </div>
  );
}
