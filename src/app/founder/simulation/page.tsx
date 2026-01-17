'use client';

/**
 * Unite Simulation Twin Console
 * Phase: D78 - Unite Simulation Twin Engine
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Database, TrendingUp, RefreshCw } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SimulationTwin {
  id: string;
  name: string;
  state: {
    variables: Record<string, number>;
    parameters: Record<string, unknown>;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  updated_at: string;
}

interface SimulationRun {
  id: string;
  twin_id: string;
  input?: {
    scenario: string;
    variables?: Record<string, number>;
  };
  output?: {
    predictions: Record<string, number>;
    confidence_scores: Record<string, number>;
    recommendations: string[];
  };
  ai_trace?: {
    model: string;
    thinking_tokens?: number;
  };
  executed_at: string;
}

interface SimStats {
  total_runs: number;
  avg_confidence: number;
  by_twin: Record<string, number>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SimulationConsolePage() {
  const [activeTab, setActiveTab] = useState<'twins' | 'runs' | 'stats'>('twins');
  const [twins, setTwins] = useState<SimulationTwin[]>([]);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [stats, setStats] = useState<SimStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<SimulationRun | null>(null);

  // Fetch twins
  const fetchTwins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/sim/twins');
      const data = await res.json();
      setTwins(data.twins || []);
    } catch (error) {
      console.error('Fetch twins failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch runs
  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/sim/run?limit=50');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error('Fetch runs failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/sim/run?action=stats');
      const data = await res.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Fetch stats failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'twins') fetchTwins();
    if (activeTab === 'runs') fetchRuns();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  // Confidence badge
  const ConfidenceBadge = ({ score }: { score: number }) => {
    let color = 'text-success-400 bg-success-400/10';
    if (score < 0.5) color = 'text-error-400 bg-error-400/10';
    else if (score < 0.7) color = 'text-warning-400 bg-warning-400/10';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${color}`}>
        {Math.round(score * 100)}% confidence
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Simulation Twin</h1>
            <p className="text-text-secondary mt-1">Digital twins for scenario prediction</p>
          </div>
          <Button
            onClick={() => {
              if (activeTab === 'twins') fetchTwins();
              if (activeTab === 'runs') fetchRuns();
              if (activeTab === 'stats') fetchStats();
            }}
            variant="outline"
            className="border-border-primary text-text-primary hover:bg-bg-hover"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-primary">
          {(['twins', 'runs', 'stats'] as const).map((tab) => (
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

        {/* Twins Tab */}
        {!loading && activeTab === 'twins' && (
          <div className="space-y-4">
            {twins.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <Database className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No twins created</p>
              </Card>
            ) : (
              twins.map((twin) => (
                <Card key={twin.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">{twin.name}</h3>
                      {twin.metadata?.description && (
                        <p className="text-sm text-text-secondary mb-3">
                          {twin.metadata.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Variables</p>
                          <p className="text-sm text-text-primary">
                            {Object.keys(twin.state.variables).length} defined
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Parameters</p>
                          <p className="text-sm text-text-primary">
                            {Object.keys(twin.state.parameters).length} configured
                          </p>
                        </div>
                      </div>

                      {twin.metadata?.version && (
                        <p className="text-xs text-text-tertiary mt-2">v{twin.metadata.version}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Runs Tab */}
        {!loading && activeTab === 'runs' && (
          <div className="space-y-4">
            {runs.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <Play className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No simulation runs</p>
              </Card>
            ) : (
              runs.map((run) => {
                const avgConfidence = run.output?.confidence_scores
                  ? Object.values(run.output.confidence_scores).reduce((a, b) => a + b, 0) /
                    Object.values(run.output.confidence_scores).length
                  : 0;

                return (
                  <Card key={run.id} className="bg-bg-card border-border-primary p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Play className="w-5 h-5 text-accent-500" />
                          <h3 className="text-lg font-semibold text-text-primary">
                            {run.input?.scenario || 'Simulation Run'}
                          </h3>
                          {avgConfidence > 0 && <ConfidenceBadge score={avgConfidence} />}
                        </div>
                        <p className="text-xs text-text-tertiary">
                          {new Date(run.executed_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          setSelectedRun(selectedRun?.id === run.id ? null : run)
                        }
                        size="sm"
                        variant="outline"
                        className="border-border-primary text-text-primary hover:bg-bg-hover"
                      >
                        {selectedRun?.id === run.id ? 'Hide' : 'Details'}
                      </Button>
                    </div>

                    {/* Predictions */}
                    {run.output?.predictions && (
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(run.output.predictions)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="bg-bg-primary p-3 rounded">
                              <p className="text-xs text-text-secondary truncate">{key}</p>
                              <p className="text-lg font-semibold text-text-primary mt-1">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Expanded details */}
                    {selectedRun?.id === run.id && run.output && (
                      <div className="mt-4 pt-4 border-t border-border-primary space-y-3">
                        {run.output.recommendations && run.output.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">
                              Recommendations
                            </h4>
                            <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                              {run.output.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {run.ai_trace && (
                          <div className="text-xs text-text-tertiary">
                            Model: {run.ai_trace.model} | Thinking tokens:{' '}
                            {run.ai_trace.thinking_tokens || 0}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
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
                  <span className="text-text-secondary">Total Runs</span>
                  <span className="text-text-primary font-semibold">{stats.total_runs}</span>
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
              <h3 className="text-lg font-semibold text-text-primary mb-4">By Twin</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_twin).map(([twinId, count]) => {
                  const twin = twins.find((t) => t.id === twinId);
                  return (
                    <div key={twinId} className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary truncate">
                        {twin?.name || twinId.slice(0, 8)}
                      </span>
                      <span className="text-sm text-text-primary font-semibold">
                        {count} runs
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
