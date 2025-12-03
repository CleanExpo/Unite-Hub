/**
 * VisualSkeleton Component
 * Phase 39: Visual QA & Stability
 *
 * Skeleton loader for images to prevent layout shifts
 */

import React from "react";

interface VisualSkeletonProps {
  aspectRatio?: "16:9" | "4:3" | "1:1" | "21:9";
  className?: string;
  showBadge?: boolean;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "21:9": "aspect-[21/9]",
};

export function VisualSkeleton({
  aspectRatio = "16:9",
  className = "",
  showBadge = true,
}: VisualSkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div
        className={`
          ${aspectRatioClasses[aspectRatio]}
          bg-bg-hover
          animate-pulse
        `}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Badge skeleton */}
      {showBadge && (
        <div className="absolute top-3 right-3">
          <div className="w-16 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      )}

      {/* Disclaimer skeleton */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <div className="w-3 h-3 bg-bg-hover rounded animate-pulse" />
        <div className="h-3 bg-bg-hover rounded w-3/4 animate-pulse" />
      </div>
    </div>
  );
}

export function VisualSkeletonGrid({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <VisualSkeleton key={i} showBadge={false} />
      ))}
    </div>
  );
}

export default VisualSkeleton;
