/**
 * VideoSkeleton Component
 * Phase 39: Visual QA & Stability
 *
 * Skeleton loader for videos with play button indicator
 */

import React from "react";
import { Play } from "lucide-react";

interface VideoSkeletonProps {
  aspectRatio?: "16:9" | "9:16" | "1:1";
  className?: string;
  showDuration?: boolean;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
};

export function VideoSkeleton({
  aspectRatio = "16:9",
  className = "",
  showDuration = true,
}: VideoSkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div
        className={`
          ${aspectRatioClasses[aspectRatio]}
          bg-gray-200 dark:bg-gray-700
          animate-pulse
        `}
      >
        {/* Center play button indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-400 dark:text-gray-500 ml-1" />
          </div>
        </div>

        {/* Duration badge skeleton */}
        {showDuration && (
          <div className="absolute bottom-2 right-2">
            <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        )}

        {/* Model badge skeleton */}
        <div className="absolute top-3 right-3">
          <div className="w-14 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
      </div>

      {/* Disclaimer skeleton */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

export default VideoSkeleton;
