'use client';

/**
 * AdaptationTimeline - Historical view of optimization profiles and adaptations
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ProfileHistoryItem {
  profileId: string;
  profileName: string;
  adaptationScore: number;
  resourceCostEstimate: number;
  resourceDurationEstimate: number;
  createdAt: string;
}

export interface AdaptationTimelineProps {
  history?: ProfileHistoryItem[];
  loading?: boolean;
}

export const AdaptationTimeline: React.FC<AdaptationTimelineProps> = ({
  history = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary">Profile History</h3>
        <div className="text-sm text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-text-primary">Profile History</h3>
        <div className="text-sm text-text-secondary">No profile history available</div>
      </div>
    );
  }

  const getScoreTrend = (current: number, previous?: number) => {
    if (!previous) {
return null;
}
    if (current > previous) {
return 'up';
}
    if (current < previous) {
return 'down';
}
    return 'stable';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-text-secondary" />
        <h3 className="font-semibold text-text-primary">Profile History</h3>
      </div>

      <div className="space-y-2">
        {history.map((item, index) => {
          const previousItem = history[index + 1];
          const trend = getScoreTrend(item.adaptationScore, previousItem?.adaptationScore);
          const scoreDiff = previousItem ? item.adaptationScore - previousItem.adaptationScore : 0;

          return (
            <div
              key={item.profileId}
              className="border border-border-subtle rounded-lg p-3 hover:bg-bg-hover/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400" />
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>

                  {/* Profile info */}
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {item.profileName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Trend indicator */}
                {trend && (
                  <div className="flex items-center gap-1">
                    {trend === 'up' && (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          +{scoreDiff.toFixed(1)}
                        </span>
                      </>
                    )}
                    {trend === 'down' && (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {scoreDiff.toFixed(1)}
                        </span>
                      </>
                    )}
                    {trend === 'stable' && (
                      <>
                        <Minus className="w-4 h-4 text-text-secondary" />
                        <span className="text-xs font-semibold text-text-secondary">
                          No change
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 ml-7 text-xs">
                <div className="p-2 bg-bg-raised rounded">
                  <p className="text-text-secondary">Score</p>
                  <p className="font-semibold text-text-primary">
                    {item.adaptationScore}
                  </p>
                </div>
                <div className="p-2 bg-bg-raised rounded">
                  <p className="text-text-secondary">Cost Est.</p>
                  <p className="font-semibold text-text-primary">
                    ${item.resourceCostEstimate.toFixed(4)}
                  </p>
                </div>
                <div className="p-2 bg-bg-raised rounded">
                  <p className="text-text-secondary">Duration</p>
                  <p className="font-semibold text-text-primary">
                    {Math.round(item.resourceDurationEstimate)}ms
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
