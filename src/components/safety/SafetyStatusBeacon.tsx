'use client';

/**
 * SafetyStatusBeacon - Real-time safety status indicator
 *
 * Displays:
 * - Current safety level (green/yellow/orange/red)
 * - Overall risk score
 * - Live polling indicator
 * - Last update timestamp
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';

export const SafetyStatusBeacon: React.FC = () => {
  const {
    status,
    timestamp,
    isPolling,
    isLoading,
  } = useSafetyStore();

  if (!status) {
    return (
      <div className="flex items-center justify-center p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading safety status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status.level) {
      case 'green':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'orange':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'red':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    }
  };

  const getStatusIcon = () => {
    switch (status.level) {
      case 'green':
        return <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />;
      case 'yellow':
        return <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />;
      case 'orange':
        return <AlertOctagon className="w-8 h-8 text-orange-600 dark:text-orange-400" />;
      case 'red':
        return <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.level) {
      case 'green':
        return 'System Safe';
      case 'yellow':
        return 'Monitor Required';
      case 'orange':
        return 'Elevated Risk';
      case 'red':
        return 'Critical Alert';
    }
  };

  const lastUpdateMs = timestamp ? new Date(timestamp).getTime() : Date.now();
  const nowMs = Date.now();
  const secondsAgo = Math.floor((nowMs - lastUpdateMs) / 1000);

  let updateText = 'Just now';
  if (secondsAgo > 60) {
    const minutesAgo = Math.floor(secondsAgo / 60);
    updateText = `${minutesAgo}m ago`;
  } else if (secondsAgo > 0) {
    updateText = `${secondsAgo}s ago`;
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getStatusText()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Risk: <span className="font-medium">{status.overallRiskScore}%</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          {isPolling && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Live</span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Updated {updateText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">Cascade Risk</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {status.cascadeRiskScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">Deadlock Risk</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {status.deadlockRiskScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">Memory Corruption</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {status.memoryCorruptionScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">Orchestration</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {status.orchestrationComplexityScore}%
          </p>
        </div>
      </div>
    </div>
  );
};
