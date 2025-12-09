"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type HealthIndex = {
  id: string;
  health_category: string;
  health_score: number;
  unified_state_score: number;
  energy_trend_score: number;
  cognitive_stability_score: number;
  recovery_effectiveness_score: number;
  contributing_factors: any;
  recommended_interventions: string[];
  urgency_level: string;
  days_in_current_category: number;
  consecutive_decline_days: number;
  volatility_score: number;
  peak_score_30d: number | null;
  lowest_score_30d: number | null;
  notes: string | null;
  created_at: string;
};

type Summary = {
  total_snapshots: number;
  current_category: string;
  current_score: number;
  avg_health_score: number;
  max_score: number;
  min_score: number;
  avg_volatility: number;
  by_category: Record<string, number>;
  score_trend: string;
  critical_days: number;
  longest_decline_streak: number;
};

export default function HealthIndexPage() {
  const [indices, setIndices] = useState<HealthIndex[]>([]);
  const [currentHealth, setCurrentHealth] = useState<any>(null);
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
        // Calculate current health
        const currentRes = await fetch(
          `/api/founder/health-index?workspaceId=${workspaceId}&action=calculate`
        );
        const currentData = await currentRes.json();
        setCurrentHealth(currentData.health);

        // Get summary
        const summaryRes = await fetch(
          `/api/founder/health-index?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get history
        const historyRes = await fetch(
          `/api/founder/health-index?workspaceId=${workspaceId}&limit=50`
        );
        const historyData = await historyRes.json();
        setIndices(historyData.indices || []);
      } catch (error) {
        console.error("Failed to load health index:", error);
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
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "stable":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "declining":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
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
      score >= 85
        ? "bg-emerald-500"
        : score >= 60
          ? "bg-blue-500"
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
        <div className="text-text-secondary">Loading health index data...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">
          Multivariate Founder Health Index
        </h1>
        <p className="text-text-secondary">
          Longitudinal health scoring from F09-F13 weighted signals with trend analysis and early
          warning indicators
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
          Current Health
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

      {/* Current Health View */}
      {view === "current" && currentHealth && (
        <div className="space-y-6">
          {/* Main Health Card */}
          <Card className="p-8 space-y-6 bg-bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryColor(
                      currentHealth.health_category
                    )}`}
                  >
                    {currentHealth.health_category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${urgencyColor(
                      currentHealth.urgency_level
                    )}`}
                  >
                    {currentHealth.urgency_level} urgency
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>
                    {currentHealth.days_in_current_category} days in current category
                  </span>
                  {currentHealth.consecutive_decline_days > 0 && (
                    <span className="text-amber-400">
                      📉 {currentHealth.consecutive_decline_days} consecutive decline days
                    </span>
                  )}
                  {currentHealth.volatility_score > 20 && (
                    <span className="text-orange-400">
                      ⚠️ High volatility ({currentHealth.volatility_score.toFixed(1)})
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary max-w-2xl">
                  Multivariate health score calculated from unified state (40%), energy trend
                  (30%), cognitive stability (20%), and recovery effectiveness (10%)
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-text-primary">
                  {currentHealth.health_score.toFixed(0)}
                </div>
                <div className="text-sm text-text-secondary">health score</div>
              </div>
            </div>
            <div>{scoreGauge(currentHealth.health_score)}</div>
          </Card>

          {/* Component Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Unified State</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentHealth.unified_state_score.toFixed(0)}
              </div>
              <div className="text-xs text-accent-400">40% weight</div>
              {scoreGauge(currentHealth.unified_state_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Energy Trend</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentHealth.energy_trend_score.toFixed(0)}
              </div>
              <div className="text-xs text-accent-400">30% weight</div>
              {scoreGauge(currentHealth.energy_trend_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Cognitive Stability</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentHealth.cognitive_stability_score.toFixed(0)}
              </div>
              <div className="text-xs text-accent-400">20% weight</div>
              {scoreGauge(currentHealth.cognitive_stability_score)}
            </Card>
            <Card className="p-4 space-y-2 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Recovery Effectiveness</div>
              <div className="text-2xl font-bold text-text-primary">
                {currentHealth.recovery_effectiveness_score.toFixed(0)}
              </div>
              <div className="text-xs text-accent-400">10% weight</div>
              {scoreGauge(currentHealth.recovery_effectiveness_score)}
            </Card>
          </div>

          {/* Recommended Interventions */}
          {currentHealth.recommended_interventions &&
            currentHealth.recommended_interventions.length > 0 && (
              <Card className="p-6 space-y-4 bg-bg-card border-border">
                <h3 className="text-lg font-semibold text-text-primary">
                  💡 Recommended Interventions
                </h3>
                <ul className="space-y-2">
                  {currentHealth.recommended_interventions.map((intervention: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-accent-400 mt-0.5">•</span>
                      <span>{intervention}</span>
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
                {summary.avg_health_score.toFixed(0)}
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
              <div className="text-xs text-text-secondary">Avg Volatility</div>
              <div className="text-2xl font-bold text-text-primary">
                {summary.avg_volatility.toFixed(1)}
              </div>
            </Card>
          </div>

          {/* Warning Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Critical Days</div>
              <div className="text-2xl font-bold text-red-400">{summary.critical_days}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Longest Decline Streak</div>
              <div className="text-2xl font-bold text-amber-400">
                {summary.longest_decline_streak} days
              </div>
            </Card>
          </div>

          {/* Category Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Category Distribution</h3>
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
          {indices.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No health index snapshots recorded yet
            </Card>
          ) : (
            indices.map((health) => (
              <Card
                key={health.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor(
                          health.health_category
                        )}`}
                      >
                        {health.health_category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${urgencyColor(
                          health.urgency_level
                        )}`}
                      >
                        {health.urgency_level}
                      </span>
                      {health.consecutive_decline_days > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
                          📉 {health.consecutive_decline_days} decline days
                        </span>
                      )}
                    </div>
                    {health.notes && <p className="text-sm text-text-secondary">{health.notes}</p>}
                    <div className="text-xs text-text-secondary">
                      {new Date(health.created_at).toLocaleString()} •{" "}
                      {health.days_in_current_category} days in category •
                      Volatility: {health.volatility_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-text-primary">
                      {health.health_score.toFixed(0)}
                    </div>
                    <div className="w-32">{scoreGauge(health.health_score)}</div>
                  </div>
                </div>
                {health.recommended_interventions && health.recommended_interventions.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-accent-400 font-medium mb-2">
                      Recommended Interventions:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {health.recommended_interventions.map((intervention: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-full text-xs bg-bg-muted text-text-secondary"
                        >
                          {intervention}
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
