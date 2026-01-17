'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Simulation Studio (I02)
 * /guardian/admin/simulation
 *
 * Chaos engineering workspace for testing Guardian pipeline:
 * - Scenario browser and execution
 * - Simulation run history and status
 * - Pipeline trace inspection (timeline, detailed logs, AI summary)
 * - Event distribution analysis
 */

interface SimulationRun {
  id: string;
  scenario_id: string;
  actor_id: string;
  status: 'running' | 'completed' | 'failed';
  impact_estimate: Record<string, any>;
  pipeline_summary: Record<string, any>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface TimelineEvent {
  phase: string;
  count: number;
  severity_breakdown: Record<string, number>;
  first_occurred: string;
  last_occurred: string;
}

interface TraceEntry {
  id: string;
  run_id: string;
  phase: string;
  step_index: number;
  actor: string;
  message: string;
  details: Record<string, any>;
  created_at: string;
}

interface SimulationSummary {
  summaryMarkdown: string;
  keyFindings: string[];
  potentialRisks: string[];
  suggestedNextScenarios: string[];
}

type Tab = 'overview' | 'runs' | 'pipeline' | 'traces';

export default function SimulationStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SimulationRun | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load simulation runs on mount
  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    setLoading(true);
    setError(null);
    try {
      // Mock data since runs table may not exist yet
      const mockRuns: SimulationRun[] = [
        {
          id: 'sim_run_001',
          scenario_id: 'scenario_high_volume',
          actor_id: 'admin_001',
          status: 'completed',
          impact_estimate: {
            estimated_alerts: 2500,
            estimated_incidents: 45,
            estimated_correlation_groups: 12,
            estimated_risk_adjustments: 8
          },
          pipeline_summary: {
            total_synthetic_events: 500,
            simulated_alerts: 2500,
            simulated_incidents: 45,
            simulated_correlations: 12,
            simulated_risk_adjustments: 8,
            simulated_notifications: 150
          },
          started_at: new Date(Date.now() - 86400000).toISOString(),
          completed_at: new Date(Date.now() - 85800000).toISOString()
        }
      ];
      setRuns(mockRuns);
      if (mockRuns.length > 0) {
        setSelectedRun(mockRuns[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load simulation runs');
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/admin/simulation/runs/${runId}/timeline?workspaceId=default`
      );
      if (!res.ok) {
throw new Error('Failed to load timeline');
}
      const { timeline: data } = await res.json();
      setTimeline(data || []);
    } catch (err: any) {
      console.error('Timeline load error:', err);
      // Set mock timeline
      setTimeline([
        {
          phase: 'rule_eval',
          count: 500,
          severity_breakdown: { low: 250, medium: 150, high: 80, critical: 20 },
          first_occurred: new Date(Date.now() - 3600000).toISOString(),
          last_occurred: new Date().toISOString()
        },
        {
          phase: 'alert_aggregate',
          count: 2500,
          severity_breakdown: { low: 1500, medium: 700, high: 250, critical: 50 },
          first_occurred: new Date(Date.now() - 3600000).toISOString(),
          last_occurred: new Date().toISOString()
        },
        {
          phase: 'correlation',
          count: 12,
          severity_breakdown: { low: 2, medium: 4, high: 4, critical: 2 },
          first_occurred: new Date(Date.now() - 3600000).toISOString(),
          last_occurred: new Date().toISOString()
        },
        {
          phase: 'incident',
          count: 45,
          severity_breakdown: { low: 5, medium: 20, high: 15, critical: 5 },
          first_occurred: new Date(Date.now() - 3600000).toISOString(),
          last_occurred: new Date().toISOString()
        },
        {
          phase: 'notification',
          count: 150,
          severity_breakdown: { low: 75, medium: 50, high: 20, critical: 5 },
          first_occurred: new Date(Date.now() - 3600000).toISOString(),
          last_occurred: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTraces(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/guardian/admin/simulation/runs/${runId}/trace?workspaceId=default&page=1&pageSize=50`
      );
      if (!res.ok) {
throw new Error('Failed to load traces');
}
      const { traces: data } = await res.json();
      setTraces(data || []);
    } catch (err: any) {
      console.error('Traces load error:', err);
      setTraces([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateAISummary(runId: string) {
    setGeneratingSummary(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/guardian/admin/simulation/runs/${runId}/summary?workspaceId=default`,
        { method: 'GET' }
      );
      if (!res.ok) {
throw new Error('Failed to generate summary');
}
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingSummary(false);
    }
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (selectedRun) {
      if (tab === 'pipeline') {
        loadTimeline(selectedRun.id);
      } else if (tab === 'traces') {
        loadTraces(selectedRun.id);
      }
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Simulation Studio</h1>
        <p className="text-sm text-muted-foreground">
          Chaos engineering workspace for testing Guardian alert/incident pipeline in isolated sandbox.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('runs')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'runs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Simulation Runs
          </button>
          <button
            onClick={() => handleTabChange('pipeline')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pipeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pipeline Timeline
          </button>
          <button
            onClick={() => handleTabChange('traces')}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'traces'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Trace Details
          </button>
        </div>
      </div>

      {/* Tab Content */}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">What is Simulation Studio?</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Simulation Studio allows you to safely test Guardian alert and incident pipeline behavior
                in an isolated sandbox environment. Synthetic events flow through the full pipeline (rule
                evaluation → alert aggregation → correlation → incidents → risk scoring → notifications)
                without triggering real alerts or notifications.
              </p>
              <p>
                Use this to validate new rule configurations, test incident correlation logic, and
                understand how Guardian handles event storms under various conditions.
              </p>
            </div>
          </section>

          {selectedRun && (
            <section className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Latest Simulation Summary</h2>
                <span className="inline-flex items-center rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                  {selectedRun.status}
                </span>
              </div>

              {/* Impact Estimate */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Impact Estimate</p>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Estimated Alerts</p>
                    <p className="text-2xl font-semibold">
                      {selectedRun.impact_estimate?.estimated_alerts || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Estimated Incidents</p>
                    <p className="text-2xl font-semibold">
                      {selectedRun.impact_estimate?.estimated_incidents || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Correlation Groups</p>
                    <p className="text-2xl font-semibold">
                      {selectedRun.impact_estimate?.estimated_correlation_groups || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Risk Adjustments</p>
                    <p className="text-2xl font-semibold">
                      {selectedRun.impact_estimate?.estimated_risk_adjustments || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pipeline Summary */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Pipeline Execution Summary</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Synthetic Events Generated</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.total_synthetic_events || 0}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Alerts Created</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.simulated_alerts || 0}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Incidents Opened</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.simulated_incidents || 0}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Correlations Formed</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.simulated_correlations || 0}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Risk Adjustments Applied</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.simulated_risk_adjustments || 0}</span>
                  </div>
                  <div className="flex justify-between rounded-lg border bg-muted/50 px-3 py-2">
                    <span>Notifications Modeled</span>
                    <span className="font-semibold">{selectedRun.pipeline_summary?.simulated_notifications || 0}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid gap-2 text-xs text-muted-foreground pt-4 border-t">
                <p>Started: {new Date(selectedRun.started_at).toLocaleString()}</p>
                {selectedRun.completed_at && (
                  <p>Completed: {new Date(selectedRun.completed_at).toLocaleString()}</p>
                )}
                {selectedRun.error_message && (
                  <p className="text-destructive">Error: {selectedRun.error_message}</p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Runs Tab */}
      {activeTab === 'runs' && (
        <section className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Simulation Runs</h2>
            <button
              type="button"
              onClick={loadRuns}
              className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading runs…</p>}

          {!loading && runs.length === 0 && (
            <p className="text-sm text-muted-foreground">No simulation runs yet. Create one to get started.</p>
          )}

          {!loading && runs.length > 0 && (
            <div className="space-y-2">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => {
                    setSelectedRun(run);
                    setActiveTab('overview');
                  }}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedRun?.id === run.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{run.scenario_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        run.status === 'completed'
                          ? 'bg-success-50 text-success-700'
                          : run.status === 'running'
                            ? 'bg-info-50 text-info-700'
                            : 'bg-error-50 text-error-700'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Pipeline Timeline Tab */}
      {activeTab === 'pipeline' && (
        <section className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Pipeline Phase Timeline</h2>
            {selectedRun && (
              <button
                type="button"
                onClick={() => generateAISummary(selectedRun.id)}
                disabled={generatingSummary}
                className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
              >
                {generatingSummary ? 'Analyzing…' : 'Generate AI Summary'}
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading timeline…</p>}

          {!loading && timeline.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedRun ? 'No timeline data. Load a simulation run first.' : 'Select a run to view timeline.'}
            </p>
          )}

          {!loading && timeline.length > 0 && (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.phase} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">{event.phase}</h3>
                    <span className="text-xs font-medium text-muted-foreground">{event.count} events</span>
                  </div>

                  {/* Severity Breakdown */}
                  <div className="flex gap-2 flex-wrap">
                    {event.severity_breakdown?.critical > 0 && (
                      <span className="inline-flex items-center rounded-full bg-error-50 px-2 py-1 text-xs font-medium text-error-700">
                        Critical: {event.severity_breakdown.critical}
                      </span>
                    )}
                    {event.severity_breakdown?.high > 0 && (
                      <span className="inline-flex items-center rounded-full bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
                        High: {event.severity_breakdown.high}
                      </span>
                    )}
                    {event.severity_breakdown?.medium > 0 && (
                      <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700">
                        Medium: {event.severity_breakdown.medium}
                      </span>
                    )}
                    {event.severity_breakdown?.low > 0 && (
                      <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-1 text-xs font-medium text-info-700">
                        Low: {event.severity_breakdown.low}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {new Date(event.first_occurred).toLocaleTimeString()} →{' '}
                    {new Date(event.last_occurred).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {summary && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">AI-Generated Analysis</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary.summaryMarkdown}</p>
                </div>
              </div>

              {summary.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Key Findings</h4>
                  <ul className="space-y-1">
                    {summary.keyFindings.map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.potentialRisks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Potential Risks</h4>
                  <ul className="space-y-1">
                    {summary.potentialRisks.map((risk, i) => (
                      <li key={i} className="text-sm text-warning-600">
                        ⚠️ {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.suggestedNextScenarios.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Suggested Next Scenarios</h4>
                  <ul className="space-y-1">
                    {summary.suggestedNextScenarios.map((scenario, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        → {scenario}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Traces Tab */}
      {activeTab === 'traces' && (
        <section className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Detailed Pipeline Traces</h2>
            {selectedRun && (
              <button
                type="button"
                onClick={() => loadTraces(selectedRun.id)}
                className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted"
              >
                Refresh
              </button>
            )}
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading traces…</p>}

          {!loading && traces.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedRun ? 'No trace data available.' : 'Select a run to view traces.'}
            </p>
          )}

          {!loading && traces.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {traces.map((trace) => (
                <div key={trace.id} className="text-xs border rounded-lg p-2 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-primary">
                      {trace.phase} #{trace.step_index}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(trace.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{trace.message}</p>
                  {Object.keys(trace.details).length > 0 && (
                    <details className="cursor-pointer">
                      <summary className="text-muted-foreground hover:text-foreground">
                        Details
                      </summary>
                      <pre className="mt-1 bg-background p-1 rounded text-xs overflow-auto">
                        {JSON.stringify(trace.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
