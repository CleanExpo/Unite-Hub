"use client";

/**
 * Founder Incident Response (Phase E21)
 * Track outages, breaches, delivery failures with timeline updates and actions
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/patterns/Modal";
import {
  AlertTriangle as ExclamationTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Plus as PlusIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

type IncidentType =
  | "outage"
  | "performance_degradation"
  | "data_breach"
  | "security_incident"
  | "delivery_failure"
  | "integration_failure"
  | "compliance_violation"
  | "api_error"
  | "payment_failure"
  | "email_bounce"
  | "spam_complaint"
  | "user_complaint"
  | "other";

type IncidentStatus =
  | "open"
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved"
  | "closed"
  | "cancelled";

type IncidentSeverity = "low" | "medium" | "high" | "critical";

interface Incident {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  assigned_to: string | null;
  affected_resource: string | null;
  affected_resource_id: string | null;
  impact_description: string | null;
  root_cause: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface IncidentStatistics {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

export default function IncidentsPage() {
  const { user } = useAuth();
  const workspaceId = user?.id;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    type: "outage" as IncidentType,
    severity: "medium" as IncidentSeverity,
    impactDescription: "",
  });

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, statusFilter, severityFilter]);

  async function loadData() {
    try {
      setLoading(true);

      const incidentParams = new URLSearchParams({ workspaceId: workspaceId! });
      if (statusFilter !== "all") {
incidentParams.append("status", statusFilter);
}
      if (severityFilter !== "all") {
incidentParams.append("severity", severityFilter);
}

      const incidentRes = await fetch(`/api/founder/incidents?${incidentParams}`);
      const incidentData = await incidentRes.json();
      setIncidents(incidentData.incidents || []);

      const statsParams = new URLSearchParams({
        workspaceId: workspaceId!,
        action: "statistics",
      });
      const statsRes = await fetch(`/api/founder/incidents?${statsParams}`);
      const statsData = await statsRes.json();
      setStatistics(statsData.statistics || null);
    } catch (error) {
      console.error("[Incidents] Load error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateIncident() {
    try {
      const res = await fetch("/api/founder/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "create-incident",
          ...newIncident,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to create incident");
}

      setShowCreateModal(false);
      setNewIncident({
        title: "",
        description: "",
        type: "outage",
        severity: "medium",
        impactDescription: "",
      });
      loadData();
    } catch (error) {
      console.error("[Incidents] Create error:", error);
    }
  }

  async function handleUpdateStatus(incidentId: string, status: IncidentStatus) {
    try {
      const res = await fetch("/api/founder/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "update-incident-status",
          incidentId,
          status,
        }),
      });

      if (!res.ok) {
throw new Error("Failed to update status");
}

      loadData();
    } catch (error) {
      console.error("[Incidents] Update error:", error);
    }
  }

  function getStatusBadge(status: IncidentStatus) {
    const variants: Record<IncidentStatus, { color: string; icon: React.ReactNode }> = {
      open: {
        color: "bg-error-500/10 text-error-400 border-error-500/20",
        icon: <ExclamationTriangleIcon className="w-3 h-3" />,
      },
      investigating: {
        color: "bg-warning-500/10 text-warning-400 border-warning-500/20",
        icon: <ClockIcon className="w-3 h-3" />,
      },
      identified: {
        color: "bg-accent-500/10 text-accent-400 border-accent-500/20",
        icon: <ExclamationTriangleIcon className="w-3 h-3" />,
      },
      monitoring: {
        color: "bg-info-500/10 text-info-400 border-info-500/20",
        icon: <ClockIcon className="w-3 h-3" />,
      },
      resolved: {
        color: "bg-success-500/10 text-success-400 border-success-500/20",
        icon: <CheckCircleIcon className="w-3 h-3" />,
      },
      closed: {
        color: "bg-bg-hover0/10 text-text-muted border-border/20",
        icon: <CheckCircleIcon className="w-3 h-3" />,
      },
      cancelled: {
        color: "bg-bg-hover0/10 text-text-muted border-border/20",
        icon: <CheckCircleIcon className="w-3 h-3" />,
      },
    };

    const variant = variants[status];
    return (
      <Badge className={`inline-flex items-center gap-1 ${variant.color} border`}>
        {variant.icon}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  function getSeverityBadge(severity: IncidentSeverity) {
    const colors: Record<IncidentSeverity, string> = {
      low: "bg-info-500/10 text-info-400 border-info-500/20",
      medium: "bg-warning-500/10 text-warning-400 border-warning-500/20",
      high: "bg-accent-500/10 text-accent-400 border-accent-500/20",
      critical: "bg-error-500/10 text-error-400 border-error-500/20",
    };

    return (
      <Badge className={`${colors[severity]} border capitalize`}>
        {severity}
      </Badge>
    );
  }

  function formatType(type: IncidentType): string {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-accent-500" />
              Incident Response
            </h1>
            <p className="text-text-secondary mt-1">
              Track outages, breaches, delivery failures
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Incident
          </Button>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text-primary">{statistics.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-error-400">{statistics.open}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Investigating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-warning-400">
                  {statistics.investigating}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success-400">{statistics.resolved}</p>
              </CardContent>
            </Card>
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-secondary text-sm">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-error-500">{statistics.critical}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-bg-card border border-border-primary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incidents">All Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Active Incidents</CardTitle>
                <CardDescription className="text-text-secondary">
                  Currently open or investigating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents
                    .filter((i) => ["open", "investigating"].includes(i.status))
                    .slice(0, 5)
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between p-4 bg-bg-secondary border border-border-primary rounded-lg hover:border-accent-500/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                          <h3 className="font-semibold text-text-primary mb-1">
                            {incident.title}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {formatType(incident.type)} • {new Date(incident.detected_at).toLocaleString()}
                          </p>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
                      </div>
                    ))}
                  {incidents.filter((i) => ["open", "investigating"].includes(i.status)).length ===
                    0 && (
                    <p className="text-center py-8 text-text-secondary">No active incidents</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-text-primary">All Incidents</CardTitle>
                  <div className="flex gap-2">
                    {(["all", "open", "investigating", "resolved"] as const).map((status) => (
                      <Button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        className={
                          statusFilter === status
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
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 bg-bg-secondary border border-border-primary rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                          <h3 className="font-semibold text-text-primary mb-1">
                            {incident.title}
                          </h3>
                          <p className="text-sm text-text-secondary mb-2">
                            {formatType(incident.type)}
                          </p>
                          {incident.description && (
                            <p className="text-sm text-text-secondary mb-2">
                              {incident.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-tertiary mb-3">
                        <span>
                          Detected: {new Date(incident.detected_at).toLocaleString()}
                        </span>
                        {incident.resolved_at && (
                          <span>
                            Resolved: {new Date(incident.resolved_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {incident.status !== "resolved" && incident.status !== "closed" && (
                        <div className="flex gap-2">
                          {incident.status === "open" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(incident.id, "investigating")}
                              className="bg-warning-500/10 text-warning-400 hover:bg-warning-500/20 border border-warning-500/20"
                            >
                              Start Investigating
                            </Button>
                          )}
                          {incident.status === "investigating" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(incident.id, "identified")}
                              className="bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/20"
                            >
                              Mark Identified
                            </Button>
                          )}
                          {["investigating", "identified", "monitoring"].includes(
                            incident.status
                          ) && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(incident.id, "resolved")}
                              className="bg-success-500/10 text-success-400 hover:bg-success-500/20 border border-success-500/20"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Incident"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              value={newIncident.title}
              onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
              placeholder="Brief description of incident"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Type
            </label>
            <select
              value={newIncident.type}
              onChange={(e) =>
                setNewIncident({ ...newIncident, type: e.target.value as IncidentType })
              }
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="outage">Outage</option>
              <option value="performance_degradation">Performance Degradation</option>
              <option value="data_breach">Data Breach</option>
              <option value="security_incident">Security Incident</option>
              <option value="delivery_failure">Delivery Failure</option>
              <option value="integration_failure">Integration Failure</option>
              <option value="compliance_violation">Compliance Violation</option>
              <option value="api_error">API Error</option>
              <option value="payment_failure">Payment Failure</option>
              <option value="email_bounce">Email Bounce</option>
              <option value="spam_complaint">Spam Complaint</option>
              <option value="user_complaint">User Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Severity
            </label>
            <select
              value={newIncident.severity}
              onChange={(e) =>
                setNewIncident({
                  ...newIncident,
                  severity: e.target.value as IncidentSeverity,
                })
              }
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={newIncident.description}
              onChange={(e) =>
                setNewIncident({ ...newIncident, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-bg-secondary text-text-primary hover:bg-bg-tertiary border border-border-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateIncident}
              disabled={!newIncident.title}
              className="flex-1 bg-accent-500 text-white hover:bg-accent-600"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
