'use client';

/**
 * Unite Scenario Engine Console
 * Phase: D79 - Scenario Engine
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, GitBranch, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ScenarioStatus = 'pending' | 'running' | 'completed' | 'failed';

interface ScenarioTemplate {
  id: string;
  name: string;
  description?: string;
  variables: {
    input_vars?: string[];
    constraints?: Record<string, unknown>;
  };
  created_at: string;
}

interface ScenarioRun {
  id: string;
  template_id: string;
  inputs: {
    variables: Record<string, unknown>;
  };
  outputs?: {
    paths: Array<{
      name: string;
      probability: number;
      outcomes: string[];
    }>;
    risks: string[];
    opportunities: string[];
    timeline: Record<string, string>;
    required_actions: string[];
  };
  status: ScenarioStatus;
  created_at: string;
}

interface ScenarioStats {
  total_runs: number;
  by_status: Record<ScenarioStatus, number>;
  avg_paths_per_run: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScenarioConsolePage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'runs' | 'stats'>('templates');
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [stats, setStats] = useState<ScenarioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ScenarioRun | null>(null);

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orchestration/scenario/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Fetch templates failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch runs
  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orchestration/scenario/run');
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
      const res = await fetch('/api/orchestration/scenario/run?action=stats');
      const data = await res.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Fetch stats failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'runs') fetchRuns();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  // Status badge
  const StatusBadge = ({ status }: { status: ScenarioStatus }) => {
    const config = {
      pending: 'text-gray-400 bg-gray-400/10',
      running: 'text-blue-400 bg-blue-400/10',
      completed: 'text-green-400 bg-green-400/10',
      failed: 'text-red-400 bg-red-400/10',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${config[status]}`}>{status}</span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Scenario Engine</h1>
            <p className="text-text-secondary mt-1">
              Multi-path outcome simulations + stress-tests
            </p>
          </div>
          <Button
            onClick={() => {
              if (activeTab === 'templates') fetchTemplates();
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
          {(['templates', 'runs', 'stats'] as const).map((tab) => (
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

        {/* Templates Tab */}
        {!loading && activeTab === 'templates' && (
          <div className="space-y-4">
            {templates.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <GitBranch className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No scenario templates</p>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-text-secondary mb-3">{template.description}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Input vars:</span>
                          <span className="text-text-primary ml-2">
                            {template.variables.input_vars?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Constraints:</span>
                          <span className="text-text-primary ml-2">
                            {Object.keys(template.variables.constraints || {}).length}
                          </span>
                        </div>
                      </div>
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
                <p className="text-text-secondary">No scenario runs</p>
              </Card>
            ) : (
              runs.map((run) => (
                <Card key={run.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Play className="w-5 h-5 text-accent-500" />
                        <h3 className="text-lg font-semibold text-text-primary">Scenario Run</h3>
                        <StatusBadge status={run.status} />
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {new Date(run.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                      size="sm"
                      variant="outline"
                      className="border-border-primary text-text-primary hover:bg-bg-hover"
                    >
                      {selectedRun?.id === run.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  {/* Paths summary */}
                  {run.outputs?.paths && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {run.outputs.paths.slice(0, 3).map((path, idx) => (
                        <div key={idx} className="bg-bg-primary p-3 rounded">
                          <p className="text-xs text-text-secondary truncate">{path.name}</p>
                          <p className="text-lg font-semibold text-accent-500 mt-1">
                            {Math.round(path.probability * 100)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expanded details */}
                  {selectedRun?.id === run.id && run.outputs && (
                    <div className="pt-4 border-t border-border-primary space-y-3">
                      {/* All paths */}
                      {run.outputs.paths && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Outcome Paths ({run.outputs.paths.length})
                          </h4>
                          <div className="space-y-2">
                            {run.outputs.paths.map((path, idx) => (
                              <div key={idx} className="bg-bg-primary p-3 rounded">
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm font-medium text-text-primary">
                                    {path.name}
                                  </span>
                                  <span className="text-sm text-accent-500">
                                    {Math.round(path.probability * 100)}%
                                  </span>
                                </div>
                                <ul className="list-disc list-inside text-xs text-text-tertiary space-y-1">
                                  {path.outcomes.map((outcome, i) => (
                                    <li key={i}>{outcome}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risks */}
                      {run.outputs.risks && run.outputs.risks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Risks
                          </h4>
                          <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                            {run.outputs.risks.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Opportunities */}
                      {run.outputs.opportunities && run.outputs.opportunities.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Opportunities
                          </h4>
                          <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                            {run.outputs.opportunities.map((opp, i) => (
                              <li key={i}>{opp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Required actions */}
                      {run.outputs.required_actions && run.outputs.required_actions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Required Actions
                          </h4>
                          <ul className="list-disc list-inside text-sm text-text-tertiary space-y-1 bg-bg-primary p-3 rounded">
                            {run.outputs.required_actions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                  <span className="text-text-secondary">Total Runs</span>
                  <span className="text-text-primary font-semibold">{stats.total_runs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg Paths/Run</span>
                  <span className="text-text-primary font-semibold">
                    {stats.avg_paths_per_run}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-bg-card border-border-primary p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">By Status</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_status)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <StatusBadge status={status as ScenarioStatus} />
                      <span className="text-text-primary font-semibold">{count}</span>
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
