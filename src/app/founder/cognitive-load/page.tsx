"use client";

import { useEffect, useState } from "react";
import { Card } from "@/src/components/ui/card";
import { useAuth } from "@/src/contexts/AuthContext";

type CognitiveLoadEvent = {
  id: string;
  intensity: string;
  calculated_load: number;
  signal_type: string;
  signal_value: number;
  context: string | null;
  recovery_recommended: boolean;
  recovery_action: string | null;
  created_at: string;
};

type Summary = {
  total_events: number;
  avg_load: number;
  max_load: number;
  overload_events: number;
  recovery_recommended_count: number;
  by_intensity: Record<string, number>;
  by_signal_type: Record<string, number>;
};

type CurrentLoad = {
  current_avg_load: number;
  current_max_load: number;
  current_intensity: string;
  recent_events: number;
  recovery_needed: boolean;
  latest_recovery_action: string | null;
};

export default function CognitiveLoadPage() {
  const [events, setEvents] = useState<CognitiveLoadEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentLoad, setCurrentLoad] = useState<CurrentLoad | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"current" | "events" | "summary">("current");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Load current load
        const currentRes = await fetch(
          `/api/founder/cognitive-load?workspaceId=${workspaceId}&action=current&windowMinutes=60`
        );
        const currentData = await currentRes.json();
        setCurrentLoad(currentData.currentLoad);

        // Load summary
        const summaryRes = await fetch(
          `/api/founder/cognitive-load?workspaceId=${workspaceId}&action=summary&days=7`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Load recent events
        const eventsRes = await fetch(
          `/api/founder/cognitive-load?workspaceId=${workspaceId}&limit=20`
        );
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      } catch (error) {
        console.error("Failed to load cognitive load data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const intensityColor = (intensity: string) => {
    switch (intensity) {
      case "overload":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "extreme":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "high":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "moderate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const loadGauge = (load: number) => {
    const color =
      load >= 90
        ? "bg-red-500"
        : load >= 75
          ? "bg-orange-500"
          : load >= 60
            ? "bg-accent-500"
            : load >= 40
              ? "bg-amber-500"
              : "bg-emerald-500";
    return (
      <div className="relative h-2 bg-bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-300`}
          style={{ width: `${load}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading cognitive load data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Cognitive Load Monitor</h1>
        <p className="text-text-secondary">
          Track mental load from multiple signals with automatic intensity detection and recovery
          recommendations
        </p>
      </header>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("current")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "current"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Current Load
        </button>
        <button
          onClick={() => setView("events")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "events"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Recent Events
        </button>
        <button
          onClick={() => setView("summary")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "summary"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          7-Day Summary
        </button>
      </div>

      {/* Current Load View */}
      {view === "current" && currentLoad && (
        <div className="space-y-6">
          {/* Alert Banner */}
          {currentLoad.recovery_needed && (
            <Card className="bg-red-500/10 border-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-400 text-xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 mb-1">Recovery Recommended</h3>
                  <p className="text-sm text-text-secondary">{currentLoad.latest_recovery_action}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 space-y-3 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Average Load (60 min)</div>
              <div className="text-3xl font-bold text-text-primary">
                {currentLoad.current_avg_load.toFixed(1)}
              </div>
              {loadGauge(currentLoad.current_avg_load)}
            </Card>

            <Card className="p-6 space-y-3 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Peak Load</div>
              <div className="text-3xl font-bold text-text-primary">
                {currentLoad.current_max_load.toFixed(1)}
              </div>
              {loadGauge(currentLoad.current_max_load)}
            </Card>

            <Card className="p-6 space-y-3 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Current Intensity</div>
              <div
                className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold border ${intensityColor(currentLoad.current_intensity)}`}
              >
                {currentLoad.current_intensity}
              </div>
              <div className="text-sm text-text-secondary mt-2">
                {currentLoad.recent_events} events in last hour
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Events View */}
      {view === "events" && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No cognitive load events recorded yet
            </Card>
          ) : (
            events.map((event) => (
              <Card
                key={event.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${intensityColor(event.intensity)}`}
                      >
                        {event.intensity}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {event.signal_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {event.context && (
                      <p className="text-sm text-text-secondary">{event.context}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold text-text-primary">
                      {event.calculated_load.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {event.recovery_recommended && event.recovery_action && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-accent-400 font-medium mb-1">
                      💡 Recovery Recommendation
                    </div>
                    <div className="text-sm text-text-secondary">{event.recovery_action}</div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && summary && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Total Events</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_events}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Load</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_load.toFixed(1)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Peak Load</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.max_load.toFixed(1)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Overload Events</div>
              <div className="text-2xl font-bold text-red-400">{summary.overload_events}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Recovery Needed</div>
              <div className="text-2xl font-bold text-accent-400">
                {summary.recovery_recommended_count}
              </div>
            </Card>
          </div>

          {/* By Intensity */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Events by Intensity</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_intensity).map(([intensity, count]) => (
                <div key={intensity} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${intensityColor(intensity)}`}
                  >
                    {intensity}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_events) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* By Signal Type */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Events by Signal Type</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_signal_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary capitalize">
                    {type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_events) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
