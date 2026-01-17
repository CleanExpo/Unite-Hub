"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type WorkloadRecord = {
  id: string;
  recommended_load: string;
  load_score: number;
  factors: any;
  current_capacity: number | null;
  current_utilization: number | null;
  limiting_factors: string[] | null;
  suggested_actions: string[] | null;
  created_at: string;
};

export default function WorkloadRegulatorPage() {
  const [recommendations, setRecommendations] = useState<WorkloadRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
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
          `/api/founder/workload-regulator?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const recommendationsRes = await fetch(
          `/api/founder/workload-regulator?workspaceId=${workspaceId}&limit=50`
        );
        const recommendationsData = await recommendationsRes.json();
        setRecommendations(recommendationsData.recommendations || []);
      } catch (error) {
        console.error("Failed to load workload data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const recommendationColor = (rec: string) => {
    switch (rec) {
      case "increase":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "maintain":
        return "bg-info-500/10 text-info-400 border-info-500/20";
      case "reduce":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "pause":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "halt":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      default:
        return "bg-bg-subtle text-text-secondary border-border";
    }
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
        <div className="text-text-secondary">Please log in to view workload recommendations.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Adaptive Workload Regulator
        </h1>
        <p className="text-text-secondary">
          Dynamically adjusts workload recommendations based on founder state
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Load Score</div>
            <div className="text-3xl font-semibold text-text-primary">
              {summary.avg_load_score.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Current Recommendation</div>
            <div className={`px-3 py-1 inline-block rounded-full text-sm font-medium border ${recommendationColor(summary.current_recommendation)}`}>
              {summary.current_recommendation}
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

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Workload Recommendations</h2>
        </div>

        <div className="divide-y divide-border">
          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No workload recommendations yet
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${recommendationColor(
                      rec.recommended_load
                    )}`}
                  >
                    {rec.recommended_load}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-text-primary">
                      {rec.load_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">load score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  {rec.current_capacity !== null && (
                    <div>
                      <div className="text-text-secondary">Capacity</div>
                      <div className="text-text-primary font-medium">{rec.current_capacity.toFixed(0)}%</div>
                    </div>
                  )}
                  {rec.current_utilization !== null && (
                    <div>
                      <div className="text-text-secondary">Utilization</div>
                      <div className="text-text-primary font-medium">{rec.current_utilization.toFixed(0)}%</div>
                    </div>
                  )}
                </div>

                {rec.suggested_actions && rec.suggested_actions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Suggested Actions</div>
                    <ul className="text-sm text-text-primary list-disc list-inside space-y-1">
                      {rec.suggested_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-text-secondary">
                  {new Date(rec.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
