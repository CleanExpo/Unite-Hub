"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type IntentSignal = {
  id: string;
  intent_type: string;
  confidence: string;
  confidence_score: number;
  signal_source: string;
  interpretation: string | null;
  recommended_action: string | null;
  routed_to: string | null;
  routing_status: string;
  created_at: string;
  routed_at: string | null;
  completed_at: string | null;
};

type Summary = {
  total_signals: number;
  avg_confidence: number;
  high_confidence_count: number;
  routed_count: number;
  completed_count: number;
  by_intent_type: Record<string, number>;
  by_routing_status: Record<string, number>;
  by_routed_to: Record<string, number>;
  avg_routing_time_mins: number;
  avg_completion_time_mins: number;
};

export default function IntentRouterPage() {
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"signals" | "summary" | "routing">("signals");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try{
        // Load summary
        const summaryRes = await fetch(
          `/api/founder/intent-router?workspaceId=${workspaceId}&action=summary&days=7`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Load signals
        const signalsRes = await fetch(
          `/api/founder/intent-router?workspaceId=${workspaceId}&limit=30`
        );
        const signalsData = await signalsRes.json();
        setSignals(signalsData.signals || []);
      } catch (error) {
        console.error("Failed to load intent router data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const confidenceColor = (confidence: string) => {
    switch (confidence) {
      case "very_high":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "high":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "medium":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "low":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "very_low":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-500/10 text-success-400 border-emerald-500/20";
      case "in_progress":
        return "bg-accent-500/10 text-accent-400 border-accent-500/20";
      case "routed":
        return "bg-warning-500/10 text-warning-400 border-warning-500/20";
      case "detected":
        return "bg-info-500/10 text-info-400 border-info-500/20";
      case "failed":
        return "bg-error-500/10 text-error-400 border-error-500/20";
      case "cancelled":
        return "bg-bg-hover0/10 text-text-muted border-border/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const intentIcon = (type: string) => {
    const icons: Record<string, string> = {
      deep_work_request: "🎯",
      break_request: "☕",
      meeting_request: "📅",
      decision_needed: "🤔",
      review_needed: "👀",
      planning_mode: "📋",
      learning_mode: "📚",
      admin_mode: "⚙️",
      delegation_intent: "🤝",
      automation_intent: "🤖",
      clarification_needed: "❓",
      other: "📝",
    };
    return icons[type] || "📝";
  };

  const filteredSignals =
    filterStatus === "all" ? signals : signals.filter((s) => s.routing_status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading intent router data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Founder Intent Router</h1>
        <p className="text-text-secondary">
          Interpret intent signals and automatically route to appropriate systems with confidence
          scoring
        </p>
      </header>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("signals")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "signals"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Intent Signals
        </button>
        <button
          onClick={() => setView("routing")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "routing"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Routing Analysis
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

      {/* Signals View */}
      {view === "signals" && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-accent-500 text-white"
                  : "bg-bg-muted text-text-secondary hover:bg-bg-card"
              }`}
            >
              All
            </button>
            {["detected", "routed", "in_progress", "completed", "failed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-accent-500 text-white"
                    : "bg-bg-muted text-text-secondary hover:bg-bg-card"
                }`}
              >
                {status.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Signals List */}
          {filteredSignals.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No intent signals found
            </Card>
          ) : (
            filteredSignals.map((signal) => (
              <Card
                key={signal.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{intentIcon(signal.intent_type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">
                          {signal.intent_type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-text-secondary">
                          from {signal.signal_source}
                        </div>
                      </div>
                    </div>
                    {signal.interpretation && (
                      <p className="text-sm text-text-secondary">{signal.interpretation}</p>
                    )}
                    {signal.recommended_action && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-xs text-accent-400 font-medium mb-1">
                          💡 Recommended Action
                        </div>
                        <div className="text-sm text-text-secondary">
                          {signal.recommended_action}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColor(signal.confidence)}`}
                    >
                      {signal.confidence}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(signal.routing_status)}`}
                    >
                      {signal.routing_status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
                  <div>
                    {signal.routed_to && (
                      <span>
                        Routed to: <span className="text-accent-400">{signal.routed_to}</span>
                      </span>
                    )}
                  </div>
                  <div>{new Date(signal.created_at).toLocaleString()}</div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Routing Analysis View */}
      {view === "routing" && summary && (
        <div className="space-y-6">
          {/* Routing Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 space-y-2 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Avg Routing Time</div>
              <div className="text-3xl font-bold text-text-primary">
                {summary.avg_routing_time_mins.toFixed(1)}
                <span className="text-sm text-text-secondary ml-1">min</span>
              </div>
            </Card>
            <Card className="p-6 space-y-2 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Avg Completion Time</div>
              <div className="text-3xl font-bold text-text-primary">
                {summary.avg_completion_time_mins.toFixed(1)}
                <span className="text-sm text-text-secondary ml-1">min</span>
              </div>
            </Card>
            <Card className="p-6 space-y-2 bg-bg-card border-border">
              <div className="text-sm text-text-secondary">Completion Rate</div>
              <div className="text-3xl font-bold text-text-primary">
                {((summary.completed_count / summary.total_signals) * 100).toFixed(0)}
                <span className="text-sm text-text-secondary ml-1">%</span>
              </div>
            </Card>
          </div>

          {/* Routing Destinations */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Routing Destinations</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_routed_to).map(([destination, count]) => (
                <div key={destination} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary capitalize">
                    {destination.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.routed_count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Intent Types Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Intent Types</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_intent_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{intentIcon(type)}</span>
                    <span className="text-sm text-text-primary capitalize">
                      {type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_signals) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && summary && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Total Signals</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_signals}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Avg Confidence</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_confidence.toFixed(0)}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">High Confidence</div>
              <div className="text-2xl font-bold text-success-400">
                {summary.high_confidence_count}
              </div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Routed</div>
              <div className="text-2xl font-bold text-accent-400">{summary.routed_count}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Completed</div>
              <div className="text-2xl font-bold text-success-400">{summary.completed_count}</div>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Routing Status</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_routing_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(status)}`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_signals) * 100}%` }}
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
