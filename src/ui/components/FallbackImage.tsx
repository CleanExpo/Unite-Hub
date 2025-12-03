/**
 * FallbackImage Component
 * Phase 39: Visual QA & Stability
 *
 * Fallback display when image fails to load
 */

import React from "react";
import { ImageOff, RefreshCw, AlertTriangle } from "lucide-react";

interface FallbackImageProps {
  message?: string;
  onRetry?: () => void;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "21:9";
  className?: string;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "21:9": "aspect-[21/9]",
};

export function FallbackImage({
  message = "Image unavailable",
  onRetry,
  aspectRatio = "16:9",
  className = "",
}: FallbackImageProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div
        className={`
          ${aspectRatioClasses[aspectRatio]}
          bg-bg-hover
          border-2 border-dashed border-border-base
          flex flex-col items-center justify-center
        `}
      >
        <ImageOff className="w-10 h-10 text-text-muted mb-2" />
        <p className="text-sm text-text-secondary mb-3">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              flex items-center gap-2 px-3 py-1.5
              text-xs font-medium
              text-text-secondary
              bg-bg-input
              border border-border-base
              rounded-md
              hover:bg-gray-50 dark:hover:bg-gray-600
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
          Generation may have failed or timed out
        </p>
      </div>
    </div>
  );
}

export default FallbackImage;
