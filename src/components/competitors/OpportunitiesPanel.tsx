"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, TrendingUp } from "lucide-react";

interface DifferentiationOpportunity {
  area: string;
  recommendation: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

interface OpportunitiesPanelProps {
  opportunities: DifferentiationOpportunity[];
}

export default function OpportunitiesPanel({
  opportunities,
}: OpportunitiesPanelProps) {
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-purple-100 text-purple-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case "medium":
        return <Target className="w-4 h-4 text-blue-600" />;
      default:
        return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  // Sort by impact (high first), then by effort (low first)
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const effortOrder = { low: 0, medium: 1, high: 2 };

    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) {
return impactDiff;
}

    return effortOrder[a.effort] - effortOrder[b.effort];
  });

  // Identify quick wins (low effort, high impact)
  const quickWins = opportunities.filter(
    (opp) => opp.effort === "low" && opp.impact === "high"
  );

  return (
    <div className="space-y-6">
      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Wins
              </h3>
              <p className="text-sm text-gray-600">
                High impact, low effort opportunities
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {quickWins.map((opp, idx) => (
              <div
                key={idx}
                className="p-4 bg-white rounded-lg border border-purple-200"
              >
                <div className="flex items-start gap-3">
                  {getImpactIcon(opp.impact)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {opp.area}
                    </h4>
                    <p className="text-sm text-gray-700">{opp.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Differentiation Opportunities */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Differentiation Opportunities
            </h3>
            <p className="text-sm text-gray-600">
              Ways to stand out from competitors
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedOpportunities.map((opp, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getImpactIcon(opp.impact)}
                  <h4 className="font-semibold text-gray-900">{opp.area}</h4>
                </div>
                <div className="flex gap-2">
                  <Badge className={getEffortColor(opp.effort)}>
                    {opp.effort} effort
                  </Badge>
                  <Badge className={getImpactColor(opp.impact)}>
                    {opp.impact} impact
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-700">{opp.recommendation}</p>
            </div>
          ))}

          {opportunities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No opportunities identified yet.</p>
              <p className="text-sm">
                Run a competitor analysis to find ways to differentiate.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Effort vs Impact Matrix Explanation */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          How to prioritize:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <span className="font-medium">Quick Wins:</span> Low effort, high
            impact - start here
          </li>
          <li>
            <span className="font-medium">Strategic:</span> High effort, high
            impact - plan for these
          </li>
          <li>
            <span className="font-medium">Easy Wins:</span> Low effort, medium
            impact - do when possible
          </li>
          <li>
            <span className="font-medium">Low Priority:</span> High effort, low
            impact - avoid these
          </li>
        </ul>
      </Card>
    </div>
  );
}
