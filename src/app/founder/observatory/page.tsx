"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/useWorkspace";

type ObservatoryEvent = {
  id: string;
  event_type: string;
  severity: string;
  value: number | null;
  description: string;
  metadata: any;
  created_at: string;
};

type ObservatorySummary = {
  total_events: number;
  critical_events: number;
  performance_spikes: number;
  avg_value: number;
};

export default function ObservatoryPage() {
  const [events, setEvents] = useState<ObservatoryEvent[]>([]);
  const [summary, setSummary] = useState<ObservatorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [days, setDays] = useState(7);

  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;
    loadData();
  }, [workspaceId, eventTypeFilter, severityFilter, days]);

  const loadData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError(null);

      // Load summary
      const summaryRes = await fetch(
        `/api/founder/observatory?workspaceId=${workspaceId}&action=summary&days=${days}`
      );
      if (!summaryRes.ok) {
throw new Error("Failed to load summary");
}
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // Load events
      const params = new URLSearchParams({ workspaceId });
      if (eventTypeFilter !== "all") {
params.append("eventType", eventTypeFilter);
}
      if (severityFilter !== "all") {
params.append("severity", severityFilter);
}
      params.append("limit", "50");

      const eventsRes = await fetch(`/api/founder/observatory?${params}`);
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
          <div className="text-red-600">{workspaceError || "No workspace selected"}</div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-text-primary">Loading observatory data...</div>
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
            <h1 className="text-3xl font-bold text-text-primary">Founder Observatory</h1>
            <p className="text-text-secondary mt-1">Meta-systems operational telemetry</p>
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
                <CardTitle className="text-sm text-text-secondary">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">{summary.total_events}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent-500">{summary.critical_events}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Performance Spikes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">{summary.performance_spikes}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-text-secondary">Avg Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-text-primary">
                  {summary.avg_value ? summary.avg_value.toFixed(2) : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Event Type</label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="performance_spike">Performance Spike</SelectItem>
                    <SelectItem value="load_spike">Load Spike</SelectItem>
                    <SelectItem value="friction_detected">Friction Detected</SelectItem>
                    <SelectItem value="decay_signal">Decay Signal</SelectItem>
                    <SelectItem value="anomaly_detected">Anomaly Detected</SelectItem>
                    <SelectItem value="system_health">System Health</SelectItem>
                    <SelectItem value="user_experience">User Experience</SelectItem>
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
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-text-secondary mb-2 block">Time Range</label>
                <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 Hours</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No events found</div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-bg-primary hover:bg-bg-hover transition-colors border border-border"
                  >
                    <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                      {event.severity}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{event.event_type}</span>
                        {event.value !== null && (
                          <span className="text-sm text-text-secondary">Value: {event.value}</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-text-secondary">{event.description}</p>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
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
