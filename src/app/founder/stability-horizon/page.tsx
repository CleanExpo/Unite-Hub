"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type StabilityHorizon = {
  id: string;
  horizon_window: string;
  predicted_risk: string;
  risk_score: number;
  leading_signals: any;
  signal_count: number;
  positive_indicators: number;
  negative_indicators: number;
  probability: number | null;
  confidence_level: number | null;
  risk_factors: any;
  protective_factors: any;
  intervention_suggestions: string[] | null;
  created_at: string;
};

type HorizonSummary = {
  avg_risk_score: number;
  max_risk_score: number;
  critical_count: number;
  high_count: number;
  by_window: Record<string, number>;
  period_days: number;
};

export default function StabilityHorizonPage() {
  const [horizons, setHorizons] = useState<StabilityHorizon[]>([]);
  const [summary, setSummary] = useState<HorizonSummary | null>(null);
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
        // Get summary
        const summaryRes = await fetch(
          `/api/founder/stability-horizon?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get horizon history
        const horizonRes = await fetch(
          `/api/founder/stability-horizon?workspaceId=${workspaceId}&limit=50`
        );
        const horizonData = await horizonRes.json();
        setHorizons(horizonData.horizons || []);
      } catch (error) {
        console.error("Failed to load stability horizon:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const windowColor = (window: string) => {
    switch (window) {
      case "24h":
        return "bg-info-500/10 text-info-400 border-info-500/20";
      case "72h":
        return "bg-cyan-500/10 text-info-400 border-cyan-500/20";
      case "7d":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "14d":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "30d":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      default:
        return "bg-bg-subtle text-text-secondary border-border";
    }
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-error-500/10 text-error-400";
      case "high":
        return "bg-accent-500/10 text-accent-400";
      case "moderate":
        return "bg-warning-500/10 text-warning-400";
      case "low":
        return "bg-success-500/10 text-success-400";
      case "minimal":
        return "bg-success-500/10 text-success-400";
      default:
        return "bg-bg-subtle text-text-secondary";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) {
return "text-error-400";
}
    if (score >= 50) {
return "text-warning-400";
}
    if (score >= 25) {
return "text-accent-400";
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
        <div className="text-text-secondary">Please log in to view stability horizon analysis.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Stability Horizon Scanner
        </h1>
        <p className="text-text-secondary">
          Predicts future stability risks based on multi-phase leading indicators
        </p>
      </header>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Risk Score</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.avg_risk_score)}`}>
              {summary.avg_risk_score.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Max Risk</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.max_risk_score)}`}>
              {summary.max_risk_score.toFixed(0)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Critical Events</div>
            <div className="text-3xl font-semibold text-error-400">
              {summary.critical_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">High Risk Events</div>
            <div className="text-3xl font-semibold text-accent-400">
              {summary.high_count}
            </div>
          </Card>
        </div>
      )}

      {/* Horizon Forecasts */}
      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Stability Forecasts</h2>
        </div>

        <div className="divide-y divide-border">
          {horizons.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No stability forecasts available
            </div>
          ) : (
            horizons.map((horizon) => (
              <div key={horizon.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${windowColor(
                        horizon.horizon_window
                      )}`}
                    >
                      {horizon.horizon_window} horizon
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${riskColor(
                        horizon.predicted_risk
                      )}`}
                    >
                      {horizon.predicted_risk} risk
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${scoreColor(horizon.risk_score)}`}>
                      {horizon.risk_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">risk score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Positive Indicators</div>
                    <div className="text-success-400 font-medium">
                      {horizon.positive_indicators}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Negative Indicators</div>
                    <div className="text-error-400 font-medium">
                      {horizon.negative_indicators}
                    </div>
                  </div>
                  {horizon.probability !== null && (
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Probability</div>
                      <div className="text-text-primary font-medium">
                        {horizon.probability.toFixed(0)}%
                      </div>
                    </div>
                  )}
                  {horizon.confidence_level !== null && (
                    <div>
                      <div className="text-xs text-text-secondary mb-1">Confidence</div>
                      <div className="text-text-primary font-medium">
                        {horizon.confidence_level.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>

                {horizon.intervention_suggestions && horizon.intervention_suggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Suggested Interventions</div>
                    <div className="text-sm text-text-primary">
                      <ul className="list-disc list-inside space-y-1">
                        {horizon.intervention_suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary mt-4">
                  {new Date(horizon.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
