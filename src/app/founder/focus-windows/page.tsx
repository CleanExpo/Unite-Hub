"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type FocusWindow = {
  id: string;
  window_label: string;
  start_time: string;
  end_time: string;
  certainty: number;
  confidence_score: number | null;
  contributing_metrics: any;
  energy_forecast: number | null;
  load_forecast: number | null;
  momentum_forecast: number | null;
  recommended_activities: string[] | null;
  activities_to_avoid: string[] | null;
  optimal_duration_minutes: number | null;
  created_at: string;
};

type FocusWindowsSummary = {
  avg_certainty: number;
  peak_focus_count: number;
  high_focus_count: number;
  next_peak_window: {
    start_time: string;
    end_time: string;
    certainty: number;
  } | null;
  prediction_hours: number;
};

export default function FocusWindowsPage() {
  const [windows, setWindows] = useState<FocusWindow[]>([]);
  const [summary, setSummary] = useState<FocusWindowsSummary | null>(null);
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
          `/api/founder/focus-windows?workspaceId=${workspaceId}&action=summary&hours=48`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        const windowsRes = await fetch(
          `/api/founder/focus-windows?workspaceId=${workspaceId}&limit=50`
        );
        const windowsData = await windowsRes.json();
        setWindows(windowsData.windows || []);
      } catch (error) {
        console.error("Failed to load focus windows:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const labelColor = (label: string) => {
    const colors: Record<string, string> = {
      "peak-focus": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      "high-focus": "bg-green-500/10 text-green-400 border-green-500/20",
      "medium-focus": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "low-focus": "bg-amber-500/10 text-amber-400 border-amber-500/20",
      recovery: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      avoid: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return colors[label] || "bg-bg-subtle text-text-secondary border-border";
  };

  const certaintyColor = (certainty: number) => {
    if (certainty >= 85) {
return "text-emerald-400";
}
    if (certainty >= 70) {
return "text-green-400";
}
    if (certainty >= 50) {
return "text-blue-400";
}
    if (certainty >= 30) {
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
        <div className="text-text-secondary">Please log in to view focus window predictions.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Predictive Focus Window Engine
        </h1>
        <p className="text-text-secondary">
          Forecasts future high-productivity windows for optimal performance
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Avg Certainty</div>
            <div className={`text-3xl font-semibold ${certaintyColor(summary.avg_certainty)}`}>
              {summary.avg_certainty.toFixed(1)}%
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Peak Windows</div>
            <div className="text-3xl font-semibold text-emerald-400">
              {summary.peak_focus_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">High Windows</div>
            <div className="text-3xl font-semibold text-green-400">
              {summary.high_focus_count}
            </div>
          </Card>

          <Card className="bg-bg-card border-border p-6">
            <div className="text-sm text-text-secondary mb-1">Prediction Horizon</div>
            <div className="text-3xl font-semibold text-text-primary">
              {summary.prediction_hours}h
            </div>
          </Card>
        </div>
      )}

      {summary?.next_peak_window && (
        <Card className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border-emerald-500/20 p-6">
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">Next Peak Focus Window</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-text-secondary mb-1">Start Time</div>
              <div className="text-text-primary font-medium">
                {new Date(summary.next_peak_window.start_time).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-text-secondary mb-1">End Time</div>
              <div className="text-text-primary font-medium">
                {new Date(summary.next_peak_window.end_time).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-text-secondary mb-1">Certainty</div>
              <div className={`font-medium ${certaintyColor(summary.next_peak_window.certainty)}`}>
                {summary.next_peak_window.certainty.toFixed(0)}%
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-bg-card border-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary">Focus Window Predictions</h2>
        </div>

        <div className="divide-y divide-border">
          {windows.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No focus window predictions available
            </div>
          ) : (
            windows.map((window) => (
              <div key={window.id} className="p-6 hover:bg-bg-subtle transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${labelColor(
                        window.window_label
                      )}`}
                    >
                      {window.window_label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-semibold ${certaintyColor(window.certainty)}`}>
                      {window.certainty.toFixed(0)}%
                    </div>
                    <div className="text-xs text-text-secondary">certainty</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Start Time</div>
                    <div className="text-text-primary font-medium">
                      {new Date(window.start_time).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">End Time</div>
                    <div className="text-text-primary font-medium">
                      {new Date(window.end_time).toLocaleString()}
                    </div>
                  </div>
                </div>

                {window.recommended_activities && window.recommended_activities.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-text-secondary mb-1">Recommended Activities</div>
                    <div className="flex flex-wrap gap-2">
                      {window.recommended_activities.map((activity, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-text-secondary mt-4">
                  Predicted {new Date(window.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
