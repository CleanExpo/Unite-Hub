'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Risk Score Dashboard (G47)
 * /guardian/risk
 *
 * Displays current risk score and historical trend
 * Risk score: 0-100 scale based on recent alerts + incidents
 */

interface RiskItem {
  id: string;
  date: string;
  score: number;
  breakdown: {
    window_days: number;
    alerts_count: number;
    incidents_count: number;
    incident_open_count: number;
    alert_score: number;
    incident_score: number;
    decay: number;
  };
}

export default function GuardianRiskPage() {
  const [items, setItems] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/risk/summary');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load risk scores');
      setItems(json.items ?? []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load Guardian risk data.');
    } finally {
      setLoading(false);
    }
  }

  async function recompute() {
    setRecomputing(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/risk/recompute', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to recompute risk score');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to recompute Guardian risk score.');
    } finally {
      setRecomputing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latest = items[0];
  const riskLevel =
    !latest || latest.score < 25
      ? 'Low'
      : latest.score < 50
      ? 'Medium'
      : latest.score < 75
      ? 'High'
      : 'Critical';

  const riskColor =
    !latest || latest.score < 25
      ? 'text-cyan-400'
      : latest.score < 50
      ? 'text-amber-400'
      : latest.score < 75
      ? 'text-orange-400'
      : 'text-red-400';

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Risk Score</h1>
        <p className="text-sm text-muted-foreground">
          Standardized risk index for your workspace based on recent Guardian alerts and
          incidents (7-day rolling window).
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current Score Section */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Current Risk Score
            </p>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${riskColor}`}>
                {latest ? latest.score : '—'}
              </span>
              <span className="text-lg font-medium text-muted-foreground">/  100</span>
            </div>
            <p className="text-sm font-medium">{riskLevel} Risk</p>
            {latest && (
              <p className="text-xs text-muted-foreground">As of {latest.date}</p>
            )}
          </div>
          <button
            type="button"
            onClick={recompute}
            disabled={recomputing}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {recomputing ? 'Recomputing…' : 'Recompute now'}
          </button>
        </div>

        {/* Breakdown */}
        {latest && (
          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Alerts ({windowDays} days)</p>
              <p className="text-2xl font-semibold">{latest.breakdown?.alerts_count ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">
                Score: {latest.breakdown?.alert_score ?? 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Incidents ({windowDays} days)</p>
              <p className="text-2xl font-semibold">
                {latest.breakdown?.incidents_count ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Score: {latest.breakdown?.incident_score ?? 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Open Incidents</p>
              <p className="text-2xl font-semibold">
                {latest.breakdown?.incident_open_count ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Penalty: +5 each</p>
            </div>
          </div>
        )}
      </section>

      {/* History Section */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Score History</h2>
        {loading && items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading history…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No historical risk scores computed yet. Click "Recompute now" to generate your first
            score.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Risk Level</th>
                  <th className="px-3 py-2 text-left">Alerts</th>
                  <th className="px-3 py-2 text-left">Incidents</th>
                  <th className="px-3 py-2 text-left">Open</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const level =
                    i.score < 25 ? 'Low' : i.score < 50 ? 'Medium' : i.score < 75 ? 'High' : 'Critical';
                  const color =
                    i.score < 25
                      ? 'text-cyan-400'
                      : i.score < 50
                      ? 'text-amber-400'
                      : i.score < 75
                      ? 'text-orange-400'
                      : 'text-red-400';
                  return (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{i.date}</td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${color}`}>{i.score}</span>
                      </td>
                      <td className="px-3 py-2">{level}</td>
                      <td className="px-3 py-2">{i.breakdown?.alerts_count ?? 0}</td>
                      <td className="px-3 py-2">{i.breakdown?.incidents_count ?? 0}</td>
                      <td className="px-3 py-2">{i.breakdown?.incident_open_count ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
