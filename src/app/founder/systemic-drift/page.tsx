"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type SystemicDrift = {
  id: string;
  drift_score: number;
  drift_category: string;
  drift_severity: string;
  contributing_factors: any;
  intent_vector: any;
  execution_vector: any;
  alignment_angle: number | null;
  affected_domains: string[] | null;
  root_causes: string[] | null;
  created_at: string;
};

type DriftSummary = {
  avg_drift_score: number;
  max_drift_score: number;
  critical_count: number;
  by_category: Record<string, number>;
  period_days: number;
};

export default function SystemicDriftPage() {
  const [drifts, setDrifts] = useState<SystemicDrift[]>([]);
  const [summary, setSummary] = useState<DriftSummary | null>(null);
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
          `/api/founder/systemic-drift?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get drift history
        const driftRes = await fetch(
          `/api/founder/systemic-drift?workspaceId=${workspaceId}&limit=50`
        );
        const driftData = await driftRes.json();
        setDrifts(driftData.drifts || []);
      } catch (error) {
        console.error("Failed to load systemic drift:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const categoryColor = (category: string) => {
    switch (category) {
      case "alignment_loss":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      case "focus_split":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "execution_gap":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "external_pressure":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "resource_constraint":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "priority_conflict":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-bg-subtle text-text-secondary border-border";
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-error-500/10 text-error-400";
      case "significant":
        return "bg-accent-500/10 text-accent-400";
      case "moderate":
        return "bg-warning-500/10 text-warning-400";
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
        <div className="text-text-secondary">Please log in to view systemic drift analysis.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Systemic Drift Detector
        </h1>
        <p className="text-text-secondary">
          Identifies deviations between founder intent and execution reality
        </p>
      </header>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Drift Score</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.avg_drift_score)}`}>
              {summary.avg_drift_score.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Max Drift</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.max_drift_score)}`}>
              {summary.max_drift_score.toFixed(0)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Critical Events</div>
            <div className="text-3xl font-semibold text-error-400">
              {summary.critical_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Period</div>
            <div className="text-3xl font-semibold text-text-primary">
              {summary.period_days}d
            </div>
          </Card>
        </div>
      )}

      {/* Drift History */}
      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Drift Events</h2>
        </div>

        <div className="divide-y divide-border">
          {drifts.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No drift events detected
            </div>
          ) : (
            drifts.map((drift) => (
              <div key={drift.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColor(
                        drift.drift_category
                      )}`}
                    >
                      {drift.drift_category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor(
                        drift.drift_severity
                      )}`}
                    >
                      {drift.drift_severity}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${scoreColor(drift.drift_score)}`}>
                      {drift.drift_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">drift score</div>
                  </div>
                </div>

                {drift.alignment_angle !== null && (
                  <div className="mb-3 text-sm text-text-secondary">
                    Alignment Angle: <span className="text-text-primary font-medium">{drift.alignment_angle.toFixed(1)}°</span>
                  </div>
                )}

                {drift.affected_domains && drift.affected_domains.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Affected Domains</div>
                    <div className="flex flex-wrap gap-2">
                      {drift.affected_domains.map((domain, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-bg-subtle text-text-primary text-xs"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {drift.root_causes && drift.root_causes.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Root Causes</div>
                    <div className="text-sm text-text-primary">
                      <ul className="list-disc list-inside space-y-1">
                        {drift.root_causes.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary mt-4">
                  {new Date(drift.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
