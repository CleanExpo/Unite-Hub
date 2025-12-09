"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type StabilityAlert = {
  id: string;
  alert_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  severity_score: number;
  detection_method: string;
  confidence_score: number;
  trigger_source: string;
  recommended_interventions: string[];
  urgency_level: string;
  detected_at: string;
  resolved_at: string | null;
  time_to_resolve_hours: number | null;
};

type Summary = {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  avg_resolution_hours: number;
  unresolved_critical_count: number;
};

export default function StabilityGuardPage() {
  const [alerts, setAlerts] = useState<StabilityAlert[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "history" | "summary">("active");

  const { user, loading: authLoading } = useAuth();
  const workspaceId = user?.id;

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) {
        setLoading(false);
        return;
      }

      try {
        // Detect anomalies
        const anomaliesRes = await fetch(
          `/api/founder/stability-guard?workspaceId=${workspaceId}&action=detect`
        );
        const anomaliesData = await anomaliesRes.json();
        setAnomalies(anomaliesData.anomalies || []);

        // Get summary
        const summaryRes = await fetch(
          `/api/founder/stability-guard?workspaceId=${workspaceId}&action=summary&days=30`
        );
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);

        // Get history
        const historyRes = await fetch(
          `/api/founder/stability-guard?workspaceId=${workspaceId}&limit=50`
        );
        const historyData = await historyRes.json();
        setAlerts(historyData.alerts || []);
      } catch (error) {
        console.error("Failed to load stability guard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [workspaceId, authLoading]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/founder/stability-guard?workspaceId=${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          newStatus: "resolved",
          resolutionNotes: "Resolved by user",
        }),
      });
      // Reload data
      window.location.reload();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/founder/stability-guard?workspaceId=${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          newStatus: "acknowledged",
        }),
      });
      // Reload data
      window.location.reload();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "acknowledged":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "dismissed":
        return "bg-bg-muted text-text-secondary border-border";
      default:
        return "bg-bg-muted text-text-secondary border-border";
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "decline":
        return "bg-red-500/10 text-red-400";
      case "burnout_risk":
        return "bg-orange-500/10 text-orange-400";
      case "overload":
        return "bg-amber-500/10 text-amber-400";
      case "instability":
        return "bg-yellow-500/10 text-yellow-400";
      case "forecast_alarm":
        return "bg-purple-500/10 text-purple-400";
      case "recovery_failure":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-bg-muted text-text-secondary";
    }
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "•";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading stability guard data...</div>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === "active");

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">
          Autonomous Founder Stability Guard
        </h1>
        <p className="text-text-secondary">
          Real-time anomaly detection, alerting, and autonomous interventions across F09-F15
          signals
        </p>
      </header>

      {/* Critical Alert Banner */}
      {activeAlerts.filter((a) => a.severity === "critical").length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-semibold text-red-400">
                {activeAlerts.filter((a) => a.severity === "critical").length} Critical Alert(s)
                Active
              </div>
              <div className="text-sm text-text-secondary">
                Immediate attention required - review active alerts below
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setView("active")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "active"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Active Alerts ({activeAlerts.length})
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "history"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          All History
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
      </div>

      {/* Active Alerts View */}
      {view === "active" && (
        <div className="space-y-6">
          {/* Current Anomalies (Not Yet Recorded) */}
          {anomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-primary">
                🔍 Detected Anomalies (Real-Time)
              </h3>
              {anomalies.map((anomaly, idx) => (
                <Card
                  key={idx}
                  className="p-5 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{severityIcon(anomaly.severity)}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor(
                            anomaly.severity
                          )}`}
                        >
                          {anomaly.severity}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor(
                            anomaly.alert_type
                          )}`}
                        >
                          {anomaly.alert_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-text-primary">{anomaly.title}</h4>
                      <p className="text-sm text-text-secondary">{anomaly.description}</p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>Confidence: {anomaly.confidence_score?.toFixed(0)}%</span>
                        <span>Source: {anomaly.trigger_source}</span>
                        <span>Method: {anomaly.detection_method}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-400">
                        {anomaly.severity_score.toFixed(0)}
                      </div>
                      <div className="text-xs text-text-secondary">severity</div>
                    </div>
                  </div>
                  {anomaly.recommended_interventions &&
                    anomaly.recommended_interventions.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="text-xs text-accent-400 font-medium mb-2">
                          Recommended Interventions:
                        </div>
                        <ul className="space-y-1">
                          {anomaly.recommended_interventions.map((intervention: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <span className="text-accent-400 mt-0.5">•</span>
                              <span>{intervention}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </Card>
              ))}
            </div>
          )}

          {/* Recorded Active Alerts */}
          {activeAlerts.length === 0 && anomalies.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-semibold">No active alerts</div>
              <div className="text-sm mt-1">All systems stable</div>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="p-5 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{severityIcon(alert.severity)}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor(
                          alert.alert_type
                        )}`}
                      >
                        {alert.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-text-primary">{alert.title}</h4>
                    <p className="text-sm text-text-secondary">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>Detected: {new Date(alert.detected_at).toLocaleString()}</span>
                      <span>Confidence: {alert.confidence_score?.toFixed(0)}%</span>
                      <span>Source: {alert.trigger_source}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-3xl font-bold text-red-400">
                      {alert.severity_score.toFixed(0)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
                {alert.recommended_interventions && alert.recommended_interventions.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs text-accent-400 font-medium mb-2">
                      Recommended Interventions:
                    </div>
                    <ul className="space-y-1">
                      {alert.recommended_interventions.map((intervention: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-accent-400 mt-0.5">•</span>
                          <span>{intervention}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="p-8 text-center text-text-secondary bg-bg-card">
              No stability alerts recorded yet
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className="p-4 space-y-3 bg-bg-card border-border hover:border-accent-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{severityIcon(alert.severity)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${severityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor(
                          alert.alert_type
                        )}`}
                      >
                        {alert.alert_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="font-semibold text-text-primary">{alert.title}</div>
                    <p className="text-sm text-text-secondary max-w-2xl">{alert.description}</p>
                    <div className="text-xs text-text-secondary">
                      {new Date(alert.detected_at).toLocaleString()}
                      {alert.resolved_at && (
                        <>
                          {" "}
                          • Resolved: {new Date(alert.resolved_at).toLocaleString()} (
                          {alert.time_to_resolve_hours?.toFixed(1)}h)
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-text-primary">
                      {alert.severity_score.toFixed(0)}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && summary && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Total Alerts</div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_alerts}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Active Alerts</div>
              <div className="text-2xl font-bold text-amber-400">{summary.active_alerts}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Critical Alerts</div>
              <div className="text-2xl font-bold text-red-400">{summary.critical_alerts}</div>
            </Card>
            <Card className="p-4 space-y-1 bg-bg-card border-border">
              <div className="text-xs text-text-secondary">Unresolved Critical</div>
              <div className="text-2xl font-bold text-red-400">
                {summary.unresolved_critical_count}
              </div>
            </Card>
          </div>

          {/* Average Resolution Time */}
          <Card className="p-4 bg-bg-card border-border">
            <div className="text-xs text-text-secondary">Avg Resolution Time</div>
            <div className="text-2xl font-bold text-text-primary">
              {summary.avg_resolution_hours?.toFixed(1) || "N/A"} hours
            </div>
          </Card>

          {/* By Severity Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Alerts by Severity</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_severity || {}).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColor(severity)}`}
                  >
                    {severity}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_alerts) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* By Type Distribution */}
          <Card className="p-6 space-y-4 bg-bg-card border-border">
            <h3 className="text-lg font-semibold text-text-primary">Alerts by Type</h3>
            <div className="space-y-3">
              {Object.entries(summary.by_type || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor(type)}`}
                  >
                    {type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-text-primary font-medium">{count}</div>
                    <div className="w-32 h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{ width: `${(count / summary.total_alerts) * 100}%` }}
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
