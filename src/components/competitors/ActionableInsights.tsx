"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";

interface ActionableInsight {
  insight: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface ActionableInsightsProps {
  insights: ActionableInsight[];
}

export default function ActionableInsights({
  insights,
}: ActionableInsightsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const highPriorityCount = insights.filter(
    (i) => i.priority === "high"
  ).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Actionable Insights
            </h3>
            <p className="text-sm text-gray-600">
              Specific actions to take based on analysis
            </p>
          </div>
        </div>

        {highPriorityCount > 0 && (
          <Badge className="bg-red-100 text-red-800">
            {highPriorityCount} high priority
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {sortedInsights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-2 ${
              insight.priority === "high"
                ? "bg-red-50 border-red-200"
                : insight.priority === "medium"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2">
                <Lightbulb
                  className={`w-5 h-5 mt-0.5 ${
                    insight.priority === "high"
                      ? "text-red-600"
                      : insight.priority === "medium"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    {insight.insight}
                  </p>
                </div>
              </div>
              <Badge className={getPriorityColor(insight.priority)}>
                {insight.priority}
              </Badge>
            </div>

            <div className="flex items-start gap-2 ml-7">
              <ArrowRight
                className={`w-4 h-4 mt-1 flex-shrink-0 ${
                  insight.priority === "high"
                    ? "text-red-600"
                    : insight.priority === "medium"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Recommended Action:
                </p>
                <p className="text-sm text-gray-900">{insight.action}</p>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No actionable insights yet.</p>
            <p className="text-sm">
              Run a competitor analysis to get specific recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {insights.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Next Steps:
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Focus on high priority actions first</li>
            <li>Assign owners and deadlines for each action</li>
            <li>Track progress and measure impact</li>
            <li>Re-run analysis quarterly to stay ahead</li>
          </ol>
        </div>
      )}
    </Card>
  );
}
