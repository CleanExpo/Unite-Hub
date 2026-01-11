"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type UnifiedState = {
  id: string;
  state_category: string;
  composite_score: number;
  cognitive_load_score: number;
  energy_score: number;
  recovery_score: number;
  intent_routing_score: number;
  factors: any;
  recommended_actions: string[];
  priority_level: string;
  notes: string | null;
  created_at: string;
};

type Summary = {
  total_snapshots: number;
  current_state: string;
  current_score: number;
  avg_composite_score: number;
  max_score: number;
  min_score: number;
  by_category: Record<string, number>;
  score_trend: string;
  critical_count: number;
};

export default function UnifiedStatePage() {
  const [states, setStates] = useState<UnifiedState[]>([]);
  const [currentState, setCurrentState] = useState<any>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"current" | "history" | "summary">("current");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Calculate current state
        const currentRes = await fetch(
          `/api/founder/unified-state?workspaceId=${workspaceId}&action=calculate`
        );
        const currentData = await currentRes.json();
        setCurrentState(currentData.state);

        // Get summary
        const summaryRes = await fetch(
          `/api/founder/unified-state?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get history
        const historyRes = await fetch(
          `/api/founder/unified-state?workspaceId=${workspaceId}&limit=50`
        );
        const historyData = await historyRes.json();
        setStates(historyData.states || []);
      } catch (error) {
        console.error("Failed to load unified state:", error);
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
      case "optimal":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "flow":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "focused":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "balanced":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "stressed":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "overloaded":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "fatigued":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "disrupted":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "recovering":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "moderate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const scoreGauge = (score: number) => {
    const color =
      score >= 80
        ? "bg-emerald-500"
        : score >= 60
          ? "bg-accent-500"
          : score >= 40
            ? "bg-amber-500"
            : "bg-red-500";
    return (
      <div className="relative h-3 bg-bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    );
  };

  const trendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈";
      case "declining":
        return "📉";
      default:
        return "➡️";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading unified state data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Founder Unified State Model</h1>
        <p className="text-text-secondary">
          Aggregates all F09-F12 founder signals into a single weighted state with intelligent
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
          Current State
        </button>
        <button
          onClick={() => setView("summary")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "summary"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          30-Day Summary
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "history"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          History
        </button>
      </div>

      {/* Current State View */}
      {view === "current" && currentState && (
        <div className="space-y-6">
          {/* Main State Card */}
          <Card className="p-8 space-y-6 bg-bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryColor(
                      currentState.state_category
                    )}`}
                  >
                    {currentState.state_category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColor(
                      currentState.priority_level
                    )}`}
                  >
                    {currentState.priority_level} priority
                  </span>
                </div>
                <p className="text-sm text-text-secondary max-w-2xl">
                  Unified state calculated from cognitive load, energy mapping, recovery protocols,
                  and intent routing signals
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-text-primary">
                  {currentState.composite_score.toFixed(0)}
                </div>
                <div className="text-sm text-text-secondary">composite score</div>
              </div>
            </div>
            <div>{scoreGauge(currentState.composite_score)}</div>
          </Card>

          {/* Component Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Cognitive Load</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentState.cognitive_load_score.toFixed(0)}
              </div>
              {scoreGauge(currentState.cognitive_load_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Energy Level</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentState.energy_score.toFixed(0)}
              </div>
              {scoreGauge(currentState.energy_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Recovery State</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentState.recovery_score.toFixed(0)}
              </div>
              {scoreGauge(currentState.recovery_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Intent Routing</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentState.intent_routing_score.toFixed(0)}
              </div>
              {scoreGauge(currentState.intent_routing_score)}
            </Card>
          </div>

          {/* Recommended Actions */}
          {currentState.recommended_actions && currentState.recommended_actions.length > 0 && (
            <Card className="p-6 space-y-4 bg-bg-card border-border">
              <h3 className="text-lg font-semibold text-text-primary">
                💡 Recommended Actions
              </h3>
              <ul className="space-y-2">
                {currentState.recommended_actions.map((action: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-400 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && summary && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Total Snapshots</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_snapshots}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Score</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_composite_score.toFixed(0)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Peak Score</div>
              <div className="text-2xl font-bold text-emerald-400">
                {summary.max_score.toFixed(0)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Trend</div>
              <div className="text-2xl font-bold text-text-primary">
                {trendIcon(summary.score_trend)} {summary.score_trend}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Critical Events</div>
              <div className="text-2xl font-bold text-red-400">{summary.critical_count}</div>
            </Card>
          </div>

          {/* State Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">State Distribution</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(category)}`}
                  >
                    {category}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_snapshots) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-4">
          {states.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No unified state snapshots recorded yet
            </Card>
          ) : (
            states.map((state) => (
              <Card
                key={state.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                          state.state_category
                        )}`}
                      >
                        {state.state_category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityColor(
                          state.priority_level
                        )}`}
                      >
                        {state.priority_level}
                      </span>
                    </div>
                    {state.notes && <p className="text-sm text-text-secondary">{state.notes}</p>}
                    <div className="text-xs text-text-secondary">
                      {new Date(state.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-text-primary">
                      {state.composite_score.toFixed(0)}
                    </div>
                    <div className="w-32">{scoreGauge(state.composite_score)}</div>
                  </div>
                </div>
                {state.recommended_actions && state.recommended_actions.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-accent-400 font-medium mb-2">
                      Recommended Actions:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {state.recommended_actions.map((action: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-full text-xs bg-bg-muted text-text-secondary"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </main>
  );
}
