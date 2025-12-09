"use client";

/**
 * @fileoverview E44 Intelligence Bus Page
 * Unified stream of cross-domain agent insights and alerts
 */

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

interface IntelligenceSignal {
  id: string;
  source_agent: string;
  domain: string;
  kind: string;
  title: string | null;
  summary: string | null;
  payload: any;
  importance: number;
  created_at: string;
}

interface Summary {
  total_signals: number;
  by_domain: Record<string, number>;
  by_kind: Record<string, number>;
  high_importance: number;
  alerts: number;
  anomalies: number;
}

export default function IntelligenceBusPage() {
  const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = "0642cf92-2617-419f-93ae-1d48652f2b03"; // TODO: Replace with auth context

  const loadData = async () => {
    setLoading(true);
    try {
      const [signalsRes, summaryRes] = await Promise.all([
        fetch(`/api/founder/intelligence-bus?workspaceId=${workspaceId}`),
        fetch(`/api/founder/intelligence-bus?workspaceId=${workspaceId}&action=summary`),
      ]);

      const signalsData = await signalsRes.json();
      const summaryData = await summaryRes.json();

      setSignals(signalsData.signals || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error("Failed to load intelligence bus data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedByDomain = useMemo(() => {
    const groups: Record<string, IntelligenceSignal[]> = {};
    for (const signal of signals) {
      const key = signal.domain || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(signal);
    }
    return groups;
  }, [signals]);

  const getKindBadgeClass = (kind: string) => {
    switch (kind) {
      case "alert":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "anomaly":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "recommendation":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "insight":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "forecast":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "pattern":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex items-center justify-center">
        <div className="text-text-secondary">Loading intelligence bus...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary p-6 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Multi-Agent Intelligence Bus
        </h1>
        <p className="text-sm text-text-secondary">
          Unified stream of cross-domain agent insights and alerts
        </p>
      </header>

      {/* Summary Cards */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Total Signals (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">
                {summary.total_signals}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">High Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-500">
                {summary.high_importance}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{summary.alerts}</div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary">Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">{summary.anomalies}</div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Grouped Signals by Domain */}
      {Object.keys(groupedByDomain).length === 0 ? (
        <Card className="bg-bg-card border-border p-8 text-center">
          <p className="text-sm text-text-secondary">
            No intelligence signals received yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDomain).map(([domain, domainSignals]) => (
            <section key={domain}>
              <Card className="bg-bg-card border-border">
                <CardHeader className="border-b border-border bg-muted/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-text-primary capitalize">
                      {domain}
                    </CardTitle>
                    <span className="text-[11px] text-text-secondary">
                      {domainSignals.length} signal{domainSignals.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardHeader>
                <div className="divide-y divide-border">
                  {domainSignals.map((s) => (
                    <article
                      key={s.id}
                      className="px-4 py-3 flex items-start justify-between gap-4 text-sm"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="text-xs font-mono text-text-secondary">
                          {s.source_agent}
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          {s.title || `${s.kind.charAt(0).toUpperCase()}${s.kind.slice(1)}`}
                        </div>
                        {s.summary && (
                          <div className="text-xs text-text-secondary line-clamp-2">
                            {s.summary}
                          </div>
                        )}
                        {s.payload && Object.keys(s.payload).length > 0 && (
                          <pre className="mt-1 rounded bg-muted px-2 py-1 text-[11px] text-text-secondary max-h-32 overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(s.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-text-secondary space-y-1">
                        <div
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getKindBadgeClass(
                            s.kind
                          )}`}
                        >
                          {s.kind.toUpperCase()}
                        </div>
                        <div>Importance: {s.importance}</div>
                        <div>{new Date(s.created_at).toLocaleString()}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
