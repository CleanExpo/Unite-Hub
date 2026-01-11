'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Anomalies Dashboard (H02)
 * /guardian/anomalies
 *
 * Historical anomaly detection results
 * Shows AI-powered anomaly scores with explanations
 */

interface AnomalyItem {
  id: string;
  window_start: string;
  window_end: string;
  anomaly_score: number;
  confidence: number;
  contributing_alert_ids: string[];
  contributing_incident_ids: string[];
  explanation: string;
  created_at: string;
}

export default function GuardianAnomaliesPage() {
  const [items, setItems] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const supabase = await import('@/lib/supabase/client').then((m) => m.createClient());
      const { data, error: fetchError } = await supabase
        .from('guardian_anomaly_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;
      setItems((data as AnomalyItem[]) ?? []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load anomaly scores.');
    } finally {
      setLoading(false);
    }
  }

  async function runDetection() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/anomaly/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windowHours: 24 }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === 'AI_NOT_CONFIGURED') {
          setError('AI anomaly detection not available (ANTHROPIC_API_KEY not configured)');
        } else {
          setError(json.error || 'Anomaly detection failed');
        }
        return;
      }

      await load(); // Reload list
    } catch (err: any) {
      setError(err?.message || 'Unable to run anomaly detection');
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latest = items[0];
  const anomalyLevel =
    !latest || latest.anomaly_score < 0.25
      ? 'Low'
      : latest.anomaly_score < 0.5
      ? 'Medium'
      : latest.anomaly_score < 0.75
      ? 'High'
      : 'Critical';

  const anomalyColor =
    !latest || latest.anomaly_score < 0.25
      ? 'text-cyan-400'
      : latest.anomaly_score < 0.5
      ? 'text-amber-400'
      : latest.anomaly_score < 0.75
      ? 'text-orange-400'
      : 'text-red-400';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Anomaly Detection</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered anomaly detection analyzing recent Guardian alerts and incidents (last 24 hours).
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Latest Anomaly Score */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Latest Anomaly Score
            </p>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${anomalyColor}`}>
                {latest ? latest.anomaly_score.toFixed(2) : '—'}
              </span>
              <span className="text-lg font-medium text-muted-foreground">/ 1.00</span>
            </div>
            <p className="text-sm font-medium">{anomalyLevel} Anomaly</p>
            {latest && (
              <p className="text-xs text-muted-foreground">
                Confidence: {(latest.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={runDetection}
            disabled={running}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {running ? 'Analyzing…' : '✨ Run Detection'}
          </button>
        </div>

        {latest && latest.explanation && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              AI Explanation
            </p>
            <p className="text-sm">{latest.explanation}</p>
          </div>
        )}

        {latest && (
          <div className="border-t pt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Contributing Alerts</p>
              <p className="text-2xl font-semibold">
                {latest.contributing_alert_ids?.length ?? 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Contributing Incidents</p>
              <p className="text-2xl font-semibold">
                {latest.contributing_incident_ids?.length ?? 0}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* History */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Detection History</h2>
        {loading && items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading history…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No anomaly detections run yet. Click "Run Detection" to analyze recent Guardian activity.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Detected At</th>
                  <th className="px-3 py-2 text-left">Window</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Confidence</th>
                  <th className="px-3 py-2 text-left">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const level =
                    i.anomaly_score < 0.25
                      ? 'Low'
                      : i.anomaly_score < 0.5
                      ? 'Medium'
                      : i.anomaly_score < 0.75
                      ? 'High'
                      : 'Critical';
                  const color =
                    i.anomaly_score < 0.25
                      ? 'text-cyan-400'
                      : i.anomaly_score < 0.5
                      ? 'text-amber-400'
                      : i.anomaly_score < 0.75
                      ? 'text-orange-400'
                      : 'text-red-400';

                  const windowStart = new Date(i.window_start);
                  const windowEnd = new Date(i.window_end);
                  const windowDuration = Math.round(
                    (windowEnd.getTime() - windowStart.getTime()) / (60 * 60 * 1000)
                  );

                  return (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{new Date(i.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{windowDuration}h</td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${color}`}>
                          {i.anomaly_score.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{level}</td>
                      <td className="px-3 py-2">{(i.confidence * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2">
                        <p className="line-clamp-2">{i.explanation}</p>
                      </td>
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
