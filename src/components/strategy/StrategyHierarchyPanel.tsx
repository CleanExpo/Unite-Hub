'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StrategyHierarchy } from '@/lib/strategy';
import {
  formatRiskLevel,
  getDecompositionRatio,
  formatEffortEstimate,
} from '@/lib/strategy/strategyClient';

interface StrategyItem {
  id: string;
  title: string;
  description: string;
  resourcesRequired?: string[];
  estimatedDuration?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
  owner?: string;
}

interface StrategyLevel {
  level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  items: StrategyItem[];
}

interface StrategyHierarchyPanelProps {
  hierarchy: StrategyHierarchy;
  isLoading?: boolean;
  onItemClick?: (item: StrategyItem, level: number) => void;
}

export function StrategyHierarchyPanel({
  hierarchy,
  isLoading = false,
  onItemClick,
}: StrategyHierarchyPanelProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const levels: StrategyLevel[] = [
    hierarchy.L1_Strategic_Objective,
    hierarchy.L2_Strategic_Pillars,
    hierarchy.L3_Strategic_Tactics,
    hierarchy.L4_Operational_Tasks,
  ];

  const decompositionRatio = useMemo(() => {
    return getDecompositionRatio(
      hierarchy.L2_Strategic_Pillars.items.length,
      hierarchy.L3_Strategic_Tactics.items.length,
      hierarchy.L4_Operational_Tasks.items.length
    );
  }, [hierarchy]);

  const totalEffort = useMemo(() => {
    const totalMinutes = levels.reduce((sum, level) => {
      return (
        sum +
        level.items.reduce((levelSum, item) => levelSum + (item.estimatedDuration || 0), 0)
      );
    }, 0);
    return formatEffortEstimate(totalMinutes / 60);
  }, [levels]);

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
      2: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
      3: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
      4: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    };
    return colors[level as keyof typeof colors];
  };

  const getLevelIcon = (level: number) => {
    const icons = {
      1: <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      2: <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      3: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      4: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
    };
    return icons[level as keyof typeof icons];
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3, 4].map((level) => (
          <div key={level} className="space-y-2">
            <div className="h-12 bg-bg-hover rounded-lg animate-pulse" />
            <div className="h-8 bg-bg-hover rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-lg border border-border-subtle p-4">
          <div className="text-sm text-text-secondary mb-1">Total Items</div>
          <div className="text-2xl font-bold text-text-primary">
            {levels.reduce((sum, level) => sum + level.items.length, 0)}
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border-subtle p-4">
          <div className="text-sm text-text-secondary mb-1">Total Effort</div>
          <div className="text-2xl font-bold text-text-primary">
            {totalEffort.formatted}
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border-subtle p-4">
          <div className="text-sm text-text-secondary mb-1">Hierarchy Score</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {hierarchy.hierarchyScore.toFixed(1)}%
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border-subtle p-4">
          <div className="text-sm text-text-secondary mb-1">Balance</div>
          <div className="text-2xl font-bold">
            {decompositionRatio.isWellBalanced ? (
              <span className="text-green-600 dark:text-green-400">✓ Good</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">⚠ Check</span>
            )}
          </div>
        </div>
      </div>

      {/* Balance Recommendations */}
      {decompositionRatio.recommendations.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Balance Recommendations
              </h3>
              <ul className="space-y-1">
                {decompositionRatio.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
                  >
                    <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Levels */}
      <div className="space-y-4">
        {levels.map((level) => (
          <motion.div
            key={level.level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: level.level * 0.05 }}
            className={`border rounded-lg overflow-hidden ${getLevelColor(level.level)}`}
          >
            {/* Level Header */}
            <button
              onClick={() => toggleLevel(level.level)}
              className="w-full px-6 py-4 flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex-shrink-0">{getLevelIcon(level.level)}</div>

              <div className="flex-1 text-left">
                <h3 className="font-semibold text-text-primary">
                  L{level.level}: {level.title}
                </h3>
                <p className="text-sm text-text-secondary">{level.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="inline-block bg-bg-input text-text-primary text-sm font-semibold px-3 py-1 rounded-full">
                  {level.items.length}
                </span>

                {expandedLevels.has(level.level) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Level Items */}
            <AnimatePresence>
              {expandedLevels.has(level.level) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-opacity-20 dark:border-opacity-20"
                >
                  <div className="p-4 space-y-3 bg-opacity-50 dark:bg-opacity-10">
                    {level.items.map((item, idx) => {
                      const risk = item.riskLevel ? formatRiskLevel(item.riskLevel) : null;
                      const isExpanded = expandedItems.has(item.id);

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Item Header */}
                          <button
                            onClick={() => {
                              toggleItem(item.id);
                              onItemClick?.(item, level.level);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-hover transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {item.dependencies && item.dependencies.length > 0 && (
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>

                            <div className="flex-1 text-left">
                              <h4 className="font-medium text-text-primary">
                                {item.title}
                              </h4>
                              <p className="text-xs text-text-secondary">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {risk && (
                                <div
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: risk.backgroundColor,
                                    color: risk.color,
                                  }}
                                >
                                  {risk.label}
                                </div>
                              )}

                              {(item.resourcesRequired || item.estimatedDuration) && (
                                <ChevronRight
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              )}
                            </div>
                          </button>

                          {/* Item Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="border-t border-border-subtle bg-bg-raised p-4 space-y-3"
                              >
                                {item.estimatedDuration && (
                                  <div>
                                    <div className="text-xs font-semibold text-text-secondary mb-1">
                                      Duration
                                    </div>
                                    <div className="text-sm text-text-primary">
                                      {(item.estimatedDuration / 60).toFixed(1)} hours
                                    </div>
                                  </div>
                                )}

                                {item.owner && (
                                  <div>
                                    <div className="text-xs font-semibold text-text-secondary mb-1">
                                      Owner
                                    </div>
                                    <div className="text-sm text-text-primary">
                                      {item.owner}
                                    </div>
                                  </div>
                                )}

                                {item.resourcesRequired && item.resourcesRequired.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-text-secondary mb-2">
                                      Resources Required
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {item.resourcesRequired.map((resource, ridx) => (
                                        <span
                                          key={ridx}
                                          className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded"
                                        >
                                          {resource}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {item.dependencies && item.dependencies.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-text-secondary mb-2">
                                      Dependencies
                                    </div>
                                    <div className="space-y-1">
                                      {item.dependencies.map((dep, didx) => (
                                        <div
                                          key={didx}
                                          className="text-xs text-text-secondary flex items-center gap-2"
                                        >
                                          <span className="text-amber-600 dark:text-amber-400">→</span>
                                          <span>{dep}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
