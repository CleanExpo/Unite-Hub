"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type MomentumIndex = {
  id: string;
  momentum_score: number;
  momentum_direction: string;
  velocity: number | null;
  acceleration: number | null;
  trajectory_angle: number | null;
  contributing_signals: any;
  positive_signals: number | null;
  negative_signals: number | null;
  key_drivers: string[] | null;
  momentum_sustainers: string[] | null;
  momentum_drains: string[] | null;
  created_at: string;
};

export default function MomentumPage() {
  const [momentumIndex, setMomentumIndex] = useState<MomentumIndex[]>([]);
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
          `/api/founder/momentum?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const indexRes = await fetch(
          `/api/founder/momentum?workspaceId=${workspaceId}&limit=50`
        );
        const indexData = await indexRes.json();
        setMomentumIndex(indexData.momentumIndex || []);
      } catch (error) {
        console.error("Failed to load momentum:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const directionColor = (direction: string) => {
    switch (direction) {
      case "accelerating_up":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "trending_up":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "stable":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "trending_down":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "accelerating_down":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "volatile":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-bg-subtle text-text-secondary border-border";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) {
return "text-purple-400";
}
    if (score >= 60) {
return "text-emerald-400";
}
    if (score >= 40) {
return "text-accent-400";
}
    if (score >= 20) {
return "text-amber-400";
}
    return "text-red-400";
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
        <div className="text-text-secondary">Please log in to view momentum analysis.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Founder Momentum Engine
        </h1>
        <p className="text-text-secondary">
          Tracks directional momentum across all founder metrics
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Momentum</div>
            <div className={`text-3xl font-semibold ${scoreColor(summary.avg_momentum)}`}>
              {summary.avg_momentum.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Velocity</div>
            <div className="text-3xl font-semibold text-text-primary">
              {summary.avg_velocity.toFixed(1)}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Current Direction</div>
            <div className={`px-3 py-1 inline-block rounded-full text-sm font-medium border ${directionColor(summary.current_direction)}`}>
              {summary.current_direction.replace(/_/g, " ")}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Trend</div>
            <div className="text-2xl font-semibold text-text-primary">
              {summary.trend.replace(/_/g, " ")}
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Momentum History</h2>
        </div>

        <div className="divide-y divide-border">
          {momentumIndex.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No momentum data yet
            </div>
          ) : (
            momentumIndex.map((item) => (
              <div key={item.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${directionColor(
                      item.momentum_direction
                    )}`}
                  >
                    {item.momentum_direction.replace(/_/g, " ")}
                  </span>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${scoreColor(item.momentum_score)}`}>
                      {item.momentum_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">momentum score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  {item.velocity !== null && (
                    <div>
                      <div className="text-text-secondary">Velocity</div>
                      <div className={`font-medium ${item.velocity > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.velocity > 0 ? "+" : ""}{item.velocity.toFixed(1)}
                      </div>
                    </div>
                  )}
                  {item.acceleration !== null && (
                    <div>
                      <div className="text-text-secondary">Acceleration</div>
                      <div className={`font-medium ${item.acceleration > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.acceleration > 0 ? "+" : ""}{item.acceleration.toFixed(1)}
                      </div>
                    </div>
                  )}
                  {item.positive_signals !== null && (
                    <div>
                      <div className="text-text-secondary">Positive Signals</div>
                      <div className="text-emerald-400 font-medium">{item.positive_signals}</div>
                    </div>
                  )}
                  {item.negative_signals !== null && (
                    <div>
                      <div className="text-text-secondary">Negative Signals</div>
                      <div className="text-red-400 font-medium">{item.negative_signals}</div>
                    </div>
                  )}
                </div>

                {item.key_drivers && item.key_drivers.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Key Drivers</div>
                    <div className="flex flex-wrap gap-2">
                      {item.key_drivers.map((driver, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-bg-subtle text-text-primary text-xs"
                        >
                          {driver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
