"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface UptimeOverview {
  period_days: number;
  total_checks: number;
  up_checks: number;
  down_checks: number;
  overall_uptime_percent: number;
  avg_response_time_ms?: number;
  total_slas: number;
  total_incidents: number;
  open_incidents: number;
}

interface SLADefinition {
  id: string;
  name: string;
  description?: string;
  target_type: string;
  target_value: number;
  target_unit?: string;
  measurement_period_days: number;
  is_active: boolean;
}

interface SLAIncident {
  id: string;
  sla_id: string;
  sla_name: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  started_at: string;
  resolved_at?: string;
}

export default function SLAReportingPage() {
  const [overview, setOverview] = useState<UptimeOverview | null>(null);
  const [slas, setSlas] = useState<SLADefinition[]>([]);
  const [incidents, setIncidents] = useState<SLAIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "slas" | "incidents">("overview");

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  async function loadData() {
    try {
      const [overviewRes, slasRes, incidentsRes] = await Promise.all([
        fetch(`/api/founder/slas?workspaceId=${userId}&action=uptime-overview&days=7`),
        fetch(`/api/founder/slas?workspaceId=${userId}&isActive=true`),
        fetch(`/api/founder/slas?workspaceId=${userId}&action=list-incidents`),
      ]);

      const overviewData = await overviewRes.json();
      const slasData = await slasRes.json();
      const incidentsData = await incidentsRes.json();

      setOverview(overviewData.overview);
      setSlas(slasData.slas || []);
      setIncidents(incidentsData.incidents || []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="text-text-primary">Loading SLA data...</div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500";
      case "high": return "bg-orange-500/10 text-orange-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500";
      case "low": return "bg-blue-500/10 text-blue-500";
      default: return "bg-bg-primary text-text-secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-500/10 text-green-500";
      case "monitoring": return "bg-blue-500/10 text-blue-500";
      case "investigating": return "bg-yellow-500/10 text-yellow-500";
      case "identified": return "bg-orange-500/10 text-orange-500";
      case "open": return "bg-red-500/10 text-red-500";
      default: return "bg-bg-primary text-text-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">SLA & Uptime Reporting</h1>
          <p className="text-text-secondary mt-1">E31: Service Level Agreements and uptime monitoring</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium ${
              activeTab === "overview"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("slas")}
            className={`px-4 py-2 font-medium ${
              activeTab === "slas"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            SLAs
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-4 py-2 font-medium ${
              activeTab === "incidents"
                ? "text-accent-500 border-b-2 border-accent-500"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Incidents
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-bg-card border-border p-6">
                <div className="text-text-secondary text-sm">Overall Uptime (7d)</div>
                <div className="text-3xl font-bold text-accent-500 mt-2">
                  {overview.overall_uptime_percent.toFixed(2)}%
                </div>
              </Card>
              <Card className="bg-bg-card border-border p-6">
                <div className="text-text-secondary text-sm">Total Checks</div>
                <div className="text-3xl font-bold text-text-primary mt-2">
                  {overview.total_checks}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {overview.up_checks} up, {overview.down_checks} down
                </div>
              </Card>
              <Card className="bg-bg-card border-border p-6">
                <div className="text-text-secondary text-sm">Avg Response Time</div>
                <div className="text-3xl font-bold text-text-primary mt-2">
                  {overview.avg_response_time_ms || 0}
                  <span className="text-base text-text-secondary ml-1">ms</span>
                </div>
              </Card>
              <Card className="bg-bg-card border-border p-6">
                <div className="text-text-secondary text-sm">Open Incidents</div>
                <div className="text-3xl font-bold text-red-500 mt-2">
                  {overview.open_incidents}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {overview.total_incidents} total
                </div>
              </Card>
            </div>

            <Card className="bg-bg-card border-border p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Active SLAs</h2>
              <div className="text-2xl font-bold text-accent-500">{overview.total_slas}</div>
              <div className="text-text-secondary text-sm mt-1">Service level agreements configured</div>
            </Card>
          </div>
        )}

        {/* SLAs Tab */}
        {activeTab === "slas" && (
          <div className="space-y-4">
            {slas.length === 0 && (
              <Card className="bg-bg-card border-border p-6">
                <p className="text-text-secondary">No SLA definitions found.</p>
              </Card>
            )}
            {slas.map((sla) => (
              <Card key={sla.id} className="bg-bg-card border-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{sla.name}</h3>
                    {sla.description && (
                      <p className="text-text-secondary text-sm mt-1">{sla.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${
                      sla.is_active ? "bg-green-500/10 text-green-500" : "bg-bg-primary text-text-secondary"
                    }`}
                  >
                    {sla.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary">Target Type</div>
                    <div className="text-text-primary font-medium capitalize">
                      {sla.target_type.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Target Value</div>
                    <div className="text-text-primary font-medium">
                      {sla.target_value} {sla.target_unit || ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary">Measurement Period</div>
                    <div className="text-text-primary font-medium">
                      {sla.measurement_period_days} days
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === "incidents" && (
          <div className="space-y-4">
            {incidents.length === 0 && (
              <Card className="bg-bg-card border-border p-6">
                <p className="text-text-secondary">No incidents found.</p>
              </Card>
            )}
            {incidents.map((incident) => (
              <Card key={incident.id} className="bg-bg-card border-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">{incident.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </span>
                    </div>
                    {incident.description && (
                      <p className="text-text-secondary text-sm mb-2">{incident.description}</p>
                    )}
                    <div className="text-xs text-text-secondary">
                      SLA: {incident.sla_name} | Started: {new Date(incident.started_at).toLocaleString()}
                      {incident.resolved_at && ` | Resolved: ${new Date(incident.resolved_at).toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
