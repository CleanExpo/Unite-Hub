"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface TimelineEvent {
  event_id: string;
  event_type: string;
  event_category: string;
  event_title: string;
  event_description?: string;
  event_severity?: string;
  event_timestamp: string;
}

interface TimelineStats {
  period_days: number;
  total_events: number;
  audit_logs: number;
  retention_jobs: number;
  risk_events: number;
  runbook_assignments: number;
  sla_incidents: number;
  evidence_packs: number;
  critical_events: number;
}

export default function FounderTimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetch(`/api/founder/timeline?workspaceId=${userId}&limit=50`).then((r) => r.json()),
        fetch(`/api/founder/timeline?workspaceId=${userId}&action=stats&days=30`).then((r) => r.json()),
      ])
        .then(([eventsData, statsData]) => {
          setEvents(eventsData.events || []);
          setStats(statsData.stats);
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading timeline...</div></div>;

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500";
      case "low": return "bg-blue-500/10 text-blue-500 border-blue-500";
      default: return "bg-bg-card text-text-secondary border-border";
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      audit_log: "Audit",
      data_retention_job: "Retention",
      webhook_event: "Webhook",
      risk_event: "Risk",
      runbook_assignment: "Runbook",
      sla_incident: "SLA",
      evidence_pack: "Evidence",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Founder Timeline Replay</h1>
          <p className="text-text-secondary mt-1">E33: Unified governance events timeline</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Events (30d)</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">{stats.total_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Critical Events</div>
              <div className="text-2xl font-bold text-red-500 mt-1">{stats.critical_events}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Audit Logs</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{stats.audit_logs}</div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Risk Events</div>
              <div className="text-2xl font-bold text-orange-500 mt-1">{stats.risk_events}</div>
            </Card>
          </div>
        )}

        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Event Timeline (Last 50)</h2>
          {events.length === 0 ? (
            <p className="text-text-secondary">No events found.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.event_id}
                  className={`border-l-4 pl-4 py-2 ${getSeverityColor(event.event_severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 text-xs rounded bg-accent-500/10 text-accent-500 font-medium">
                          {getEventTypeLabel(event.event_type)}
                        </span>
                        <span className="text-sm font-medium text-text-primary">{event.event_title}</span>
                      </div>
                      {event.event_description && (
                        <p className="text-sm text-text-secondary">{event.event_description}</p>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary whitespace-nowrap ml-4">
                      {new Date(event.event_timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
