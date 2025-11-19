/**
 * Strategy Signoff Panel - Phase 8 Week 24
 *
 * UI for reviewing and approving SEO strategy recommendations.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  StrategyRecommendation,
  SignoffDecision,
} from "@/lib/seo/strategySignoff";

interface StrategySignoffPanelProps {
  recommendations: StrategyRecommendation[];
  onSignoff: (
    recommendationId: string,
    decision: SignoffDecision,
    notes: string
  ) => Promise<void>;
  loading?: boolean;
}

export default function StrategySignoffPanel({
  recommendations,
  onSignoff,
  loading = false,
}: StrategySignoffPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleSignoff = async (
    recommendationId: string,
    decision: SignoffDecision
  ) => {
    setSubmitting(recommendationId);
    try {
      await onSignoff(recommendationId, decision, notes[recommendationId] || "");
    } finally {
      setSubmitting(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "HIGH":
        return "text-red-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "LOW":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      technical: "🔧",
      content: "📝",
      keywords: "🔑",
      backlinks: "🔗",
      geo: "📍",
      competitors: "🏆",
    };
    return icons[category] || "📋";
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">All Recommendations Reviewed</p>
          <p className="text-sm text-gray-500 mt-1">
            No pending recommendations to review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Strategy Recommendations ({recommendations.length})
        </h2>
        <div className="text-sm text-gray-500">
          Review and approve each recommendation
        </div>
      </div>

      {recommendations.map((rec) => (
        <Card key={rec.recommendation_id} className="overflow-hidden">
          <CardHeader
            className="pb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() =>
              setExpandedId(
                expandedId === rec.recommendation_id ? null : rec.recommendation_id
              )
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                <div>
                  <CardTitle className="text-base">{rec.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                        rec.priority
                      )}`}
                    >
                      {rec.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      Effort:{" "}
                      <span className={getEffortColor(rec.effort_level)}>
                        {rec.effort_level}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {expandedId === rec.recommendation_id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </CardHeader>

          {expandedId === rec.recommendation_id && (
            <CardContent className="pt-0">
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rec.description}
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Expected Impact
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {rec.expected_impact}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Actions:</p>
                  <ul className="text-sm space-y-1">
                    {rec.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Metrics to Track:</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.metrics_to_track.map((metric, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optional):</label>
                  <Textarea
                    placeholder="Add any notes or modifications..."
                    value={notes[rec.recommendation_id] || ""}
                    onChange={(e) =>
                      setNotes({
                        ...notes,
                        [rec.recommendation_id]: e.target.value,
                      })
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSignoff(rec.recommendation_id, "APPROVED")}
                    disabled={loading || submitting === rec.recommendation_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSignoff(rec.recommendation_id, "MODIFIED")}
                    disabled={loading || submitting === rec.recommendation_id}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Modify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSignoff(rec.recommendation_id, "REJECTED")}
                    disabled={loading || submitting === rec.recommendation_id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
