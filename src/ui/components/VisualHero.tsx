/**
 * VisualHero Component
 * Phase 38: Visual Orchestration Layer
 *
 * Display a hero visual with model badges and disclaimers
 */

"use client";

import React, { useState } from "react";
import { Play, AlertTriangle, RefreshCw, ImageOff } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface VisualHeroProps {
  imageUrl?: string;
  videoUrl?: string;
  alt: string;
  model: AIModel | string;
  disclaimer?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "21:9";
  onPlay?: () => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: boolean;
  className?: string;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "21:9": "aspect-[21/9]",
};

export function VisualHero({
  imageUrl,
  videoUrl,
  alt,
  model,
  disclaimer = "AI-generated concept - requires approval for use",
  aspectRatio = "16:9",
  onPlay,
  onRetry,
  loading = false,
  error = false,
  className = "",
}: VisualHeroProps) {
  const isVideo = !!videoUrl;
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Visual Content */}
      <div
        className={`
          relative bg-bg-hover
          ${aspectRatioClasses[aspectRatio]}
        `}
      >
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 bg-bg-hover animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}

        {/* Error state */}
        {(error || imgError) && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-hover">
            <ImageOff className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Failed to load</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-bg-input border rounded hover:bg-gray-50"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Image content */}
        {!loading && !error && !imgError && imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : !loading && !error && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-text-muted">
              {isVideo ? (
                <Play className="w-16 h-16" />
              ) : (
                <div className="w-16 h-16 bg-bg-hover rounded" />
              )}
            </div>
          </div>
        )}

        {/* Play button for video */}
        {isVideo && onPlay && (
          <button
            onClick={onPlay}
            className="
              absolute inset-0 flex items-center justify-center
              bg-black/0 hover:bg-black/30 transition-colors
            "
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </button>
        )}

        {/* Model Badge */}
        <div className="absolute top-3 right-3">
          <AIModelBadge model={model as AIModel} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-text-secondary">{disclaimer}</p>
      </div>
    </div>
  );
}

export default VisualHero;
