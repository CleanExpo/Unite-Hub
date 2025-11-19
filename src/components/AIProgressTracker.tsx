"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Check, Loader2 } from "lucide-react";

/**
 * AI Progress Tracker - Visual feedback for multi-tier AI operations
 *
 * Shows users:
 * - Current AI model being used (FREE/Budget/Premium)
 * - Processing stage
 * - Progress indication
 *
 * Prevents "dead UI" syndrome where users think nothing is happening
 */

export type ModelTier = "free" | "budget" | "premium";

export interface AIProgressStage {
  id: string;
  label: string;
  model?: string;
  tier?: ModelTier;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number; // 0-100
}

export interface AIProgressTrackerProps {
  stages: AIProgressStage[];
  currentStageIndex?: number;
  totalProgress?: number; // 0-100 overall progress
  onCancel?: () => void;
  compact?: boolean;
}

const tierConfig = {
  free: {
    icon: Zap,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "FREE Model",
    description: "Fast & cost-effective",
  },
  budget: {
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Budget Model",
    description: "Balanced performance",
  },
  premium: {
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    label: "Premium Model",
    description: "Advanced reasoning",
  },
};

export default function AIProgressTracker({
  stages,
  currentStageIndex = 0,
  totalProgress = 0,
  onCancel,
  compact = false,
}: AIProgressTrackerProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(totalProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [totalProgress]);

  const currentStage = stages[currentStageIndex];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {currentStage?.label || "Processing..."}
          </p>
          {currentStage?.model && (
            <p className="text-xs text-gray-400 truncate">
              {currentStage.model}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-400">{Math.round(totalProgress)}%</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-200">AI Processing</span>
          <span className="text-gray-400">{Math.round(animatedProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Current Stage Display */}
      <AnimatePresence mode="wait">
        {currentStage && (
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              currentStage.tier
                ? `${tierConfig[currentStage.tier].bg} ${tierConfig[currentStage.tier].border}`
                : "bg-gray-900/50 border-gray-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="mt-0.5">
                {currentStage.status === "processing" && (
                  <Loader2
                    className={`h-5 w-5 animate-spin ${
                      currentStage.tier
                        ? tierConfig[currentStage.tier].color
                        : "text-blue-500"
                    }`}
                  />
                )}
                {currentStage.status === "completed" && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
                {currentStage.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                )}
                {currentStage.status === "error" && (
                  <div className="h-5 w-5 rounded-full bg-red-500" />
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-200">
                    {currentStage.label}
                  </h3>
                  {currentStage.tier && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${tierConfig[currentStage.tier].bg} ${tierConfig[currentStage.tier].color}`}
                    >
                      {tierConfig[currentStage.tier].label}
                    </span>
                  )}
                </div>

                {currentStage.model && (
                  <p className="text-sm text-gray-400 mb-2">
                    Using: {currentStage.model}
                  </p>
                )}

                {currentStage.tier && (
                  <p className="text-xs text-gray-500">
                    {tierConfig[currentStage.tier].description}
                  </p>
                )}

                {/* Stage Progress Bar (if available) */}
                {currentStage.status === "processing" &&
                  currentStage.progress !== undefined && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            currentStage.tier
                              ? tierConfig[currentStage.tier].color.replace(
                                  "text",
                                  "bg"
                                )
                              : "bg-blue-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${currentStage.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage List (All stages) */}
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          const isPast = index < currentStageIndex;
          const isFuture = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-gray-800/50"
                  : isPast
                  ? "bg-gray-900/30"
                  : "bg-gray-900/10"
              }`}
            >
              {/* Mini Status Icon */}
              <div className="flex-shrink-0">
                {stage.status === "completed" && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {stage.status === "processing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {stage.status === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
                )}
                {stage.status === "error" && (
                  <div className="h-4 w-4 rounded-full bg-red-500" />
                )}
              </div>

              {/* Stage Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    isCurrent
                      ? "text-gray-200 font-medium"
                      : isPast
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {stage.label}
                </p>
              </div>

              {/* Tier Badge */}
              {stage.tier && (
                <div className="flex-shrink-0">
                  {React.createElement(tierConfig[stage.tier].icon, {
                    className: `h-4 w-4 ${tierConfig[stage.tier].color}`,
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Button (if provided) */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
