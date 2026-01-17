"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Settings,
  BarChart3,
  Eye,
  Clock,
  Trash2,
  Shield,
} from "lucide-react";

interface GuardianNetworkFeatureFlags {
  enableNetworkTelemetry: boolean;
  enableNetworkBenchmarks: boolean;
  enableNetworkAnomalies: boolean;
  enableNetworkEarlyWarnings: boolean;
  enableAiHints: boolean;
  enableCohortMetadataSharing: boolean;
}

interface GuardianNetworkStats {
  benchmarksAvailable: boolean;
  anomaliesLast30d: number;
  earlyWarningsOpen: number;
  telemetryActiveSince?: string;
  cohortsUsed: string[];
}

interface GuardianNetworkRecentAnomaly {
  detectedAt: string;
  metricFamily: string;
  metricKey: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface GuardianNetworkRecentWarning {
  id: string;
  createdAt: string;
  severity: "low" | "medium" | "high" | "critical";
  matchScore: number;
  patternKey: string;
  suggestionTheme?: string;
}

interface GuardianNetworkGovernanceEvent {
  occurredAt: string;
  eventType: string;
  context: string;
  detailsSummary?: string;
}

interface GuardianNetworkRetentionPolicy {
  telemetryRetentionDays: number;
  aggregatesRetentionDays: number;
  anomaliesRetentionDays: number;
  benchmarksRetentionDays: number;
  earlyWarningsRetentionDays: number;
  governanceRetentionDays: number;
}

interface GuardianNetworkLifecycleEvent {
  occurredAt: string;
  scope: string;
  action: string;
  itemsAffected: number;
  detail: string;
}

interface GuardianNetworkRecommendation {
  id: string;
  status: 'open' | 'in_progress' | 'implemented' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendationType: string;
  suggestionTheme: string;
  title: string;
  summary: string;
  rationale?: string;
  createdAt: string;
  updatedAt: string;
}

interface GuardianNetworkOverview {
  flags: GuardianNetworkFeatureFlags;
  stats: GuardianNetworkStats;
  recentAnomalies: GuardianNetworkRecentAnomaly[];
  recentWarnings: GuardianNetworkRecentWarning[];
  recentGovernanceEvents: GuardianNetworkGovernanceEvent[];
}

const SEVERITY_COLORS = {
  critical: "bg-error-100 text-error-800 border-error-300",
  high: "bg-accent-100 text-accent-800 border-accent-300",
  medium: "bg-warning-100 text-warning-800 border-warning-300",
  low: "bg-info-100 text-info-800 border-info-300",
};

export default function NetworkIntelligencePage() {
  const [overview, setOverview] = useState<GuardianNetworkOverview | null>(null);
  const [flags, setFlags] = useState<GuardianNetworkFeatureFlags | null>(null);
  const [retention, setRetention] = useState<GuardianNetworkRetentionPolicy | null>(null);
  const [lifecycleEvents, setLifecycleEvents] = useState<GuardianNetworkLifecycleEvent[]>([]);
  const [recommendations, setRecommendations] = useState<GuardianNetworkRecommendation[]>([]);
  const [recommendationDetail, setRecommendationDetail] = useState<GuardianNetworkRecommendation | null>(null);
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'open' | 'in_progress'>('open');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "insights" | "settings" | "compliance" | "recommendations">(
    "overview"
  );

  const { workspaceId, loading: workspaceLoading, error: workspaceError } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;

    const loadAllData = async () => {
      await loadOverview();
      await loadRetention();
      await loadLifecycleEvents();
      await loadRecommendations();
    };
    loadAllData();
  }, [workspaceId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/guardian/admin/network/overview?workspaceId=${workspaceId}`
      );

      if (!res.ok) {
        throw new Error(`Failed to load overview: ${res.status}`);
      }

      const data = await res.json();
      setOverview(data.overview);
      setFlags(data.overview.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleFlagToggle = async (flagKey: keyof GuardianNetworkFeatureFlags) => {
    if (!flags) {
return;
}

    try {
      setUpdating(true);
      setError(null);

      const updated = {
        ...flags,
        [flagKey]: !flags[flagKey],
      };

      const res = await fetch(
        `/api/guardian/admin/network/settings?workspaceId=${workspaceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to update flags: ${res.status}`);
      }

      setFlags(updated);
      // Reload overview to refresh stats
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const loadRetention = async () => {
    try {
      const res = await fetch(
        `/api/guardian/admin/network/retention?workspaceId=${workspaceId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRetention(data.data);
      }
    } catch (err) {
      console.error('Failed to load retention policy:', err);
    }
  };

