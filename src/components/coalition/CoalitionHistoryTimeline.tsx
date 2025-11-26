'use client';

import React, { useState } from 'react';
import { useCoalitionStore } from '@/state/useCoalitionStore';
import {
  getOutcomeColor,
  formatSynergyScore,
  formatOutcome,
  formatTimestamp,
  getTimeElapsed,
  formatPercentage,
} from '@/lib/coalition/coalitionClient';
import { Badge } from '@/components/ui/badge';
import { History, Filter, ChevronDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface CoalitionHistoryTimelineProps {
  workspaceId: string;
}

type FilterType = 'all' | 'success' | 'partial' | 'failure';

export function CoalitionHistoryTimeline({ workspaceId }: CoalitionHistoryTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { historicalCoalitions, isLoadingHistory } = useCoalitionStore();

  const filteredCoalitions = historicalCoalitions.filter((coalition) => {
    if (filterType === 'all') return true;
    return coalition.outcome === filterType || (filterType === 'partial' && coalition.outcome === 'partial_success');
  });

  const toggleExpanded = (idx: number) => {
    setExpandedId(expandedId === idx ? null : idx);
  };

  if (isLoadingHistory) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold">Coalition History</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="text-sm px-3 py-1 rounded border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="partial">Partial Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredCoalitions.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {historicalCoalitions.length === 0
                ? 'No coalition history yet'
                : 'No coalitions match the selected filter'}
            </p>
          </div>
        ) : (
          filteredCoalitions.map((coalition, idx) => (
            <CoalitionTimelineEntry
              key={idx}
              coalition={coalition}
              isExpanded={expandedId === idx}
              onToggle={() => toggleExpanded(idx)}
            />
          ))
        )}
      </div>

      {/* Summary */}
      {filteredCoalitions.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {filteredCoalitions.length}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Avg Synergy</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatPercentage(
                  filteredCoalitions.reduce((sum, c) => sum + c.synergyScore, 0) /
                    filteredCoalitions.length
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatPercentage(
                  (filteredCoalitions.filter((c) => c.outcome === 'success').length /
                    filteredCoalitions.length) *
                    100
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Avg Agents</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {(
                  filteredCoalitions.reduce((sum, c) => sum + c.agentCount, 0) /
                  filteredCoalitions.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoalitionTimelineEntry({
  coalition,
  isExpanded,
  onToggle,
}: {
  coalition: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="pt-1 shrink-0">
              <OutcomeIcon outcome={coalition.outcome} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {coalition.taskId}
                </h4>
                <Badge className={getOutcomeColor(coalition.outcome)}>
                  {formatOutcome(coalition.outcome)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>{coalition.agentCount} agents</span>
                <span>•</span>
                <span>Synergy: {formatSynergyScore(coalition.synergyScore)}</span>
                <span>•</span>
                <span>{getTimeElapsed(coalition.completedAt)}</span>
              </div>
            </div>
          </div>

          <ChevronDown
            className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Task ID</p>
                <p className="font-medium text-gray-900 dark:text-white break-all">{coalition.taskId}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Completed</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatTimestamp(coalition.completedAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Synergy Score</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatSynergyScore(coalition.synergyScore)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Outcome</p>
                <Badge className={getOutcomeColor(coalition.outcome)}>
                  {formatOutcome(coalition.outcome)}
                </Badge>
              </div>
            </div>
            {coalition.patternType && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Detected Pattern</p>
                <Badge variant="outline">{coalition.patternType}</Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomeIcon({ outcome }: { outcome: string }) {
  switch (outcome) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    case 'partial_success':
      return <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case 'failure':
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    default:
      return <History className="h-5 w-5 text-gray-400" />;
  }
}
