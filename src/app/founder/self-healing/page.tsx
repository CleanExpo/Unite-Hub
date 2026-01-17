'use client';

/**
 * Self-Healing & Guardrails Dashboard
 * Phase: D68 - Unite Self-Healing & Guardrail Automation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Filter,
  Zap,
} from 'lucide-react';

interface ErrorSignature {
  id: string;
  signature_key: string;
  category: string;
  severity: string;
  description?: string;
  fix_type: string;
  is_idempotent: boolean;
  is_reversible: boolean;
  auto_approve: boolean;
  occurrence_count: number;
  last_seen_at?: string;
}

interface SelfHealingRun {
  id: string;
  signature_id?: string;
  triggered_by: string;
  status: string;
  fix_action: Record<string, unknown>;
  execution_log?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  rollback_available: boolean;
  created_at: string;
}

interface GuardrailPolicy {
  id: string;
  policy_key: string;
  name: string;
  boundary: string;
  rule_type: string;
  enforcement: string;
  is_active: boolean;
  violation_count: number;
  last_violation_at?: string;
}

export default function SelfHealingPage() {
  const [activeTab, setActiveTab] = useState<'signatures' | 'runs' | 'guardrails'>('signatures');
  const [signatures, setSignatures] = useState<ErrorSignature[]>([]);
  const [runs, setRuns] = useState<SelfHealingRun[]>([]);
  const [policies, setPolicies] = useState<GuardrailPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'signatures') {
      fetchSignatures();
    } else if (activeTab === 'runs') {
      fetchRuns();
    } else {
      fetchPolicies();
    }
  }, [activeTab, severityFilter, statusFilter]);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const severityParam = severityFilter !== 'all' ? `&severity=${severityFilter}` : '';
      const response = await fetch(`/api/unite/self-healing/signatures?limit=100${severityParam}`);
      const data = await response.json();
      if (response.ok) {
        setSignatures(data.signatures || []);
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
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`/api/unite/self-healing/run?limit=100${statusParam}`);
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

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/self-healing/guardrails?limit=100');
      const data = await response.json();
      if (response.ok) {
        setPolicies(data.policies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeRun = async (runId: string) => {
    try {
      const response = await fetch('/api/unite/self-healing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', run_id: runId }),
      });
      if (response.ok) {
        fetchRuns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rollbackRun = async (runId: string) => {
    try {
      const response = await fetch('/api/unite/self-healing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', run_id: runId }),
      });
      if (response.ok) {
        fetchRuns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-error-500/10 text-error-400 border-error-500/20',
      error: 'bg-error-500/10 text-error-400 border-error-500/20',
      warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      info: 'bg-info-500/10 text-info-400 border-info-500/20',
    };
    return colors[severity] || colors.info;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-success-500/10 text-success-400 border-success-500/20',
      running: 'bg-info-500/10 text-info-400 border-info-500/20',
      pending: 'bg-bg-hover0/10 text-text-muted border-border/20',
      failed: 'bg-error-500/10 text-error-400 border-error-500/20',
      rolled_back: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      success: <CheckCircle className="w-5 h-5 text-success-400" />,
      running: <Zap className="w-5 h-5 text-info-400" />,
      pending: <AlertTriangle className="w-5 h-5 text-text-muted" />,
      failed: <XCircle className="w-5 h-5 text-error-400" />,
      rolled_back: <RotateCcw className="w-5 h-5 text-accent-400" />,
    };
    return icons[status] || icons.pending;
  };

  // Summary stats
  const totalSignatures = signatures.length;
  const autoApprovedSignatures = signatures.filter((s) => s.auto_approve).length;
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.status === 'success').length;
  const activePolicies = policies.filter((p) => p.is_active).length;
  const totalViolations = policies.reduce((sum, p) => sum + p.violation_count, 0);

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-accent-500" />
            Self-Healing & Guardrails
          </h1>
          <p className="text-text-secondary">
            AI-powered error detection and automated remediation
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Error Signatures</span>
              <AlertTriangle className="w-5 h-5 text-accent-500" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalSignatures}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {autoApprovedSignatures} auto-approved
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Healing Runs</span>
              <Zap className="w-5 h-5 text-info-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalRuns}</div>
            <div className="text-xs text-text-tertiary mt-1">
              {successfulRuns} successful
            </div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Guardrails</span>
              <Shield className="w-5 h-5 text-success-400" />
            </div>
            <div className="text-3xl font-bold text-text-primary">{activePolicies}</div>
            <div className="text-xs text-text-tertiary mt-1">active policies</div>
          </div>

          <div className="p-6 bg-bg-card rounded-lg border border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Violations</span>
              <XCircle className="w-5 h-5 text-error-400" />
            </div>
            <div className="text-3xl font-bold text-error-400">{totalViolations}</div>
            <div className="text-xs text-text-tertiary mt-1">total blocked</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {[
            { key: 'signatures', label: 'Error Signatures', icon: AlertTriangle },
            { key: 'runs', label: 'Healing Runs', icon: Zap },
            { key: 'guardrails', label: 'Guardrail Policies', icon: Shield },
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

        {/* Error Signatures Tab */}
        {activeTab === 'signatures' && (
          <div>
            {/* Severity Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'critical', 'error', 'warning', 'info'].map((severity) => (
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
              <div className="text-center py-12 text-text-secondary">Loading signatures...</div>
            ) : signatures.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No error signatures found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {signatures.map((signature) => (
                  <div
                    key={signature.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getSeverityColor(
                      signature.severity
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">
                            {signature.signature_key}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {signature.category}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {signature.fix_type}
                          </span>
                        </div>
                        {signature.description && (
                          <p className="text-sm text-text-secondary mb-2">
                            {signature.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-text-tertiary">
                          <span>Occurrences: {signature.occurrence_count}</span>
                          <span>Idempotent: {signature.is_idempotent ? 'Yes' : 'No'}</span>
                          <span>Reversible: {signature.is_reversible ? 'Yes' : 'No'}</span>
                          {signature.auto_approve && (
                            <span className="text-success-400">Auto-approved</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Healing Runs Tab */}
        {activeTab === 'runs' && (
          <div>
            {/* Status Filter */}
            <div className="mb-4 flex gap-2">
              {['all', 'pending', 'running', 'success', 'failed', 'rolled_back'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    statusFilter === status
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Zap className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No healing runs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 bg-bg-card rounded-lg border ${getStatusColor(run.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(run.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {run.fix_action.type || 'Unknown Fix'}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                              {run.triggered_by}
                            </span>
                          </div>
                          <span className="text-xs text-text-tertiary">
                            {new Date(run.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {run.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => executeRun(run.id)}
                              className="bg-accent-500 hover:bg-accent-600"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Execute
                            </Button>
                          )}
                          {run.status === 'success' && run.rollback_available && (
                            <Button
                              size="sm"
                              onClick={() => rollbackRun(run.id)}
                              variant="outline"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guardrail Policies Tab */}
        {activeTab === 'guardrails' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-text-secondary">Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
                <Shield className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary">No guardrail policies found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div
                    key={policy.id}
                    className={`p-4 bg-bg-card rounded-lg border ${
                      policy.is_active
                        ? 'border-success-500/20'
                        : 'border-border-primary opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">{policy.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {policy.boundary}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                            {policy.rule_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              policy.enforcement === 'block'
                                ? 'bg-error-500/10 text-error-400'
                                : policy.enforcement === 'throttle'
                                  ? 'bg-warning-500/10 text-warning-400'
                                  : 'bg-info-500/10 text-info-400'
                            }`}
                          >
                            {policy.enforcement}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-text-tertiary">
                          <span>Violations: {policy.violation_count}</span>
                          <span>Status: {policy.is_active ? 'Active' : 'Inactive'}</span>
                          {policy.last_violation_at && (
                            <span>
                              Last violation:{' '}
                              {new Date(policy.last_violation_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
