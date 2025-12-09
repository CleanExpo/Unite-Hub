"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import {
  Shield,
  AlertTriangle,
  Power,
  Plus,
  CheckCircle2,
  XCircle,
  Zap,
  Settings,
} from "lucide-react";

type GuardrailScope = "global" | "agent" | "delivery" | "automation" | "campaign";
type GuardrailSeverity = "low" | "medium" | "high" | "critical";

interface GuardrailPolicy {
  id: string;
  tenant_id: string;
  scope: GuardrailScope;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  config: Record<string, unknown>;
  severity: GuardrailSeverity;
  created_at: string;
  updated_at: string;
}

interface GuardrailViolation {
  id: string;
  tenant_id: string;
  policy_id?: string;
  source_type: string;
  source_ref?: string;
  severity: GuardrailSeverity;
  message: string;
  context: Record<string, unknown>;
  blocked: boolean;
  created_at: string;
}

interface KillSwitchState {
  id: string;
  tenant_id: string;
  scope: GuardrailScope;
  target: string;
  enabled: boolean;
  reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ViolationSummary {
  total_violations: number;
  blocked_violations: number;
  critical_violations: number;
  high_violations: number;
  recent_violations_count: number;
}

export default function GuardrailsPage() {
  const [policies, setPolicies] = useState<GuardrailPolicy[]>([]);
  const [violations, setViolations] = useState<GuardrailViolation[]>([]);
  const [killSwitches, setKillSwitches] = useState<KillSwitchState[]>([]);
  const [summary, setSummary] = useState<ViolationSummary | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for new policy
  const [newPolicyScope, setNewPolicyScope] = useState<GuardrailScope>("agent");
  const [newPolicyKey, setNewPolicyKey] = useState("");
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDescription, setNewPolicyDescription] = useState("");
  const [newPolicySeverity, setNewPolicySeverity] = useState<GuardrailSeverity>("medium");
  const [newPolicyThreshold, setNewPolicyThreshold] = useState("");
  const [newPolicyAction, setNewPolicyAction] = useState<"block" | "warn" | "log">("warn");

