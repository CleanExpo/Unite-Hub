/**
 * VisualHero Component
 * Phase 38: Visual Orchestration Layer
 *
 * Display a hero visual with model badges and disclaimers
 */

"use client";

import React from "react";
import { Play, AlertTriangle } from "lucide-react";
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
  className = "",
}: VisualHeroProps) {
  const isVideo = !!videoUrl;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Visual Content */}
      <div
        className={`
          relative bg-gray-100 dark:bg-gray-800
          ${aspectRatioClasses[aspectRatio]}
        `}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-300 dark:text-gray-600">
              {isVideo ? (
                <Play className="w-16 h-16" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded" />
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
        <p className="text-xs text-gray-500 dark:text-gray-400">{disclaimer}</p>
      </div>
    </div>
  );
}

export default VisualHero;
