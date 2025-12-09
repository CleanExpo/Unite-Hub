"use client";

/**
 * Founder Audit Log Center (Phase E22)
 * Unified audit logging for governance and founder-level actions
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast } from "@/components/patterns/Toast";
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type AuditCategory =
  | "authentication"
  | "authorization"
  | "data_access"
  | "data_modification"
  | "configuration"
  | "compliance"
  | "security"
  | "billing"
  | "incident"
  | "policy"
  | "notification"
  | "rate_limit"
  | "integration"
  | "export"
  | "import"
  | "other";

interface AuditLog {
  id: string;
  tenant_id: string;
  actor: string | null;
  category: AuditCategory;
  action: string;
  resource: string | null;
  resource_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface AuditStatistics {
  total: number;
  by_category: Record<string, number>;
  by_actor: Array<{ actor: string; count: number }>;
  recent_actions: Array<{
    action: string;
    category: AuditCategory;
    created_at: string;
  }>;
}

export default function AuditLogCenterPage() {
  const { user } = useAuth();
  const workspaceId = user?.id;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "all">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load statistics
      const statsRes = await fetch(`/api/founder/audit?workspaceId=${workspaceId}&action=statistics&days=30`);
      if (statsRes.ok) {
        const { statistics: stats } = await statsRes.json();
        setStatistics(stats);
      }

      // Load logs
      const logsQuery = categoryFilter !== "all" ? `&category=${categoryFilter}` : "";
      const logsRes = await fetch(`/api/founder/audit?workspaceId=${workspaceId}${logsQuery}&limit=100`);
      if (logsRes.ok) {
        const { logs: fetchedLogs } = await logsRes.json();
        setLogs(fetchedLogs || []);
      }
    } catch (error) {
      console.error("Error loading audit data:", error);
      setToast({ message: "Failed to load audit logs", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryBadgeColor = (category: AuditCategory) => {
    const colors: Record<AuditCategory, string> = {
      authentication: "bg-blue-500/10 text-blue-500",
      authorization: "bg-purple-500/10 text-purple-500",
      data_access: "bg-green-500/10 text-green-500",
      data_modification: "bg-yellow-500/10 text-yellow-500",
      configuration: "bg-indigo-500/10 text-indigo-500",
      compliance: "bg-pink-500/10 text-pink-500",
      security: "bg-red-500/10 text-red-500",
      billing: "bg-emerald-500/10 text-emerald-500",
      incident: "bg-orange-500/10 text-orange-500",
      policy: "bg-violet-500/10 text-violet-500",
      notification: "bg-cyan-500/10 text-cyan-500",
      rate_limit: "bg-amber-500/10 text-amber-500",
      integration: "bg-teal-500/10 text-teal-500",
      export: "bg-lime-500/10 text-lime-500",
      import: "bg-fuchsia-500/10 text-fuchsia-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Audit Log Center</h1>
            <p className="text-text-secondary mt-1">
              Unified governance logging for all founder-level actions
            </p>
          </div>
          <ShieldCheckIcon className="h-12 w-12 text-accent-500" />
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Total Events (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{statistics.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Categories Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {Object.keys(statistics.by_category).length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {statistics.by_actor.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-text-secondary">Recent Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">
                  {statistics.recent_actions.length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-bg-card border border-border-primary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Event Distribution by Category</CardTitle>
                <CardDescription className="text-text-secondary">
                  Last 30 days of audit activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statistics && (
                  <div className="space-y-3">
                    {Object.entries(statistics.by_category)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getCategoryBadgeColor(category as AuditCategory)}>
                              {category}
                            </Badge>
                          </div>
                          <span className="text-text-primary font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Top Active Users</CardTitle>
                <CardDescription className="text-text-secondary">
                  Users with most audit events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statistics && statistics.by_actor.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.by_actor.slice(0, 5).map((actorData, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent-500/10 flex items-center justify-center">
                            <span className="text-accent-500 font-semibold text-sm">
                              {idx + 1}
                            </span>
                          </div>
                          <span className="text-text-primary text-sm truncate max-w-xs">
                            {actorData.actor || "Unknown"}
                          </span>
                        </div>
                        <span className="text-text-primary font-semibold">{actorData.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm">No user activity recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            {/* Filter Bar */}
            <Card className="bg-bg-card border-border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <FunnelIcon className="h-5 w-5 text-text-secondary" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as AuditCategory | "all")}
                    className="flex-1 px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-text-primary"
                  >
                    <option value="all">All Categories</option>
                    <option value="authentication">Authentication</option>
                    <option value="authorization">Authorization</option>
                    <option value="data_access">Data Access</option>
                    <option value="data_modification">Data Modification</option>
                    <option value="configuration">Configuration</option>
                    <option value="compliance">Compliance</option>
                    <option value="security">Security</option>
                    <option value="billing">Billing</option>
                    <option value="incident">Incident</option>
                    <option value="policy">Policy</option>
                    <option value="notification">Notification</option>
                    <option value="rate_limit">Rate Limit</option>
                    <option value="integration">Integration</option>
                    <option value="export">Export</option>
                    <option value="import">Import</option>
                    <option value="other">Other</option>
                  </select>
                  <Button onClick={loadData} className="bg-accent-500 hover:bg-accent-600 text-white">
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Audit Log Entries</CardTitle>
                <CardDescription className="text-text-secondary">
                  Most recent audit events (showing {logs.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-primary">
                        <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">
                          Timestamp
                        </th>
                        <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">
                          Category
                        </th>
                        <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">
                          Action
                        </th>
                        <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">
                          Resource
                        </th>
                        <th className="text-left py-3 px-4 text-text-secondary text-sm font-medium">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-text-secondary">
                            No audit logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="border-b border-border-primary hover:bg-bg-hover">
                            <td className="py-3 px-4 text-text-primary text-sm">
                              <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-text-secondary" />
                                {formatDate(log.created_at)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getCategoryBadgeColor(log.category)}>
                                {log.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-text-primary text-sm">
                              {log.action}
                              {log.description && (
                                <div className="text-text-secondary text-xs mt-1">
                                  {log.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-text-primary text-sm">
                              {log.resource ? (
                                <div>
                                  <div className="font-medium">{log.resource}</div>
                                  {log.resource_id && (
                                    <div className="text-text-secondary text-xs truncate max-w-xs">
                                      {log.resource_id}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-secondary">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-text-primary text-sm">
                              {log.ip_address || <span className="text-text-secondary">—</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-bg-card border-border-primary">
              <CardHeader>
                <CardTitle className="text-text-primary">Recent Activity Timeline</CardTitle>
                <CardDescription className="text-text-secondary">
                  Last 5 audit events across all categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statistics && statistics.recent_actions.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.recent_actions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="h-4 w-4 text-accent-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryBadgeColor(action.category)}>
                              {action.category}
                            </Badge>
                            <span className="text-text-primary text-sm font-medium">
                              {action.action}
                            </span>
                          </div>
                          <p className="text-text-secondary text-xs mt-1">
                            {formatDate(action.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
