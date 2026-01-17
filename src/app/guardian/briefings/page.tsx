'use client';

import { useEffect, useState } from 'react';

/**
 * Guardian Executive Briefings (H07)
 * /guardian/briefings
 *
 * AI-generated narrative summaries of Guardian activity
 * Shows key metrics, trends, and prioritized recommendations
 */

interface Briefing {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string;
  model: string;
  summary_markdown: string;
  key_metrics: Record<string, any>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    area: string;
  }>;
  source_features: string[];
  created_at: string;
}

export default function GuardianBriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBriefings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guardian/ai/briefings');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Unable to load briefings');

      setBriefings(json.briefings ?? []);
      if (json.briefings?.length > 0 && !selectedBriefing) {
        setSelectedBriefing(json.briefings[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load briefings');
    } finally {
      setLoading(false);
    }
  }

  async function generateBriefing(periodLabel: '24h' | '7d' | '30d') {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/guardian/ai/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodLabel }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === 'FEATURE_DISABLED') {
          setError('Executive briefings are disabled. Enable in AI Governance settings.');
        } else if (json.code === 'QUOTA_EXCEEDED') {
          setError('Daily AI quota exceeded. Adjust limits in AI Governance settings.');
        } else {
          setError(json.error || 'Unable to generate briefing');
        }
        return;
      }

      await loadBriefings();
      if (json.briefing) {
        setSelectedBriefing(json.briefing);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate briefing');
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadBriefings();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guardian Executive Briefings</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated narrative summaries of Guardian activity with key metrics and recommendations.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generate Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => generateBriefing('24h')}
          disabled={generating}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          {generating ? 'Generating…' : '✨ Generate 24h Briefing'}
        </button>
        <button
          type="button"
          onClick={() => generateBriefing('7d')}
          disabled={generating}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          {generating ? 'Generating…' : '✨ Generate 7d Briefing'}
        </button>
        <button
          type="button"
          onClick={loadBriefings}
          disabled={loading}
          className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs hover:bg-muted disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Briefings List */}
        <section className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-medium">Briefing History</h2>
          {loading && briefings.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading briefings…</p>
          ) : briefings.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No briefings yet. Generate your first briefing using the buttons above.
            </p>
          ) : (
            <ul className="space-y-2">
              {briefings.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBriefing(b)}
                    className={`w-full text-left rounded-md border p-2 text-xs hover:bg-muted ${
                      selectedBriefing?.id === b.id ? 'bg-muted border-primary' : 'bg-background'
                    }`}
                  >
                    <div className="font-medium">{b.period_label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Selected Briefing */}
        <section className="rounded-xl border bg-card p-6 space-y-6">
          {!selectedBriefing ? (
            <p className="text-sm text-muted-foreground">
              Select a briefing from the list or generate a new one.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    {selectedBriefing.period_label.toUpperCase()} Period
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedBriefing.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedBriefing.period_start).toLocaleDateString()} →{' '}
                  {new Date(selectedBriefing.period_end).toLocaleDateString()}
                </p>
              </div>

              {/* Summary */}
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: selectedBriefing.summary_markdown
                      .replace(/\n/g, '<br />')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                  }}
                />
              </div>

              {/* Recommendations */}
              {selectedBriefing.recommendations && selectedBriefing.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Recommendations</h3>
                  <ul className="space-y-2">
                    {selectedBriefing.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{rec.title}</p>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              rec.priority === 'high'
                                ? 'bg-error-500/10 text-error-400'
                                : rec.priority === 'medium'
                                ? 'bg-warning-500/10 text-warning-400'
                                : 'bg-info-500/10 text-info-400'
                            }`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <p className="text-[11px] text-muted-foreground">Area: {rec.area}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Metrics */}
              {selectedBriefing.key_metrics && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Key Metrics</h3>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedBriefing.key_metrics, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
