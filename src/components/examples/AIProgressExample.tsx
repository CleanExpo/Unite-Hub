"use client";

import React from "react";
import AIProgressTracker from "../AIProgressTracker";
import { useAIProgress, getModelTier } from "@/hooks/useAIProgress";
import { routeToModel } from "@/lib/agents/model-router";

/**
 * Example: Multi-tier AI processing with visual progress
 *
 * CRITICAL ARCHITECTURE RULE:
 * - FREE/Budget models = Preprocessing/heavy lifting ONLY
 * - Big 4 (Anthropic/ChatGPT/Perplexity/Gemini) = Final validation & execution
 * - NO function should be completed by FREE models without Big 4 validation
 *
 * Correct Flow:
 * 1. FREE model: Preprocess/summarize raw data (context reduction, $0 cost)
 * 2. FREE model: Extract raw insights (heavy lifting, $0 cost)
 * 3. BIG 4 (Gemini): Validate & refine insights (gatekeeper)
 * 4. BIG 4 (Claude): Final execution with Extended Thinking (premium quality)
 */

interface ContactAnalysisProps {
  contactId: string;
  onComplete?: (result: any) => void;
}

export default function ContactAnalysisExample({
  contactId,
  onComplete,
}: ContactAnalysisProps) {
  const progress = useAIProgress([
    {
      id: "preprocess",
      label: "Preprocessing contact data (FREE - context reduction)",
      tier: "free",
    },
    {
      id: "extract",
      label: "Extracting raw insights (FREE - heavy lifting)",
      tier: "free",
    },
    {
      id: "validate",
      label: "Validating insights (BIG 4 - Gemini gatekeeper)",
      tier: "budget",
    },
    {
      id: "execute",
      label: "Final execution (BIG 4 - Claude Opus)",
      tier: "premium",
    },
  ]);

  const runAnalysis = async () => {
    try {
      // Stage 1: Preprocess data (FREE - Sherlock Dash for context reduction)
      progress.start("preprocess", "sherlock-dash-alpha");
      const preprocessResult = await routeToModel({
        task: "preprocess_data", // Preprocessing task - FREE models allowed
        prompt: `Summarize and clean this contact data: ${contactId}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 2: Extract raw insights (FREE - Sherlock Think for heavy lifting)
      progress.start("extract", "sherlock-think-alpha");
      const rawInsights = await routeToModel({
        task: "extract_raw_data", // Preprocessing task - FREE models allowed
        prompt: `Extract all raw insights from: ${preprocessResult.response}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 3: Validate insights (BIG 4 - Gemini 2.0 Flash gatekeeper)
      progress.start("validate", "gemini-2.0-flash");
      const validatedInsights = await routeToModel({
        task: "contact_scoring", // FINAL EXECUTION - Big 4 required
        prompt: `Validate and score these insights: ${rawInsights.response}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 4: Final execution (BIG 4 - Claude Opus with Extended Thinking)
      progress.start("execute", "claude-opus-4");
      const finalResult = await routeToModel({
        task: "generate_content", // FINAL EXECUTION - Big 4 required
        prompt: `Generate final personalized content: ${validatedInsights.response}`,
        thinkingBudget: 5000, // Extended Thinking for premium quality
      });
      progress.updateProgress(100);
      progress.complete();

      if (onComplete) {
        onComplete(finalResult);
      }
    } catch (error) {
      progress.error(error instanceof Error ? error.message : "Analysis failed");
    }
  };

  return (
    <div className="space-y-4">
      <AIProgressTracker
        stages={progress.stages}
        currentStageIndex={progress.currentStageIndex}
        totalProgress={progress.totalProgress}
      />

      {!progress.isComplete && !progress.hasError && (
        <button
          onClick={runAnalysis}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Start Analysis
        </button>
      )}

      {progress.isComplete && (
        <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg text-green-400">
          ✓ Analysis complete! Content generated and refined.
        </div>
      )}

      {progress.hasError && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400">
          ✗ Analysis failed. Please try again.
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function CompactAIProgress({ stages, currentStageIndex, totalProgress }: any) {
  return (
    <AIProgressTracker
      stages={stages}
      currentStageIndex={currentStageIndex}
      totalProgress={totalProgress}
      compact
    />
  );
}

/**
 * Usage in your actual components:
 *
 * Example:
 * - In HotLeadsPanel.tsx or any AI-powered component
 * - Import useAIProgress hook and AIProgressTracker component
 * - Define stages with id, label, and tier
 * - Use progress.start(), progress.complete(), progress.next()
 * - Render AIProgressTracker component with progress state
 */
