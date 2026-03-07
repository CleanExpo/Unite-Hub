"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Globe, Brain, Wrench, Zap, ExternalLink, RefreshCw,
  Settings, CheckCircle2, AlertCircle, Clock, X, Key, Webhook,
  ChevronDown, Plus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthStatus = "healthy" | "unknown" | "down";

interface PlatformEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  category: "Operations" | "Portfolio" | "Intelligence" | "Marketing";
  icon: React.ComponentType<{ className?: string }>;
}

interface PlatformHealth {
  status: HealthStatus;
  lastChecked: Date | null;
}

interface ConfigModal {
  platformId: string;
  platformName: string;
  apiKey: string;
  webhookUrl: string;
}

interface DynamicProject {
  id: string;
  name: string;
  slug: string;
  api_key_prefix: string | null;
  webhook_url: string | null;
  last_seen_at: string | null;
  health_status: "healthy" | "degraded" | "down" | "unknown";
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_PLATFORMS: PlatformEntry[] = [
  {
    id: "disaster-recovery",
    name: "Disaster Recovery",
    description: "Emergency response and business continuity platform",
    url: process.env.NEXT_PUBLIC_DR_URL || "https://disaster-recovery.unitegroupau.com",
    category: "Operations",
    icon: Shield,
  },
  {
    id: "nrpg",
    name: "NRPG",
    description: "Natural Resources Portfolio Group management",
    url: process.env.NEXT_PUBLIC_NRPG_URL || "https://nrpg.unitegroupau.com",
    category: "Portfolio",
    icon: Globe,
  },
  {
    id: "carsi",
    name: "CARSI",
    description: "Client acquisition and relationship scoring intelligence",
    url: process.env.NEXT_PUBLIC_CARSI_URL || "https://carsi.unitegroupau.com",
    category: "Intelligence",
    icon: Brain,
  },
  {
    id: "restore-assist",
    name: "RestoreAssist",
    description: "Restoration project management and contractor coordination",
    url: process.env.NEXT_PUBLIC_RESTORE_URL || "https://restoreassist.unitegroupau.com",
    category: "Operations",
    icon: Wrench,
  },
  {
    id: "synthex",
    name: "Synthex",
    description: "AI-powered marketing automation and content generation",
    url: process.env.NEXT_PUBLIC_SYNTHEX_URL || "https://synthex.unitegroupau.com",
    category: "Marketing",
    icon: Zap,
  },
];

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  Operations:   { badge: "text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/20", dot: "#00FF88" },
  Portfolio:    { badge: "text-[#00F5FF] bg-[#00F5FF]/10 border-[#00F5FF]/20", dot: "#00F5FF" },
  Intelligence: { badge: "text-[#FF00FF] bg-[#FF00FF]/10 border-[#FF00FF]/20", dot: "#FF00FF" },
  Marketing:    { badge: "text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20", dot: "#FFB800" },
};

const HEALTH_COLOURS: Record<HealthStatus, string> = {
  healthy: "#00FF88",
  unknown: "#FFB800",
  down:    "#FF4444",
};

const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  unknown: "Unknown",
  down:    "Down",
};

const LEGACY_HEALTH_COLOURS: Record<string, string> = {
  healthy:  "#00FF88",
  degraded: "#FFB800",
  down:     "#FF4444",
  unknown:  "#71717a",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-AU", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  });
}

// ─── Configure Modal ──────────────────────────────────────────────────────────

