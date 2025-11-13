"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Users } from "lucide-react";

interface CompetitorMetricsProps {
  totalCompetitors: number;
  directCompetitors: number;
  indirectCompetitors: number;
  potentialCompetitors: number;
  lastAnalysisDate?: number;
  marketGapsCount: number;
  opportunitiesCount: number;
}

export default function CompetitorMetrics({
  totalCompetitors,
  directCompetitors,
  indirectCompetitors,
  potentialCompetitors,
  lastAnalysisDate,
  marketGapsCount,
  opportunitiesCount,
}: CompetitorMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Competitors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {totalCompetitors}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              <span className="text-red-600">{directCompetitors} direct</span>
              <span className="text-yellow-600">{indirectCompetitors} indirect</span>
              <span className="text-blue-600">{potentialCompetitors} potential</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Market Gaps</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {marketGapsCount}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Opportunities identified
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Opportunities</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {opportunitiesCount}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ways to differentiate
            </p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Last Analysis</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {lastAnalysisDate
                ? new Date(lastAnalysisDate).toLocaleDateString()
                : "Never"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {lastAnalysisDate
                ? `${Math.floor((Date.now() - lastAnalysisDate) / (1000 * 60 * 60 * 24))} days ago`
                : "Run your first analysis"}
            </p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
