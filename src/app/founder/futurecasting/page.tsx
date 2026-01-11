'use client';

/**
 * Unite Futurecasting Console
 * Phase: D80 - Futurecasting Engine
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Layers, AlertCircle, RefreshCw, Target } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ForecastTimeframe = 'short_term' | 'medium_term' | 'long_term' | 'multi_horizon';

interface FuturecastingModel {
  id: string;
  title: string;
  domain: string;
  timeframe: ForecastTimeframe;
  inputs?: {
    variables?: Record<string, unknown>;
    assumptions?: string[];
  };
  outputs?: {
    macro_trends?: string[];
    industry_shifts?: string[];
    competitor_moves?: string[];
    regulatory_changes?: string[];
    tech_evolution?: string[];
    leading_indicators?: Array<{
      indicator: string;
      current_value: string;
      trend: 'rising' | 'falling' | 'stable';
      significance: 'low' | 'medium' | 'high';
    }>;
    confidence_score?: number;
  };
  created_at: string;
}

interface ForecastStats {
  total_models: number;
  by_domain: Record<string, number>;
  by_timeframe: Record<ForecastTimeframe, number>;
  avg_confidence: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function FuturecastingConsolePage() {
  const [activeTab, setActiveTab] = useState<'models' | 'stats'>('models');
  const [models, setModels] = useState<FuturecastingModel[]>([]);
  const [stats, setStats] = useState<ForecastStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<FuturecastingModel | null>(null);

  // Fetch models
  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orchestration/futurecasting/run');
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Fetch models failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orchestration/futurecasting/run?action=stats');
      const data = await res.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Fetch stats failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'models') fetchModels();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  // Timeframe badge
  const TimeframeBadge = ({ timeframe }: { timeframe: ForecastTimeframe }) => {
    const config = {
      short_term: 'text-blue-400 bg-blue-400/10',
      medium_term: 'text-purple-400 bg-purple-400/10',
      long_term: 'text-orange-400 bg-orange-400/10',
      multi_horizon: 'text-accent-500 bg-accent-500/10',
    };
    const labels = {
      short_term: '3-6mo',
      medium_term: '6-18mo',
      long_term: '18mo+',
      multi_horizon: 'Multi',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config[timeframe]}`}>
        {labels[timeframe]}
      </span>
    );
  };

  // Trend badge
  const TrendBadge = ({ trend }: { trend: 'rising' | 'falling' | 'stable' }) => {
    const config = {
      rising: 'text-green-400 bg-green-400/10',
      falling: 'text-red-400 bg-red-400/10',
      stable: 'text-gray-400 bg-gray-400/10',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config[trend]}`}>{trend}</span>
    );
  };

  // Significance badge
  const SignificanceBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
    const config = {
      low: 'text-gray-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };
    return (
      <AlertCircle className={`w-4 h-4 ${config[level]}`} />
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Futurecasting</h1>
            <p className="text-text-secondary mt-1">
              Macro trends + competitive intelligence + regulatory foresight
            </p>
          </div>
          <Button
            onClick={() => (activeTab === 'models' ? fetchModels() : fetchStats())}
            variant="outline"
            className="border-border-primary text-text-primary hover:bg-bg-hover"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-primary">
          {(['models', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
          </div>
        )}

        {/* Models Tab */}
        {!loading && activeTab === 'models' && (
          <div className="space-y-4">
            {models.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <TrendingUp className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No forecasting models</p>
              </Card>
            ) : (
              models.map((model) => (
                <Card key={model.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-5 h-5 text-accent-500" />
                        <h3 className="text-lg font-semibold text-text-primary">{model.title}</h3>
                        <TimeframeBadge timeframe={model.timeframe} />
                        {model.outputs?.confidence_score !== undefined && (
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded">
                            {Math.round(model.outputs.confidence_score * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">Domain: {model.domain}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(model.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setSelectedModel(selectedModel?.id === model.id ? null : model)
                      }
                      size="sm"
                      variant="outline"
                      className="border-border-primary text-text-primary hover:bg-bg-hover"
                    >
                      {selectedModel?.id === model.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  {/* Summary stats */}
                  {model.outputs && (
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      <div className="bg-bg-primary p-3 rounded text-center">
                        <p className="text-xs text-text-secondary">Macro</p>
                        <p className="text-lg font-semibold text-text-primary mt-1">
                          {model.outputs.macro_trends?.length || 0}
                        </p>
                      </div>
                      <div className="bg-bg-primary p-3 rounded text-center">
                        <p className="text-xs text-text-secondary">Industry</p>
                        <p className="text-lg font-semibold text-text-primary mt-1">
                          {model.outputs.industry_shifts?.length || 0}
                        </p>
                      </div>
                      <div className="bg-bg-primary p-3 rounded text-center">
                        <p className="text-xs text-text-secondary">Competitor</p>
                        <p className="text-lg font-semibold text-text-primary mt-1">
                          {model.outputs.competitor_moves?.length || 0}
                        </p>
                      </div>
                      <div className="bg-bg-primary p-3 rounded text-center">
                        <p className="text-xs text-text-secondary">Regulatory</p>
                        <p className="text-lg font-semibold text-text-primary mt-1">
                          {model.outputs.regulatory_changes?.length || 0}
                        </p>
                      </div>
                      <div className="bg-bg-primary p-3 rounded text-center">
                        <p className="text-xs text-text-secondary">Tech</p>
                        <p className="text-lg font-semibold text-text-primary mt-1">
                          {model.outputs.tech_evolution?.length || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expanded details */}
                  {selectedModel?.id === model.id && model.outputs && (
                    <div className="pt-4 border-t border-border-primary space-y-4">
                      {/* Leading indicators */}
                      {model.outputs.leading_indicators && model.outputs.leading_indicators.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Leading Indicators ({model.outputs.leading_indicators.length})
                          </h4>
                          <div className="space-y-2">
                            {model.outputs.leading_indicators.map((indicator, idx) => (
                              <div key={idx} className="bg-bg-primary p-3 rounded flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <SignificanceBadge level={indicator.significance} />
                                    <span className="text-sm font-medium text-text-primary">
                                      {indicator.indicator}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-tertiary">
                                    Current: {indicator.current_value}
                                  </p>
                                </div>
                                <TrendBadge trend={indicator.trend} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All forecasts */}
                      <div className="grid grid-cols-2 gap-4">
                        {model.outputs.macro_trends && model.outputs.macro_trends.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">
                              Macro Trends
                            </h4>
                            <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                              {model.outputs.macro_trends.map((trend, i) => (
                                <li key={i}>{trend}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {model.outputs.industry_shifts && model.outputs.industry_shifts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">
                              Industry Shifts
                            </h4>
                            <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                              {model.outputs.industry_shifts.map((shift, i) => (
                                <li key={i}>{shift}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {model.outputs.competitor_moves && model.outputs.competitor_moves.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">
                              Competitor Moves
                            </h4>
                            <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                              {model.outputs.competitor_moves.map((move, i) => (
                                <li key={i}>{move}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {model.outputs.regulatory_changes && model.outputs.regulatory_changes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">
                              Regulatory Changes
                            </h4>
                            <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                              {model.outputs.regulatory_changes.map((change, i) => (
                                <li key={i}>{change}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Stats Tab */}
        {!loading && activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-bg-card border-border-primary p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Models</span>
                  <span className="text-text-primary font-semibold">{stats.total_models}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg Confidence</span>
                  <span className="text-text-primary font-semibold">
                    {Math.round(stats.avg_confidence * 100)}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-bg-card border-border-primary p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">By Timeframe</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_timeframe)
                  .filter(([, count]) => count > 0)
                  .map(([timeframe, count]) => (
                    <div key={timeframe} className="flex justify-between items-center">
                      <TimeframeBadge timeframe={timeframe as ForecastTimeframe} />
                      <span className="text-text-primary font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="bg-bg-card border-border-primary p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-text-primary mb-4">By Domain</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(stats.by_domain).map(([domain, count]) => (
                  <div key={domain} className="bg-bg-primary p-3 rounded">
                    <p className="text-sm text-text-secondary truncate capitalize">{domain}</p>
                    <p className="text-lg font-semibold text-text-primary mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
