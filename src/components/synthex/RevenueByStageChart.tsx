'use client';

/**
 * RevenueByStageChart Component
 *
 * Displays revenue breakdown by journey stage as a horizontal bar chart.
 * Part of Phase B15 - Revenue Attribution by Journey Stage.
 */

import { useMemo } from 'react';

export interface StageSummary {
  stage: string;
  revenue: number;
  conversions: number;
  avgOrderValue: number;
  percentOfTotal: number;
}

interface RevenueByStageChartProps {
  stages: StageSummary[];
  currency?: string;
  showPercentages?: boolean;
  className?: string;
}

const STAGE_COLORS: Record<string, string> = {
  awareness: 'bg-blue-500',
  consideration: 'bg-purple-500',
  decision: 'bg-green-500',
  retention: 'bg-yellow-500',
  advocacy: 'bg-pink-500',
  unknown: 'bg-gray-500',
};

const STAGE_LABELS: Record<string, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  decision: 'Decision',
  retention: 'Retention',
  advocacy: 'Advocacy',
  unknown: 'Unknown',
};

function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function RevenueByStageChart({
  stages,
  currency = 'AUD',
  showPercentages = true,
  className = '',
}: RevenueByStageChartProps) {
  const maxRevenue = useMemo(() => {
    return Math.max(...stages.map((s) => s.revenue), 1);
  }, [stages]);

  const totalRevenue = useMemo(() => {
    return stages.reduce((sum, s) => sum + s.revenue, 0);
  }, [stages]);

  if (stages.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Revenue by Stage</h3>
        <div className="text-gray-400 text-center py-8">
          No revenue data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Revenue by Stage</h3>
        <div className="text-sm text-gray-400">
          Total: {formatCurrency(totalRevenue, currency)}
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => {
          const barWidth = (stage.revenue / maxRevenue) * 100;
          const colorClass = STAGE_COLORS[stage.stage] || STAGE_COLORS.unknown;
          const label = STAGE_LABELS[stage.stage] || stage.stage;

          return (
            <div key={stage.stage} className="group">
              {/* Stage header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <span className="text-sm font-medium text-gray-200">{label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    {stage.conversions} conversions
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(stage.revenue, currency)}
                  </span>
                  {showPercentages && (
                    <span className="text-gray-500 w-12 text-right">
                      {stage.percentOfTotal.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${colorClass} transition-all duration-500 ease-out flex items-center px-3`}
                  style={{ width: `${Math.max(barWidth, 2)}%` }}
                >
                  {barWidth > 15 && (
                    <span className="text-xs font-medium text-white">
                      AOV: {formatCurrency(stage.avgOrderValue, currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-xs text-gray-500">
                Avg Order Value: {formatCurrency(stage.avgOrderValue, currency)} |{' '}
                {stage.conversions > 0
                  ? `${formatNumber(stage.revenue / stage.conversions)}/conversion`
                  : 'No conversions'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-4">
          {Object.entries(STAGE_LABELS).map(([key, label]) => {
            const hasData = stages.some((s) => s.stage === key);
            if (!hasData && key !== 'unknown') {
return null;
}

            return (
              <div key={key} className="flex items-center gap-2 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[key]}`} />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RevenueByStageChart;
