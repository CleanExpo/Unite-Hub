'use client';

/**
 * Guardian I06: Gatekeeper Admin Dashboard
 *
 * View and manage gate decisions for pre-deployment validation.
 * Shows change impact assessment and pass/fail/warn decisions.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface GateDecision {
  id: string;
  change_set_id: string;
  status: 'pending' | 'evaluated' | 'failed';
  decision: 'allow' | 'block' | 'warn' | null;
  reason?: string;
  summary?: Record<string, unknown>;
  created_at: string;
  guardian_change_sets?: {
    source: string;
    source_ref?: string;
    change_type: string;
    description?: string;
  };
}

export default function GatekeeperPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [decisions, setDecisions] = useState<GateDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<GateDecision | null>(
    null
  );

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDecision, setFilterDecision] = useState<string>('');

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    loadDecisions();
  }, [workspaceId, filterStatus, filterDecision]);

  async function loadDecisions() {
    if (!workspaceId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ workspaceId });
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      if (filterDecision) {
        params.append('decision', filterDecision);
      }

      const res = await fetch(
        `/api/guardian/admin/gatekeeper/decisions?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error('Failed to load gate decisions');
      }

      const data = await res.json();
      setDecisions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decisions');
    } finally {
      setLoading(false);
    }
  }

  function getDecisionBadge(decision: string | null) {
    const styles: Record<string, string> = {
      allow: 'bg-success-100 text-success-800',
      block: 'bg-error-100 text-error-800',
      warn: 'bg-warning-100 text-warning-800',
    };

    return (
      <span
        className={`inline-block px-2 py-1 rounded text-sm font-medium ${
          decision ? styles[decision] || 'bg-bg-hover' : 'bg-bg-hover'
        }`}
      >
        {decision ? decision.toUpperCase() : 'PENDING'}
      </span>
    );
  }

  return (
    <div className="p-6 bg-bg-primary min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Guardian Change Impact Gatekeeper
          </h1>
          <p className="text-text-secondary">
            Pre-deployment validation for Guardian config changes (rules, playbooks, thresholds)
          </p>
          <div className="mt-4 p-4 bg-info-50 border border-info-200 rounded-lg">
            <p className="text-sm text-info-900">
              <strong>Note:</strong> Gatekeeper provides advisory gate decisions for CI/CD systems
              and admins. It does not enforce or block deployments directly. Final deployment
              decisions are made by external CI/CD pipelines or administrators.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-border rounded px-3 py-2 bg-bg-card text-text-primary"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="evaluated">Evaluated</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Decision
            </label>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="border border-border rounded px-3 py-2 bg-bg-card text-text-primary"
            >
              <option value="">All</option>
              <option value="allow">Allow</option>
              <option value="block">Block</option>
              <option value="warn">Warn</option>
            </select>
          </div>
        </div>

        {/* Gate Decisions List */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-900 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-text-secondary">
            Loading gate decisions...
          </div>
        )}

        {!loading && decisions.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            No gate decisions found
          </div>
        )}

        {!loading && decisions.length > 0 && (
          <div className="bg-bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-secondary border-b border-border">
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Created
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Source
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Decision
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-text-primary">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((decision) => (
                  <tr key={decision.id} className="border-b border-border hover:bg-bg-secondary">
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {new Date(decision.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-primary">
                      {decision.guardian_change_sets?.source || 'unknown'}
                      {decision.guardian_change_sets?.source_ref && (
                        <span className="text-text-secondary text-xs ml-2">
                          ({decision.guardian_change_sets.source_ref})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-primary">
                      {decision.guardian_change_sets?.change_type || 'unknown'}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {getDecisionBadge(decision.decision)}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {decision.status}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => setSelectedDecision(decision)}
                        className="text-accent-500 hover:text-accent-600 underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Panel */}
        {selectedDecision && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-bg-secondary border-b border-border px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-text-primary">
                  Gate Decision Details
                </h2>
                <button
                  onClick={() => setSelectedDecision(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="font-bold text-text-primary mb-3">Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-text-primary">Decision:</span>
                      <span className="ml-2">
                        {getDecisionBadge(selectedDecision.decision)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Status:</span>
                      <span className="ml-2 text-text-secondary">
                        {selectedDecision.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Reason:</span>
                      <span className="ml-2 text-text-secondary">
                        {selectedDecision.reason || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Info */}
                {selectedDecision.guardian_change_sets && (
                  <div>
                    <h3 className="font-bold text-text-primary mb-3">Change Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-text-primary">Source:</span>
                        <span className="ml-2 text-text-secondary">
                          {selectedDecision.guardian_change_sets.source}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-text-primary">Type:</span>
                        <span className="ml-2 text-text-secondary">
                          {selectedDecision.guardian_change_sets.change_type}
                        </span>
                      </div>
                      {selectedDecision.guardian_change_sets.description && (
                        <div>
                          <span className="font-medium text-text-primary">
                            Description:
                          </span>
                          <p className="ml-2 text-text-secondary mt-1">
                            {selectedDecision.guardian_change_sets.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Data */}
                {selectedDecision.summary && (
                  <div>
                    <h3 className="font-bold text-text-primary mb-3">Evaluation Summary</h3>
                    <pre className="bg-bg-secondary p-3 rounded text-xs text-text-secondary overflow-auto max-h-64">
                      {JSON.stringify(selectedDecision.summary, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Related Artifacts */}
                <div className="text-sm text-text-secondary border-t border-border pt-4">
                  <p>
                    Related regression runs and drift reports can be found in the I01–I05
                    dashboards using the run IDs in the evaluation summary above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
