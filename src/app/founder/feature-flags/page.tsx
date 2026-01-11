"use client";

/**
 * Founder Feature Flags Dashboard
 *
 * Phase: D46 - Feature Flags & Rollout Control
 *
 * Features:
 * - List and manage feature flags
 * - Create and update flags
 * - Manage scope-based overrides
 * - View rollout history
 * - AI-powered rollout recommendations
 */

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  default_state: boolean;
  segment_rules?: Record<string, unknown>;
  created_at: string;
}

interface Override {
  id: string;
  scope_type: string;
  scope_ref: string;
  state: boolean;
  reason?: string;
  created_at: string;
}

interface RolloutEvent {
  id: string;
  event_type: string;
  description?: string;
  created_at: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [history, setHistory] = useState<RolloutEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [aiPlan, setAiPlan] = useState<{
    recommendation: string;
    risk_assessment: string;
  } | null>(null);

  // New flag form
  const [newFlag, setNewFlag] = useState({
    key: "",
    name: "",
    description: "",
    default_state: false,
  });

  // New override form
  const [newOverride, setNewOverride] = useState({
    scope_type: "user",
    scope_ref: "",
    state: true,
    reason: "",
  });

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const res = await fetch("/api/synthex/flags");
      const data = await res.json();
      if (data.success) {
        setFlags(data.flags || []);
      }
    } catch (error) {
      console.error("Failed to load flags:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFlagDetails(flagId: string) {
    try {
      const res = await fetch(
        `/api/synthex/flags/${flagId}?includeOverrides=true&includeHistory=true`
      );
      const data = await res.json();
      if (data.success) {
        setSelectedFlag(data.flag);
        setOverrides(data.overrides || []);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load flag details:", error);
    }
  }

  async function createFlag() {
    try {
      const res = await fetch("/api/synthex/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...newFlag }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewFlag({ key: "", name: "", description: "", default_state: false });
        loadFlags();
      }
    } catch (error) {
      console.error("Failed to create flag:", error);
    }
  }

  async function toggleFlag(flagId: string, currentState: boolean) {
    try {
      const res = await fetch(`/api/synthex/flags/${flagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_state: !currentState }),
      });
      const data = await res.json();
      if (data.success) {
        loadFlags();
        if (selectedFlag?.id === flagId) {
          loadFlagDetails(flagId);
        }
      }
    } catch (error) {
      console.error("Failed to toggle flag:", error);
    }
  }

  async function createOverride() {
    if (!selectedFlag) return;
    try {
      const res = await fetch("/api/synthex/flags/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_flag_id: selectedFlag.id,
          ...newOverride,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOverrideModal(false);
        setNewOverride({ scope_type: "user", scope_ref: "", state: true, reason: "" });
        loadFlagDetails(selectedFlag.id);
      }
    } catch (error) {
      console.error("Failed to create override:", error);
    }
  }

  async function deleteOverride(overrideId: string) {
    try {
      const res = await fetch(`/api/synthex/flags/overrides?override_id=${overrideId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success && selectedFlag) {
        loadFlagDetails(selectedFlag.id);
      }
    } catch (error) {
      console.error("Failed to delete override:", error);
    }
  }

  async function generateAiPlan() {
    if (!selectedFlag) return;
    try {
      const res = await fetch("/api/synthex/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai_rollout_plan", flag_id: selectedFlag.id }),
      });
      const data = await res.json();
      if (data.success) {
        setAiPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to generate AI plan:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-text-secondary">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Feature Flags & Rollouts</h1>
            <p className="text-text-secondary mt-2">
              Control feature rollouts with scoped overrides and AI-powered recommendations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent-500 hover:bg-accent-400 rounded-lg font-semibold transition"
          >
            + New Flag
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-card border border-border-base rounded-lg p-6">
            <p className="text-text-secondary text-sm">Total Flags</p>
            <p className="text-3xl font-bold mt-2">{flags.length}</p>
          </div>
          <div className="bg-bg-card border border-border-base rounded-lg p-6">
            <p className="text-text-secondary text-sm">Enabled</p>
            <p className="text-3xl font-bold mt-2 text-success-500">
              {flags.filter((f) => f.default_state).length}
            </p>
          </div>
          <div className="bg-bg-card border border-border-base rounded-lg p-6">
            <p className="text-text-secondary text-sm">Disabled</p>
            <p className="text-3xl font-bold mt-2 text-text-muted">
              {flags.filter((f) => !f.default_state).length}
            </p>
          </div>
        </div>

        {/* Flags List & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flags List */}
          <div className="bg-bg-card border border-border-base rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Flags</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedFlag?.id === flag.id
                      ? "border-accent-500 bg-bg-hover"
                      : "border-border-subtle hover:border-border-medium bg-bg-raised"
                  }`}
                  onClick={() => loadFlagDetails(flag.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{flag.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            flag.default_state
                              ? "bg-success-500/20 text-success-500"
                              : "bg-text-muted/20 text-text-muted"
                          }`}
                        >
                          {flag.default_state ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        Key: <code className="text-accent-500">{flag.key}</code>
                      </p>
                      {flag.description && (
                        <p className="text-sm text-text-secondary mt-2">{flag.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFlag(flag.id, flag.default_state);
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        flag.default_state
                          ? "bg-text-muted/20 hover:bg-text-muted/30 text-text-muted"
                          : "bg-accent-500/20 hover:bg-accent-500/30 text-accent-500"
                      }`}
                    >
                      {flag.default_state ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flag Details */}
          <div className="bg-bg-card border border-border-base rounded-lg p-6">
            {selectedFlag ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedFlag.name}</h2>
                    <p className="text-text-secondary text-sm mt-1">
                      {selectedFlag.description || "No description"}
                    </p>
                  </div>
                  <button
                    onClick={generateAiPlan}
                    className="px-4 py-2 bg-accent-500/20 hover:bg-accent-500/30 text-accent-500 rounded-lg text-sm font-medium transition"
                  >
                    AI Rollout Plan
                  </button>
                </div>

                {/* AI Plan */}
                {aiPlan && (
                  <div className="bg-bg-raised border border-accent-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-accent-500 mb-2">AI Recommendation</h3>
                    <p className="text-sm text-text-secondary mb-3">{aiPlan.recommendation}</p>
                    <div className="bg-bg-base rounded p-3">
                      <p className="text-xs text-text-muted font-semibold mb-1">Risk Assessment</p>
                      <p className="text-sm">{aiPlan.risk_assessment}</p>
                    </div>
                  </div>
                )}

                {/* Overrides */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Overrides ({overrides.length})</h3>
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      className="px-3 py-1 bg-accent-500/20 hover:bg-accent-500/30 text-accent-500 rounded text-sm font-medium transition"
                    >
                      + Add Override
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {overrides.map((override) => (
                      <div
                        key={override.id}
                        className="bg-bg-raised border border-border-subtle rounded p-3 flex justify-between items-start"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {override.scope_type}:{" "}
                            <code className="text-accent-500">{override.scope_ref}</code>
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            State: {override.state ? "Enabled" : "Disabled"}
                          </p>
                          {override.reason && (
                            <p className="text-xs text-text-muted mt-1">{override.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteOverride(override.id)}
                          className="text-error-500 hover:text-error-400 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History */}
                <div>
                  <h3 className="font-semibold mb-3">Rollout History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((event) => (
                      <div
                        key={event.id}
                        className="bg-bg-raised border border-border-subtle rounded p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-accent-500 uppercase">
                              {event.event_type}
                            </span>
                            {event.description && (
                              <p className="text-sm text-text-secondary mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">
                            {new Date(event.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">
                <p>Select a flag to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Flag Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-bg-card border border-border-base rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-semibold mb-4">Create Feature Flag</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Key (unique)</label>
                  <input
                    type="text"
                    value={newFlag.key}
                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    placeholder="ai_content_generation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    placeholder="AI Content Generation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    rows={3}
                    placeholder="Enable AI-powered content generation features"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newFlag.default_state}
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, default_state: e.target.checked })
                    }
                    className="w-4 h-4 text-accent-500 rounded focus:ring-accent-500"
                  />
                  <label className="ml-2 text-sm">Enable by default</label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createFlag}
                    className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-400 rounded-lg font-semibold transition"
                  >
                    Create Flag
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-bg-raised hover:bg-bg-hover border border-border-base rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Override Modal */}
        {showOverrideModal && selectedFlag && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-bg-card border border-border-base rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-semibold mb-4">Add Override</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Scope Type</label>
                  <select
                    value={newOverride.scope_type}
                    onChange={(e) =>
                      setNewOverride({ ...newOverride, scope_type: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="business">Business</option>
                    <option value="tenant">Tenant</option>
                    <option value="segment">Segment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Scope Reference (ID)</label>
                  <input
                    type="text"
                    value={newOverride.scope_ref}
                    onChange={(e) =>
                      setNewOverride({ ...newOverride, scope_ref: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    placeholder="uuid-or-segment-id"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newOverride.state}
                    onChange={(e) => setNewOverride({ ...newOverride, state: e.target.checked })}
                    className="w-4 h-4 text-accent-500 rounded focus:ring-accent-500"
                  />
                  <label className="ml-2 text-sm">Enable for this scope</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                  <input
                    type="text"
                    value={newOverride.reason}
                    onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none"
                    placeholder="Testing new feature"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createOverride}
                    className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-400 rounded-lg font-semibold transition"
                  >
                    Add Override
                  </button>
                  <button
                    onClick={() => setShowOverrideModal(false)}
                    className="flex-1 px-4 py-2 bg-bg-raised hover:bg-bg-hover border border-border-base rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
