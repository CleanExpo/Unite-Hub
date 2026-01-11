'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Correlations Dashboard (G46 + H03)
 * /guardian/correlations
 *
 * Displays correlation clusters with AI-powered refinement suggestions
 */

interface ClusterItem {
  id: string;
  key: string;
  severity: string | null;
  status: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
}

interface Recommendation {
  action: string;
  targetClusterIds: string[];
  score: number;
  confidence: number;
  rationale: string;
}

export default function GuardianCorrelationsPage() {
  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCorrelation, setRunningCorrelation] = useState(false);
  const [runningAI, setRunningAI] = useState(false);

  async function loadClusters() {
    setLoading(true);
    setError(null);
    try {
      const supabase = await import('@/lib/supabase/client').then((m) => m.createClient());
      const { data, error: fetchError } = await supabase
        .from('guardian_correlation_clusters')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setClusters((data as ClusterItem[]) ?? []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load correlation clusters.');
    } finally {
      setLoading(false);
    }
  }

  async function runCorrelation() {
    setRunningCorrelation(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/correlation/run', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Correlation run failed');

      await loadClusters();
    } catch (err: any) {
      setError(err?.message || 'Unable to run correlation');
    } finally {
      setRunningCorrelation(false);
    }
  }

  async function runAIReview() {
    setRunningAI(true);
    setError(null);
    setRecommendations([]);

    try {
      const res = await fetch('/api/guardian/ai/correlation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windowHours: 72, limitClusters: 50 }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === 'AI_NOT_CONFIGURED') {
          setError('AI refinement not available (ANTHROPIC_API_KEY not configured)');
        } else {
          setError(json.error || 'AI refinement failed');
        }
        return;
      }

      setRecommendations(json.recommendations ?? []);
    } catch (err: any) {
      setError(err?.message || 'Unable to get AI recommendations');
    } finally {
      setRunningAI(false);
    }
  }

  useEffect(() => {
    loadClusters();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Correlations</h1>
        <p className="text-sm text-muted-foreground">
          Correlation clusters group related alerts and incidents by time and severity.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={runCorrelation}
          disabled={runningCorrelation}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          {runningCorrelation ? 'Running…' : 'Run Correlation'}
        </button>
        <button
          type="button"
          onClick={runAIReview}
          disabled={runningAI}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          {runningAI ? 'Analyzing…' : '✨ AI Review'}
        </button>
        <button
          type="button"
          onClick={loadClusters}
          disabled={loading}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Clusters List */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">Correlation Clusters</h2>
          {loading && clusters.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading clusters…</p>
          ) : clusters.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No correlation clusters found. Run correlation to create clusters from recent alerts and incidents.
            </p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Cluster ID</th>
                    <th className="px-3 py-2 text-left">Severity</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">First Seen</th>
                    <th className="px-3 py-2 text-left">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-[11px]">
                        {c.id.substring(0, 8)}…
                      </td>
                      <td className="px-3 py-2 capitalize">{c.severity ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">
                        {new Date(c.first_seen).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">
                        {new Date(c.last_seen).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* AI Recommendations Panel */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-medium">AI Recommendations</h2>
            <p className="text-[11px] text-muted-foreground">
              AI-powered suggestions for improving correlation clusters (experimental)
            </p>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Click "AI Review" to get AI-powered cluster refinement suggestions.
            </p>
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-md border bg-background p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {rec.action.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Score: {(rec.score * 100).toFixed(0)}% | Confidence: {(rec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs">{rec.rationale}</p>
                  <div className="text-[11px] text-muted-foreground">
                    Clusters: {rec.targetClusterIds.map((id) => id.substring(0, 8)).join(', ')}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="inline-flex h-6 items-center rounded-md border px-2 text-[11px] hover:bg-muted"
                      disabled
                      title="Manual application in future phase"
                    >
                      Apply (H04+)
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-6 items-center rounded-md border px-2 text-[11px] hover:bg-muted"
                      disabled
                      title="Dismiss feature in future phase"
                    >
                      Dismiss (H04+)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
