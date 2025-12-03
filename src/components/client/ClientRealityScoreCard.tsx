"use client";

/**
 * Client Reality Score Card
 * Phase 36: MVP Client Truth Layer
 *
 * Honest snapshot display - not a promise, just current state
 */

import { AlertCircle, TrendingUp, Globe, FileText, Zap } from "lucide-react";

interface RealityScoreCardProps {
  overallScore: number;
  subScores: {
    technicalHealth: number;
    contentDepth: number;
    localPresence: number;
    experimentationActivity: number;
  };
  explanation: string;
  dataPoints: number;
}

export default function ClientRealityScoreCard({
  overallScore,
  subScores,
  explanation,
  dataPoints,
}: RealityScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score < 30) return "text-red-600";
    if (score < 60) return "text-yellow-600";
    if (score < 80) return "text-blue-600";
    return "text-green-600";
  };

  const getBarColor = (score: number) => {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-yellow-500";
    if (score < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Reality Score
          </h3>
          <p className="text-xs text-text-secondary">
            Based on {dataPoints} data point{dataPoints !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </p>
          <p className="text-xs text-gray-400">/ 100</p>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {explanation}
      </p>

      {/* Sub-scores */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-text-secondary">
              <TrendingUp className="w-3 h-3" />
              Technical Health
            </span>
            <span className="text-text-primary">{subScores.technicalHealth}</span>
          </div>
          <div className="h-1.5 bg-bg-hover rounded-full">
            <div
              className={`h-full rounded-full ${getBarColor(subScores.technicalHealth)}`}
              style={{ width: `${subScores.technicalHealth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-text-secondary">
              <FileText className="w-3 h-3" />
              Content Depth
            </span>
            <span className="text-text-primary">{subScores.contentDepth}</span>
          </div>
          <div className="h-1.5 bg-bg-hover rounded-full">
            <div
              className={`h-full rounded-full ${getBarColor(subScores.contentDepth)}`}
              style={{ width: `${subScores.contentDepth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-text-secondary">
              <Globe className="w-3 h-3" />
              Local Presence
            </span>
            <span className="text-text-primary">{subScores.localPresence}</span>
          </div>
          <div className="h-1.5 bg-bg-hover rounded-full">
            <div
              className={`h-full rounded-full ${getBarColor(subScores.localPresence)}`}
              style={{ width: `${subScores.localPresence}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-text-secondary">
              <Zap className="w-3 h-3" />
              Activity
            </span>
            <span className="text-text-primary">{subScores.experimentationActivity}</span>
          </div>
          <div className="h-1.5 bg-bg-hover rounded-full">
            <div
              className={`h-full rounded-full ${getBarColor(subScores.experimentationActivity)}`}
              style={{ width: `${subScores.experimentationActivity}%` }}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-text-secondary">
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <p>
          This is a directional indicator based on available data. It reflects current state, not guaranteed outcomes.
        </p>
      </div>
    </div>
  );
}
