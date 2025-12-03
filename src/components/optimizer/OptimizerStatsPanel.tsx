'use client';

/**
 * OptimizerStatsPanel - Detailed statistics and pattern analysis
 */

import React from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

export interface OptimizationPattern {
  patternType: string;
  occurrences: number;
  avgEfficiencyGain: number;
  successRate: number;
  firstAppliedAt: string;
  lastAppliedAt: string;
}

export interface DailyMetric {
  day: string;
  optimizations: number;
  avgEfficiencyGain: number;
  successRate: number;
}

export interface OptimizerStatsPanelProps {
  patterns?: OptimizationPattern[];
  dailyTrends?: DailyMetric[];
  totalOptimizations?: number;
  loading?: boolean;
}

export const OptimizerStatsPanel: React.FC<OptimizerStatsPanelProps> = ({
  patterns = [],
  dailyTrends = [],
  totalOptimizations = 0,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary">Statistics & Patterns</h3>
        <div className="text-sm text-text-secondary">Loading stats...</div>
      </div>
    );
  }

  const getPatternIcon = (patternType: string) => {
    switch (patternType) {
      case 'duration_optimization':
        return '⏱️';
      case 'cost_optimization':
        return '💰';
      case 'general_optimization':
        return '⚙️';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-text-secondary" />
        <h3 className="font-semibold text-text-primary">Statistics & Patterns</h3>
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-bg-raised rounded-lg border border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">Total Optimizations</p>
            <p className="text-2xl font-bold text-text-primary">{totalOptimizations}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary">Patterns Detected</p>
            <p className="text-2xl font-bold text-text-primary">{patterns.length}</p>
          </div>
        </div>
      </div>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Detected Patterns</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {patterns.map((pattern) => (
              <div
                key={pattern.patternType}
                className="p-3 rounded-lg border border-border-subtle bg-bg-card hover:bg-bg-hover/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPatternIcon(pattern.patternType)}</span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary capitalize">
                        {pattern.patternType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Detected {pattern.occurrences} time{pattern.occurrences !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                      +{pattern.avgEfficiencyGain.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-secondary">
                      {(pattern.successRate * 100).toFixed(0)}% success
                    </p>
                  </div>
                </div>
                <div className="text-xs text-text-secondary space-y-0.5">
                  <p>First applied: {new Date(pattern.firstAppliedAt).toLocaleDateString()}</p>
                  <p>Last applied: {new Date(pattern.lastAppliedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Trends */}
      {dailyTrends.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-secondary" />
            <h4 className="text-sm font-medium text-text-primary">7-Day Trend</h4>
          </div>
          <div className="space-y-1.5">
            {dailyTrends.map((metric) => (
              <div key={metric.day} className="p-2 bg-bg-raised rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text-primary">{metric.day}</span>
                  <span className="text-text-secondary">{metric.optimizations} ops</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(metric.successRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-text-secondary">
                      {metric.successRate.toFixed(0)}% success
                    </p>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      +{metric.avgEfficiencyGain.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {patterns.length === 0 && dailyTrends.length === 0 && (
        <div className="text-center py-4 text-sm text-text-secondary">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          No pattern data available yet
        </div>
      )}
    </div>
  );
};
