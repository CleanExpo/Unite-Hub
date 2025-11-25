'use client';

/**
 * CalibrationTimeline - Historical calibration cycles visualization
 */

import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';

export interface CalibrationTimelineProps {
  cycles: Array<{
    cycleNumber: number;
    timestamp: string;
    improvement: number;
    confidence: number;
    changeCount: number;
  }>;
}

export const CalibrationTimeline: React.FC<CalibrationTimelineProps> = ({ cycles = [] }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Calibration History</h3>
      </div>

      <div className="space-y-2">
        {cycles.map((cycle, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Cycle #{cycle.cycleNumber}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(cycle.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {cycle.improvement > 0 ? '+' : ''}{cycle.improvement.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {cycle.changeCount} changes, {cycle.confidence}% confidence
              </p>
            </div>
          </div>
        ))}
      </div>

      {cycles.length === 0 && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 py-4">
          No calibration cycles yet
        </p>
      )}
    </div>
  );
};
