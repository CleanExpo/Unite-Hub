"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RiskCategory = "security" | "compliance" | "operational" | "financial" | "reputation" | "data_quality" | "performance" | "availability" | "other";
type RiskSeverity = "low" | "medium" | "high" | "critical";

interface RiskScore {
  id: string;
  category: RiskCategory;
  score: number;
  severity: RiskSeverity;
  description: string | null;
  last_event_at: string | null;
  updated_at: string;
}

interface RiskEvent {
  id: string;
  category: RiskCategory;
  event_type: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  score_impact: number | null;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
}

interface RiskOverview {
  total_events: number;
  unresolved_events: number;
  critical_events: number;
  high_events: number;
  avg_score: number;
  max_score: number;
}

export default function RiskScoringPage() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [overview, setOverview] = useState<RiskOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setWorkspaceId(userId);
      loadData(userId);
    } else {
      setError("User not authenticated");
      setLoading(false);
    }
  }, []);

  async function loadData(wid: string) {
    try {
      setLoading(true);
      setError(null);

      const [scoresRes, eventsRes, overviewRes] = await Promise.all([
        fetch(`/api/founder/risk?workspaceId=${wid}`),
        fetch(`/api/founder/risk?workspaceId=${wid}&action=events&resolved=false`),
        fetch(`/api/founder/risk?workspaceId=${wid}&action=overview`),
      ]);

      if (!scoresRes.ok || !eventsRes.ok || !overviewRes.ok) {
        throw new Error("Failed to load risk data");
      }

      const scoresData = await scoresRes.json();
      const eventsData = await eventsRes.json();
      const overviewData = await overviewRes.json();

      setScores(scoresData.scores || []);
      setEvents(eventsData.events || []);
      setOverview(overviewData.overview || null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveEvent(eventId: string) {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "resolve-event",
          eventId,
          scoreReduction: 10,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve event");
      }

      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const getSeverityColor = (severity: RiskSeverity) => {
    switch (severity) {
      case "critical": return "bg-error-500/20 text-error-500";
      case "high": return "bg-accent-500/20 text-accent-500";
      case "medium": return "bg-warning-500/20 text-warning-500";
      case "low": return "bg-success-500/20 text-success-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="text-text-primary">Loading risk scoring...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Risk Scoring & Anomaly Detection</h1>
          <p className="text-text-secondary mt-1">Monitor risk across categories (Phase E28)</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Unresolved Events</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{overview.unresolved_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Critical</div>
              <div className="text-2xl font-bold text-error-500 mt-1">{overview.critical_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">High</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">{overview.high_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Events</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{overview.total_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Avg Score</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{overview.avg_score.toFixed(0)}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Max Score</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">{overview.max_score}</div>
            </Card>
          </div>
        )}

        {/* Risk Scores by Category */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Risk Scores by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scores.length === 0 ? (
              <div className="col-span-3 text-center text-text-secondary py-8">No risk scores available</div>
            ) : (
              scores.map((score) => (
                <Card key={score.id} className="bg-bg-primary border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-primary font-medium capitalize">{score.category}</span>
                    <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(score.severity)}`}>
                      {score.severity}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-text-primary mb-2">{score.score}/100</div>
                  {score.description && (
                    <p className="text-text-secondary text-sm">{score.description}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Unresolved Risk Events */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Unresolved Risk Events</h2>
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-text-secondary py-8">No unresolved events</div>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="bg-bg-primary border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                        <span className="text-text-secondary text-sm capitalize">{event.category}</span>
                      </div>
                      <h3 className="text-text-primary font-medium mb-1">{event.title}</h3>
                      <p className="text-text-secondary text-sm mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-text-secondary text-xs">
                        <span>Type: {event.event_type}</span>
                        {event.score_impact && <span>Impact: {event.score_impact > 0 ? "+" : ""}{event.score_impact}</span>}
                        <span>Detected: {new Date(event.detected_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleResolveEvent(event.id)}
                      className="bg-accent-500 hover:bg-accent-600 text-white"
                    >
                      Resolve
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
