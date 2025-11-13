"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight } from "lucide-react";

interface MarketGap {
  gap: string;
  opportunity: string;
  priority: "high" | "medium" | "low";
}

interface MarketGapsPanelProps {
  marketGaps: MarketGap[];
}

export default function MarketGapsPanel({ marketGaps }: MarketGapsPanelProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sortedGaps = [...marketGaps].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Market Gaps</h3>
          <p className="text-sm text-gray-600">
            Opportunities your competitors are missing
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedGaps.map((gap, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <Badge className={getPriorityColor(gap.priority)}>
                {gap.priority} priority
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Market Gap:
                </p>
                <p className="text-sm text-gray-900">{gap.gap}</p>
              </div>

              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">
                    Your Opportunity:
                  </p>
                  <p className="text-sm text-gray-900">{gap.opportunity}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {marketGaps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No market gaps identified yet.</p>
            <p className="text-sm">Run a competitor analysis to find opportunities.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
