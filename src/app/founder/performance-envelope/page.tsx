"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type PerformanceEnvelope = {
  id: string;
  envelope_state: string;
  load_index: number;
  efficiency_index: number;
  capacity_utilization: number | null;
  performance_score: number | null;
  overhead_ratio: number | null;
  envelope_factors: any;
  limiting_factors: string[] | null;
  enhancing_factors: string[] | null;
  created_at: string;
};

type EnvelopeSummary = {
  avg_load_index: number;
  avg_efficiency_index: number;
  current_state: string;
  critical_count: number;
  overloaded_count: number;
  optimal_count: number;
  period_days: number;
};

export default function PerformanceEnvelopePage() {
  const [envelopes, setEnvelopes] = useState<PerformanceEnvelope[]>([]);
  const [summary, setSummary] = useState<EnvelopeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        const summaryRes = await fetch(
          `/api/founder/performance-envelope?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const envelopeRes = await fetch(
          `/api/founder/performance-envelope?workspaceId=${workspaceId}&limit=50`
        );
        const envelopeData = await envelopeRes.json();
        setEnvelopes(envelopeData.envelopes || []);
      } catch (error) {
        console.error("Failed to load performance envelope:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const stateColor = (state: string) => {
    const colors: Record<string, string> = {
      optimal: "bg-success-500/10 text-success-400 border-emerald-500/20",
      stable: "bg-info-500/10 text-info-400 border-info-500/20",
      strained: "bg-warning-500/10 text-warning-400 border-warning-500/20",
      overloaded: "bg-accent-500/10 text-accent-400 border-accent-500/20",
      critical: "bg-error-500/10 text-error-400 border-error-500/20",
      recovery: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[state] || "bg-bg-subtle text-text-secondary border-border";
  };

  const indexColor = (value: number) => {
    if (value >= 90) {
return "text-error-400";
}
    if (value >= 75) {
return "text-accent-400";
}
    if (value >= 60) {
return "text-warning-400";
}
    if (value >= 40) {
return "text-success-400";
}
    return "text-success-400";
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-text-secondary">Loading...</div>
      </main>
    );
  }

  if (!workspaceId) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-text-secondary">Please log in to view performance envelope analysis.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Founder Performance Envelope
        </h1>
        <p className="text-text-secondary">
          Defines operating limits, ideal bands, and overload thresholds
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Load Index</div>
            <div className={`text-3xl font-semibold ${indexColor(summary.avg_load_index)}`}>
              {summary.avg_load_index.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Efficiency</div>
            <div className={`text-3xl font-semibold ${indexColor(100 - summary.avg_efficiency_index)}`}>
              {summary.avg_efficiency_index.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Current State</div>
            <div className={`px-3 py-2 rounded-lg text-sm font-semibold border ${stateColor(summary.current_state)}`}>
              {summary.current_state}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Optimal Periods</div>
            <div className="text-3xl font-semibold text-success-400">
              {summary.optimal_count}
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Performance History</h2>
        </div>

        <div className="divide-y divide-border">
          {envelopes.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No performance envelope data available
            </div>
          ) : (
            envelopes.map((envelope) => (
              <div key={envelope.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${stateColor(
                        envelope.envelope_state
                      )}`}
                    >
                      {envelope.envelope_state}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${indexColor(envelope.load_index)}`}>
                      {envelope.load_index.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">load index</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Efficiency Index</div>
                    <div className={`font-medium ${indexColor(100 - envelope.efficiency_index)}`}>
                      {envelope.efficiency_index.toFixed(1)}
                    </div>
                  </div>
                  {envelope.capacity_utilization !== null && (
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Capacity</div>
                      <div className="text-text-primary font-medium">
                        {envelope.capacity_utilization.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {envelope.performance_score !== null && (
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Performance</div>
                      <div className="text-text-primary font-medium">
                        {envelope.performance_score.toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>

                {envelope.limiting_factors && envelope.limiting_factors.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Limiting Factors</div>
                    <div className="flex flex-wrap gap-2">
                      {envelope.limiting_factors.map((factor, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-error-500/10 text-error-400 text-xs"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary mt-4">
                  {new Date(envelope.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
