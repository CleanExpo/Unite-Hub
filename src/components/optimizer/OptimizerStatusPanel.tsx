'use client';

/**
 * OptimizerStatusPanel - Real-time execution optimizer status and metrics
 */

import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Zap, AlertCircle, RefreshCw } from 'lucide-react';

export interface OptimizerStatusData {
  status: {
    lastOptimizationTime: string | null;
    totalOptimizationsRun: number;
    activePatterns: number;
  };
  metrics: {
    avgEfficiencyGain: number;
    successRate: number;
    totalCostSaved: number;
    totalTimeSavedMs: number;
  };
  health: {
    optimizationHealth: string;
    reliabilityHealth: string;
    patternDetectionHealth: string;
  };
}

export interface OptimizerStatusPanelProps {
  data?: OptimizerStatusData;
  loading?: boolean;
  onRefresh?: () => void;
}

export const OptimizerStatusPanel: React.FC<OptimizerStatusPanelProps> = ({
  data,
  loading = false,
  onRefresh,
}) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent':
      case 'High':
      case 'Active':
        return 'text-green-600 dark:text-green-400';
      case 'Good':
      case 'Moderate':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getHealthBg = (health: string) => {
    switch (health) {
      case 'Excellent':
      case 'High':
      case 'Active':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'Good':
      case 'Moderate':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-red-50 dark:bg-red-900/20';
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle p-6 space-y-4">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-text-secondary">Loading optimizer status...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border-subtle p-6 text-center">
        <AlertCircle className="w-5 h-5 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No optimization data available</p>
      </div>
    );
  }

  const timeSavedMinutes = Math.round(data.metrics.totalTimeSavedMs / 1000 / 60);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-text-primary">Optimizer Status</h3>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Efficiency Gain */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Avg Efficiency Gain</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {data.metrics.avgEfficiencyGain.toFixed(1)}%
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Across {data.status.totalOptimizationsRun} optimizations
          </p>
        </div>

        {/* Success Rate */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Success Rate</span>
            <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {data.metrics.successRate.toFixed(1)}%
          </p>
          <p className="text-xs text-text-secondary mt-1">Optimization success</p>
        </div>

        {/* Cost Saved */}
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-secondary">Cost Saved</span>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            ${data.metrics.totalCostSaved.toFixed(2)}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {timeSavedMinutes} minutes saved
          </p>
        </div>
      </div>

      {/* Health Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-text-primary">System Health</h4>
        <div className="space-y-2">
          {/* Optimization Health */}
          <div className={`p-2 rounded-lg border ${getHealthBg(data.health.optimizationHealth)} border-current`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Optimization Health</span>
              <span className={`text-sm font-semibold ${getHealthColor(data.health.optimizationHealth)}`}>
                {data.health.optimizationHealth}
              </span>
            </div>
          </div>

          {/* Reliability Health */}
          <div className={`p-2 rounded-lg border ${getHealthBg(data.health.reliabilityHealth)} border-current`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Reliability</span>
              <span className={`text-sm font-semibold ${getHealthColor(data.health.reliabilityHealth)}`}>
                {data.health.reliabilityHealth}
              </span>
            </div>
          </div>

          {/* Pattern Detection Health */}
          <div className={`p-2 rounded-lg border ${getHealthBg(data.health.patternDetectionHealth)} border-current`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Pattern Detection</span>
              <span className={`text-sm font-semibold ${getHealthColor(data.health.patternDetectionHealth)}`}>
                {data.health.patternDetectionHealth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Optimization Time */}
      {data.status.lastOptimizationTime && (
        <div className="text-xs text-text-secondary pt-2 border-t border-border-subtle">
          Last optimization: {new Date(data.status.lastOptimizationTime).toLocaleString()}
        </div>
      )}
    </div>
  );
};
