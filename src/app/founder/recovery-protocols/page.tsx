"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type RecoveryState = {
  id: string;
  state: string;
  recovery_score: number;
  fatigue_level: number | null;
  stress_level: number | null;
  sleep_quality: number | null;
  contributing_factors: any[];
  notes: string | null;
  created_at: string;
};

type RecoveryAction = {
  id: string;
  action_type: string;
  urgency: string;
  description: string;
  recommended: boolean;
  taken: boolean;
  scheduled_for: string | null;
  duration_minutes: number | null;
  effectiveness_rating: number | null;
  notes: string | null;
  created_at: string;
  taken_at: string | null;
};

type Summary = {
  current_state: string;
  current_score: number;
  avg_recovery_score: number;
  avg_fatigue_level: number;
  avg_stress_level: number;
  avg_sleep_quality: number;
  by_state: Record<string, number>;
  pending_actions: number;
  critical_actions: number;
  completed_actions: number;
  avg_action_effectiveness: number;
};

export default function RecoveryProtocolsPage() {
  const [states, setStates] = useState<RecoveryState[]>([]);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [autoRecommendations, setAutoRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "states" | "actions">("dashboard");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Load summary
        const summaryRes = await fetch(
          `/api/founder/recovery-protocols?workspaceId=${workspaceId}&action=summary&days=7`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Load auto recommendations
        const recsRes = await fetch(
          `/api/founder/recovery-protocols?workspaceId=${workspaceId}&action=auto-recommend`
        );
        const recsData = await recsRes.json();
        setAutoRecommendations(recsData.recommendations);

        // Load states
        const statesRes = await fetch(
          `/api/founder/recovery-protocols?workspaceId=${workspaceId}&limit=20`
        );
        const statesData = await statesRes.json();
        setStates(statesData.states || []);

        // Load actions
        const actionsRes = await fetch(
          `/api/founder/recovery-protocols?workspaceId=${workspaceId}&action=list-actions&limit=30`
        );
        const actionsData = await actionsRes.json();
        setActions(actionsData.actions || []);
      } catch (error) {
        console.error("Failed to load recovery protocols data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const stateColor = (state: string) => {
    switch (state) {
      case "well_rested":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "normal":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "fatigued":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "exhausted":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "burned_out":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "recovering":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const urgencyColor = (urgency: string) => {
    switch (urgency) {
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
            : score >= 20
              ? "bg-orange-500"
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

  const actionIcon = (type: string) => {
    const icons: Record<string, string> = {
      micro_break: "⚡",
      short_break: "☕",
      long_break: "🌅",
      power_nap: "😴",
      physical_activity: "🏃",
      meditation: "🧘",
      social_connection: "👥",
      creative_activity: "🎨",
      nature_exposure: "🌳",
      sleep_optimization: "💤",
      workload_reduction: "📉",
      other: "📝",
    };
    return icons[type] || "📝";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading recovery protocols data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Recovery Protocols</h1>
        <p className="text-text-secondary">
          Track recovery states with automated action recommendations and effectiveness measurement
        </p>
      </header>

      {/* Critical Actions Alert */}
      {summary && summary.critical_actions > 0 && (
        <Card className="bg-red-500/10 border-red-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-xl">🚨</div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-1">
                {summary.critical_actions} Critical Recovery Actions Pending
              </h3>
              <p className="text-sm text-text-secondary">
                Immediate attention recommended to prevent burnout
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Auto Recommendations */}
      {autoRecommendations && autoRecommendations.recommendations?.length > 0 && (
        <Card className="bg-accent-500/10 border-accent-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="text-accent-400 text-xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-accent-400 mb-2">Recommended Recovery Actions</h3>
              <div className="space-y-2">
                {autoRecommendations.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-lg">{actionIcon(rec.action_type)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        {rec.description}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border mt-1 ${urgencyColor(rec.urgency)}`}
                      >
                        {rec.urgency} urgency
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("dashboard")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "dashboard"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView("states")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "states"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Recovery States
        </button>
        <button
          onClick={() => setView("actions")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "actions"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Actions
        </button>
      </div>

      {/* Dashboard View */}
      {view === "dashboard" && summary && (
        <div className="space-y-6">
          {/* Current State */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Current Recovery State</h3>
            <div className="flex items-center justify-between">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${stateColor(summary.current_state)}`}
              >
                {summary.current_state.replace(/_/g, " ")}
              </span>
              <div className="text-right">
                <div className="text-3xl font-bold text-text-primary">{summary.current_score}</div>
                <div className="text-xs text-text-secondary">recovery score</div>
              </div>
            </div>
            <div className="pt-2">{scoreGauge(summary.current_score)}</div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Recovery</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_recovery_score.toFixed(0)}
              </div>
              {scoreGauge(summary.avg_recovery_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Fatigue</div>
              <div className="text-2xl font-bold text-orange-400">
                {summary.avg_fatigue_level.toFixed(0)}
              </div>
              {scoreGauge(100 - summary.avg_fatigue_level)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Stress</div>
              <div className="text-2xl font-bold text-red-400">
                {summary.avg_stress_level.toFixed(0)}
              </div>
              {scoreGauge(100 - summary.avg_stress_level)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Sleep</div>
              <div className="text-2xl font-bold text-emerald-400">
                {summary.avg_sleep_quality.toFixed(0)}
              </div>
              {scoreGauge(summary.avg_sleep_quality)}
            </Card>
          </div>

          {/* Action Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Pending Actions</div>
              <div className="text-2xl font-bold text-text-primary">{summary.pending_actions}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Critical Actions</div>
              <div className="text-2xl font-bold text-red-400">{summary.critical_actions}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Completed Actions</div>
              <div className="text-2xl font-bold text-emerald-400">
                {summary.completed_actions}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Effectiveness</div>
              <div className="text-2xl font-bold text-accent-400">
                {summary.avg_action_effectiveness.toFixed(0)}
              </div>
            </Card>
          </div>

          {/* State Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">State Distribution</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_state).map(([state, count]) => (
                <div key={state} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${stateColor(state)}`}
                  >
                    {state.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{
                          width: `${
                            (count /
                              Object.values(summary.by_state).reduce((a, b) => a + b, 0)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* States View */}
      {view === "states" && (
        <div className="space-y-4">
          {states.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No recovery states recorded yet
            </Card>
          ) : (
            states.map((state) => (
              <Card
                key={state.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${stateColor(state.state)}`}
                    >
                      {state.state.replace(/_/g, " ")}
                    </span>
                    {state.contributing_factors && state.contributing_factors.length > 0 && (
                      <div className="text-sm text-text-secondary">
                        <span className="font-medium">Contributing factors:</span>{" "}
                        {state.contributing_factors.map((f: any) => f.factor).join(", ")}
                      </div>
                    )}
                    {state.notes && <p className="text-sm text-text-secondary">{state.notes}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-text-primary">{state.recovery_score}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(state.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-sm">
                  {state.fatigue_level !== null && (
                    <div>
                      <div className="text-xs text-text-secondary">Fatigue</div>
                      <div className="font-medium text-orange-400">{state.fatigue_level}</div>
                    </div>
                  )}
                  {state.stress_level !== null && (
                    <div>
                      <div className="text-xs text-text-secondary">Stress</div>
                      <div className="font-medium text-red-400">{state.stress_level}</div>
                    </div>
                  )}
                  {state.sleep_quality !== null && (
                    <div>
                      <div className="text-xs text-text-secondary">Sleep</div>
                      <div className="font-medium text-emerald-400">{state.sleep_quality}</div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Actions View */}
      {view === "actions" && (
        <div className="space-y-4">
          {actions.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No recovery actions recorded yet
            </Card>
          ) : (
            actions.map((action) => (
              <Card
                key={action.id}
                className={`p-4 space-y-3 bg-bg-card border-border ${
                  action.taken
                    ? "opacity-75"
                    : "hover:border-accent-500/50 transition-colors"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{actionIcon(action.action_type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">{action.description}</div>
                        <div className="text-xs text-text-secondary mt-1">
                          {action.action_type.replace(/_/g, " ")}
                          {action.duration_minutes && ` · ${action.duration_minutes} min`}
                        </div>
                      </div>
                    </div>
                    {action.notes && <p className="text-sm text-text-secondary">{action.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${urgencyColor(action.urgency)}`}
                    >
                      {action.urgency}
                    </span>
                    {action.taken ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    {action.recommended && (
                      <span className="text-accent-400">💡 System recommended</span>
                    )}
                    {action.effectiveness_rating && (
                      <span>
                        Effectiveness:{" "}
                        <span className="text-text-primary font-medium">
                          {action.effectiveness_rating}%
                        </span>
                      </span>
                    )}
                  </div>
                  <div>
                    {action.taken && action.taken_at
                      ? new Date(action.taken_at).toLocaleString()
                      : new Date(action.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </main>
  );
}
