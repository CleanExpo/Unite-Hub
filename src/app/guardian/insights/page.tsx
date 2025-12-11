'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Insights Dashboard (G50)
 * /guardian/insights
 *
 * High-level overview of Guardian activity:
 * - Alert counts (24h, 7d)
 * - Incident counts (30d, open)
 * - Top triggering rules
 * - Latest risk score
 */

interface TopRule {
  rule_id: string;
  count: number;
}

interface RiskLatest {
  date: string;
  score: number;
}

interface Summary {
  alerts_last_24h: number;
  alerts_last_7d: number;
  incidents_last_30d: number;
  open_incidents: number;
  top_rules: TopRule[];
  risk_latest?: RiskLatest | null;
}

export default function GuardianInsightsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/insights/summary');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load Guardian insights');
      setSummary(json.summary ?? null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load Guardian insights.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const riskLevel =
    !summary?.risk_latest || summary.risk_latest.score < 25
      ? 'Low'
      : summary.risk_latest.score < 50
      ? 'Medium'
      : summary.risk_latest.score < 75
      ? 'High'
      : 'Critical';

  const riskColor =
    !summary?.risk_latest || summary.risk_latest.score < 25
      ? 'text-cyan-400'
      : summary.risk_latest.score < 50
      ? 'text-amber-400'
      : summary.risk_latest.score < 75
      ? 'text-orange-400'
      : 'text-red-400';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Insights</h1>
        <p className="text-sm text-muted-foreground">
          High-level view of Guardian alerts, incidents, and risk for your workspace.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <p className="text-sm text-muted-foreground">Loading insights…</p>
      ) : !summary ? (
        <p className="text-sm text-muted-foreground">No Guardian activity yet.</p>
      ) : (
        <>
          {/* Metrics Cards */}
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Alerts (24h)
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.alerts_last_24h}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Alerts (7d)
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.alerts_last_7d}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Incidents (30d)
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.incidents_last_30d}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Open Incidents
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.open_incidents}</p>
            </div>
          </section>

          {/* Top Rules + Risk */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Top rules (7d)</h2>
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              {summary.top_rules.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No alert activity in the last 7 days.
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {summary.top_rules.map((r) => (
                    <li key={r.rule_id} className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px]">
                        {r.rule_id.substring(0, 8)}…
                      </span>
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        {r.count} alerts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-sm font-medium">Risk Score</h2>
              {summary.risk_latest ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className={`text-5xl font-bold ${riskColor}`}>
                      {summary.risk_latest.score}
                    </span>
                    <span className="text-lg font-medium text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-sm font-medium">{riskLevel} Risk</p>
                  <p className="text-xs text-muted-foreground">As of {summary.risk_latest.date}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No risk scores computed yet. Visit /guardian/risk to generate your first score.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
