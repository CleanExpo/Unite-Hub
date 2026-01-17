"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type ResilienceMetric = {
  id: string;
  resilience_score: number;
  resilience_level: string;
  pressure_factors: any;
  stabilising_factors: any;
  net_resilience: number;
  pressure_score: number | null;
  stability_score: number | null;
  stressor_types: string[] | null;
  coping_mechanisms: string[] | null;
  created_at: string;
};

type ResilienceSummary = {
  avg_resilience: number;
  min_resilience: number;
  max_resilience: number;
  current_level: string;
  vulnerable_count: number;
  period_days: number;
};

export default function ResiliencePage() {
  const [metrics, setMetrics] = useState<ResilienceMetric[]>([]);
  const [summary, setSummary] = useState<ResilienceSummary | null>(null);
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
          `/api/founder/resilience?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const metricsRes = await fetch(
          `/api/founder/resilience?workspaceId=${workspaceId}&limit=50`
        );
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      } catch (error) {
        console.error("Failed to load resilience:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const levelColor = (level: string) => {
    switch (level) {
      case "exceptional":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "strong":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "adequate":
        return "bg-info-500/10 text-info-400 border-info-500/20";
      case "vulnerable":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "critical":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      default:
        return "bg-bg-subtle text-text-secondary border-border";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 90) {
return "text-purple-400";
}
    if (score >= 70) {
return "text-success-400";
}
    if (score >= 50) {
return "text-accent-400";
}
    if (score >= 30) {
return "text-warning-400";
}
    return "text-error-400";
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
        <div className="text-text-secondary">Please log in to view resilience metrics.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Founder Resilience Engine
        </h1>
        <p className="text-text-secondary">
          Measures resilience in presence of stressors, drift, and instability
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Resilience</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.avg_resilience)}`}>
              {summary.avg_resilience.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Range</div>
            <div className="text-3xl font-semibold text-text-primary">
              {summary.min_resilience.toFixed(0)}-{summary.max_resilience.toFixed(0)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Current Level</div>
            <div className={`px-3 py-1 inline-block rounded-full text-sm font-medium border ${levelColor(summary.current_level)}`}>
              {summary.current_level}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Vulnerable Events</div>
            <div className="text-3xl font-semibold text-warning-400">
              {summary.vulnerable_count}
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Resilience History</h2>
        </div>

        <div className="divide-y divide-border">
          {metrics.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No resilience data yet
            </div>
          ) : (
            metrics.map((metric) => (
              <div key={metric.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${levelColor(
                      metric.resilience_level
                    )}`}
                  >
                    {metric.resilience_level}
                  </span>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${scoreColor(metric.resilience_score)}`}>
                      {metric.resilience_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">resilience score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary mb-1">Net Resilience</div>
                    <div className="text-text-primary font-medium">{metric.net_resilience.toFixed(1)}</div>
                  </div>
                  {metric.pressure_score !== null && (
                    <div>
                      <div className="text-text-secondary mb-1">Pressure Score</div>
                      <div className="text-error-400 font-medium">{metric.pressure_score.toFixed(1)}</div>
                    </div>
                  )}
                  {metric.stability_score !== null && (
                    <div>
                      <div className="text-text-secondary mb-1">Stability Score</div>
                      <div className="text-success-400 font-medium">{metric.stability_score.toFixed(1)}</div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-text-secondary mt-4">
                  {new Date(metric.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
