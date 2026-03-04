"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedProject {
  id: string;
  name: string;
  slug: string;
  api_key_prefix: string | null;
  webhook_url: string | null;
  last_seen_at: string | null;
  health_status: "healthy" | "degraded" | "down" | "unknown";
  health_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEALTH_COLOURS: Record<string, string> = {
  healthy: "#00FF88",
  degraded: "#FFB800",
  down: "#FF4444",
  unknown: "#71717a",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const [projects, setProjects] = useState<ConnectedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [adding, setAdding] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ projectId: string; key: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/founder/connections");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAdd = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/founder/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setRevealedKey({ projectId: data.project.id, key: data.apiKey });
        setShowAddModal(false);
        setNewName("");
        setNewSlug("");
        await fetchProjects();
      } else {
        alert(data.error || "Failed to add project");
      }
    } catch {
      alert("Network error");
    } finally {
      setAdding(false);
    }
  };

  const handleRegenerate = async (projectId: string) => {
    if (!confirm("Regenerate API key? The old key will stop working immediately.")) return;
    setActionLoading(projectId);
    try {
      const res = await fetch("/api/founder/connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setRevealedKey({ projectId, key: data.apiKey });
        await fetchProjects();
      }
    } catch {
      alert("Failed to regenerate key");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (projectId: string) => {
    if (!confirm("Remove this project? All associated events will be deleted.")) return;
    setActionLoading(projectId);
    try {
      await fetch("/api/founder/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      await fetchProjects();
      if (revealedKey?.projectId === projectId) setRevealedKey(null);
    } catch {
      alert("Failed to remove project");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTest = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      // Simulate a health ping — update last_seen_at
      const res = await fetch("/api/project-connect/health");
      if (res.ok) {
        await fetchProjects();
      }
    } catch {
      alert("Test failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight">
            <span className="text-[#00F5FF]">Project</span> Connect
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            External product gateway &mdash; {projects.length} connected
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm font-mono text-sm hover:bg-[#00F5FF]/20 transition-colors"
        >
          + Add Project
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-20">
          <div className="text-zinc-600 text-4xl mb-4">&#x1F517;</div>
          <p className="text-zinc-500 font-mono">No connected projects yet</p>
          <p className="text-zinc-600 font-mono text-sm mt-1">Add your first project to start receiving events</p>
        </div>
      )}

      {/* Revealed Key Banner */}
      <AnimatePresence>
        {revealedKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#00FF88] font-mono text-sm font-bold mb-1">
                  API Key Generated — Copy Now
                </p>
                <p className="text-zinc-400 font-mono text-xs mb-2">
                  This key will not be shown again.
                </p>
                <code className="text-[#00FF88] font-mono text-sm bg-black/50 px-3 py-1.5 rounded-sm select-all block break-all">
                  {revealedKey.key}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey.key);
                  setRevealedKey(null);
                }}
                className="ml-4 px-3 py-1.5 bg-[#00FF88]/20 text-[#00FF88] rounded-sm font-mono text-xs hover:bg-[#00FF88]/30 transition-colors whitespace-nowrap"
              >
                Copy & Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Cards */}
      <div className="grid gap-4">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-sm hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left: Project info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-mono font-bold text-white">{project.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-sm font-mono text-xs">
                    {project.slug}
                  </span>
                  {/* Health dot */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: HEALTH_COLOURS[project.health_status] }}
                    />
                    <span
                      className="font-mono text-xs"
                      style={{ color: HEALTH_COLOURS[project.health_status] }}
                    >
                      {HEALTH_LABELS[project.health_status]}
                    </span>
                  </div>
                </div>

                {/* API Key Prefix */}
                <div className="flex items-center gap-4 text-zinc-500 font-mono text-xs">
                  {project.api_key_prefix && (
                    <span>
                      Key: <code className="text-zinc-400">{project.api_key_prefix}...</code>
                    </span>
                  )}
                  <span>Last seen: {formatDate(project.last_seen_at)}</span>
                  <span>Created: {formatDate(project.created_at)}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleRegenerate(project.id)}
                  disabled={actionLoading === project.id}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-sm font-mono text-xs hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Regenerate Key
                </button>
                <button
                  onClick={() => handleTest(project.id)}
                  disabled={actionLoading === project.id}
                  className="px-3 py-1.5 bg-[#00F5FF]/10 text-[#00F5FF] rounded-sm font-mono text-xs hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-50"
                >
                  Test
                </button>
                <button
                  onClick={() => handleRemove(project.id)}
                  disabled={actionLoading === project.id}
                  className="px-3 py-1.5 bg-[#FF4444]/10 text-[#FF4444] rounded-sm font-mono text-xs hover:bg-[#FF4444]/20 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-sm p-6"
            >
              <h2 className="text-lg font-mono font-bold text-white mb-4">
                Add Connected Project
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 font-mono text-xs mb-1">Project Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Synthex"
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-sm text-white font-mono text-sm focus:border-[#00F5FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-xs mb-1">Slug</label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. synthex"
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-sm text-white font-mono text-sm focus:border-[#00F5FF] focus:outline-none"
                  />
                  <p className="text-zinc-600 font-mono text-xs mt-1">Lowercase, alphanumeric, hyphens only</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-sm font-mono text-sm hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  disabled={adding || !newName.trim() || !newSlug.trim()}
                  className="px-4 py-2 bg-[#00F5FF]/20 border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm font-mono text-sm hover:bg-[#00F5FF]/30 transition-colors disabled:opacity-50"
                >
                  {adding ? "Creating..." : "Create & Generate Key"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