function ConfigureModal({
  config,
  onClose,
  onSave,
}: {
  config: ConfigModal;
  onClose: () => void;
  onSave: (apiKey: string, webhookUrl: string) => void;
}) {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate save
    onSave(apiKey, webhookUrl);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-sm p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-mono font-bold text-white">Configure</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{config.platformName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/[0.06] text-white/40 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 uppercase tracking-wider mb-1.5">
              <Key className="w-3 h-3" />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-sm text-white font-mono text-sm focus:border-[#00F5FF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 uppercase tracking-wider mb-1.5">
              <Webhook className="w-3 h-3" />
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-sm text-white font-mono text-sm focus:border-[#00F5FF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/[0.03] border border-white/[0.06] text-white/50 rounded-sm font-mono text-sm hover:text-white hover:border-white/[0.12] transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[#00F5FF] text-[#050505] rounded-sm font-mono text-sm font-bold hover:bg-[#00d4e0] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Primary Platform Card ─────────────────────────────────────────────────────

function PlatformCard({
  platform,
  health,
  onConfigure,
}: {
  platform: PlatformEntry;
  health: PlatformHealth;
  onConfigure: () => void;
}) {
  const Icon = platform.icon;
  const catStyle = CATEGORY_STYLES[platform.category];
  const healthColour = HEALTH_COLOURS[health.status];
  const healthLabel = HEALTH_LABELS[health.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 hover:border-white/[0.10] transition-colors"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono font-bold text-white/90">{platform.name}</h3>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${catStyle.badge}`}>
                {platform.category}
              </span>
            </div>
            <p className="text-xs text-white/40 mt-1 leading-snug">{platform.description}</p>
          </div>
        </div>
      </div>

      {/* Health + last sync */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: healthColour }}
          />
          <span className="font-mono text-xs" style={{ color: healthColour }}>
            {healthLabel}
          </span>
        </div>
        <span className="text-white/20 text-xs">·</span>
        <span className="font-mono text-[10px] text-white/30">
          {health.lastChecked
            ? health.lastChecked.toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
            : "Not yet checked"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00F5FF] text-[#050505] rounded-sm text-sm font-mono font-bold hover:bg-[#00d4e0] transition-colors"
        >
          Open Platform
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={onConfigure}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-white/[0.06] text-white/50 rounded-sm text-sm font-mono hover:text-white hover:border-white/[0.12] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Configure
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const [healthMap, setHealthMap] = useState<Record<string, PlatformHealth>>({});
  const [checking, setChecking] = useState(false);
  const [configModal, setConfigModal] = useState<ConfigModal | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<Record<string, { apiKey: string; webhookUrl: string }>>({});

  // Dynamic / legacy connections
  const [dynamicProjects, setDynamicProjects] = useState<DynamicProject[]>([]);
  const [dynamicLoading, setDynamicLoading] = useState(true);
  const [showDynamic, setShowDynamic] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [adding, setAdding] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ projectId: string; key: string } | null>(null);

  // ── Health check ────────────────────────────────────────────────────────────

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/connectors/health");
      if (res.ok) {
        const data: Record<string, string> = await res.json();
        const now = new Date();
        const mapped: Record<string, PlatformHealth> = {};
        for (const [id, status] of Object.entries(data)) {
          mapped[id] = { status: status as HealthStatus, lastChecked: now };
        }
        setHealthMap(mapped);
      }
    } catch {
      // leave as unknown
    } finally {
      setChecking(false);
    }
  }, []);

  // ── Dynamic projects ────────────────────────────────────────────────────────

  const fetchDynamicProjects = useCallback(async () => {
    setDynamicLoading(true);
    try {
      const res = await fetch("/api/founder/connections");
      const data = await res.json();
      if (data.projects) setDynamicProjects(data.projects);
    } catch {
      // fail silently
    } finally {
      setDynamicLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchDynamicProjects();
  }, [checkHealth, fetchDynamicProjects]);

  // ── Configure modal actions ─────────────────────────────────────────────────

  const openConfig = (platform: PlatformEntry) => {
    const existing = savedConfigs[platform.id] ?? { apiKey: "", webhookUrl: "" };
    setConfigModal({
      platformId: platform.id,
      platformName: platform.name,
      apiKey: existing.apiKey,
      webhookUrl: existing.webhookUrl,
    });
  };

  const handleSaveConfig = (apiKey: string, webhookUrl: string) => {
    if (!configModal) return;
    setSavedConfigs(prev => ({
      ...prev,
      [configModal.platformId]: { apiKey, webhookUrl },
    }));
    setConfigModal(null);
  };

  // ── Add dynamic project ─────────────────────────────────────────────────────

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
        await fetchDynamicProjects();
      } else {
        alert(data.error || "Failed to add project");
      }
    } catch {
      alert("Network error");
    } finally {
      setAdding(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const apiKeyConfigured = (id: string) => !!savedConfigs[id]?.apiKey;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl text-white/90 tracking-tight">
              <span className="text-[#00F5FF]">Ecosystem</span> Registry
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Central control connections for all Unite-Group platforms
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={checkHealth}
            disabled={checking}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] text-white/50 rounded-sm font-mono text-xs hover:text-[#00F5FF] hover:border-[#00F5FF]/20 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Refresh Health
          </motion.button>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Platforms",
              value: PRIMARY_PLATFORMS.length,
              colour: "text-[#00F5FF]",
            },
            {
              label: "Healthy",
              value: PRIMARY_PLATFORMS.filter(p => (healthMap[p.id]?.status ?? "unknown") === "healthy").length,
              colour: "text-[#00FF88]",
            },
            {
              label: "Configured",
              value: PRIMARY_PLATFORMS.filter(p => apiKeyConfigured(p.id)).length,
              colour: "text-[#FFB800]",
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 text-center"
            >
              <p className={`text-2xl font-mono font-bold ${stat.colour}`}>{stat.value}</p>
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Revealed key banner ── */}
        <AnimatePresence>
          {revealedKey && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[#00FF88] font-mono text-sm font-bold mb-1">API Key Generated — Copy Now</p>
                  <p className="text-white/40 font-mono text-xs mb-2">This key will not be shown again.</p>
                  <code className="text-[#00FF88] font-mono text-xs bg-black/50 px-3 py-1.5 rounded-sm select-all block break-all">
                    {revealedKey.key}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey.key);
                    setRevealedKey(null);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#00FF88]/20 text-[#00FF88] rounded-sm font-mono text-xs hover:bg-[#00FF88]/30 transition-colors whitespace-nowrap"
                >
                  Copy &amp; Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Primary platforms ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Primary Platforms</h2>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          <div className="grid gap-4">
            {PRIMARY_PLATFORMS.map(platform => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                health={healthMap[platform.id] ?? { status: "unknown", lastChecked: null }}
                onConfigure={() => openConfig(platform)}
              />
            ))}
          </div>
        </section>

        {/* ── Dynamic / additional connections ── */}
        <section className="space-y-3">
          <button
            onClick={() => setShowDynamic(v => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Additional Connections</h2>
            <div className="flex-1 h-px bg-white/[0.04]" />
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/30 transition-transform ${showDynamic ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showDynamic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                {/* Add button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm font-mono text-xs hover:bg-[#00F5FF]/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Connection
                  </button>
                </div>

                {dynamicLoading && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
                  </div>
                )}

                {!dynamicLoading && dynamicProjects.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-white/30 font-mono text-sm">No additional connections</p>
                    <p className="text-white/20 font-mono text-xs mt-1">Add custom integrations above</p>
                  </div>
                )}

                {dynamicProjects.map(project => (
                  <div
                    key={project.id}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-white/90">{project.name}</span>
                          <span className="px-1.5 py-0.5 bg-white/[0.04] text-white/40 rounded-sm font-mono text-[9px] border border-white/[0.06]">
                            {project.slug}
                          </span>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: LEGACY_HEALTH_COLOURS[project.health_status] ?? "#71717a" }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white/30">
                          {project.api_key_prefix && (
                            <span>Key: <code className="text-white/50">{project.api_key_prefix}…</code></span>
                          )}
                          <span>Last seen: {formatDate(project.last_seen_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ── Configure Modal ── */}
      <AnimatePresence>
        {configModal && (
          <ConfigureModal
            config={configModal}
            onClose={() => setConfigModal(null)}
            onSave={handleSaveConfig}
          />
        )}
      </AnimatePresence>

      {/* ── Add Dynamic Connection Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-sm p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-mono font-bold text-white">Add Connection</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-sm border border-white/[0.06] text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Synthex"
                    className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-sm text-white font-mono text-sm focus:border-[#00F5FF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="e.g. synthex"
                    className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-sm text-white font-mono text-sm focus:border-[#00F5FF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
                  />
                  <p className="text-white/20 font-mono text-[10px] mt-1">Lowercase, alphanumeric, hyphens only</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-white/[0.03] border border-white/[0.06] text-white/50 rounded-sm font-mono text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={adding || !newName.trim() || !newSlug.trim()}
                  className="flex-1 px-4 py-2 bg-[#00F5FF] text-[#050505] rounded-sm font-mono text-sm font-bold hover:bg-[#00d4e0] disabled:opacity-50 transition-colors"
                >
                  {adding ? "Creating…" : "Create & Generate Key"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
