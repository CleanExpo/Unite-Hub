"use client";

/**
 * Founder Security Center (Phase E20)
 * Session tracking, security event monitoring
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast } from "@/components/patterns/Toast";
import {
  ShieldExclamationIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type SessionStatus = "active" | "expired" | "revoked" | "logged_out";
type SecurityEventType = "login_success" | "login_failure" | "logout" | "mfa_enabled" | "mfa_disabled" |
  "mfa_verified" | "mfa_failed" | "password_changed" | "password_reset_requested" | "password_reset_completed" |
  "email_changed" | "permission_granted" | "permission_revoked" | "session_created" | "session_invalidated" |
  "api_key_created" | "api_key_revoked" | "suspicious_activity" | "account_locked" | "account_unlocked" | "other";
type SecurityEventSeverity = "info" | "warning" | "critical";

interface UserSession {
  id: string;
  tenant_id: string;
  user_id: string;
  session_token: string;
  status: SessionStatus;
  device_info: string | null;
  browser_info: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  last_active_at: string;
  created_at: string;
  expires_at: string;
  invalidated_at: string | null;
  metadata: Record<string, any>;
}

interface SecurityEvent {
  id: string;
  tenant_id: string;
  user_id: string | null;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  resource: string | null;
  resource_id: string | null;
  success: boolean;
  failure_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface SecurityEventSummary {
  total: number;
  critical: number;
  warnings: number;
  failed_logins: number;
  by_type: Record<string, number>;
  period_days: number;
}

export default function SecurityCenterPage() {
  const { user } = useAuth();
  const workspaceId = user?.id;

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecurityEventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionFilter, setSessionFilter] = useState<SessionStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<SecurityEventSeverity | "all">("all");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, sessionFilter, severityFilter]);

  async function loadData() {
    try {
      setLoading(true);

      // Load sessions
      const sessionParams = new URLSearchParams({ workspaceId: workspaceId! });
      if (sessionFilter !== "all") {
        sessionParams.append("status", sessionFilter);
      }
      const sessionRes = await fetch(`/api/founder/security?${sessionParams}`);
      const sessionData = await sessionRes.json();
      setSessions(sessionData.sessions || []);

      // Load summary
      const summaryParams = new URLSearchParams({
        workspaceId: workspaceId!,
        action: "summary",
        days: "30"
      });
      const summaryRes = await fetch(`/api/founder/security?${summaryParams}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary || null);

      // Load events
      const eventsParams = new URLSearchParams({
        workspaceId: workspaceId!,
        action: "events",
        limit: "50"
      });
      if (severityFilter !== "all") {
        eventsParams.append("severity", severityFilter);
      }
      const eventsRes = await fetch(`/api/founder/security?${eventsParams}`);
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);

    } catch (error) {
      console.error("[Security] Load error:", error);
      setToast({ message: "Failed to load security data", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleInvalidateSession(sessionId: string) {
    try {
      const res = await fetch("/api/founder/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "invalidate-session",
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Failed to invalidate session");

      setToast({ message: "Session invalidated", type: "success" });
      loadData();
    } catch (error) {
      console.error("[Security] Invalidate error:", error);
      setToast({ message: "Failed to invalidate session", type: "error" });
    }
  }

  function getStatusBadge(status: SessionStatus) {
    const variants: Record<SessionStatus, { color: string; icon: React.ReactNode }> = {
      active: { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: <CheckCircleIcon className="w-3 h-3" /> },
      expired: { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <ClockIcon className="w-3 h-3" /> },
      revoked: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: <XCircleIcon className="w-3 h-3" /> },
      logged_out: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <XCircleIcon className="w-3 h-3" /> },
    };

    const variant = variants[status];
    return (
      <Badge className={`inline-flex items-center gap-1 ${variant.color} border`}>
        {variant.icon}
        <span className="capitalize">{status.replace("_", " ")}</span>
      </Badge>
    );
  }

  function getSeverityBadge(severity: SecurityEventSeverity) {
    const variants: Record<SecurityEventSeverity, { color: string; icon: React.ReactNode }> = {
      info: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <CheckCircleIcon className="w-3 h-3" /> },
      warning: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <ExclamationTriangleIcon className="w-3 h-3" /> },
      critical: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: <ShieldExclamationIcon className="w-3 h-3" /> },
    };

    const variant = variants[severity];
    return (
      <Badge className={`inline-flex items-center gap-1 ${variant.color} border`}>
        {variant.icon}
        <span className="capitalize">{severity}</span>
      </Badge>
    );
  }

  function formatEventType(type: SecurityEventType): string {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <ShieldExclamationIcon className="w-8 h-8 text-accent-500" />
              Security Center
            </h1>
            <p className="text-text-secondary mt-1">
              Session monitoring, security event tracking
            </p>
          </div>
        </div>

        {/* Statistics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Total Events (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text-primary">{summary.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-400">{summary.critical}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-400">{summary.warnings}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-400">{summary.failed_logins}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-bg-card border border-border-primary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-bg-card border-border-primary">
                <CardHeader>
                  <CardTitle className="text-text-primary">Active Sessions</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Currently logged in users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.filter(s => s.status === "active").slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-bg-secondary border border-border-primary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ComputerDesktopIcon className="w-5 h-5 text-accent-500" />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {session.device_info || "Unknown Device"}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {session.ip_address} • {new Date(session.last_active_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    ))}
                    {sessions.filter(s => s.status === "active").length === 0 && (
                      <p className="text-center py-8 text-text-secondary">No active sessions</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-bg-card border-border-primary">
                <CardHeader>
                  <CardTitle className="text-text-primary">Recent Events</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Latest security events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-bg-secondary border border-border-primary rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text-primary">
                            {formatEventType(event.event_type)}
                          </span>
                          {getSeverityBadge(event.severity)}
                        </div>
                        <p className="text-xs text-text-secondary">
                          {new Date(event.created_at).toLocaleString()}
                          {event.ip_address && ` • ${event.ip_address}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">User Sessions</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "active", "expired", "revoked"] as const).map((status) => (
                      <Button
                        key={status}
                        onClick={() => setSessionFilter(status)}
                        variant={sessionFilter === status ? "default" : "outline"}
                        size="sm"
                        className={
                          sessionFilter === status
                            ? "bg-accent-500 text-white"
                            : "bg-bg-secondary text-text-secondary"
                        }
                      >
                        {status === "all" ? "All" : status}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ComputerDesktopIcon className="w-6 h-6 text-accent-500" />
                          <div>
                            <h3 className="font-semibold text-text-primary mb-1">
                              {session.device_info || "Unknown Device"}
                            </h3>
                            <p className="text-sm text-text-secondary">
                              {session.browser_info || "Unknown Browser"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-text-tertiary mb-3">
                        <div>
                          <span className="block text-text-secondary mb-1">IP Address</span>
                          <span>{session.ip_address || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-text-secondary mb-1">Location</span>
                          <span>
                            {session.city && session.country
                              ? `${session.city}, ${session.country}`
                              : "Unknown"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-text-secondary mb-1">Last Active</span>
                          <span>{new Date(session.last_active_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-text-secondary mb-1">Expires</span>
                          <span>{new Date(session.expires_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {session.status === "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleInvalidateSession(session.id)}
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                        >
                          Invalidate Session
                        </Button>
                      )}
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <p className="text-center py-12 text-text-secondary">No sessions found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">Security Events</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "info", "warning", "critical"] as const).map((severity) => (
                      <Button
                        key={severity}
                        onClick={() => setSeverityFilter(severity)}
                        variant={severityFilter === severity ? "default" : "outline"}
                        size="sm"
                        className={
                          severityFilter === severity
                            ? "bg-accent-500 text-white"
                            : "bg-bg-secondary text-text-secondary"
                        }
                      >
                        {severity === "all" ? "All" : severity}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-text-primary mb-1">
                            {formatEventType(event.event_type)}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-text-secondary">{event.description}</p>
                          )}
                        </div>
                        {getSeverityBadge(event.severity)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                        {event.ip_address && <span>IP: {event.ip_address}</span>}
                        {event.resource && <span>Resource: {event.resource}</span>}
                        <Badge
                          className={
                            event.success
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }
                        >
                          {event.success ? "Success" : "Failed"}
                        </Badge>
                      </div>

                      {!event.success && event.failure_reason && (
                        <p className="mt-2 text-xs text-red-400 p-2 bg-red-500/10 rounded">
                          {event.failure_reason}
                        </p>
                      )}
                    </div>
                  ))}

                  {events.length === 0 && (
                    <p className="text-center py-12 text-text-secondary">No events found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