  const loadLifecycleEvents = async () => {
    try {
      const res = await fetch(
        `/api/guardian/admin/network/lifecycle?workspaceId=${workspaceId}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setLifecycleEvents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load lifecycle events:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      const statusFilter = recommendationFilter === 'all' ? '' : `&status=${recommendationFilter}`;
      const res = await fetch(
        `/api/guardian/network/recommendations?workspaceId=${workspaceId}&limit=50${statusFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const updateRecommendationStatus = async (id: string, status: 'in_progress' | 'implemented' | 'dismissed') => {
    try {
      setUpdating(true);
      const res = await fetch(
        `/api/guardian/network/recommendations?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (recommendationDetail && recommendationDetail.id === id) {
          setRecommendationDetail(data.data);
        }
        await loadRecommendations();
      } else {
        setError('Failed to update recommendation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleRetentionUpdate = async (key: keyof GuardianNetworkRetentionPolicy, value: number) => {
    if (!retention) {
return;
}

    try {
      setUpdating(true);
      const patch = { [key]: Math.max(30, Math.min(3650, value)) };

      const res = await fetch(
        `/api/guardian/admin/network/retention?workspaceId=${workspaceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patch }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRetention(data.data);
        await loadLifecycleEvents();
      } else {
        setError('Failed to update retention policy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleCleanupDryRun = async () => {
    try {
      setCleanupRunning(true);
      const res = await fetch(
        `/api/guardian/admin/network/cleanup?workspaceId=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'tenant', dryRun: true, limitPerTable: 1000 }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        alert(`Dry-run: Would delete ${data.data.totalAffected} rows total`);
      } else {
        setError('Failed to run cleanup dry-run');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setCleanupRunning(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-text-tertiary">Loading workspace...</div>
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="pt-6">
            <p className="text-sm text-error-900">{workspaceError || "No workspace selected"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-text-tertiary">Loading Network Intelligence...</div>
      </div>
    );
  }

  if (!overview || !flags) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="pt-6">
            <p className="text-sm text-error-900">{error || "Failed to load Network Intelligence"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Network Intelligence Console</h1>
          <p className="text-text-muted mt-1">
            Unified view of X-series network telemetry, anomalies, and governance
          </p>
        </div>
        <Button onClick={loadOverview} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Privacy Banner */}
      <Card className="border-info-200 bg-info-50">
        <CardContent className="pt-6">
          <p className="text-sm text-info-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              All X-series data is privacy-preserving. Network metrics are aggregated
              at the cohort level with no individual tenant cross-references or PII.
            </span>
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="pt-6">
            <p className="text-sm text-warning-900">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "overview"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setSelectedTab("insights")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "insights"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Eye className="w-4 h-4" />
          Insights
        </button>
        <button
          onClick={() => setSelectedTab("settings")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "settings"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => setSelectedTab("compliance")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "compliance"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Shield className="w-4 h-4" />
          Compliance
        </button>
        <button
          onClick={() => {
            setSelectedTab("recommendations");
            loadRecommendations();
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "recommendations"
              ? "border-accent-500 text-accent-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Recommendations
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* Feature Flag Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">X-Series Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Network Telemetry</p>
                    <p className="text-xs text-text-tertiary">Anonymized metric ingestion</p>
                  </div>
                  <Badge
                    className={flags.enableNetworkTelemetry ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableNetworkTelemetry ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Benchmarks</p>
                    <p className="text-xs text-text-tertiary">Cohort comparisons</p>
                  </div>
                  <Badge
                    className={flags.enableNetworkBenchmarks ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableNetworkBenchmarks ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Anomalies</p>
                    <p className="text-xs text-text-tertiary">Anomaly detection (X02)</p>
                  </div>
                  <Badge
                    className={flags.enableNetworkAnomalies ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableNetworkAnomalies ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Early Warnings</p>
                    <p className="text-xs text-text-tertiary">Pattern-based signals (X03)</p>
                  </div>
                  <Badge
                    className={flags.enableNetworkEarlyWarnings ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableNetworkEarlyWarnings ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">AI Hints</p>
                    <p className="text-xs text-text-tertiary">AI-generated suggestions</p>
                  </div>
                  <Badge
                    className={flags.enableAiHints ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableAiHints ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Cohort Metadata</p>
                    <p className="text-xs text-text-tertiary">Region/vertical in cohorts</p>
                  </div>
                  <Badge
                    className={flags.enableCohortMetadataSharing ? "bg-success-100 text-success-800" : "bg-bg-hover text-text-secondary"}
                  >
                    {flags.enableCohortMetadataSharing ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-accent-600">
                  {overview.stats.anomaliesLast30d}
                </div>
                <p className="text-sm text-text-muted mt-1">Anomalies (30d)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-accent-600">
                  {overview.stats.earlyWarningsOpen}
                </div>
                <p className="text-sm text-text-muted mt-1">Open Warnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {overview.stats.benchmarksAvailable ? "Yes" : "No"}
                </div>
                <p className="text-sm text-text-muted mt-1">Benchmarks</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{overview.stats.cohortsUsed.length}</div>
                <p className="text-sm text-text-muted mt-1">Cohorts</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Anomalies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.recentAnomalies.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No recent anomalies</p>
                ) : (
                  <div className="space-y-2">
                    {overview.recentAnomalies.slice(0, 5).map((anom, idx) => (
                      <div key={idx} className="text-xs p-2 border rounded flex justify-between">
                        <div>
                          <p className="font-medium">{anom.metricKey}</p>
                          <p className="text-text-tertiary">{anom.metricFamily}</p>
                        </div>
                        <Badge
                          className={
                            SEVERITY_COLORS[anom.severity] || "bg-bg-hover text-text-secondary"
                          }
                        >
                          {anom.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Warnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Early Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.recentWarnings.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No recent warnings</p>
                ) : (
                  <div className="space-y-2">
                    {overview.recentWarnings.slice(0, 5).map((warn) => (
                      <div key={warn.id} className="text-xs p-2 border rounded">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">{warn.patternKey}</p>
                          <Badge
                            className={
                              SEVERITY_COLORS[warn.severity] || "bg-bg-hover text-text-secondary"
                            }
                          >
                            {(warn.matchScore * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        {warn.suggestionTheme && (
                          <p className="text-text-tertiary">{warn.suggestionTheme}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {selectedTab === "insights" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {!flags.enableNetworkAnomalies && !flags.enableNetworkEarlyWarnings ? (
                <div className="p-6 bg-bg-hover border border-border rounded text-center">
                  <AlertCircle className="w-8 h-8 mx-auto text-text-muted mb-2" />
                  <p className="text-text-muted">
                    Enable "Anomalies" or "Early Warnings" in Settings to view insights
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flags.enableNetworkAnomalies && (
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Network Anomalies (X02)</h4>
                      <p className="text-sm text-text-muted">
                        View detailed anomaly detection results and historical patterns
                      </p>
                    </div>
                  )}
                  {flags.enableNetworkEarlyWarnings && (
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Early-Warning Signals (X03)</h4>
                      <p className="text-sm text-text-muted">
                        Monitor pattern-based early warnings derived from cohort behavior
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SETTINGS TAB */}
      {selectedTab === "settings" && (
        <div className="space-y-6">
          {/* Feature Flag Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>X-Series Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "enableNetworkTelemetry" as const,
                  label: "Network Telemetry",
                  description: "Allow your anonymized metrics to be included in cohort statistics",
                },
                {
                  key: "enableNetworkBenchmarks" as const,
                  label: "Benchmarks",
                  description: "Access to cohort-level benchmark comparisons (requires Telemetry)",
                },
                {
                  key: "enableNetworkAnomalies" as const,
                  label: "Anomaly Detection",
                  description: "View network anomaly detection results and trends",
                },
                {
                  key: "enableNetworkEarlyWarnings" as const,
                  label: "Early Warnings",
                  description: "Receive pattern-based early-warning signals",
                },
                {
                  key: "enableAiHints" as const,
                  label: "AI Suggestions",
                  description: "Enable AI-generated hints and explanations in Network console",
                },
                {
                  key: "enableCohortMetadataSharing" as const,
                  label: "Cohort Metadata Sharing",
                  description: "Allow region/vertical metadata in cohort derivation (otherwise global-only)",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.description}</p>
                  </div>
                  <Switch
                    checked={flags[item.key]}
                    onCheckedChange={() => handleFlagToggle(item.key)}
                    disabled={updating}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Governance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Governance & History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.recentGovernanceEvents.length === 0 ? (
                <p className="text-sm text-text-tertiary">No governance events recorded</p>
              ) : (
                <div className="space-y-2">
                  {overview.recentGovernanceEvents.map((event, idx) => (
                    <div key={idx} className="text-xs p-2 border rounded flex justify-between">
                      <div>
                        <p className="font-medium">{event.eventType}</p>
                        <p className="text-text-tertiary">{event.context}</p>
                        {event.detailsSummary && (
                          <p className="text-text-muted mt-1">{event.detailsSummary}</p>
                        )}
                      </div>
                      <p className="text-text-muted flex-shrink-0">
                        {new Date(event.occurredAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Info */}
          <Card className="border-info-200 bg-info-50">
            <CardContent className="pt-6">
              <p className="text-sm text-info-900">
                <strong>Privacy Guarantee:</strong> Your tenant's individual metrics are never
                shared with other tenants. All X-series features use anonymized cohort-level
                aggregations without cross-tenant identifiers.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {selectedTab === "compliance" && (
        <div className="space-y-6">
          {/* Retention Policy Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Data Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {retention ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'telemetryRetentionDays' as const, label: 'Telemetry (X01)', desc: 'Hourly metrics' },
                    { key: 'aggregatesRetentionDays' as const, label: 'Aggregates', desc: 'Cohort data' },
                    { key: 'anomaliesRetentionDays' as const, label: 'Anomalies (X02)', desc: 'Detection signals' },
                    { key: 'benchmarksRetentionDays' as const, label: 'Benchmarks', desc: 'Snapshots' },
                    { key: 'earlyWarningsRetentionDays' as const, label: 'Early Warnings (X03)', desc: 'Patterns matched' },
                    { key: 'governanceRetentionDays' as const, label: 'Governance Events', desc: 'Audit trail' },
                  ].map((item) => (
                    <div key={item.key} className="p-4 border rounded">
                      <label className="block mb-2">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-text-tertiary">{item.desc}</p>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="30"
                          max="3650"
                          value={retention[item.key]}
                          onChange={(e) => handleRetentionUpdate(item.key, parseInt(e.target.value, 10))}
                          disabled={updating}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder={`Enter ${item.label} retention days`}
                          aria-label={`${item.label} retention days`}
                        />
                        <span className="text-xs text-text-tertiary w-8">days</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">Loading retention policy...</p>
              )}
              <p className="text-xs text-text-tertiary mt-4">
                Range: 30–3650 days. Automatic cleanup runs daily for data older than the retention period.
              </p>
            </CardContent>
          </Card>

          {/* Cleanup Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Lifecycle Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded bg-bg-hover">
                <h4 className="font-medium text-sm mb-2">Cleanup Actions</h4>
                <p className="text-xs text-text-muted mb-4">
                  Preview what will be deleted based on retention policy. Dry-run mode counts rows without deleting.
                </p>
                <Button
                  onClick={handleCleanupDryRun}
                  disabled={cleanupRunning || updating}
                  variant="outline"
                  className="text-accent-600 border-accent-200 hover:bg-accent-50"
                >
                  {cleanupRunning ? 'Running...' : 'Run Dry-Run Cleanup'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lifecycle Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Lifecycle Events</CardTitle>
            </CardHeader>
            <CardContent>
              {lifecycleEvents.length === 0 ? (
                <p className="text-sm text-text-tertiary">No lifecycle events recorded</p>
              ) : (
                <div className="space-y-2">
                  {lifecycleEvents.slice(0, 10).map((event, idx) => (
                    <div key={idx} className="text-xs p-3 border rounded bg-bg-hover">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium">{event.scope.toUpperCase()}</p>
                          <p className="text-text-muted">{event.action}</p>
                        </div>
                        <Badge className="bg-info-100 text-info-800">
                          {event.itemsAffected} rows
                        </Badge>
                      </div>
                      <p className="text-text-tertiary mt-1">{event.detail}</p>
                      <p className="text-text-muted text-xs mt-1">
                        {new Date(event.occurredAt).toLocaleDateString()} {new Date(event.occurredAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Info */}
          <Card className="border-success-200 bg-success-50">
            <CardContent className="pt-6">
              <p className="text-sm text-success-900">
                <strong>Retention & Compliance:</strong> All lifecycle operations are immutable and auditable.
                Retention policies apply only to X-series artifacts; Guardian core runtime tables are never touched.
                Governance events are preserved according to your retention setting.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RECOMMENDATIONS TAB */}
      {selectedTab === "recommendations" && (
        <div className="space-y-6">
          {/* Advisory Banner */}
          <Card className="border-info-200 bg-info-50">
            <CardContent className="pt-6">
              <p className="text-sm text-info-900 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Advisory-Only:</strong> Recommendations are non-binding guidance derived from network
                  intelligence. You decide when and how to apply them. No automatic configuration changes occur.
                </span>
              </p>
            </CardContent>
          </Card>

          {!flags?.enableNetworkEarlyWarnings && !flags?.enableNetworkAnomalies ? (
            <Card className="border-warning-200 bg-warning-50">
              <CardContent className="pt-6">
                <p className="text-sm text-warning-900">
                  Enable "Anomalies" or "Early Warnings" in Settings to see recommendations
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filter & Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Select value={recommendationFilter} onValueChange={(val) => {
                      setRecommendationFilter(val as 'all' | 'open' | 'in_progress');
                      setTimeout(() => loadRecommendations(), 0);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recommendations.length === 0 ? (
                    <div className="p-6 bg-bg-hover border border-border rounded text-center">
                      <CheckCircle className="w-8 h-8 mx-auto text-text-muted mb-2" />
                      <p className="text-text-muted">No {recommendationFilter !== 'all' ? recommendationFilter : ''} recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 border rounded hover:bg-bg-hover cursor-pointer transition-colors"
                          onClick={() => setRecommendationDetail(rec)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{rec.title}</p>
                              <p className="text-xs text-text-tertiary mt-1">{rec.summary}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Badge
                                className={
                                  SEVERITY_COLORS[rec.severity] || "bg-bg-hover text-text-secondary"
                                }
                              >
                                {rec.severity}
                              </Badge>
                              <Badge
                                className={
                                  rec.status === 'open'
                                    ? 'bg-info-100 text-info-800'
                                    : rec.status === 'in_progress'
                                    ? 'bg-accent-100 text-accent-800'
                                    : rec.status === 'implemented'
                                    ? 'bg-success-100 text-success-800'
                                    : 'bg-bg-hover text-text-secondary'
                                }
                              >
                                {rec.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 text-xs mt-3">
                            <span className="text-text-tertiary">{rec.recommendationType}</span>
                            <span className="text-text-muted">•</span>
                            <span className="text-text-tertiary">{rec.suggestionTheme}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detail Panel */}
              {recommendationDetail && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{recommendationDetail.title}</span>
                      <Badge
                        className={
                          SEVERITY_COLORS[recommendationDetail.severity] || "bg-bg-hover text-text-secondary"
                        }
                      >
                        {recommendationDetail.severity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Summary</p>
                      <p className="text-sm">{recommendationDetail.summary}</p>
                    </div>

                    {recommendationDetail.rationale && (
                      <div>
                        <p className="text-xs text-text-tertiary mb-1">Rationale</p>
                        <p className="text-sm">{recommendationDetail.rationale}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-text-tertiary">Type</p>
                        <p className="text-sm font-medium">{recommendationDetail.recommendationType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-tertiary">Theme</p>
                        <p className="text-sm font-medium">{recommendationDetail.suggestionTheme}</p>
                      </div>
                    </div>

                    {recommendationDetail.status === 'open' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => updateRecommendationStatus(recommendationDetail.id, 'in_progress')}
                          disabled={updating}
                          size="sm"
                          className="bg-accent-600 hover:bg-accent-700"
                        >
                          Start Work
                        </Button>
                        <Button
                          onClick={() => updateRecommendationStatus(recommendationDetail.id, 'dismissed')}
                          disabled={updating}
                          variant="outline"
                          size="sm"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}

                    {recommendationDetail.status === 'in_progress' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => updateRecommendationStatus(recommendationDetail.id, 'implemented')}
                          disabled={updating}
                          size="sm"
                          className="bg-success-600 hover:bg-success-700"
                        >
                          Mark Implemented
                        </Button>
                        <Button
                          onClick={() => updateRecommendationStatus(recommendationDetail.id, 'open')}
                          disabled={updating}
                          variant="outline"
                          size="sm"
                        >
                          Revert to Open
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-text-muted pt-4 border-t">
                      Updated: {new Date(recommendationDetail.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
