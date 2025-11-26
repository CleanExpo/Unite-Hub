'use client';

import React, { useMemo } from 'react';
import { useCoalitionStore } from '@/state/useCoalitionStore';
import {
  formatSynergyScore,
  getSynergyColor,
  getSynergyStatusLabel,
  formatPercentage,
} from '@/lib/coalition/coalitionClient';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, Shield } from 'lucide-react';

export interface CoalitionSynergyPanelProps {
  workspaceId: string;
}

export function CoalitionSynergyPanel({ workspaceId }: CoalitionSynergyPanelProps) {
  const { activeCoalition, historicalCoalitions, isLoadingCoalition } = useCoalitionStore();

  // Calculate synergy trends
  const synergyTrend = useMemo(() => {
    if (historicalCoalitions.length < 2) return null;

    const recent = historicalCoalitions.slice(0, 10);
    const scores = recent.map((c) => c.synergyScore);

    const avgRecent = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgAll =
      historicalCoalitions.reduce((sum, c) => sum + c.synergyScore, 0) /
      historicalCoalitions.length;

    return {
      avgRecent,
      avgAll,
      trend: avgRecent >= avgAll ? 'up' : 'down',
      change: ((avgRecent - avgAll) / avgAll) * 100,
    };
  }, [historicalCoalitions]);

  if (isLoadingCoalition) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!activeCoalition) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center py-8">
          <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Synergy metrics will appear when a coalition forms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Synergy Score */}
      <div className={`rounded-lg p-6 ${getSynergyColor(activeCoalition.synergyScore)}`}>
        <p className="text-xs font-semibold opacity-75 mb-2">Current Synergy Score</p>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-4xl font-bold">{formatSynergyScore(activeCoalition.synergyScore)}</p>
            <p className="text-sm mt-2">{getSynergyStatusLabel(activeCoalition.synergyScore)}</p>
          </div>
          {synergyTrend && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                {synergyTrend.trend === 'up' ? '↑' : '↓'} {Math.abs(synergyTrend.change).toFixed(1)}%
              </p>
              <p className="text-xs opacity-75 mt-1">vs average</p>
            </div>
          )}
        </div>
      </div>

      {/* Safety Status */}
      {!activeCoalition.safetyApproved && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Safety Filter Applied
              </p>
              <p className="text-sm text-red-800 dark:text-red-200">
                {activeCoalition.safetyVetoes.length} agent
                {activeCoalition.safetyVetoes.length !== 1 ? 's' : ''} disqualified (risk ≥ 80%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Approved Badge */}
      {activeCoalition.safetyApproved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-semibold text-green-900 dark:text-green-100">Safety Approved</p>
          </div>
        </div>
      )}

      {/* Synergy Components */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Synergy Breakdown
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Capability Overlap (35%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Capability Overlap (35%)
              </label>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage((activeCoalition.synergyScore * 0.35).toFixed(1))}
              </span>
            </div>
            <Progress
              value={(activeCoalition.synergyScore * 0.35)}
              className="h-2"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              How well agents cover required capabilities
            </p>
          </div>

          {/* Skill Complement (25%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Skill Complement (25%)
              </label>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage((activeCoalition.synergyScore * 0.25).toFixed(1))}
              </span>
            </div>
            <Progress
              value={(activeCoalition.synergyScore * 0.25)}
              className="h-2"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              How well agents fill each other's knowledge gaps
            </p>
          </div>

          {/* Historical Success (20%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Historical Success (20%)
              </label>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage((activeCoalition.synergyScore * 0.2).toFixed(1))}
              </span>
            </div>
            <Progress
              value={(activeCoalition.synergyScore * 0.2)}
              className="h-2"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Past coalition success rates
            </p>
          </div>

          {/* Safety Profile (20%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Safety Profile (20%)
              </label>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatPercentage((activeCoalition.synergyScore * 0.2).toFixed(1))}
              </span>
            </div>
            <Progress
              value={(activeCoalition.synergyScore * 0.2)}
              className="h-2"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Agent risk levels (inverse of risk score)
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Outcome */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Estimated Success</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(activeCoalition.estimatedOutcome)}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            Predicted
          </Badge>
        </div>
      </div>

      {/* Trend Information */}
      {synergyTrend && (
        <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p>
            Recent average: <span className="font-semibold">{formatPercentage(synergyTrend.avgRecent)}</span>
            <br />
            Historical average: <span className="font-semibold">{formatPercentage(synergyTrend.avgAll)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
