"use client";

import React from "react";
import AIProgressTracker from "../AIProgressTracker";
import { useAIProgress, getModelTier } from "@/hooks/useAIProgress";
import { routeToModel } from "@/lib/agents/model-router";

/**
 * Example: Multi-tier AI processing with visual progress
 *
 * This demonstrates the user's requirement:
 * "Use lower cost for heavy lifting, bring in dynamic models for deep reasoning"
 *
 * Flow:
 * 1. FREE model: Analyze contact data (fast, $0 cost)
 * 2. FREE model: Extract key insights (fast, $0 cost)
 * 3. Budget model: Generate initial content (balanced)
 * 4. Premium model: Refine & validate content (high quality)
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
      id: "analyze",
      label: "Analyzing contact data",
      tier: "free",
    },
    {
      id: "extract",
      label: "Extracting key insights",
      tier: "free",
    },
    {
      id: "generate",
      label: "Generating personalized content",
      tier: "budget",
    },
    {
      id: "refine",
      label: "Refining with advanced reasoning",
      tier: "premium",
    },
  ]);

  const runAnalysis = async () => {
    try {
      // Stage 1: Analyze contact (FREE - Sherlock Dash)
      progress.start("analyze", "sherlock-dash-alpha");
      const analysisResult = await routeToModel({
        task: "contact_scoring",
        prompt: `Analyze this contact: ${contactId}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 2: Extract insights (FREE - Sherlock Dash)
      progress.start("extract", "sherlock-dash-alpha");
      const insightsResult = await routeToModel({
        task: "extract_intent",
        prompt: `Extract key insights from: ${analysisResult.response}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 3: Generate content (Budget - Gemini 2.0 or DeepSeek)
      progress.start("generate", "gemini-2.0-flash");
      const contentResult = await routeToModel({
        task: "generate_persona",
        prompt: `Generate personalized content based on: ${insightsResult.response}`,
      });
      progress.updateProgress(100);
      progress.complete();
      progress.next();

      // Stage 4: Refine content (Premium - Claude Opus with Extended Thinking)
      progress.start("refine", "claude-opus-4");
      const refinedResult = await routeToModel({
        task: "generate_content",
        prompt: `Refine and validate this content: ${contentResult.response}`,
        thinkingBudget: 5000, // Enable Extended Thinking for final validation
      });
      progress.updateProgress(100);
      progress.complete();

      if (onComplete) {
        onComplete(refinedResult);
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
