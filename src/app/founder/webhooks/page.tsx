"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type WebhookEventType =
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "campaign.created"
  | "campaign.updated"
  | "campaign.completed"
  | "email.sent"
  | "email.opened"
  | "email.clicked"
  | "audit.event"
  | "security.alert"
  | "incident.created"
  | "policy.triggered"
  | "rate_limit.exceeded"
  | "other";

type WebhookEndpointStatus = "active" | "inactive" | "disabled";
type WebhookEventStatus = "pending" | "delivered" | "failed" | "retrying";

interface WebhookEndpoint {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description: string | null;
  status: WebhookEndpointStatus;
  secret: string | null;
  events: WebhookEventType[];
  headers: Record<string, any>;
  retry_count: number;
  timeout_seconds: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  total_sent: number;
  total_success: number;
  total_failed: number;
  created_at: string;
  updated_at: string;
}

interface WebhookEvent {
  id: string;
  endpoint_id: string;
  tenant_id: string;
  event_type: WebhookEventType;
  status: WebhookEventStatus;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_count: number;
  next_retry_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface WebhookStatistics {
  total_endpoints: number;
  active_endpoints: number;
  total_events: number;
  pending_events: number;
  delivered_events: number;
  failed_events: number;
  by_event_type: Record<string, number>;
  by_endpoint: Record<string, number>;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [statistics, setStatistics] = useState<WebhookStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    secret: "",
    events: [] as WebhookEventType[],
    retryCount: 3,
    timeoutSeconds: 30,
  });

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

      const [endpointsRes, eventsRes, statsRes] = await Promise.all([
        fetch(`/api/founder/webhooks?workspaceId=${wid}`),
        fetch(`/api/founder/webhooks?workspaceId=${wid}&action=events`),
        fetch(`/api/founder/webhooks?workspaceId=${wid}&action=statistics`),
      ]);

      if (!endpointsRes.ok || !eventsRes.ok || !statsRes.ok) {
        throw new Error("Failed to load webhook data");
      }

      const endpointsData = await endpointsRes.json();
      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();

      setEndpoints(endpointsData.endpoints || []);
      setEvents(eventsData.events || []);
      setStatistics(statsData.statistics || null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEndpoint() {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "create-endpoint",
          name: formData.name,
          url: formData.url,
          description: formData.description || null,
          secret: formData.secret || null,
          events: formData.events,
          retryCount: formData.retryCount,
          timeoutSeconds: formData.timeoutSeconds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create endpoint");
      }

      setShowForm(false);
      setFormData({
        name: "",
        url: "",
        description: "",
        secret: "",
        events: [],
        retryCount: 3,
        timeoutSeconds: 30,
      });
      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleTestEndpoint(endpointId: string) {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "test-endpoint",
          endpointId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Test failed");
      }

      alert(data.message);
      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteEndpoint(endpointId: string) {
    if (!workspaceId) return;
    if (!confirm("Delete this webhook endpoint?")) return;

    try {
      const res = await fetch(
        `/api/founder/webhooks?workspaceId=${workspaceId}&endpointId=${endpointId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete endpoint");
      }

      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const handleEventToggle = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="text-text-primary">Loading webhook governance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Webhook Governance</h1>
            <p className="text-text-secondary mt-1">
              Outbound webhook endpoints and event logging (Phase E27)
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            {showForm ? "Cancel" : "Create Endpoint"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Endpoints</div>
              <div className="text-2xl font-bold text-text-primary mt-1">
                {statistics.total_endpoints}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Active</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">
                {statistics.active_endpoints}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Events</div>
              <div className="text-2xl font-bold text-text-primary mt-1">
                {statistics.total_events}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Pending</div>
              <div className="text-2xl font-bold text-yellow-500 mt-1">
                {statistics.pending_events}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Delivered</div>
              <div className="text-2xl font-bold text-green-500 mt-1">
                {statistics.delivered_events}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Failed</div>
              <div className="text-2xl font-bold text-red-500 mt-1">
                {statistics.failed_events}
              </div>
            </Card>
          </div>
        )}

        {/* Create Endpoint Form */}
        {showForm && (
          <Card className="bg-bg-card border-border p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Create Webhook Endpoint
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                  placeholder="My Webhook"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                  placeholder="https://api.example.com/webhooks"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Secret (optional)</label>
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                  placeholder="For signature verification"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Retry Count</label>
                  <input
                    type="number"
                    value={formData.retryCount}
                    onChange={(e) =>
                      setFormData({ ...formData, retryCount: parseInt(e.target.value) })
                    }
                    className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Timeout (sec)</label>
                  <input
                    type="number"
                    value={formData.timeoutSeconds}
                    onChange={(e) =>
                      setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) })
                    }
                    className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                    min="1"
                    max="300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Event Subscriptions</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["contact.created", "campaign.created", "email.sent", "audit.event", "security.alert", "incident.created"] as WebhookEventType[]).map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded border-border"
                      />
                      <span className="text-text-secondary text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreateEndpoint}
                className="bg-accent-500 hover:bg-accent-600 text-white w-full"
              >
                Create Endpoint
              </Button>
            </div>
          </Card>
        )}

        {/* Endpoints Table */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Webhook Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Name</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">URL</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Status</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Success Rate</th>
                  <th className="text-right text-text-secondary text-sm font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-secondary py-8">
                      No webhook endpoints configured
                    </td>
                  </tr>
                ) : (
                  endpoints.map((endpoint) => {
                    const successRate = endpoint.total_sent > 0
                      ? ((endpoint.total_success / endpoint.total_sent) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <tr key={endpoint.id} className="border-b border-border">
                        <td className="py-3 text-text-primary">{endpoint.name}</td>
                        <td className="py-3 text-text-secondary text-sm">{endpoint.url}</td>
                        <td className="py-3">
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              endpoint.status === "active"
                                ? "bg-green-500/20 text-green-500"
                                : endpoint.status === "inactive"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {endpoint.status}
                          </span>
                        </td>
                        <td className="py-3 text-text-primary">
                          {successRate}% ({endpoint.total_success}/{endpoint.total_sent})
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleTestEndpoint(endpoint.id)}
                            className="bg-accent-500 hover:bg-accent-600 text-white"
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Events */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Event Type</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Status</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Response</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Attempts</th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-secondary py-8">
                      No webhook events found
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="border-b border-border">
                      <td className="py-3 text-text-primary">{event.event_type}</td>
                      <td className="py-3">
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            event.status === "delivered"
                              ? "bg-green-500/20 text-green-500"
                              : event.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : event.status === "retrying"
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 text-text-secondary text-sm">
                        {event.response_status || "-"}
                      </td>
                      <td className="py-3 text-text-primary">{event.attempt_count}</td>
                      <td className="py-3 text-text-secondary text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
