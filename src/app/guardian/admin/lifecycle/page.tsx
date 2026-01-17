'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface LifecyclePolicy {
  policy_key: string;
  label: string;
  description: string;
  retention_days: number;
  archive_enabled: boolean;
  delete_enabled: boolean;
  min_keep_rows: number;
  compaction_strategy: string;
}

interface LifecycleResult {
  policy_key: string;
  compacted_rows: number;
  deleted_rows: number;
  retained_rows: number;
  oldest_affected_date?: string;
  newest_affected_date?: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
}

export default function LifecyclePage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [policies, setPolicies] = useState<LifecyclePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<LifecycleResult[] | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LifecyclePolicy>>({});

  // Load policies on mount
  useEffect(() => {
    if (!workspaceId) return;

    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/guardian/meta/lifecycle/policies?workspaceId=${workspaceId}`);
        if (!res.ok) throw new Error('Failed to load policies');
        const data = await res.json();
        setPolicies(data.data.policies || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [workspaceId]);

  const handleRunLifecycle = async () => {
    if (!workspaceId) return;

    try {
      setRunning(true);
      setResults(null);

      const res = await fetch(`/api/guardian/meta/lifecycle/run?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error('Failed to run lifecycle');
      const data = await res.json();
      setResults(data.data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  };

  const handleUpdatePolicy = async (policyKey: string) => {
    if (!workspaceId) return;

    try {
      const updates = [{ policy_key: policyKey, ...editValues }];

      const res = await fetch(`/api/guardian/meta/lifecycle/policies?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) throw new Error('Failed to update policy');
      const data = await res.json();
      setPolicies(data.data.policies || []);
      setEditingPolicy(null);
      setEditValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const startEdit = (policy: LifecyclePolicy) => {
    setEditingPolicy(policy.policy_key);
    setEditValues({
      retention_days: policy.retention_days,
      archive_enabled: policy.archive_enabled,
      delete_enabled: policy.delete_enabled,
      min_keep_rows: policy.min_keep_rows,
      compaction_strategy: policy.compaction_strategy,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading lifecycle policies...</p>
      </div>
    );
  }

  if (error && !policies.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-hover p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Meta Lifecycle & Data Hygiene</h1>
          <p className="text-text-muted mt-2">
            Manage retention, compaction, and deletion policies for Guardian Z-series meta artefacts
            (Z01-Z05). These policies apply only to metadata and do NOT affect core Guardian runtime
            data (alerts, incidents, rules, etc.).
          </p>
        </div>

        {/* Safety Warning */}
        <div className="mb-8 bg-warning-50 border border-warning-300 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-warning-900 mb-1">Z-Series Metadata Only</h3>
            <p className="text-sm text-warning-800">
              These lifecycle policies affect only Z-series meta artefacts (readiness scores,
              adoption signals, reports, nudges, etc.). Core Guardian data (G-series rules,
              H-series incidents, I-series simulations, X-series network data) is completely
              unaffected and will never be deleted by lifecycle operations.
            </p>
          </div>
        </div>

        {/* Run Lifecycle Button */}
        <div className="mb-8">
          <Button
            onClick={handleRunLifecycle}
            disabled={running}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            {running ? 'Running Lifecycle...' : 'Run Lifecycle Now'}
          </Button>
        </div>

        {/* Lifecycle Results */}
        {results && (
          <Card className="mb-8 border-success-300 bg-success-50">
            <CardHeader>
              <CardTitle className="text-success-900">Lifecycle Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-bg-card p-3 rounded border border-success-200">
                  <p className="text-xs text-text-muted">Total Compacted</p>
                  <p className="text-2xl font-bold text-success-700">
                    {results.reduce((sum, r) => sum + r.compacted_rows, 0)}
                  </p>
                </div>
                <div className="bg-bg-card p-3 rounded border border-success-200">
                  <p className="text-xs text-text-muted">Total Deleted</p>
                  <p className="text-2xl font-bold text-error-700">
                    {results.reduce((sum, r) => sum + r.deleted_rows, 0)}
                  </p>
                </div>
                <div className="bg-bg-card p-3 rounded border border-success-200">
                  <p className="text-xs text-text-muted">Successful</p>
                  <p className="text-2xl font-bold text-info-700">
                    {results.filter((r) => r.status === 'success').length}
                  </p>
                </div>
                <div className="bg-bg-card p-3 rounded border border-success-200">
                  <p className="text-xs text-text-muted">Skipped</p>
                  <p className="text-2xl font-bold text-text-secondary">
                    {results.filter((r) => r.status === 'skipped').length}
                  </p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.policy_key} className="bg-bg-card p-4 rounded border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-text-primary">{result.policy_key}</h4>
                        <div className="text-sm text-text-muted mt-1 space-y-1">
                          <p>Compacted: {result.compacted_rows} rows</p>
                          <p>Deleted: {result.deleted_rows} rows</p>
                          <p>Retained: {result.retained_rows} rows</p>
                          {result.oldest_affected_date && (
                            <p>
                              Oldest affected:{' '}
                              {new Date(result.oldest_affected_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          result.status === 'success'
                            ? 'bg-success-100 text-success-800'
                            : result.status === 'skipped'
                              ? 'bg-bg-hover text-text-secondary'
                              : 'bg-error-100 text-error-800'
                        }
                      >
                        {result.status}
                      </Badge>
                    </div>
                    {result.reason && <p className="text-sm text-text-tertiary mt-2">{result.reason}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {policies.map((policy) => (
                <div
                  key={policy.policy_key}
                  className="border border-border rounded-lg p-4 bg-bg-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{policy.label}</h3>
                      <p className="text-sm text-text-muted">{policy.description}</p>
                    </div>
                    <Badge className="bg-info-100 text-info-800">{policy.policy_key}</Badge>
                  </div>

                  {editingPolicy === policy.policy_key ? (
                    <div className="bg-bg-card p-4 rounded border border-info-300 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Retention Days
                        </label>
                        <input
                          type="number"
                          min="7"
                          value={editValues.retention_days || ''}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              retention_days: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-border-subtle rounded"
                        />
                        <p className="text-xs text-text-tertiary mt-1">Minimum 7 days</p>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editValues.archive_enabled || false}
                            onChange={(e) =>
                              setEditValues({ ...editValues, archive_enabled: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-text-secondary">Archive Enabled</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editValues.delete_enabled || false}
                            onChange={(e) =>
                              setEditValues({ ...editValues, delete_enabled: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-text-secondary">Delete Enabled</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Compaction Strategy
                        </label>
                        <select
                          value={editValues.compaction_strategy || 'none'}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              compaction_strategy: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border-subtle rounded"
                        >
                          <option value="none">None</option>
                          <option value="snapshot">Snapshot</option>
                          <option value="aggregate">Aggregate</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdatePolicy(policy.policy_key)}
                          className="bg-success-600 hover:bg-success-700 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingPolicy(null);
                            setEditValues({});
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-muted">Retention Days</p>
                        <p className="text-lg font-semibold text-text-primary">{policy.retention_days}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Archive Enabled</p>
                        <p className="text-lg font-semibold text-text-primary">
                          {policy.archive_enabled ? '✓' : '✗'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Delete Enabled</p>
                        <Badge
                          className={
                            policy.delete_enabled
                              ? 'bg-error-100 text-error-800'
                              : 'bg-success-100 text-success-800'
                          }
                        >
                          {policy.delete_enabled ? 'YES' : 'NO'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Compaction</p>
                        <p className="text-lg font-semibold text-text-primary">
                          {policy.compaction_strategy}
                        </p>
                      </div>
                    </div>
                  )}

                  {editingPolicy !== policy.policy_key && (
                    <Button
                      onClick={() => startEdit(policy)}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      Edit Policy
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
