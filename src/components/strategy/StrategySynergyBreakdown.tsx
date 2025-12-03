'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { DecompositionMetrics } from '@/lib/strategy';
import { getDecompositionQualityColor } from '@/lib/strategy/strategyClient';

interface StrategySynergyBreakdownProps {
  metrics: DecompositionMetrics | null;
  isLoading?: boolean;
}

export function StrategySynergyBreakdown({
  metrics,
  isLoading = false,
}: StrategySynergyBreakdownProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-24 bg-bg-hover rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-bg-raised border border-border-subtle rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          No Metrics Available
        </h3>
        <p className="text-text-secondary">
          Generate or analyze a strategy to view decomposition metrics.
        </p>
      </div>
    );
  }

  const qualityColor = getDecompositionQualityColor(
    metrics.overall >= 85
      ? 'excellent'
      : metrics.overall >= 70
        ? 'good'
        : metrics.overall >= 50
          ? 'fair'
          : 'poor'
  );

  const metricsList = [
    {
      id: 'completeness',
      label: 'Completeness',
      value: metrics.completeness,
      description: 'All necessary components are included in the hierarchy',
      icon: '✓',
    },
    {
      id: 'balance',
      label: 'Balance',
      value: metrics.balance,
      description: 'Items are evenly distributed across levels (3-5 L2, 2-4 L3, 2-3 L4)',
      icon: '⚖',
    },
    {
      id: 'coherence',
      label: 'Coherence',
      value: metrics.coherence,
      description: 'Each level logically flows from the previous level',
      icon: '🔗',
    },
    {
      id: 'clarity',
      label: 'Clarity',
      value: metrics.clarity,
      description: 'Descriptions are clear and unambiguous',
      icon: '💡',
    },
  ];

  const getMetricColor = (value: number): string => {
    if (value >= 80) return '#10b981'; // Green
    if (value >= 60) return '#f59e0b'; // Amber
    if (value >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getMetricBgColor = (value: number): string => {
    if (value >= 80) return '#d1fae5'; // Green light
    if (value >= 60) return '#fef3c7'; // Amber light
    if (value >= 40) return '#fed7aa'; // Orange light
    return '#fee2e2'; // Red light
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center"
      >
        <div className="text-sm text-text-secondary mb-2">
          Overall Decomposition Quality
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.overall.toFixed(1)}%
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{
                color: qualityColor.color,
                backgroundColor: qualityColor.backgroundColor,
              }}
            >
              {qualityColor.icon} {qualityColor.label}
            </div>
          </div>
        </div>

        <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.overall}%` }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
          />
        </div>

        <div className="mt-4 text-xs text-text-secondary">
          {metrics.overall >= 85 ? (
            <span>⭐ Excellent decomposition structure</span>
          ) : metrics.overall >= 70 ? (
            <span>👍 Good structure with minor refinements possible</span>
          ) : metrics.overall >= 50 ? (
            <span>⚠️ Fair structure with room for improvement</span>
          ) : (
            <span>❌ Needs significant restructuring</span>
          )}
        </div>
      </motion.div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Quality Dimensions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricsList.map((metric, idx) => {
            const color = getMetricColor(metric.value);
            const bgColor = getMetricBgColor(metric.value);
            const isHovered = hoveredMetric === metric.id;

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredMetric(metric.id)}
                onMouseLeave={() => setHoveredMetric(null)}
                className="relative"
              >
                <div
                  className="rounded-lg p-5 bg-bg-card border border-border-subtle cursor-help transition-all hover:shadow-md"
                  style={
                    isHovered
                      ? {
                          borderColor: color,
                          boxShadow: `0 4px 12px ${color}30`,
                        }
                      : {}
                  }
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{metric.icon}</span>
                      <h4 className="font-semibold text-text-primary">
                        {metric.label}
                      </h4>
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color }}
                    >
                      {metric.value.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                      className="h-full transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </div>

                  {/* Description - Show on hover */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      height: isHovered ? 'auto' : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-text-secondary pt-2 border-t border-border-subtle">
                      {metric.description}
                    </p>
                  </motion.div>

                  {/* Assessment Badge */}
                  <div className="mt-3 flex items-center gap-1">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: bgColor,
                        color: color,
                      }}
                    >
                      {metric.value >= 80
                        ? 'Excellent'
                        : metric.value >= 60
                          ? 'Good'
                          : metric.value >= 40
                            ? 'Fair'
                            : 'Needs Work'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Insights Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Quality Insights
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {/* Completeness Insight */}
          {metrics.completeness < 70 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Incomplete Decomposition
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Some necessary components may be missing from the hierarchy. Consider adding
                  more items or consolidating existing ones.
                </p>
              </div>
            </motion.div>
          )}

          {/* Balance Insight */}
          {metrics.balance < 70 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Imbalanced Hierarchy
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Items are unevenly distributed across levels. Ideal ratios are L2: 3-5 per
                  objective, L3: 2-4 per pillar, L4: 2-3 per tactic.
                </p>
              </div>
            </motion.div>
          )}

          {/* Coherence Insight */}
          {metrics.coherence < 70 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Weak Logical Flow
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  The hierarchy may lack logical progression. Ensure each level clearly supports
                  the level above it.
                </p>
              </div>
            </motion.div>
          )}

          {/* Clarity Insight */}
          {metrics.clarity < 70 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Unclear Descriptions
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Some descriptions may be unclear or ambiguous. Consider revising for better
                  clarity and specificity.
                </p>
              </div>
            </motion.div>
          )}

          {/* Positive Insights */}
          {metrics.completeness >= 80 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Complete Decomposition
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  The strategy includes all necessary components for successful execution.
                </p>
              </div>
            </motion.div>
          )}

          {metrics.balance >= 80 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Well-Balanced Hierarchy
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Items are well-distributed across levels with proper ratios for effective
                  execution.
                </p>
              </div>
            </motion.div>
          )}

          {metrics.coherence >= 80 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Strong Logical Flow
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Each level logically supports the level above, creating a coherent strategy.
                </p>
              </div>
            </motion.div>
          )}

          {metrics.clarity >= 80 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Clear Descriptions
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  All descriptions are clear, specific, and easy to understand.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
