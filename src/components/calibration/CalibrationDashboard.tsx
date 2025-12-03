'use client';

/**
 * CalibrationDashboard - Global Autonomy Calibration Command Center
 *
 * Displays:
 * - Latest calibration cycle status
 * - System health trend
 * - Applied parameter adjustments
 * - Detected patterns
 * - Controls to run calibration cycles
 * - Parameter inspection
 * - Improvement metrics
 */

import React, { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export interface CalibrationDashboardProps {
  workspaceId: string;
  onRunCalibration?: () => Promise<void>;
  isLoading?: boolean;
}

export const CalibrationDashboard: React.FC<CalibrationDashboardProps> = ({
  workspaceId,
  onRunCalibration,
  isLoading = false,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [parameters, setParameters] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setError(null);
        const statusRes = await fetch(
          `/api/calibration/status?workspaceId=${workspaceId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        const paramsRes = await fetch(
          `/api/calibration/parameters?workspaceId=${workspaceId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (statusRes.ok && paramsRes.ok) {
          setStatus(await statusRes.json());
          setParameters(await paramsRes.json());
          setLastUpdate(new Date());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [workspaceId]);

  const handleRunCalibration = async () => {
    try {
      setError(null);
      setIsRunning(true);

      const response = await fetch(
        `/api/calibration/run?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Calibration cycle ${result.calibrationCycle.cycleNumber} completed!`);

        // Refresh status
        const statusRes = await fetch(
          `/api/calibration/status?workspaceId=${workspaceId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (statusRes.ok) {
          setStatus(await statusRes.json());
          setLastUpdate(new Date());
        }
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to run calibration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error running calibration');
    } finally {
      setIsRunning(false);
      if (onRunCalibration) {
        await onRunCalibration();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <h2 className="text-2xl font-bold text-text-primary">Calibration Dashboard</h2>
        <span className="ml-auto text-sm text-text-secondary">
          {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-900 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleRunCalibration}
          disabled={isRunning || isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Calibration Cycle
            </>
          )}
        </button>
      </div>

      {!status || !parameters ? (
        <div className="text-center py-8 text-text-secondary">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-spin" />
          Loading calibration data...
        </div>
      ) : (
        <>
          {/* System Improvement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Improvement */}
            <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Average Improvement
                </span>
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {status.systemImprovement?.averageImprovement || '0%'}
              </p>
              <p className="text-xs text-text-secondary">
                across {status.systemImprovement?.calibrationsCount || 0} calibrations
              </p>
            </div>

            {/* Confidence Score */}
            <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Avg Confidence
                </span>
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {status.systemImprovement?.averageConfidence || 0}%
              </p>
              <p className="text-xs text-text-secondary">
                adjustment confidence
              </p>
            </div>

            {/* Latest Cycle */}
            <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Latest Cycle
                </span>
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-text-primary">
                #{status.latestCycle?.cycleNumber || 0}
              </p>
              <p className="text-xs text-text-secondary">
                {status.latestCycle?.status || 'pending'}
              </p>
            </div>
          </div>

          {/* Current Parameters */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-4">
            <h3 className="font-semibold text-text-primary">Current Parameters</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Weights */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Agent Weights</p>
                <div className="space-y-1">
                  {parameters.currentParameters?.agentWeights &&
                    Object.entries(parameters.currentParameters.agentWeights).map(([agent, data]: [string, any]) => (
                      <div key={agent} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">
                          {agent.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-text-primary">
                          {data.value?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Risk Thresholds */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">Risk Thresholds</p>
                <div className="space-y-1">
                  {parameters.currentParameters?.riskThresholds &&
                    Object.entries(parameters.currentParameters.riskThresholds).map(([threshold, data]: [string, any]) => (
                      <div key={threshold} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">
                          {threshold.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-text-primary">
                          {data.value?.toFixed(0) || 'N/A'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detected Patterns */}
          {status.detectedPatterns && status.detectedPatterns.length > 0 && (
            <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-4">
              <h3 className="font-semibold text-text-primary">Detected Patterns</h3>
              <div className="space-y-2">
                {status.detectedPatterns.map((pattern: any, idx: number) => (
                  <div key={idx} className="p-3 bg-bg-raised rounded-lg">
                    <p className="text-sm font-medium text-text-primary">
                      {pattern.patternName.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Occurrences: {pattern.occurrences} | Confidence: {pattern.avgConfidence}% | Success: {pattern.successRate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health Trend */}
          {status.systemHealthTrend && status.systemHealthTrend.length > 0 && (
            <div className="bg-bg-card rounded-lg border border-border-subtle p-4 space-y-4">
              <h3 className="font-semibold text-text-primary">System Health Trend</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {status.systemHealthTrend.slice(0, 5).map((trend: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-bg-raised rounded">
                    <div>
                      <p className="font-medium text-text-primary">
                        Cycle {trend.cycleNumber}
                      </p>
                      <p className="text-text-secondary">
                        {trend.healthBefore} → {trend.healthAfter}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${trend.improvement > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {trend.improvement}
                      </p>
                      <p className="text-text-secondary">
                        {new Date(trend.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