  // Form state for kill switch
  const [killSwitchScope, setKillSwitchScope] = useState<GuardrailScope>("agent");
  const [killSwitchTarget, setKillSwitchTarget] = useState("all");
  const [killSwitchReason, setKillSwitchReason] = useState("");

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/synthex/guardrails");
      const data = await res.json();
      if (data.success) {
        setPolicies(data.policies);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    }
  };

  // Fetch violations
  const fetchViolations = async () => {
    try {
      const res = await fetch("/api/synthex/guardrails/violations?limit=20");
      const data = await res.json();
      if (data.success) {
        setViolations(data.violations);
      }
    } catch (error) {
      console.error("Failed to fetch violations:", error);
    }
  };

  // Fetch violation summary
  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/synthex/guardrails/violations?action=summary&days=7");
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  // Fetch kill switches
  const fetchKillSwitches = async () => {
    try {
      const res = await fetch("/api/synthex/guardrails/kill-switch");
      const data = await res.json();
      if (data.success) {
        setKillSwitches(data.killSwitches);
      }
    } catch (error) {
      console.error("Failed to fetch kill switches:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPolicies(), fetchViolations(), fetchSummary(), fetchKillSwitches()]).then(() => {
      setLoading(false);
    });
  }, []);

  // Create policy
  const handleCreatePolicy = async () => {
    try {
      const res = await fetch("/api/synthex/guardrails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          scope: newPolicyScope,
          key: newPolicyKey,
          name: newPolicyName,
          description: newPolicyDescription,
          severity: newPolicySeverity,
          config: {
            threshold: parseFloat(newPolicyThreshold) || 100,
            operator: "lte",
            action: newPolicyAction,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsPolicyModalOpen(false);
        // Reset form
        setNewPolicyKey("");
        setNewPolicyName("");
        setNewPolicyDescription("");
        setNewPolicyThreshold("");
        fetchPolicies();
      } else {
        alert("Failed to create policy");
      }
    } catch (error) {
      console.error("Failed to create policy:", error);
      alert("Error creating policy");
    }
  };

  // Toggle policy enabled
  const handleTogglePolicy = async (policyId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch("/api/synthex/guardrails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          policy_id: policyId,
          enabled: !currentEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchPolicies();
      }
    } catch (error) {
      console.error("Failed to toggle policy:", error);
    }
  };

  // Set kill switch
  const handleSetKillSwitch = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/synthex/guardrails/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: killSwitchScope,
          target: killSwitchTarget,
          enabled,
          reason: killSwitchReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsKillSwitchModalOpen(false);
        setKillSwitchReason("");
        fetchKillSwitches();
      } else {
        alert("Failed to set kill switch");
      }
    } catch (error) {
      console.error("Failed to set kill switch:", error);
      alert("Error setting kill switch");
    }
  };

  const scopeColors: Record<GuardrailScope, string> = {
    global: "text-error-500 bg-error-500/20",
    agent: "text-accent-500 bg-accent-500/20",
    delivery: "text-warning-500 bg-warning-500/20",
    automation: "text-success-500 bg-success-500/20",
    campaign: "text-text-muted bg-text-muted/20",
  };

  const severityColors: Record<GuardrailSeverity, string> = {
    low: "text-text-muted bg-text-muted/20",
    medium: "text-warning-500 bg-warning-500/20",
    high: "text-accent-500 bg-accent-500/20",
    critical: "text-error-500 bg-error-500/20",
  };

  return (
    <div className="min-h-screen bg-bg-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Global Guardrails & Kill Switch</h1>
            <p className="text-text-muted mt-1">Autonomy safety layer for agents and systems</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsPolicyModalOpen(true)}
              className="bg-accent-500 hover:bg-accent-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
            <Button
              onClick={() => setIsKillSwitchModalOpen(true)}
              variant="outline"
              className="border-error-500 text-error-500 hover:bg-error-500/10"
            >
              <Power className="w-4 h-4 mr-2" />
              Kill Switch
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <Shield className="w-4 h-4" />
                Total Violations
              </div>
              <div className="text-2xl font-bold text-text-primary">{summary.total_violations}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <XCircle className="w-4 h-4" />
                Blocked
              </div>
              <div className="text-2xl font-bold text-error-500">{summary.blocked_violations}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                Critical
              </div>
              <div className="text-2xl font-bold text-error-500">{summary.critical_violations}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                High
              </div>
              <div className="text-2xl font-bold text-accent-500">{summary.high_violations}</div>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
                <Zap className="w-4 h-4" />
                Recent (7d)
              </div>
              <div className="text-2xl font-bold text-text-primary">{summary.recent_violations_count}</div>
            </div>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guardrail Policies */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border-subtle rounded-lg">
              <div className="border-b border-border-subtle p-4">
                <h2 className="text-lg font-semibold text-text-primary">Guardrail Policies</h2>
                <p className="text-sm text-text-muted">{policies.length} policies</p>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-text-muted">Loading...</div>
                ) : policies.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">No policies configured</div>
                ) : (
                  policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-3 rounded-lg border border-border-subtle bg-bg-subtle"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">{policy.name}</div>
                          <div className="text-xs text-text-muted mt-1">{policy.key}</div>
                        </div>
                        <button
                          onClick={() => handleTogglePolicy(policy.id, policy.enabled)}
                          className={`p-1 rounded ${
                            policy.enabled ? "text-success-500" : "text-text-muted"
                          }`}
                        >
                          {policy.enabled ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${scopeColors[policy.scope]}`}>
                          {policy.scope}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${severityColors[policy.severity]}`}>
                          {policy.severity}
                        </span>
                      </div>

                      {policy.description && (
                        <p className="text-xs text-text-secondary mt-2">{policy.description}</p>
                      )}

                      {policy.config.threshold && (
                        <div className="text-xs text-text-muted mt-2">
                          Threshold: {String(policy.config.threshold)} ({policy.config.action as string})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Kill Switches */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border-subtle rounded-lg">
              <div className="border-b border-border-subtle p-4">
                <h2 className="text-lg font-semibold text-text-primary">Kill Switches</h2>
                <p className="text-sm text-text-muted">{killSwitches.length} switches</p>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {killSwitches.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">No kill switches configured</div>
                ) : (
                  killSwitches.map((killSwitch) => (
                    <div
                      key={killSwitch.id}
                      className={`p-3 rounded-lg border ${
                        killSwitch.enabled
                          ? "border-error-500 bg-error-500/10"
                          : "border-border-subtle bg-bg-subtle"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-text-primary capitalize">
                            {killSwitch.scope} / {killSwitch.target}
                          </div>
                          <div className="text-xs text-text-muted mt-1">
                            {new Date(killSwitch.updated_at).toLocaleString()}
                          </div>
                        </div>
                        {killSwitch.enabled && (
                          <Power className="w-5 h-5 text-error-500" />
                        )}
                      </div>

                      {killSwitch.enabled && killSwitch.reason && (
                        <div className="mt-2 p-2 bg-bg-card rounded text-xs text-text-secondary">
                          {killSwitch.reason}
                        </div>
                      )}

                      <div className={`text-xs font-semibold mt-2 ${
                        killSwitch.enabled ? "text-error-500" : "text-success-500"
                      }`}>
                        {killSwitch.enabled ? "🔴 ACTIVE" : "🟢 Inactive"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Violations */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border-subtle rounded-lg">
              <div className="border-b border-border-subtle p-4">
                <h2 className="text-lg font-semibold text-text-primary">Recent Violations</h2>
                <p className="text-sm text-text-muted">{violations.length} recent</p>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {violations.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent violations</p>
                  </div>
                ) : (
                  violations.map((violation) => (
                    <div
                      key={violation.id}
                      className="p-3 rounded-lg border border-border-subtle bg-bg-subtle"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded ${severityColors[violation.severity]}`}>
                              {violation.severity}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-bg-card text-text-muted">
                              {violation.source_type}
                            </span>
                            {violation.blocked && (
                              <XCircle className="w-4 h-4 text-error-500" />
                            )}
                          </div>
                          <p className="text-sm text-text-primary">{violation.message}</p>
                          <div className="text-xs text-text-muted mt-1">
                            {new Date(violation.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {violation.context && Object.keys(violation.context).length > 0 && (
                        <div className="mt-2 p-2 bg-bg-card rounded text-xs">
                          <pre className="text-text-secondary overflow-x-auto">
                            {JSON.stringify(violation.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Create Guardrail Policy"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Scope</label>
            <select
              value={newPolicyScope}
              onChange={(e) => setNewPolicyScope(e.target.value as GuardrailScope)}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="agent">Agent</option>
              <option value="delivery">Delivery</option>
              <option value="automation">Automation</option>
              <option value="campaign">Campaign</option>
              <option value="global">Global</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Key</label>
            <input
              type="text"
              value={newPolicyKey}
              onChange={(e) => setNewPolicyKey(e.target.value)}
              placeholder="e.g., max_daily_spend"
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
            <input
              type="text"
              value={newPolicyName}
              onChange={(e) => setNewPolicyName(e.target.value)}
              placeholder="Policy name"
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
            <textarea
              value={newPolicyDescription}
              onChange={(e) => setNewPolicyDescription(e.target.value)}
              placeholder="What this policy prevents"
              rows={2}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Severity</label>
              <select
                value={newPolicySeverity}
                onChange={(e) => setNewPolicySeverity(e.target.value as GuardrailSeverity)}
                className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Threshold</label>
              <input
                type="number"
                value={newPolicyThreshold}
                onChange={(e) => setNewPolicyThreshold(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Action</label>
            <select
              value={newPolicyAction}
              onChange={(e) => setNewPolicyAction(e.target.value as "block" | "warn" | "log")}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="log">Log Only</option>
              <option value="warn">Warn</option>
              <option value="block">Block</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreatePolicy}
              disabled={!newPolicyKey || !newPolicyName}
              className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
            <Button
              onClick={() => setIsPolicyModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Kill Switch Modal */}
      <Modal
        isOpen={isKillSwitchModalOpen}
        onClose={() => setIsKillSwitchModalOpen(false)}
        title="Configure Kill Switch"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Scope</label>
            <select
              value={killSwitchScope}
              onChange={(e) => setKillSwitchScope(e.target.value as GuardrailScope)}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="global">Global (All Systems)</option>
              <option value="agent">Agent</option>
              <option value="delivery">Delivery</option>
              <option value="automation">Automation</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Target</label>
            <input
              type="text"
              value={killSwitchTarget}
              onChange={(e) => setKillSwitchTarget(e.target.value)}
              placeholder="all"
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-text-muted mt-1">Use "all" for entire scope, or specific ID</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Reason</label>
            <textarea
              value={killSwitchReason}
              onChange={(e) => setKillSwitchReason(e.target.value)}
              placeholder="Why is this kill switch being activated?"
              rows={3}
              className="w-full px-3 py-2 bg-bg-card border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleSetKillSwitch(true)}
              className="flex-1 bg-error-500 hover:bg-error-600 text-white"
            >
              <Power className="w-4 h-4 mr-2" />
              Activate Kill Switch
            </Button>
            <Button
              onClick={() => handleSetKillSwitch(false)}
              className="flex-1 bg-success-500 hover:bg-success-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
