"use client";

import { useState, useCallback } from "react";
import { AIProgressStage, ModelTier } from "@/components/AIProgressTracker";

/**
 * Hook for managing AI progress state
 *
 * Usage:
 * ```typescript
 * const progress = useAIProgress([
 *   { id: "analyze", label: "Analyzing contact", tier: "free" },
 *   { id: "generate", label: "Generating content", tier: "premium" },
 * ]);
 *
 * progress.start("analyze", "sherlock-dash-alpha");
 * progress.updateProgress(50);
 * progress.complete();
 * progress.next();
 * ```
 */

export function useAIProgress(initialStages: Omit<AIProgressStage, "status">[]) {
  const [stages, setStages] = useState<AIProgressStage[]>(
    initialStages.map((stage) => ({ ...stage, status: "pending" as const }))
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  /**
   * Start a specific stage
   */
  const start = useCallback(
    (stageId: string, model?: string) => {
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId
            ? { ...stage, status: "processing" as const, model, progress: 0 }
            : stage
        )
      );

      // Update current stage index
      const index = stages.findIndex((s) => s.id === stageId);
      if (index !== -1) {
        setCurrentStageIndex(index);
      }
    },
    [stages]
  );

  /**
   * Update progress of current stage
   */
  const updateProgress = useCallback((progress: number) => {
    setStages((prev) =>
      prev.map((stage, index) =>
        index === currentStageIndex ? { ...stage, progress } : stage
      )
    );

    // Update total progress (weighted by number of stages)
    setTotalProgress((prevTotal) => {
      const stageWeight = 100 / stages.length;
      const completedStages = currentStageIndex;
      const currentStageProgress = progress;
      return (
        completedStages * stageWeight + (currentStageProgress / 100) * stageWeight
      );
    });
  }, [currentStageIndex, stages.length]);

  /**
   * Complete current stage
   */
  const complete = useCallback(() => {
    setStages((prev) =>
      prev.map((stage, index) =>
        index === currentStageIndex
          ? { ...stage, status: "completed" as const, progress: 100 }
          : stage
      )
    );

    updateProgress(100);
  }, [currentStageIndex, updateProgress]);

  /**
   * Mark current stage as error
   */
  const error = useCallback((errorMessage?: string) => {
    setStages((prev) =>
      prev.map((stage, index) =>
        index === currentStageIndex
          ? { ...stage, status: "error" as const, label: errorMessage || stage.label }
          : stage
      )
    );
  }, [currentStageIndex]);

  /**
   * Move to next stage
   */
  const next = useCallback(() => {
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    }
  }, [currentStageIndex, stages.length]);

  /**
   * Move to specific stage
   */
  const goToStage = useCallback((stageId: string) => {
    const index = stages.findIndex((s) => s.id === stageId);
    if (index !== -1) {
      setCurrentStageIndex(index);
    }
  }, [stages]);

  /**
   * Reset all stages
   */
  const reset = useCallback(() => {
    setStages((prev) =>
      prev.map((stage) => ({ ...stage, status: "pending" as const, progress: 0 }))
    );
    setCurrentStageIndex(0);
    setTotalProgress(0);
  }, []);

  /**
   * Check if all stages are completed
   */
  const isComplete = stages.every((stage) => stage.status === "completed");

  /**
   * Check if any stage has error
   */
  const hasError = stages.some((stage) => stage.status === "error");

  return {
    stages,
    currentStageIndex,
    totalProgress,
    currentStage: stages[currentStageIndex],
    isComplete,
    hasError,
    start,
    updateProgress,
    complete,
    error,
    next,
    goToStage,
    reset,
  };
}

/**
 * Helper to determine model tier from model name
 */
export function getModelTier(modelName: string): ModelTier {
  const freeModels = [
    "sherlock-think-alpha",
    "sherlock-dash-alpha",
    "kat-coder-pro-free",
    "gemma-3n-e2b-it-free",
    "mai-ds-r1-free",
  ];

  const premiumModels = [
    "claude-opus-4",
    "claude-sonnet-4.5",
    "gemini-3.0-pro",
  ];

  if (freeModels.some((m) => modelName.includes(m))) {
    return "free";
  }

  if (premiumModels.some((m) => modelName.includes(m))) {
    return "premium";
  }

  return "budget";
}
