'use client';

/**
 * SafetyPredictionPanel - Display top safety predictions
 *
 * Shows:
 * - Top 5 predictions with probability, confidence, and recommended actions
 * - Expandable detail view
 * - Affected agents list
 * - Color-coded priority indicators
 */

import React from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Zap } from 'lucide-react';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';

export const SafetyPredictionPanel: React.FC = () => {
  const {
    predictions,
    expandedPredictionId,
    expandPrediction,
    isLoading,
  } = useSafetyStore();

  if (isLoading && predictions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-text-secondary">Loading predictions...</p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
        <p className="text-sm font-medium text-green-900 dark:text-green-300">No active predictions</p>
        <p className="text-xs text-green-700 dark:text-green-400 mt-1">System operating normally</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-900 dark:bg-gray-900/30 dark:text-gray-300 border-border-base';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-text-primary flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Active Predictions ({predictions.length})
      </h3>

      {predictions.map((prediction) => {
        const isExpanded = expandedPredictionId === prediction.id;

        return (
          <div
            key={prediction.id}
            className="border border-border-subtle rounded-lg overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => expandPrediction(isExpanded ? null : prediction.id)}
              className="w-full p-4 bg-bg-card hover:bg-bg-hover flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getPriorityColor(prediction.priority)}`}>
                  {getPriorityIcon(prediction.priority)}
                  <span className="text-xs font-medium capitalize">{prediction.priority}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary capitalize">
                    {prediction.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {prediction.probability}% probability
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    {prediction.probability}%
                  </p>
                  <p className="text-xs text-text-secondary">
                    {prediction.confidence}% confidence
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Details */}
            {isExpanded && (
              <div className="border-t border-border-subtle bg-bg-raised p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-2">
                    Affected Agents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prediction.affectedAgents.length > 0 ? (
                      prediction.affectedAgents.map((agent) => (
                        <span
                          key={agent}
                          className="px-2 py-1 bg-bg-card text-xs font-medium text-text-secondary rounded border border-border-subtle"
                        >
                          {agent}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-secondary">System-wide</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase mb-2">
                    Recommended Action
                  </p>
                  <p className="text-sm text-text-secondary bg-bg-card p-2 rounded border border-border-subtle">
                    {prediction.recommendedAction}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-bg-card p-2 rounded">
                    <p className="text-text-secondary">Probability</p>
                    <p className="font-bold text-text-primary">{prediction.probability}%</p>
                  </div>
                  <div className="bg-bg-card p-2 rounded">
                    <p className="text-text-secondary">Confidence</p>
                    <p className="font-bold text-text-primary">{prediction.confidence}%</p>
                  </div>
                </div>

                <p className="text-xs text-text-secondary">
                  Detected {new Date(prediction.createdAt).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
