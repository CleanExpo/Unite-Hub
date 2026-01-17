'use client';

/**
 * Guardian I09: Performance & Cost QA Console
 * Load testing, SLO evaluation, and AI cost monitoring
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface PerformanceProfile {
  id: string;
  name: string;
  description?: string;
  profile_type: string;
  target_entity_type: string;
  target_entity_id?: string;
  load_config: Record<string, unknown>;
  slo_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

interface PerformanceRun {
  id: string;
  profile_id: string;
  profile_name?: string;
  started_at: string;
  finished_at?: string;
  status: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  slo_result?: string;
  latency_stats?: Record<string, unknown>;
  ai_usage?: Record<string, unknown>;
}

interface AiUsageItem {
  context: string;
  totalTokens: number;
  totalCalls: number;
  estimatedCostUsd: number;
  budgetState: string;
}

export default function PerformancePage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [profiles, setProfiles] = useState<PerformanceProfile[]>([]);
  const [runs, setRuns] = useState<PerformanceRun[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRun, setSelectedRun] = useState<PerformanceRun | null>(null);
  const [_showCreateProfile, _setShowCreateProfile] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
return;
}
    loadData();
  }, [workspaceId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Load profiles
      const profilesRes = await fetch(`/api/guardian/admin/qa/performance/profiles?workspaceId=${workspaceId}&isActive=true`);
      if (!profilesRes.ok) {
throw new Error('Failed to load profiles');
}
      const profilesData = await profilesRes.json();
      setProfiles(profilesData.data?.profiles || []);

      // Load runs
      const runsRes = await fetch(`/api/guardian/admin/qa/performance/runs?workspaceId=${workspaceId}&limit=20`);
      if (!runsRes.ok) {
throw new Error('Failed to load runs');
}
      const runsData = await runsRes.json();
      setRuns(runsData.data?.runs || []);

      // Load AI usage
      const aiRes = await fetch(`/api/guardian/admin/qa/ai-usage?workspaceId=${workspaceId}&lookbackDays=30`);
      if (!aiRes.ok) {
throw new Error('Failed to load AI usage');
}
      const aiData = await aiRes.json();
      setAiUsage(aiData.data?.usage || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function startRun(profileId: string) {
    try {
      const res = await fetch(`/api/guardian/admin/qa/performance/runs?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      if (!res.ok) {
throw new Error('Failed to start run');
}
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    }
  }

  const recentRun = runs[0];
  const criticalAiUsage = aiUsage.filter((u) => u.budgetState === 'exceeded');
  const warningAiUsage = aiUsage.filter((u) => u.budgetState === 'warning');

  return (
    <div className="p-6 bg-bg-primary min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Performance & Cost QA</h1>
          <p className="text-text-secondary">Load testing, SLO evaluation, and AI cost monitoring</p>
          <div className="mt-4 p-4 bg-info-50 border border-info-200 rounded-lg">
            <p className="text-sm text-info-900">
              <strong>Simulation Only:</strong> All performance tests run against I01–I08 simulation flows.
              No production capacity or costs are affected.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">{error}</div>
        )}

        {/* KPI Cards */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
            <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
              <p className="text-sm text-text-secondary">Last Run SLO</p>
              <p className="text-2xl font-bold mt-2 text-text-primary">
                {recentRun?.slo_result?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
              <p className="text-sm text-text-secondary">Last Run P95</p>
              <p className="text-2xl font-bold mt-2 text-text-primary">
                {recentRun?.latency_stats?.overall?.p95 ? Math.round(recentRun.latency_stats.overall.p95) + 'ms' : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
              <p className="text-sm text-text-secondary">Total Profiles</p>
              <p className="text-2xl font-bold mt-2 text-text-primary">{profiles.length}</p>
            </div>
            <div className="p-4 bg-bg-card border border-border-subtle rounded-lg">
              <p className="text-sm text-text-secondary">AI Budget Alerts</p>
              <p className="text-2xl font-bold mt-2 text-error-600">{criticalAiUsage.length}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center py-12 text-text-secondary">Loading...</div>}

        {/* Tabs */}
        {!loading && (
          <>
            <div className="flex gap-4 mb-6 border-b border-border-subtle">
              {['overview', 'profiles', 'runs', 'ai-usage'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-accent-500 text-accent-500'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab === 'ai-usage' ? 'AI Usage' : tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Performance</h2>
                {recentRun ? (
                  <div className="p-6 bg-bg-card border border-border-subtle rounded-lg">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-text-secondary">Total Requests</p>
                        <p className="text-2xl font-bold text-text-primary">{recentRun.total_requests}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Success Rate</p>
                        <p className="text-2xl font-bold text-success-600">
                          {recentRun.total_requests > 0 ? ((recentRun.successful_requests / recentRun.total_requests) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">SLO Result</p>
                        <p className={`text-2xl font-bold ${recentRun.slo_result === 'pass' ? 'text-success-600' : recentRun.slo_result === 'fail' ? 'text-error-600' : 'text-warning-600'}`}>
                          {recentRun.slo_result?.toUpperCase() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Started: {new Date(recentRun.started_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-text-secondary">No runs yet. Create a profile and start testing.</p>
                )}
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div>
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setShowCreateProfile(true)}
                    className="px-4 py-2 bg-accent-500 text-white rounded hover:bg-accent-600"
                  >
                    Create Profile
                  </button>
                </div>

                {profiles.length === 0 ? (
                  <p className="text-center text-text-secondary">No profiles. Create one to start testing.</p>
                ) : (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="p-4 bg-bg-card border border-border-subtle rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{profile.name}</h3>
                            {profile.description && (
                              <p className="text-sm text-text-secondary mt-1">{profile.description}</p>
                            )}
                            <div className="flex gap-2 mt-2 text-xs">
                              <span className="bg-info-100 text-info-800 px-2 py-1 rounded">{profile.profile_type}</span>
                              <span className="bg-bg-hover text-text-secondary px-2 py-1 rounded">{profile.target_entity_type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => startRun(profile.id)}
                            className="px-4 py-2 bg-success-600 text-white rounded hover:bg-success-700 whitespace-nowrap"
                          >
                            Run Test
                          </button>
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
                {runs.length === 0 ? (
                  <p className="text-center text-text-secondary">No runs. Start a performance test from the Profiles tab.</p>
                ) : (
                  <div className="space-y-3">
                    {runs.map((run) => (
                      <div
                        key={run.id}
                        className="p-4 bg-bg-card border border-border-subtle rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedRun(run)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{run.profile_name || 'Run'}</h3>
                            <div className="flex gap-3 mt-2 text-sm">
                              <span className="text-text-secondary">{run.total_requests} requests</span>
                              <span
                                className={`font-medium ${
                                  run.status === 'completed'
                                    ? 'text-success-600'
                                    : run.status === 'failed'
                                      ? 'text-error-600'
                                      : 'text-warning-600'
                                }`}
                              >
                                {run.status}
                              </span>
                              {run.slo_result && (
                                <span
                                  className={`font-medium ${
                                    run.slo_result === 'pass'
                                      ? 'text-success-600'
                                      : run.slo_result === 'fail'
                                        ? 'text-error-600'
                                        : 'text-warning-600'
                                  }`}
                                >
                                  SLO: {run.slo_result.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">
                              {new Date(run.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Run Detail Modal */}
                {selectedRun && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                      <div className="sticky top-0 bg-bg-secondary border-b border-border px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-text-primary">Run Details</h2>
                        <button
                          onClick={() => setSelectedRun(null)}
                          className="text-text-secondary hover:text-text-primary text-xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-text-secondary text-sm">Total Requests</p>
                            <p className="text-2xl font-bold text-text-primary">{selectedRun.total_requests}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-sm">Successful</p>
                            <p className="text-2xl font-bold text-success-600">{selectedRun.successful_requests}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-sm">Failed</p>
                            <p className="text-2xl font-bold text-error-600">{selectedRun.failed_requests}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-sm">SLO Result</p>
                            <p
                              className={`text-2xl font-bold ${
                                selectedRun.slo_result === 'pass'
                                  ? 'text-success-600'
                                  : selectedRun.slo_result === 'fail'
                                    ? 'text-error-600'
                                    : 'text-warning-600'
                              }`}
                            >
                              {selectedRun.slo_result?.toUpperCase() || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {selectedRun.latency_stats?.overall && (
                          <div className="pt-4 border-t border-border">
                            <h3 className="font-semibold text-text-primary mb-2">Latency Stats (ms)</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-text-secondary">P50</p>
                                <p className="text-lg font-medium text-text-primary">
                                  {Math.round(selectedRun.latency_stats.overall.p50 || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-text-secondary">P95</p>
                                <p className="text-lg font-medium text-text-primary">
                                  {Math.round(selectedRun.latency_stats.overall.p95 || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-text-secondary">Max</p>
                                <p className="text-lg font-medium text-text-primary">
                                  {Math.round(selectedRun.latency_stats.overall.max || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Usage Tab */}
            {activeTab === 'ai-usage' && (
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">AI Usage Summary (30 days)</h2>

                {criticalAiUsage.length > 0 && (
                  <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                    <p className="font-semibold text-error-900 mb-2">Budget Exceeded:</p>
                    <div className="space-y-2">
                      {criticalAiUsage.map((item) => (
                        <div key={item.context} className="text-sm text-error-800">
                          <strong>{item.context}:</strong> ${item.estimatedCostUsd.toFixed(2)} | {item.totalTokens} tokens
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {warningAiUsage.length > 0 && (
                  <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="font-semibold text-warning-900 mb-2">Budget Warning:</p>
                    <div className="space-y-2">
                      {warningAiUsage.map((item) => (
                        <div key={item.context} className="text-sm text-warning-800">
                          <strong>{item.context}:</strong> ${item.estimatedCostUsd.toFixed(2)} | {item.totalTokens} tokens
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiUsage.length === 0 ? (
                  <p className="text-center text-text-secondary">No AI usage tracked yet</p>
                ) : (
                  <div className="space-y-3">
                    {aiUsage.map((item) => (
                      <div key={item.context} className="p-4 bg-bg-card border border-border-subtle rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-text-primary">{item.context}</h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {item.totalTokens} tokens | {item.totalCalls} calls
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-text-primary">${item.estimatedCostUsd.toFixed(2)}</p>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                                item.budgetState === 'exceeded'
                                  ? 'bg-error-100 text-error-800'
                                  : item.budgetState === 'warning'
                                    ? 'bg-warning-100 text-warning-800'
                                    : 'bg-success-100 text-success-800'
                              }`}
                            >
                              {item.budgetState.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
