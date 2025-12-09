"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Play, TrendingUp, AlertTriangle, CheckCircle2, Clock, Target } from "lucide-react";

type OptimizerRunStatus = "pending" | "running" | "completed" | "failed";
type OptimizerActionPriority = "critical" | "high" | "medium" | "low";
type OptimizerActionStatus = "open" | "in_progress" | "applied" | "dismissed";

interface OptimizerRun {
  id: string;
  tenant_id: string;
  business_id?: string;
  scope: string;
  status: OptimizerRunStatus;
  metrics_snapshot: Record<string, unknown>;
  ai_summary: {
    health_score?: number;
    key_issues?: string[];
    opportunities?: string[];
    recommendations?: unknown[];
  };
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface OptimizerAction {
  id: string;
  tenant_id: string;
  optimizer_run_id: string;
  category: string;
  priority: OptimizerActionPriority;
  title: string;
  recommendation: string;
  target_entity?: string;
  eta_minutes?: number;
  ai_rationale: {
    reasoning?: string;
    expected_impact?: string;
    risks?: string;
  };
  status: OptimizerActionStatus;
  created_at: string;
  applied_at?: string;
}

interface OptimizerSummary {
  total_runs: number;
  completed_runs: number;
  total_actions: number;
  critical_actions: number;
  applied_actions: number;
  avg_health_score: number;
}

export default function AutoOptimizerPage() {
  const [runs, setRuns] = useState<OptimizerRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<OptimizerRun | null>(null);
  const [actions, setActions] = useState<OptimizerAction[]>([]);
  const [summary, setSummary] = useState<OptimizerSummary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Form state
  const [scope, setScope] = useState("full");

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/synthex/optimizer/run?action=summary&days=30");
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  // Fetch runs
  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/synthex/optimizer/run");
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs);
      }
    } catch (error) {
      console.error("Failed to fetch runs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch actions for selected run
  const fetchActions = async (runId: string) => {
    try {
      const res = await fetch(`/api/synthex/optimizer/actions?run_id=${runId}`);
      const data = await res.json();
      if (data.success) {
        setActions(data.actions);
      }
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchActions(selectedRun.id);
    }
  }, [selectedRun]);

  // Create and execute optimizer run
  const handleExecuteOptimization = async () => {
    setExecuting(true);
    try {
      // Create run
      const createRes = await fetch("/api/synthex/optimizer/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", scope }),
      });
      const createData = await createRes.json();

      if (!createData.success) {
        alert("Failed to create run");
        return;
      }

      // Execute run
      const executeRes = await fetch("/api/synthex/optimizer/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", run_id: createData.run.id }),
      });
      const executeData = await executeRes.json();

      if (executeData.success) {
        setIsCreateModalOpen(false);
        setScope("full");
        fetchRuns();
        fetchSummary();
        // Auto-select the new run
        setSelectedRun(executeData.run);
      } else {
        alert("Failed to execute optimization");
      }
    } catch (error) {
      console.error("Failed to execute optimization:", error);
      alert("Error executing optimization");
    } finally {
      setExecuting(false);
    }
  };

  // Update action status
  const handleUpdateActionStatus = async (actionId: string, status: OptimizerActionStatus) => {
    try {
      const res = await fetch("/api/synthex/optimizer/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId, status }),
      });
      const data = await res.json();

      if (data.success && selectedRun) {
        fetchActions(selectedRun.id);
        fetchSummary();
      }
    } catch (error) {
      console.error("Failed to update action status:", error);
    }
  };

  const statusColors: Record<OptimizerRunStatus, string> = {
    pending: "text-text-muted bg-text-muted/20",
    running: "text-warning-500 bg-warning-500/20",
    completed: "text-success-500 bg-success-500/20",
    failed: "text-error-500 bg-error-500/20",
  };

  const priorityColors: Record<OptimizerActionPriority, string> = {
    critical: "text-error-500 bg-error-500/20",
    high: "text-accent-500 bg-accent-500/20",
    medium: "text-warning-500 bg-warning-500/20",
    low: "text-text-muted bg-text-muted/20",
  };

  const actionStatusColors: Record<OptimizerActionStatus, string> = {
    open: "text-text-muted bg-text-muted/20",
    in_progress: "text-warning-500 bg-warning-500/20",
    applied: "text-success-500 bg-success-500/20",
    dismissed: "text-text-muted bg-text-muted/20 opacity-50",
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-success-500";
    if (score >= 60) return "text-warning-500";
    return "text-error-500";
  };

  return (
    <div className="min-h-screen bg-bg-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Auto-Optimizer Engine</h1>
            <p className="text-text-muted mt-1">Autonomous system health monitoring and AI-powered optimization</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent-500 hover:bg-accent-600 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Execute Optimization
          </Button>
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Total Runs
              </div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_runs}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
              <div className="text-2xl font-bold text-success-500">{summary.completed_runs}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <Target className="w-4 h-4" />
                Total Actions
              </div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_actions}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                Critical Open
              </div>
              <div className="text-2xl font-bold text-error-500">{summary.critical_actions}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Applied
              </div>
              <div className="text-2xl font-bold text-success-500">{summary.applied_actions}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Avg Health
              </div>
              <div className={`text-2xl font-bold ${getHealthScoreColor(summary.avg_health_score || 0)}`}>
                {summary.avg_health_score?.toFixed(0) || 0}
              </div>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Optimizer Runs */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border-subtle rounded-lg">
              <div className="border-b border-border-subtle p-4">
                <h2 className="text-lg font-semibold text-text-primary">Optimizer Runs</h2>
                <p className="text-sm text-text-muted">{runs.length} total</p>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-text-muted">Loading...</div>
                ) : runs.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">No optimizer runs yet</div>
                ) : (
                  runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRun?.id === run.id
                          ? "border-accent-500 bg-accent-500/10"
                          : "border-border-subtle hover:border-accent-500/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-text-primary capitalize">{run.scope}</div>
                          <div className="text-xs text-text-muted mt-1">
                            {new Date(run.started_at).toLocaleString()}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[run.status]}`}>
                          {run.status}
                        </span>
                      </div>
                      {run.ai_summary?.health_score !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                          <TrendingUp className="w-3 h-3 text-text-muted" />
                          <span className={`text-sm font-semibold ${getHealthScoreColor(run.ai_summary.health_score)}`}>
                            Health: {run.ai_summary.health_score}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Optimizer Actions */}
          <div className="lg:col-span-2">
            <div className="bg-bg-card border border-border-subtle rounded-lg">
              <div className="border-b border-border-subtle p-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  {selectedRun ? "Optimization Actions" : "Select a Run"}
                </h2>
                <p className="text-sm text-text-muted">
                  {selectedRun ? `${actions.length} actions` : "Choose a run to view actions"}
                </p>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {!selectedRun ? (
                  <div className="text-center py-16 text-text-muted">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an optimizer run to view actions</p>
                  </div>
                ) : selectedRun.status === "running" ? (
                  <div className="text-center py-16 text-text-muted">
                    <Clock className="w-12 h-12 mx-auto mb-4 animate-spin opacity-50" />
                    <p>Optimization in progress...</p>
                  </div>
                ) : actions.length === 0 ? (
                  <div className="text-center py-16 text-text-muted">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No actions recommended for this run</p>
                  </div>
                ) : (
                  actions.map((action) => (
                    <div
                      key={action.id}
                      className="p-4 rounded-lg border border-border-subtle bg-bg-subtle"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${priorityColors[action.priority]}`}>
                              {action.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-bg-card text-text-muted">
                              {action.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${actionStatusColors[action.status]}`}>
                              {action.status}
                            </span>
                          </div>
                          <h3 className="font-semibold text-text-primary">{action.title}</h3>
                        </div>
                        {action.eta_minutes && (
                          <div className="flex items-center gap-1 text-text-muted text-sm">
                            <Clock className="w-3 h-3" />
                            {action.eta_minutes}m
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-text-secondary mb-3">{action.recommendation}</p>

                      {action.ai_rationale && (
                        <div className="space-y-2 mb-3 text-sm">
                          {action.ai_rationale.reasoning && (
                            <div>
                              <span className="text-text-muted font-medium">Reasoning: </span>
                              <span className="text-text-secondary">{action.ai_rationale.reasoning}</span>
                            </div>
                          )}
                          {action.ai_rationale.expected_impact && (
                            <div>
                              <span className="text-text-muted font-medium">Expected Impact: </span>
                              <span className="text-text-secondary">{action.ai_rationale.expected_impact}</span>
                            </div>
                          )}
                          {action.ai_rationale.risks && (
                            <div>
                              <span className="text-text-muted font-medium">Risks: </span>
                              <span className="text-text-secondary">{action.ai_rationale.risks}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {action.status === "open" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateActionStatus(action.id, "applied")}
                              className="bg-success-500 hover:bg-success-600 text-white"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateActionStatus(action.id, "in_progress")}
                            >
                              In Progress
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateActionStatus(action.id, "dismissed")}
                              className="text-text-muted"
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                        {action.status === "in_progress" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateActionStatus(action.id, "applied")}
                              className="bg-success-500 hover:bg-success-600 text-white"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Mark Applied
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateActionStatus(action.id, "open")}
                            >
                              Back to Open
                            </Button>
                          </>
                        )}
                        {action.status === "applied" && (
                          <span className="text-sm text-success-500 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Applied {action.applied_at && `on ${new Date(action.applied_at).toLocaleDateString()}`}
                          </span>
                        )}
                        {action.status === "dismissed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateActionStatus(action.id, "open")}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Optimization Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Execute Optimization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Optimization Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="full">Full System</option>
              <option value="business">Business Level</option>
              <option value="campaign">Campaign Performance</option>
              <option value="delivery">Delivery Systems</option>
              <option value="content">Content Quality</option>
              <option value="audience">Audience Engagement</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              Select the scope for this optimization run
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleExecuteOptimization}
              disabled={executing}
              className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
            >
              {executing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Now
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(false)}
              variant="outline"
              disabled={executing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
