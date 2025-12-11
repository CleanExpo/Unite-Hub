'use client';

/**
 * Guardian I10: Unified QA Console
 *
 * Single pane of glass for all QA operations across I01-I09.
 * Overview of KPIs, feature flag controls, and recent audit events.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, Shield, TrendingUp, BarChart3 } from 'lucide-react';

interface QaFeatureFlags {
  enableSimulation: boolean;
  enableRegression: boolean;
  enableChaos: boolean;
  enableGatekeeper: boolean;
  enableTraining: boolean;
  enablePerformance: boolean;
  enableCoverage: boolean;
  enableDriftMonitor: boolean;
  enableAiScoring: boolean;
}

interface QaStats {
  simulationsLast30d: number;
  regressionPacks: number;
  regressionRunsLast30d: number;
  driftReportsCriticalLast30d: number;
  gatekeeperDecisionsLast30d: { allow: number; block: number; warn: number };
  drillsCompletedLast30d: number;
  coverageSnapshotsLast30d: number;
  performanceRunsLast30d: number;
}

interface QaCoverage {
  criticalRules: { total: number; averageCoverageScore: number; blindSpots: number };
  playbooks: { total: number; neverSimulated: number };
}

interface QaAlert {
  occurredAt: string;
  source: string;
  eventType: string;
  severity: string;
  summary: string;
  sourceId?: string;
}

interface QaOverview {
  stats: QaStats;
  coverage: QaCoverage;
  flags: QaFeatureFlags;
  latestAlerts: QaAlert[];
}

const FLAG_DESCRIPTIONS: Record<string, string> = {
  enableSimulation: 'Run scenario simulations (I01-I03)',
  enableRegression: 'Create and run regression packs (I02-I04)',
  enableChaos: 'Execute chaos/failure injection tests (I03)',
  enableGatekeeper: 'Pre-deployment change impact analysis (I06)',
  enableTraining: 'Run operator drills and war-games (I07)',
  enablePerformance: 'Execute performance and load tests (I09)',
  enableCoverage: 'Generate QA coverage snapshots (I08)',
  enableDriftMonitor: 'Monitor test drift and anomalies (I05)',
  enableAiScoring: 'AI-driven test scoring and analysis',
};

export default function QaConsolePage() {
  const params = useSearchParams();
  const workspaceId = params.get('workspaceId');

  const [overview, setOverview] = useState<QaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [savingFlags, setSavingFlags] = useState(false);
  const [flags, setFlags] = useState<QaFeatureFlags | null>(null);

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
      const res = await fetch(`/api/guardian/admin/qa/overview?workspaceId=${workspaceId}`);
      if (!res.ok) {
throw new Error('Failed to load QA overview');
}
      const data = await res.json();
      setOverview(data.data.overview);
      setFlags(data.data.overview.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function saveFlags() {
    if (!flags || !workspaceId) {
return;
}
    setSavingFlags(true);
    try {
      const res = await fetch(`/api/guardian/admin/qa/settings?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });
      if (!res.ok) {
throw new Error('Failed to save flags');
}
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flags');
    } finally {
      setSavingFlags(false);
    }
  }

  const toggleFlag = (key: keyof QaFeatureFlags) => {
    if (flags) {
      setFlags({ ...flags, [key]: !flags[key] });
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">Loading QA Console...</div>;
  }

  if (!overview) {
    return <div className="p-8 text-center text-text-tertiary">No QA data available</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Guardian QA & Chaos Console</h1>
        <p className="text-text-secondary mt-2">Unified control center for I01–I09 QA operations</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-bg-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-accent-500 text-accent-500'
              : 'text-text-secondary'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'settings'
              ? 'border-b-2 border-accent-500 text-accent-500'
              : 'text-text-secondary'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'events'
              ? 'border-b-2 border-accent-500 text-accent-500'
              : 'text-text-secondary'
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<BarChart3 className="text-accent-500" />}
              label="Simulations (30d)"
              value={overview.stats.simulationsLast30d}
            />
            <KpiCard
              icon={<TrendingUp className="text-accent-500" />}
              label="Regression Runs (30d)"
              value={overview.stats.regressionRunsLast30d}
            />
            <KpiCard
              icon={<Shield className="text-accent-500" />}
              label="Critical Drift Reports (30d)"
              value={overview.stats.driftReportsCriticalLast30d}
            />
            <KpiCard
              icon={<Clock className="text-accent-500" />}
              label="Drills Completed (30d)"
              value={overview.stats.drillsCompletedLast30d}
            />
            <KpiCard
              icon={<BarChart3 className="text-accent-500" />}
              label="Performance Tests (30d)"
              value={overview.stats.performanceRunsLast30d}
            />
            <KpiCard
              icon={<CheckCircle2 className="text-accent-500" />}
              label="Coverage Snapshots (30d)"
              value={overview.stats.coverageSnapshotsLast30d}
            />
          </div>

          {/* Coverage Snapshot */}
          <div className="rounded-lg border border-bg-border bg-bg-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Coverage & Rules</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Critical Rules</p>
                <p className="text-2xl font-bold text-text-primary">{overview.coverage.criticalRules.total}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Avg Coverage Score</p>
                <p className="text-2xl font-bold text-text-primary">
                  {(overview.coverage.criticalRules.averageCoverageScore * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Blind Spots</p>
                <p className="text-2xl font-bold text-red-600">{overview.coverage.criticalRules.blindSpots}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Playbooks Total</p>
                <p className="text-2xl font-bold text-text-primary">{overview.coverage.playbooks.total}</p>
              </div>
            </div>
          </div>

          {/* Latest Events */}
          <div className="rounded-lg border border-bg-border bg-bg-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Latest QA Events</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {overview.latestAlerts.length === 0 ? (
                <p className="text-text-secondary">No recent events</p>
              ) : (
                overview.latestAlerts.slice(0, 10).map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded p-3 bg-bg-secondary">
                    <div className={`mt-1 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning' ? 'text-yellow-600' :
                      'text-text-secondary'
                    }`}>
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{alert.summary}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {alert.source} • {alert.eventType}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && flags && (
        <div className="space-y-6">
          <div className="rounded-lg border border-bg-border bg-bg-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">QA Feature Flags</h3>
            <p className="text-sm text-text-secondary mb-6">Control which QA features are available for this tenant</p>

            <div className="space-y-4">
              {(Object.keys(flags) as Array<keyof QaFeatureFlags>).map((key) => (
                <div key={key} className="flex items-center justify-between p-4 rounded bg-bg-secondary">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-text-primary">
                      {key.replace(/^enable/, '')}
                    </label>
                    <p className="text-xs text-text-secondary mt-1">
                      {FLAG_DESCRIPTIONS[key] || 'QA feature control'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(key)}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      flags[key]
                        ? 'bg-accent-500 text-white'
                        : 'bg-bg-tertiary text-text-secondary'
                    }`}
                  >
                    {flags[key] ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={saveFlags}
              disabled={savingFlags}
              className="mt-6 px-6 py-2 bg-accent-500 text-white rounded font-medium hover:bg-accent-600 disabled:opacity-50"
            >
              {savingFlags ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'events' && (
        <div className="rounded-lg border border-bg-border bg-bg-card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">QA Audit Events</h3>
          <div className="text-sm text-text-secondary">
            View full audit log: <a href={`/api/guardian/admin/qa/audit?workspaceId=${workspaceId}`} className="text-accent-500 hover:underline">JSON API</a>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
        </div>
        <div className="p-2 bg-bg-secondary rounded">{icon}</div>
      </div>
    </div>
  );
}
