'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  Award,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoricalStrategy } from '@/lib/strategy';
import {
  formatOutcomeColor,
  formatCompletionRate,
  formatEfficiencyScore,
  formatTimestamp,
  getPatternColor,
} from '@/lib/strategy/strategyClient';

interface StrategyHistoryTimelineProps {
  strategies: HistoricalStrategy[];
  patterns: Array<{
    name: string;
    type: string;
    frequency: number;
    successRate: number;
    efficacy: number;
  }>;
  isLoading?: boolean;
}

export function StrategyHistoryTimeline({
  strategies,
  patterns,
  isLoading = false,
}: StrategyHistoryTimelineProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'successful' | 'partial_success' | 'failed'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'recent' | 'completion' | 'efficiency'>('recent');

  const filteredStrategies = useMemo(() => {
    let filtered = strategies;

    if (filterOutcome !== 'all') {
      filtered = filtered.filter((s) => s.outcome === filterOutcome);
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
    } else if (sortBy === 'completion') {
      sorted.sort((a, b) => b.completionRate - a.completionRate);
    } else if (sortBy === 'efficiency') {
      sorted.sort((a, b) => (b.timeEfficiency + b.costEfficiency) / 2 - (a.timeEfficiency + a.costEfficiency) / 2);
    }

    return sorted;
  }, [strategies, filterOutcome, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No History Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Completed strategies will appear here for review and learning.
        </p>
      </div>
    );
  }

  const getOutcomeColor = (outcome: 'successful' | 'partial_success' | 'failed') => {
    const colors = {
      successful: { color: '#10b981', bg: '#d1fae5', icon: '✓', label: 'Successful' },
      partial_success: { color: '#f59e0b', bg: '#fef3c7', icon: '~', label: 'Partial Success' },
      failed: { color: '#ef4444', bg: '#fee2e2', icon: '✕', label: 'Failed' },
    };
    return colors[outcome];
  };

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
            Filter by Outcome
          </label>
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Outcomes</option>
            <option value="successful">Successful</option>
            <option value="partial_success">Partial Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="completion">Highest Completion</option>
            <option value="efficiency">Best Efficiency</option>
          </select>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
          <div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Showing {filteredStrategies.length}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              of {strategies.length} strategies
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredStrategies.map((strategy, idx) => {
          const outcome = getOutcomeColor(strategy.outcome);
          const completion = formatCompletionRate(strategy.completionRate);
          const timeEff = formatEfficiencyScore(strategy.timeEfficiency, 'time');
          const costEff = formatEfficiencyScore(strategy.costEfficiency, 'cost');
          const isExpanded = expandedStrategy === strategy.id;

          return (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Timeline Item Header */}
              <button
                onClick={() =>
                  setExpandedStrategy(isExpanded ? null : strategy.id)
                }
                className="w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Timeline Dot and Line */}
                <div className="flex flex-col items-center gap-2 mt-1 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: outcome.color }}
                  >
                    {outcome.icon}
                  </div>
                  {idx < filteredStrategies.length - 1 && (
                    <div
                      className="w-1 h-8"
                      style={{
                        backgroundColor: outcome.color,
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Strategy {strategy.id.slice(0, 8)}
                    </h3>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        backgroundColor: outcome.bg,
                        color: outcome.color,
                      }}
                    >
                      {outcome.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Completion</div>
                      <div
                        className="font-semibold"
                        style={{ color: completion.color }}
                      >
                        {completion.formatted}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Time Efficiency</div>
                      <div
                        className="font-semibold"
                        style={{ color: timeEff.color }}
                      >
                        {timeEff.formatted}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs">Cost Efficiency</div>
                      <div
                        className="font-semibold"
                        style={{ color: costEff.color }}
                      >
                        {costEff.formatted}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Archived {formatTimestamp(strategy.archivedAt)}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
                  >
                    <div className="p-6 space-y-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">
                            Completion Rate
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div
                                className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${strategy.completionRate}%` }}
                                  transition={{ delay: 0.2, duration: 0.6 }}
                                  className="h-full"
                                  style={{
                                    backgroundColor: completion.color,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {strategy.completionRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">
                            Efficiency Score
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div
                                className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${((strategy.timeEfficiency + strategy.costEfficiency) / 2).toFixed(0)}%`,
                                  }}
                                  transition={{ delay: 0.2, duration: 0.6 }}
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                />
                              </div>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {(
                                (strategy.timeEfficiency + strategy.costEfficiency) /
                                2
                              ).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Patterns */}
                      {strategy.patterns && strategy.patterns.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            Detected Patterns
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {strategy.patterns.map((pattern, pidx) => {
                              const patternInfo = getPatternColor(pattern);
                              return (
                                <span
                                  key={pidx}
                                  className="text-xs font-medium px-3 py-1 rounded-full"
                                  style={{
                                    backgroundColor: patternInfo.backgroundColor,
                                    color: patternInfo.color,
                                  }}
                                >
                                  {patternInfo.icon} {pattern.replace(/_/g, ' ')}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Patterns Summary */}
      {patterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Pattern Library ({patterns.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pattern, idx) => {
              const patternInfo = getPatternColor(pattern.type);

              return (
                <motion.div
                  key={pattern.type}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor:
                      patternInfo.backgroundColor + '30',
                    borderColor: patternInfo.borderColor,
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-lg">{patternInfo.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {pattern.type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pattern.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frequency</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {pattern.frequency}x
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {pattern.successRate.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Efficacy</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {pattern.efficacy.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
