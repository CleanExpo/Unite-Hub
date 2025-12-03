'use client';

/**
 * AlignmentIndicator - System alignment and readiness indicator
 */

import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';

export interface AlignmentIndicatorProps {
  overallConfidence: number;
  systemHealthScore: number;
  issuesDetected: number;
  lastCalibration?: string;
}

export const AlignmentIndicator: React.FC<AlignmentIndicatorProps> = ({
  overallConfidence = 0,
  systemHealthScore = 0,
  issuesDetected = 0,
  lastCalibration,
}) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Optimal';
    if (score >= 60) return 'Acceptable';
    return 'Needs Attention';
  };

  return (
    <div className={`rounded-lg border p-4 ${getHealthBg(systemHealthScore)} space-y-4`}>
      <div className="flex items-center gap-2">
        <Activity className={`w-5 h-5 ${getHealthColor(systemHealthScore)}`} />
        <h3 className="font-semibold text-text-primary">System Alignment</h3>
      </div>

      {/* Health Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">
            System Health
          </span>
          <span className={`text-2xl font-bold ${getHealthColor(systemHealthScore)}`}>
            {systemHealthScore}/100
          </span>
        </div>
        <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              systemHealthScore >= 80
                ? 'bg-green-600'
                : systemHealthScore >= 60
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${systemHealthScore}%` }}
          />
        </div>
        <p className={`text-xs font-medium ${getHealthColor(systemHealthScore)}`}>
          {getHealthLabel(systemHealthScore)}
        </p>
      </div>

      {/* Confidence Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">
            Calibration Confidence
          </span>
          <span className="text-lg font-bold text-text-primary">
            {overallConfidence}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${overallConfidence}%` }}
          />
        </div>
      </div>

      {/* Issues Indicator */}
      {issuesDetected > 0 && (
        <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded">
          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <span className="text-xs font-medium text-text-secondary">
            {issuesDetected} issue{issuesDetected !== 1 ? 's' : ''} detected
          </span>
        </div>
      )}

      {/* Last Calibration */}
      {lastCalibration && (
        <div className="text-xs text-text-secondary pt-2 border-t border-border-base/50">
          Last calibration: {new Date(lastCalibration).toLocaleString()}
        </div>
      )}
    </div>
  );
};
