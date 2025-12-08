"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { AlertTriangle, TrendingUp, Shield, Zap } from "lucide-react";

type WarningEvent = {
  id: string;
  signal_type: string;
  risk_level: string;
  status: string;
  title: string;
  details: string | null;
  threshold_value: number | null;
  actual_value: number | null;
  triggered_at: string;
  acknowledged_at: string | null;
  mitigated_at: string | null;
  resolved_at: string | null;
};

type WarningSummary = {
  total_warnings: number;
  active_warnings: number;
  critical_warnings: number;
  alert_warnings: number;
};

export default function EarlyWarningPage() {
  const [events, setEvents] = useState<WarningEvent[]>([]);
  const [summary, setSummary] = useState<WarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const workspaceId = "00000000-0000-0000-0000-000000000000"; // TODO: Get from auth context

  useEffect(() => {
    loadData();
  }, [signalTypeFilter, riskLevelFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load summary
      const summaryRes = await fetch(
        `/api/founder/early-warning?workspaceId=${workspaceId}&action=summary`
      );
      if (!summaryRes.ok) throw new Error("Failed to load summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // Load events
      const params = new URLSearchParams({ workspaceId });
      if (signalTypeFilter !== "all") params.append("signalType", signalTypeFilter);
      if (riskLevelFilter !== "all") params.append("riskLevel", riskLevelFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const eventsRes = await fetch(`/api/founder/early-warning?${params}`);
      if (!eventsRes.ok) throw new Error("Failed to load events");
      const eventsData = await eventsRes.json();
      setEvents(eventsData.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (eventId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/founder/early-warning?workspaceId=${workspaceId}&action=update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-600";
      case "alert": return "bg-orange-500";
      case "watch": return "bg-yellow-500";
      case "info": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-5 w-5" />;
      case "alert": return <TrendingUp className="h-5 w-5" />;
      case "watch": return <Shield className="h-5 w-5" />;
      case "info": return <Zap className="h-5 w-5" />;
      default: return null;
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-text-primary">Loading early warning data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Early Warning System</h1>
            <p className="text-text-secondary mt-1">Critical system telemetry and risk thresholds</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Card className="bg-red-500/10 border-red-500">
            <CardContent className="p-4">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Total Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">{summary.total_warnings}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Active Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-500">{summary.active_warnings}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{summary.critical_warnings}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Alert Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">{summary.alert_warnings}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Signal Type</label>
                <Select value={signalTypeFilter} onValueChange={setSignalTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="resource_exhaustion">Resource Exhaustion</SelectItem>
                    <SelectItem value="capacity_threshold">Capacity Threshold</SelectItem>
                    <SelectItem value="error_rate_spike">Error Rate Spike</SelectItem>
                    <SelectItem value="latency_degradation">Latency Degradation</SelectItem>
                    <SelectItem value="security_anomaly">Security Anomaly</SelectItem>
                    <SelectItem value="compliance_breach">Compliance Breach</SelectItem>
                    <SelectItem value="data_quality">Data Quality</SelectItem>
                    <SelectItem value="system_degradation">System Degradation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Risk Level</label>
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="watch">Watch</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Warning Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No warning events found</div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors border border-border"
                  >
                    <div className={`p-3 rounded-lg ${getRiskLevelColor(event.risk_level)} text-white`}>
                      {getRiskLevelIcon(event.risk_level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{event.title}</span>
                        <Badge className="bg-bg-secondary text-text-secondary">
                          {event.signal_type}
                        </Badge>
                        <Badge className={`${getRiskLevelColor(event.risk_level)} text-white`}>
                          {event.risk_level}
                        </Badge>
                      </div>
                      {event.details && (
                        <p className="text-sm text-text-secondary mb-2">{event.details}</p>
                      )}
                      {(event.threshold_value !== null || event.actual_value !== null) && (
                        <div className="text-xs text-text-tertiary space-y-1 mb-2">
                          {event.threshold_value !== null && (
                            <div>Threshold: {event.threshold_value}</div>
                          )}
                          {event.actual_value !== null && (
                            <div className="font-semibold">Actual: {event.actual_value}</div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <span>Triggered: {new Date(event.triggered_at).toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                    {event.status === "active" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(event.id, "acknowledged")}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(event.id, "mitigated")}
                        >
                          Mitigate
                        </Button>
                      </div>
                    )}
                    {(event.status === "acknowledged" || event.status === "mitigated") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(event.id, "resolved")}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
