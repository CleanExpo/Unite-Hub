'use client';

/**
 * ForecastChart Component
 *
 * Displays strategic forecast scenarios (baseline, optimistic, pessimistic).
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, AlertTriangle } from 'lucide-react';

interface ForecastScenario {
  revenue: number;
  clients: number;
  growth: number;
  keyMilestones: string[];
}

interface Forecast {
  id: string;
  horizon: string;
  generatedAt: string;
  baselineScenario: ForecastScenario;
  optimisticScenario: ForecastScenario;
  pessimisticScenario: ForecastScenario;
  keyAssumptions: string[];
  confidenceScore: number;
  aiInsights: {
    summary: string;
    opportunities: string[];
    risks: string[];
  };
}

interface ForecastChartProps {
  forecast: Forecast;
  className?: string;
}

const HORIZON_LABELS: Record<string, string> = {
  '6_week': '6 Week',
  '12_week': '12 Week',
  '1_year': '1 Year',
};

export function ForecastChart({ forecast, className = '' }: ForecastChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const formatGrowth = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const scenarios = [
    {
      key: 'optimistic',
      label: 'Optimistic',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      data: forecast.optimisticScenario,
    },
    {
      key: 'baseline',
      label: 'Expected',
      icon: Minus,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      data: forecast.baselineScenario,
    },
    {
      key: 'pessimistic',
      label: 'Pessimistic',
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      data: forecast.pessimisticScenario,
    },
  ];

  return (
    <div className={`rounded-xl border bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {HORIZON_LABELS[forecast.horizon] || forecast.horizon} Forecast
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          {Math.round(forecast.confidenceScore * 100)}% confidence
        </div>
      </div>

      {/* Scenarios */}
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        {scenarios.map(({ key, label, icon: Icon, color, bgColor, borderColor, data }) => (
          <div key={key} className={`rounded-lg border p-4 ${bgColor} ${borderColor}`}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="font-medium">{label}</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(data.revenue)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Clients</p>
                  <p className="font-semibold">{data.clients}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Growth</p>
                  <p
                    className={`font-semibold ${
                      data.growth >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatGrowth(data.growth)}
                  </p>
                </div>
              </div>

              {data.keyMilestones?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Key Milestones</p>
                  <ul className="space-y-1">
                    {data.keyMilestones.slice(0, 2).map((milestone, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {forecast.aiInsights && (
        <div className="border-t p-4">
          <p className="mb-2 text-sm font-medium">AI Analysis</p>
          <p className="text-sm text-muted-foreground">{forecast.aiInsights.summary}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {forecast.aiInsights.opportunities?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  Opportunities
                </p>
                <ul className="space-y-1">
                  {forecast.aiInsights.opportunities.slice(0, 3).map((opp, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-500" />
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {forecast.aiInsights.risks?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  Risks
                </p>
                <ul className="space-y-1">
                  {forecast.aiInsights.risks.slice(0, 3).map((risk, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Assumptions */}
      {forecast.keyAssumptions?.length > 0 && (
        <div className="border-t p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Key Assumptions</p>
          <div className="flex flex-wrap gap-2">
            {forecast.keyAssumptions.map((assumption, i) => (
              <span
                key={i}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {assumption}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ForecastChart;
