'use client';

/**
 * Unite Runtime Adaptive Orchestrator Console
 * Phase: D72 - Unite Runtime Adaptive Orchestrator
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  Play,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Activity,
  Shield,
} from 'lucide-react';

interface RuntimeSignal {
  id: string;
  signal_type: string;
  source_system: string;
  severity: 'info' | 'warning' | 'critical';
  metric_name: string;
  metric_value: number;
  threshold_value?: number;
  metadata?: Record<string, unknown>;
  tenant_id?: string;
  detected_at: string;
  resolved_at?: string;
}

interface AdaptiveStrategy {
  id: string;
  name: string;
  description?: string;
  trigger_conditions: {
    signal_type?: string;
    severity?: string;
    threshold?: number;
  };
  actions: Array<{
    type: 'scale_up' | 'scale_down' | 'throttle' | 'alert' | 'restart';
    params: Record<string, unknown>;
  }>;
  evaluation_mode: 'side-effect-free' | 'commit';
  priority: number;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

interface OrchestratorRun {
  id: string;
  strategy_id: string;
  triggered_by_signal_id?: string;
  status: 'evaluating' | 'executing' | 'completed' | 'failed' | 'skipped';
  evaluation_result?: {
    safe: boolean;
    predicted_impact: Record<string, unknown>;
  };
  actions_taken?: Array<{
    action: string;
    result: string;
    timestamp: string;
  }>;
  ai_reasoning?: string;
  side_effects_detected?: {
    warnings: string[];
    impacts: string[];
  };
  tenant_id?: string;
  started_at: string;
  completed_at?: string;
}

export default function RuntimeOrchestratorPage() {
  const [activeTab, setActiveTab] = useState<'signals' | 'strategies' | 'runs'>('signals');
  const [signals, setSignals] = useState<RuntimeSignal[]>([]);
  const [strategies, setStrategies] = useState<AdaptiveStrategy[]>([]);
  const [runs, setRuns] = useState<OrchestratorRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<OrchestratorRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'signals') {
      fetchSignals();
    } else if (activeTab === 'strategies') {
      fetchStrategies();
    } else if (activeTab === 'runs') {
      fetchRuns();
    }
  }, [activeTab, severityFilter]);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const severityParam = severityFilter !== 'all' ? `&severity=${severityFilter}` : '';
      const response = await fetch(
        `/api/unite/orchestrator/run?action=signals&limit=100${severityParam}`
      );
      const data = await response.json();
      if (response.ok) {
        setSignals(data.signals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/orchestrator/strategies?limit=100');
      const data = await response.json();
      if (response.ok) {
        setStrategies(data.strategies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/orchestrator/run?limit=100');
      const data = await response.json();
      if (response.ok) {
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runOrchestrator = async (signalId: string) => {
    try {
      const response = await fetch('/api/unite/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          signal_id: signalId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setActiveTab('runs');
        fetchRuns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resolveSignal = async (signalId: string) => {
    try {
      await fetch('/api/unite/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_signal',
          signal_id: signalId,
        }),
      });
      fetchSignals();
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      evaluating: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      executing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[status] || colors.evaluating;
  };

  // Summary stats
  const totalSignals = signals.length;
  const unresolvedSignals = signals.filter((s) => !s.resolved_at).length;
  const criticalSignals = signals.filter((s) => s.severity === 'critical' && !s.resolved_at)
    .length;
  const totalStrategies = strategies.length;
  const activeStrategies = strategies.filter((s) => s.is_active).length;

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Cpu className="w-10 h-10 text-accent-500" />
            Runtime Adaptive Orchestrator
          </h1>
          <p className="text-text-secondary">
            AI-enabled adaptive strategies with side-effect-free evaluation
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Runtime Signals</span>
              <Activity className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalSignals}</div>
            <div className="text-xs text-text-tertiary mt-1">{unresolvedSignals} unresolved</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Critical</span>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{criticalSignals}</div>
            <div className="text-xs text-text-tertiary mt-1">requires attention</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Strategies</span>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalStrategies}</div>
            <div className="text-xs text-text-tertiary mt-1">{activeStrategies} active</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Safety Mode</span>
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {
                strategies.filter((s) => s.is_active && s.evaluation_mode === 'side-effect-free')
                  .length
              }
            </div>
            <div className="text-xs text-text-tertiary mt-1">safe strategies</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'signals', label: 'Runtime Signals', icon: Activity },
            { key: 'strategies', label: 'Adaptive Strategies', icon: Zap },
            { key: 'runs', label: 'Execution History', icon: Brain },
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

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div>
            {/* Severity Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'info', 'warning', 'critical'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    severityFilter === severity
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading signals...</div>
            ) : signals.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No runtime signals found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getSeverityColor(
                      signal.severity
                    )} ${signal.resolved_at ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">
                            {signal.signal_type}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {signal.source_system}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded border ${getSeverityColor(
                              signal.severity
                            )}`}
                          >
                            {signal.severity}
                          </span>
                          {signal.resolved_at && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <div className="text-sm text-text-secondary mb-2">
                          {signal.metric_name}: {signal.metric_value}
                          {signal.threshold_value && ` (threshold: ${signal.threshold_value})`}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Detected: {new Date(signal.detected_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!signal.resolved_at && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => runOrchestrator(signal.id)}
                              className="bg-accent-500 hover:bg-accent-600"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveSignal(signal.id)}
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strategies Tab */}
        {activeTab === 'strategies' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading strategies...</div>
            ) : strategies.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Zap className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No adaptive strategies found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`p-4 bg-bg-card rounded-lg border ${
                      strategy.is_active
                        ? 'border-border-primary'
                        : 'border-border-primary opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{strategy.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            Priority: {strategy.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded border ${
                              strategy.evaluation_mode === 'side-effect-free'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}
                          >
                            {strategy.evaluation_mode}
                          </span>
                        </div>
                        {strategy.description && (
                          <p className="text-sm text-text-secondary mb-2">
                            {strategy.description}
                          </p>
                        )}
                        <div className="text-xs text-text-tertiary">
                          Actions: {strategy.actions.map((a) => a.type).join(', ')}
                        </div>
                      </div>
                      <div>
                        {strategy.is_active ? (
                          <span className="px-3 py-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Brain className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No execution history found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Run List */}
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className={`p-4 bg-bg-card rounded-lg border cursor-pointer hover:border-accent-500/50 ${
                        selectedRun?.id === run.id
                          ? 'border-accent-500'
                          : getStatusColor(run.status)
                      }`}
                      onClick={() => setSelectedRun(run)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-text-primary">
                          Run {run.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </div>
                      {run.evaluation_result && (
                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                          {run.evaluation_result.safe ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                          )}
                          <span>
                            {run.evaluation_result.safe ? 'Safe to execute' : 'Not safe'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Run Details */}
                {selectedRun && (
                  <div className="bg-bg-card rounded-lg border border-border-primary p-6">
                    <h3 className="text-lg font-medium text-text-primary mb-4">Run Details</h3>

                    {/* AI Reasoning */}
                    {selectedRun.ai_reasoning && (
                      <div className="mb-4 p-4 bg-bg-tertiary rounded border border-border-primary">
                        <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-accent-500" />
                          AI Reasoning
                        </h4>
                        <p className="text-sm text-text-secondary">{selectedRun.ai_reasoning}</p>
                      </div>
                    )}

                    {/* Evaluation Result */}
                    {selectedRun.evaluation_result && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-text-primary mb-2">
                          Evaluation Result
                        </h4>
                        <div className="p-3 bg-bg-tertiary rounded">
                          <div className="flex items-center gap-2 mb-2">
                            {selectedRun.evaluation_result.safe ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm text-text-primary">
                              {selectedRun.evaluation_result.safe
                                ? 'Safe to execute'
                                : 'Not safe to execute'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Side Effects */}
                    {selectedRun.side_effects_detected &&
                      (selectedRun.side_effects_detected.warnings.length > 0 ||
                        selectedRun.side_effects_detected.impacts.length > 0) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-text-primary mb-2">
                            Side Effects
                          </h4>
                          {selectedRun.side_effects_detected.warnings.length > 0 && (
                            <div className="mb-2">
                              <div className="text-xs text-text-tertiary mb-1">Warnings</div>
                              <ul className="space-y-1">
                                {selectedRun.side_effects_detected.warnings.map((warning, i) => (
                                  <li key={i} className="text-xs text-text-secondary flex gap-2">
                                    <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Actions Taken */}
                    {selectedRun.actions_taken && selectedRun.actions_taken.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-primary mb-2">
                          Actions Taken
                        </h4>
                        <div className="space-y-2">
                          {selectedRun.actions_taken.map((action, i) => (
                            <div
                              key={i}
                              className="p-2 bg-bg-tertiary rounded text-xs text-text-secondary"
                            >
                              <div className="font-medium text-text-primary">{action.action}</div>
                              <div>Result: {action.result}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
