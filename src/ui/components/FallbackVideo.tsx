/**
 * FallbackVideo Component
 * Phase 39: Visual QA & Stability
 *
 * Fallback display when video fails to load
 */

import React from "react";
import { VideoOff, RefreshCw, AlertTriangle } from "lucide-react";

interface FallbackVideoProps {
  message?: string;
  onRetry?: () => void;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  className?: string;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
};

export function FallbackVideo({
  message = "Video unavailable",
  onRetry,
  aspectRatio = "16:9",
  className = "",
}: FallbackVideoProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div
        className={`
          ${aspectRatioClasses[aspectRatio]}
          bg-gray-900 dark:bg-black
          border-2 border-dashed border-gray-600
          flex flex-col items-center justify-center
        `}
      >
        <VideoOff className="w-10 h-10 text-gray-500 mb-2" />
        <p className="text-sm text-gray-400 mb-3">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              flex items-center gap-2 px-3 py-1.5
              text-xs font-medium
              text-white
              bg-gray-700
              border border-gray-600
              rounded-md
              hover:bg-gray-600
              transition-colors
            "
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        <p className="text-xs text-text-secondary">
          Video generation may have failed or timed out
        </p>
      </div>
    </div>
  );
}

export default FallbackVideo;
