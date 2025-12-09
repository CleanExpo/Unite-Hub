'use client';

/**
 * Unite Adaptive Recovery Console
 * Phase: D75 - Unite Adaptive Recovery Engine
 *
 * Automated recovery with AI-enabled decision making.
 * Features: Policy management, recovery simulation, execution approval.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type RecoveryStatus =
  | 'pending'
  | 'simulating'
  | 'simulated'
  | 'executing'
  | 'success'
  | 'failed'
  | 'cancelled';

interface RecoveryPolicy {
  id: string;
  key: string;
  rules: {
    trigger_condition: {
      metric: string;
      operator: string;
      threshold: number;
    };
    recovery_action: {
      type: string;
      params?: Record<string, unknown>;
    };
    simulation_required: boolean;
    max_retries: number;
    auto_execute?: boolean;
  };
  enabled: boolean;
  tenant_id?: string;
  updated_at: string;
}

interface RecoveryRun {
  id: string;
  policy_key: string;
  status: RecoveryStatus;
  trigger_event?: {
    component: string;
    severity: string;
    metrics: Record<string, number>;
  };
  simulation_result?: {
    predicted_impact: string;
    risk_score: number;
    recommended_action: string;
    safe_to_execute: boolean;
  };
  execution_result?: {
    actions_taken: string[];
    metrics_before: Record<string, number>;
    metrics_after: Record<string, number>;
    success: boolean;
  };
  ai_trace?: {
    model: string;
    prompt: string;
    response: string;
    thinking_tokens?: number;
  };
  started_at: string;
  completed_at?: string;
}

interface RecoveryStats {
  total_runs: number;
  by_status: Record<RecoveryStatus, number>;
  by_policy: Record<string, number>;
  success_rate: number;
  avg_risk_score: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RecoveryConsolePage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'runs' | 'stats'>('policies');
  const [policies, setPolicies] = useState<RecoveryPolicy[]>([]);
  const [runs, setRuns] = useState<RecoveryRun[]>([]);
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RecoveryRun | null>(null);

  // Fetch policies
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/recovery/policies');
      const data = await res.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch runs
  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/recovery/run?limit=50');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unite/recovery/run?action=stats');
      const data = await res.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle policy enabled
  const togglePolicy = async (key: string, enabled: boolean) => {
    try {
      await fetch('/api/unite/recovery/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          key,
          enabled: !enabled,
        }),
      });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to toggle policy:', error);
    }
  };

  // Approve recovery run
  const approveRun = async (runId: string) => {
    try {
      await fetch('/api/unite/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          run_id: runId,
        }),
      });
      fetchRuns();
      setSelectedRun(null);
    } catch (error) {
      console.error('Failed to approve run:', error);
    }
  };

  // Cancel recovery run
  const cancelRun = async (runId: string) => {
    try {
      await fetch('/api/unite/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          run_id: runId,
        }),
      });
      fetchRuns();
      setSelectedRun(null);
    } catch (error) {
      console.error('Failed to cancel run:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'policies') fetchPolicies();
    if (activeTab === 'runs') fetchRuns();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  // Status badge
  const StatusBadge = ({ status }: { status: RecoveryStatus }) => {
    const config = {
      pending: { icon: Pause, color: 'text-gray-400', bg: 'bg-gray-400/10' },
      simulating: { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      simulated: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
      executing: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
      failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
      cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    };

    const { icon: Icon, color, bg } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${color} ${bg}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Risk badge
  const RiskBadge = ({ score }: { score: number }) => {
    let color = 'text-green-400 bg-green-400/10';
    if (score >= 70) color = 'text-red-400 bg-red-400/10';
    else if (score >= 40) color = 'text-yellow-400 bg-yellow-400/10';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${color}`}>
        Risk: {score}/100
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Unite Recovery Engine</h1>
            <p className="text-text-secondary mt-1">
              Automated recovery with AI-enabled decision making
            </p>
          </div>
          <Button
            onClick={() => {
              if (activeTab === 'policies') fetchPolicies();
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
          {(['policies', 'runs', 'stats'] as const).map((tab) => (
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

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
          </div>
        )}

        {/* Policies Tab */}
        {!loading && activeTab === 'policies' && (
          <div className="space-y-4">
            {policies.length === 0 ? (
              <Card className="bg-bg-card border-border-primary p-8 text-center">
                <Settings className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">No recovery policies configured</p>
              </Card>
            ) : (
              policies.map((policy) => (
                <Card key={policy.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{policy.key}</h3>
                        {policy.enabled ? (
                          <span className="px-2 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-400/10 rounded">
                            Disabled
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                        <div>
                          <span className="text-text-secondary">Trigger:</span>
                          <p className="text-text-primary mt-1">
                            {policy.rules.trigger_condition.metric}{' '}
                            {policy.rules.trigger_condition.operator}{' '}
                            {policy.rules.trigger_condition.threshold}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-secondary">Action:</span>
                          <p className="text-text-primary mt-1 capitalize">
                            {policy.rules.recovery_action.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-secondary">Simulation:</span>
                          <p className="text-text-primary mt-1">
                            {policy.rules.simulation_required ? 'Required' : 'Optional'}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-secondary">Auto-execute:</span>
                          <p className="text-text-primary mt-1">
                            {policy.rules.auto_execute ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => togglePolicy(policy.key, policy.enabled)}
                      variant="outline"
                      size="sm"
                      className="border-border-primary text-text-primary hover:bg-bg-hover"
                    >
                      {policy.enabled ? 'Disable' : 'Enable'}
                    </Button>
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
                <p className="text-text-secondary">No recovery runs found</p>
              </Card>
            ) : (
              runs.map((run) => (
                <Card key={run.id} className="bg-bg-card border-border-primary p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {run.policy_key}
                        </h3>
                        <StatusBadge status={run.status} />
                        {run.simulation_result && (
                          <RiskBadge score={run.simulation_result.risk_score} />
                        )}
                      </div>

                      {run.trigger_event && (
                        <p className="text-sm text-text-secondary">
                          Triggered by: {run.trigger_event.component} (
                          {run.trigger_event.severity})
                        </p>
                      )}

                      <p className="text-xs text-text-tertiary mt-1">
                        Started: {new Date(run.started_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {run.status === 'simulated' && run.simulation_result?.safe_to_execute && (
                        <Button
                          onClick={() => approveRun(run.id)}
                          size="sm"
                          className="bg-accent-500 hover:bg-accent-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {(run.status === 'pending' ||
                        run.status === 'simulating' ||
                        run.status === 'simulated') && (
                        <Button
                          onClick={() => cancelRun(run.id)}
                          size="sm"
                          variant="outline"
                          className="border-border-primary text-text-primary hover:bg-bg-hover"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                        size="sm"
                        variant="outline"
                        className="border-border-primary text-text-primary hover:bg-bg-hover"
                      >
                        {selectedRun?.id === run.id ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedRun?.id === run.id && (
                    <div className="mt-4 pt-4 border-t border-border-primary space-y-3">
                      {run.simulation_result && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Simulation Result
                          </h4>
                          <div className="bg-bg-primary p-3 rounded text-sm">
                            <p className="text-text-secondary mb-1">
                              <strong>Impact:</strong> {run.simulation_result.predicted_impact}
                            </p>
                            <p className="text-text-secondary mb-1">
                              <strong>Recommendation:</strong>{' '}
                              {run.simulation_result.recommended_action}
                            </p>
                            <p className="text-text-secondary">
                              <strong>Safe to execute:</strong>{' '}
                              {run.simulation_result.safe_to_execute ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      )}

                      {run.execution_result && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Execution Result
                          </h4>
                          <div className="bg-bg-primary p-3 rounded text-sm">
                            <p className="text-text-secondary mb-2">
                              <strong>Actions:</strong>
                            </p>
                            <ul className="list-disc list-inside text-text-tertiary space-y-1 mb-2">
                              {run.execution_result.actions_taken.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                            <p className="text-text-secondary">
                              <strong>Success:</strong>{' '}
                              {run.execution_result.success ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      )}

                      {run.ai_trace && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            AI Trace
                          </h4>
                          <div className="bg-bg-primary p-3 rounded text-sm">
                            <p className="text-text-secondary mb-1">
                              <strong>Model:</strong> {run.ai_trace.model}
                            </p>
                            {run.ai_trace.thinking_tokens && (
                              <p className="text-text-secondary">
                                <strong>Thinking tokens:</strong> {run.ai_trace.thinking_tokens}
                              </p>
                            )}
                          </div>
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
                  <span className="text-text-secondary">Success Rate</span>
                  <span className="text-green-400 font-semibold">{stats.success_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avg Risk Score</span>
                  <span className="text-text-primary font-semibold">
                    {stats.avg_risk_score}/100
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
                      <StatusBadge status={status as RecoveryStatus} />
                      <span className="text-text-primary font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="bg-bg-card border-border-primary p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-text-primary mb-4">By Policy</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats.by_policy).map(([policy, count]) => (
                  <div key={policy} className="bg-bg-primary p-3 rounded">
                    <p className="text-sm text-text-secondary truncate">{policy}</p>
                    <p className="text-lg font-semibold text-text-primary mt-1">{count} runs</p>
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
