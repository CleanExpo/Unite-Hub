"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DataCategory =
  | "audit_logs"
  | "security_events"
  | "incidents"
  | "notifications"
  | "rate_limit_events"
  | "policy_triggers"
  | "webhook_events"
  | "compliance_records"
  | "marketing_events"
  | "analytics_data"
  | "other";

type RetentionPolicyStatus = "active" | "inactive" | "archived";
type DeletionJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface RetentionPolicy {
  id: string;
  tenant_id: string;
  category: DataCategory;
  retention_days: number;
  status: RetentionPolicyStatus;
  description: string | null;
  auto_delete: boolean;
  created_at: string;
  updated_at: string;
}

interface DeletionJob {
  id: string;
  tenant_id: string;
  policy_id: string | null;
  category: DataCategory;
  status: DeletionJobStatus;
  started_at: string | null;
  finished_at: string | null;
  deleted_count: number;
  error_message: string | null;
  created_at: string;
}

interface RetentionStatistics {
  total_policies: number;
  active_policies: number;
  total_jobs: number;
  pending_jobs: number;
  completed_jobs: number;
  by_category: Record<string, number>;
}

export default function DataRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [jobs, setJobs] = useState<DeletionJob[]>([]);
  const [statistics, setStatistics] = useState<RetentionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "audit_logs" as DataCategory,
    retentionDays: 365,
    autoDelete: false,
    description: "",
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

      const [policiesRes, jobsRes, statsRes] = await Promise.all([
        fetch(`/api/founder/data-retention?workspaceId=${wid}`),
        fetch(`/api/founder/data-retention?workspaceId=${wid}&action=jobs`),
        fetch(`/api/founder/data-retention?workspaceId=${wid}&action=statistics`),
      ]);

      if (!policiesRes.ok || !jobsRes.ok || !statsRes.ok) {
        throw new Error("Failed to load data retention information");
      }

      const policiesData = await policiesRes.json();
      const jobsData = await jobsRes.json();
      const statsData = await statsRes.json();

      setPolicies(policiesData.policies || []);
      setJobs(jobsData.jobs || []);
      setStatistics(statsData.statistics || null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePolicy() {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/data-retention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "upsert-policy",
          category: formData.category,
          retentionDays: formData.retentionDays,
          autoDelete: formData.autoDelete,
          description: formData.description || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create policy");
      }

      setShowForm(false);
      setFormData({
        category: "audit_logs",
        retentionDays: 365,
        autoDelete: false,
        description: "",
      });
      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleScheduleJob(category: DataCategory, policyId?: string) {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/founder/data-retention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          action: "schedule-job",
          category,
          policyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule deletion job");
      }

      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeletePolicy(policyId: string) {
    if (!workspaceId) return;
    if (!confirm("Delete this retention policy?")) return;

    try {
      const res = await fetch(
        `/api/founder/data-retention?workspaceId=${workspaceId}&policyId=${policyId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete policy");
      }

      await loadData(workspaceId);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="text-text-primary">Loading data retention center...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Data Retention Center</h1>
            <p className="text-text-secondary mt-1">
              Manage retention policies and deletion jobs (Phase E26)
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            {showForm ? "Cancel" : "Create Policy"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Policies</div>
              <div className="text-2xl font-bold text-text-primary mt-1">
                {statistics.total_policies}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Active</div>
              <div className="text-2xl font-bold text-accent-500 mt-1">
                {statistics.active_policies}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Total Jobs</div>
              <div className="text-2xl font-bold text-text-primary mt-1">
                {statistics.total_jobs}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Pending</div>
              <div className="text-2xl font-bold text-yellow-500 mt-1">
                {statistics.pending_jobs}
              </div>
            </Card>
            <Card className="bg-bg-card border-border p-4">
              <div className="text-text-secondary text-sm">Completed</div>
              <div className="text-2xl font-bold text-green-500 mt-1">
                {statistics.completed_jobs}
              </div>
            </Card>
          </div>
        )}

        {/* Create Policy Form */}
        {showForm && (
          <Card className="bg-bg-card border-border p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Create Retention Policy
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as DataCategory })
                  }
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                >
                  <option value="audit_logs">Audit Logs</option>
                  <option value="security_events">Security Events</option>
                  <option value="incidents">Incidents</option>
                  <option value="notifications">Notifications</option>
                  <option value="rate_limit_events">Rate Limit Events</option>
                  <option value="policy_triggers">Policy Triggers</option>
                  <option value="webhook_events">Webhook Events</option>
                  <option value="compliance_records">Compliance Records</option>
                  <option value="marketing_events">Marketing Events</option>
                  <option value="analytics_data">Analytics Data</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Retention Days
                </label>
                <input
                  type="number"
                  value={formData.retentionDays}
                  onChange={(e) =>
                    setFormData({ ...formData, retentionDays: parseInt(e.target.value) })
                  }
                  className="w-full bg-bg-primary border-border text-text-primary rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.autoDelete}
                    onChange={(e) =>
                      setFormData({ ...formData, autoDelete: e.target.checked })
                    }
                    className="rounded border-border"
                  />
                  <span className="text-text-secondary text-sm">
                    Auto-delete after retention period
                  </span>
                </label>
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
              <Button
                onClick={handleCreatePolicy}
                className="bg-accent-500 hover:bg-accent-600 text-white w-full"
              >
                Create Policy
              </Button>
            </div>
          </Card>
        )}

        {/* Retention Policies */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Retention Policies</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Category
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Retention
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Auto-Delete
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Status
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Updated
                  </th>
                  <th className="text-right text-text-secondary text-sm font-medium pb-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-text-secondary py-8">
                      No retention policies configured
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr key={policy.id} className="border-b border-border">
                      <td className="py-3 text-text-primary">{policy.category}</td>
                      <td className="py-3 text-text-primary">
                        {policy.retention_days} days
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-sm ${
                            policy.auto_delete ? "text-green-500" : "text-text-secondary"
                          }`}
                        >
                          {policy.auto_delete ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            policy.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : policy.status === "inactive"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {policy.status}
                        </span>
                      </td>
                      <td className="py-3 text-text-secondary text-sm">
                        {new Date(policy.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleScheduleJob(policy.category, policy.id)}
                          className="bg-accent-500 hover:bg-accent-600 text-white"
                        >
                          Run Now
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Deletion Jobs */}
        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Deletion Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Category
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Status
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Deleted
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Started
                  </th>
                  <th className="text-left text-text-secondary text-sm font-medium pb-3">
                    Finished
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-text-secondary py-8">
                      No deletion jobs found
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border">
                      <td className="py-3 text-text-primary">{job.category}</td>
                      <td className="py-3">
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            job.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : job.status === "running"
                              ? "bg-blue-500/20 text-blue-500"
                              : job.status === "failed"
                              ? "bg-red-500/20 text-red-500"
                              : job.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 text-text-primary">{job.deleted_count}</td>
                      <td className="py-3 text-text-secondary text-sm">
                        {job.started_at
                          ? new Date(job.started_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-3 text-text-secondary text-sm">
                        {job.finished_at
                          ? new Date(job.finished_at).toLocaleString()
                          : "-"}
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
