"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/useWorkspace";

type DriftEvent = {
  id: string;
  drift_type: string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  expected_value: string | null;
  actual_value: string | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

type DriftSummary = {
  total_events: number;
  active_events: number;
  critical_events: number;
  by_type: Record<string, number>;
};

export default function DriftPage() {
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const [summary, setSummary] = useState<DriftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driftTypeFilter, setDriftTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;
    loadData();
  }, [workspaceId, driftTypeFilter, statusFilter, severityFilter]);

  const loadData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError(null);

      // Load summary
      const summaryRes = await fetch(
        `/api/founder/drift?workspaceId=${workspaceId}&action=summary`
      );
      if (!summaryRes.ok) {
throw new Error("Failed to load summary");
}
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // Load events
      const params = new URLSearchParams({ workspaceId });
      if (driftTypeFilter !== "all") {
params.append("driftType", driftTypeFilter);
}
      if (statusFilter !== "all") {
params.append("status", statusFilter);
}
      if (severityFilter !== "all") {
params.append("severity", severityFilter);
}

      const eventsRes = await fetch(`/api/founder/drift?${params}`);
      if (!eventsRes.ok) {
throw new Error("Failed to load events");
}
      const eventsData = await eventsRes.json();
      setEvents(eventsData.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (eventId: string, newStatus: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/drift?workspaceId=${workspaceId}&action=update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: newStatus }),
      });
      if (!res.ok) {
throw new Error("Failed to update status");
}
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-error-500";
      case "high": return "bg-accent-500";
      case "medium": return "bg-warning-500";
      case "low": return "bg-info-500";
      default: return "bg-bg-hover0";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "detected": return "bg-error-500";
      case "acknowledged": return "bg-warning-500";
      case "resolved": return "bg-success-500";
      case "ignored": return "bg-bg-hover0";
      default: return "bg-bg-hover0";
    }
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-text-primary">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-error-600">{workspaceError || "No workspace selected"}</div>
        </div>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-text-primary">Loading drift data...</div>
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
            <h1 className="text-3xl font-bold text-text-primary">Drift Detector</h1>
            <p className="text-text-secondary mt-1">Configuration, behavioral, and schema drift monitoring</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Card className="bg-error-500/10 border-error-500">
            <CardContent className="p-4">
              <p className="text-error-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">{summary.total_events}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Active Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-500">{summary.active_events}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-error-500">{summary.critical_events}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Drift Type</label>
                <Select value={driftTypeFilter} onValueChange={setDriftTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="configuration">Configuration</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="schema">Schema</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
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
                    <SelectItem value="detected">Detected</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Drift Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No drift events found</div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors border border-border"
                  >
                    <div className="flex flex-col gap-2">
                      <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                        {event.severity}
                      </Badge>
                      <Badge className={`${getStatusColor(event.status)} text-white`}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{event.title}</span>
                        <span className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-secondary">
                          {event.drift_type}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-text-secondary mb-2">{event.description}</p>
                      )}
                      {(event.expected_value || event.actual_value) && (
                        <div className="text-xs text-text-tertiary space-y-1">
                          {event.expected_value && <div>Expected: {event.expected_value}</div>}
                          {event.actual_value && <div>Actual: {event.actual_value}</div>}
                        </div>
                      )}
                      <p className="text-xs text-text-tertiary mt-2">
                        Detected: {new Date(event.detected_at).toLocaleString()}
                      </p>
                    </div>
                    {event.status === "detected" && (
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
                          onClick={() => updateStatus(event.id, "ignored")}
                        >
                          Ignore
                        </Button>
                      </div>
                    )}
                    {event.status === "acknowledged" && (
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
