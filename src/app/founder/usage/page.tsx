'use client';

/**
 * Usage & Cost Overview
 * Phase: D64 - Unified Usage & Cost Telemetry Engine
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Sparkles } from 'lucide-react';

interface DailySummary {
  id: string;
  date: string;
  dimension_key: string;
  usage_value?: number;
  usage_unit?: string;
  cost_amount?: number;
  currency: string;
}

interface UsageInsights {
  summary: string;
  cost_trend: string;
  anomalies: Array<{ dimension: string; issue: string; severity: string }>;
  recommendations: string[];
}

export default function UsagePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'insights'>('overview');
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [insights, setInsights] = useState<UsageInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (activeTab === 'daily' || activeTab === 'overview') {
      fetchDailySummary();
    }
  }, [activeTab, days]);

  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await fetch(
        `/api/unite/usage/daily?start_date=${startDate}&end_date=${endDate}&limit=${days}`
      );
      const data = await response.json();
      if (response.ok) {
        setDailySummary(data.summary || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setGeneratingInsights(true);
      const response = await fetch('/api/unite/usage/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await response.json();
      if (response.ok) {
        setInsights(data.insights);
        setActiveTab('insights');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Aggregate metrics
  const totalCost = dailySummary.reduce((sum, d) => sum + (d.cost_amount || 0), 0);
  const totalUsage = dailySummary.reduce((sum, d) => sum + (d.usage_value || 0), 0);
  const avgDailyCost = totalCost / (days || 1);

  // Group by dimension
  const byDimension = dailySummary.reduce((acc, d) => {
    const key = d.dimension_key;
    if (!acc[key]) {
      acc[key] = { cost: 0, usage: 0, unit: d.usage_unit || '' };
    }
    acc[key].cost += d.cost_amount || 0;
    acc[key].usage += d.usage_value || 0;
    return acc;
  }, {} as Record<string, { cost: number; usage: number; unit: string }>);

  const topDimensions = Object.entries(byDimension)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      high: 'bg-error-500',
      medium: 'bg-warning-500',
      low: 'bg-info-500',
    };
    return colors[severity] || 'bg-bg-hover0';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-accent-500" />
              Usage & Cost Telemetry
            </h1>
            <p className="text-text-secondary">Cross-product usage tracking and cost attribution</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 bg-bg-card border border-border-primary rounded text-text-primary"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button
              onClick={handleGenerateInsights}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={generatingInsights}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingInsights ? 'Analyzing...' : 'AI Insights'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'overview', label: 'Overview', icon: DollarSign },
            { key: 'daily', label: 'Daily Breakdown', icon: Activity },
            { key: 'insights', label: 'AI Insights', icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === key
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Total Cost</span>
                  <DollarSign className="w-5 h-5 text-accent-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  ${totalCost.toFixed(2)}
                  <span className="text-sm text-text-tertiary ml-1">AUD</span>
                </div>
                <div className="text-xs text-text-tertiary mt-1">{days} days</div>
              </div>

              <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Avg Daily Cost</span>
                  <TrendingUp className="w-5 h-5 text-success-400" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  ${avgDailyCost.toFixed(2)}
                </div>
                <div className="text-xs text-text-tertiary mt-1">per day</div>
              </div>

              <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Total Usage</span>
                  <Zap className="w-5 h-5 text-info-400" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {totalUsage.toFixed(0)}
                </div>
                <div className="text-xs text-text-tertiary mt-1">units tracked</div>
              </div>
            </div>

            {/* Top Dimensions */}
            <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Top Cost Drivers</h3>
              {loading ? (
                <div className="text-center py-8 text-text-secondary">Loading...</div>
              ) : topDimensions.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">No usage data</div>
              ) : (
                <div className="space-y-4">
                  {topDimensions.map(([dimension, { cost, usage, unit }]) => (
                    <div key={dimension} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{dimension}</div>
                        <div className="text-xs text-text-tertiary">
                          {usage.toFixed(0)} {unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-accent-500">
                          ${cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {((cost / totalCost) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Breakdown Tab */}
        {activeTab === 'daily' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading daily breakdown...</div>
            ) : dailySummary.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No usage data for this period</p>
              </div>
            ) : (
              <div className="bg-bg-card rounded-lg border border-border-primary overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                        Dimension
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                        Usage
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((item) => (
                      <tr key={item.id} className="border-t border-border-secondary">
                        <td className="px-4 py-3 text-sm text-text-primary">{item.date}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {item.dimension_key}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary text-right">
                          {(item.usage_value || 0).toFixed(2)} {item.usage_unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-accent-500 text-right font-medium">
                          ${(item.cost_amount || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div>
            {!insights ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-text-secondary mb-4">Generate AI insights to analyze usage patterns</p>
                <Button
                  onClick={handleGenerateInsights}
                  className="bg-purple-600 text-white"
                  disabled={generatingInsights}
                >
                  {generatingInsights ? 'Analyzing...' : 'Generate Insights'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Summary</h3>
                  <p className="text-text-secondary">{insights.summary}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">Cost Trend:</span>
                    <span
                      className={`px-3 py-1 text-xs rounded ${
                        insights.cost_trend === 'increasing'
                          ? 'bg-error-500/10 text-error-400'
                          : insights.cost_trend === 'decreasing'
                          ? 'bg-success-500/10 text-success-400'
                          : 'bg-info-500/10 text-info-400'
                      }`}
                    >
                      {insights.cost_trend}
                    </span>
                  </div>
                </div>

                {/* Anomalies */}
                {insights.anomalies.length > 0 && (
                  <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Anomalies</h3>
                    <div className="space-y-3">
                      {insights.anomalies.map((anomaly, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-bg-tertiary rounded border border-border-secondary"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(
                                anomaly.severity
                              )}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-text-primary">
                                  {anomaly.dimension}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                                    anomaly.severity
                                  )} text-white`}
                                >
                                  {anomaly.severity}
                                </span>
                              </div>
                              <p className="text-sm text-text-secondary">{anomaly.issue}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                        <TrendingUp className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
