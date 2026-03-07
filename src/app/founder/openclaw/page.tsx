"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Bot,
  Mail,
  FileText,
  BarChart2,
  Network,
  ToggleLeft,
  ToggleRight,
  Terminal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "active" | "idle" | "error" | "running";

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  schedule: string;
}

interface AgentState {
  id: string;
  status: AgentStatus;
  lastRun: string | null;
  enabled: boolean;
  triggering: boolean;
}

interface RunLog {
  id: string;
  agent: string;
  status: "completed" | "running" | "failed" | "pending";
  duration: string | null;
  summary: string;
  created_at: string;
}

interface WorkforceData {
  initialized: boolean;
  agents?: string[];
  skills?: string[];
  hooks?: string[];
}

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENTS: AgentDefinition[] = [
  {
    id: "email",
    name: "Email Agent",
    description: "Processes inbound and outbound email workflows, drafts replies, and triages messages using AI.",
    icon: <Mail className="w-4 h-4" />,
    endpoint: "/api/agents/contact-intelligence",
    schedule: "Every 15 min",
  },
  {
    id: "content",
    name: "Content Agent",
    description: "Generates campaign copy, landing pages, and personalised content using Extended Thinking.",
    icon: <FileText className="w-4 h-4" />,
    endpoint: "/api/agents/content-personalization",
    schedule: "On demand",
  },
  {
    id: "analysis",
    name: "Analysis Agent",
    description: "Scores contacts, extracts intelligence, and surfaces strategic insights across the workspace.",
    icon: <BarChart2 className="w-4 h-4" />,
    endpoint: "/api/agents/intelligence-extraction",
    schedule: "Every 6 hrs",
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    description: "Coordinates multi-agent workflows, manages task sequencing, and monitors execution health.",
    icon: <Network className="w-4 h-4" />,
    endpoint: "/api/orchestrator/execute",
    schedule: "Continuous",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusColor(status: AgentStatus | RunLog["status"]): string {
  switch (status) {
    case "active":
    case "completed":
      return "#00FF88";
    case "running":
      return "#00F5FF";
    case "idle":
    case "pending":
      return "#FFB800";
    case "error":
    case "failed":
      return "#FF4444";
    default:
      return "#666";
  }
}

function statusLabel(status: AgentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Grid background ──────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.035]"
      style={{
        backgroundImage:
          "linear-gradient(#00F5FF 1px, transparent 1px), linear-gradient(90deg, #00F5FF 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

// ─── Status dot ──────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentStatus }) {
  const color = statusColor(status);
  const pulse = status === "active" || status === "running";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${pulse ? "animate-pulse" : ""}`}
      style={{ background: color, boxShadow: pulse ? `0 0 6px ${color}` : "none" }}
    />
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  state,
  onTrigger,
  onToggle,
}: {
  agent: AgentDefinition;
  state: AgentState;
  onTrigger: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm p-5 space-y-4 hover:border-[#00F5FF]/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center text-[#00F5FF]">
            {agent.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-wide">{agent.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusDot status={state.status} />
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: statusColor(state.status) }}
              >
                {statusLabel(state.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Enable toggle */}
        <button
          onClick={() => onToggle(agent.id)}
          className="text-zinc-500 hover:text-[#00F5FF] transition-colors"
          title={state.enabled ? "Disable agent" : "Enable agent"}
        >
          {state.enabled ? (
            <ToggleRight className="w-5 h-5 text-[#00FF88]" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-relaxed">{agent.description}</p>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {state.lastRun ? relativeTime(state.lastRun) : "Never run"}
        </span>
        <span className="text-zinc-600">{agent.schedule}</span>
      </div>

      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onTrigger(agent.id)}
        disabled={state.triggering || !state.enabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00F5FF]/8 border border-[#00F5FF]/25 rounded-sm text-[#00F5FF] text-xs font-mono font-semibold uppercase tracking-widest hover:bg-[#00F5FF]/15 hover:border-[#00F5FF]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state.triggering ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Triggering…
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            Trigger
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Execution log row ────────────────────────────────────────────────────────

function LogRow({ run }: { run: RunLog }) {
  const color = statusColor(run.status);
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-[#00F5FF]/8 hover:bg-[#00F5FF]/3 transition-colors"
    >
      <td className="py-3 px-4 text-xs font-mono text-zinc-500">{relativeTime(run.created_at)}</td>
      <td className="py-3 px-4 text-xs font-semibold text-white">{run.agent}</td>
      <td className="py-3 px-4">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest border"
          style={{
            color,
            borderColor: `${color}40`,
            background: `${color}10`,
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${run.status === "running" ? "animate-pulse" : ""}`}
            style={{ background: color }}
          />
          {run.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs font-mono text-zinc-500">{run.duration ?? "—"}</td>
      <td className="py-3 px-4 text-xs text-zinc-400 max-w-xs truncate">{run.summary}</td>
    </motion.tr>
  );
}

// ─── Agent config accordion ───────────────────────────────────────────────────

function AgentConfigAccordion({
  agent,
  state,
  onToggle,
}: {
  agent: AgentDefinition;
  state: AgentState;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#00F5FF]/15 bg-[#050505] rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-white hover:bg-[#00F5FF]/5 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="text-[#00F5FF]">{agent.icon}</span>
          {agent.name}
        </span>
        <span className="flex items-center gap-3">
          <span
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: statusColor(state.status) }}
          >
            {statusLabel(state.status)}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-[#00F5FF]/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-zinc-500 font-mono uppercase tracking-widest text-[10px]">Endpoint</p>
                  <p className="font-mono text-[#00F5FF]/80">{agent.endpoint}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 font-mono uppercase tracking-widest text-[10px]">Schedule</p>
                  <p className="font-mono text-zinc-300">{agent.schedule}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 font-mono uppercase tracking-widest text-[10px]">Last Run</p>
                  <p className="font-mono text-zinc-300">
                    {state.lastRun ? relativeTime(state.lastRun) : "Never"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 font-mono uppercase tracking-widest text-[10px]">Enabled</p>
                  <button
                    onClick={() => onToggle(agent.id)}
                    className="flex items-center gap-2 font-mono text-xs"
                  >
                    {state.enabled ? (
                      <ToggleRight className="w-5 h-5 text-[#00FF88]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-zinc-500" />
                    )}
                    <span style={{ color: state.enabled ? "#00FF88" : "#666" }}>
                      {state.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OpenClawPage() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(() =>
    Object.fromEntries(
      AGENTS.map((a) => [
        a.id,
        { id: a.id, status: "idle" as AgentStatus, lastRun: null, enabled: true, triggering: false },
      ])
    )
  );
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceData | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingWorkforce, setLoadingWorkforce] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);

  // ── Fetch workforce status ─────────────────────────────────────────────────
  const fetchWorkforce = useCallback(async () => {
    setLoadingWorkforce(true);
    try {
      const res = await fetch("/api/agent/workforce");
      if (res.ok) {
        const data = await res.json();
        setWorkforce(data);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingWorkforce(false);
    }
  }, []);

  // ── Fetch execution logs ───────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/agent/status");
      if (res.ok) {
        const data = await res.json();
        // Map agent_runs to RunLog shape
        const runs: RunLog[] = (data.runs ?? []).map(
          (r: {
            id: string;
            status: string;
            plan_id?: string;
            created_at: string;
            completed_at?: string;
            total_steps?: number;
            completed_steps?: number;
          }) => {
            const agentId =
              AGENTS.find((a) => a.id === r.plan_id?.split("-")[0])?.name ?? "Orchestrator";
            const durationMs =
              r.completed_at
                ? new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()
                : null;
            const duration = durationMs != null ? `${(durationMs / 1000).toFixed(1)}s` : null;
            const summary =
              r.total_steps != null
                ? `${r.completed_steps ?? 0}/${r.total_steps} steps completed`
                : "No step data";
            return {
              id: r.id,
              agent: agentId,
              status: r.status as RunLog["status"],
              duration,
              summary,
              created_at: r.created_at,
            };
          }
        );
        setLogs(runs.slice(0, 20));

        // Derive agent statuses from recent runs
        setAgentStates((prev) => {
          const next = { ...prev };
          for (const run of runs.slice(0, 4)) {
            const agentDef = AGENTS.find((a) => run.agent.toLowerCase().includes(a.id));
            if (agentDef && next[agentDef.id]) {
              next[agentDef.id] = {
                ...next[agentDef.id],
                status: run.status === "completed"
                  ? "active"
                  : run.status === "running"
                  ? "running"
                  : run.status === "failed"
                  ? "error"
                  : "idle",
                lastRun: run.created_at,
              };
            }
          }
          return next;
        });
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkforce(), fetchLogs()]);
    setRefreshing(false);
  }, [fetchWorkforce, fetchLogs]);

  useEffect(() => {
    void refresh();
    // Poll every 30s
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // ── Trigger agent run ──────────────────────────────────────────────────────
  const triggerAgent = useCallback(async (agentId: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], triggering: true },
    }));
    setTriggerFeedback(null);

    try {
      const agentDef = AGENTS.find((a) => a.id === agentId);
      if (!agentDef) throw new Error("Unknown agent");

      const res = await fetch("/api/orchestrator/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentId }),
      });

      if (res.ok) {
        setTriggerFeedback(`${agentDef.name} triggered successfully.`);
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            triggering: false,
            status: "running",
            lastRun: new Date().toISOString(),
          },
        }));
        // Refresh logs after a short delay
        setTimeout(() => void fetchLogs(), 2000);
      } else {
        const body = await res.json().catch(() => ({}));
        setTriggerFeedback(
          `Trigger failed: ${(body as { error?: string }).error ?? res.status}`
        );
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: { ...prev[agentId], triggering: false },
        }));
      }
    } catch (err) {
      setTriggerFeedback(
        `Trigger error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setAgentStates((prev) => ({
        ...prev,
        [agentId]: { ...prev[agentId], triggering: false },
      }));
    }

    setTimeout(() => setTriggerFeedback(null), 5000);
  }, [fetchLogs]);

  // ── Toggle agent enabled ───────────────────────────────────────────────────
  const toggleAgent = useCallback((agentId: string) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], enabled: !prev[agentId].enabled },
    }));
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const activeCount = Object.values(agentStates).filter(
    (s) => s.status === "active" || s.status === "running"
  ).length;
  const errorCount = Object.values(agentStates).filter((s) => s.status === "error").length;
  const completedToday = logs.filter(
    (l) =>
      l.status === "completed" &&
      new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <GridBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/25 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00F5FF]" />
              </div>
              <h1 className="text-2xl font-mono font-bold tracking-tight text-white/90">
                OpenClaw Control
              </h1>
            </div>
            <p className="text-sm text-white/50 pl-12">
              AI Agent Orchestration — Unite-Group Central Control
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Workforce indicator */}
            {!loadingWorkforce && workforce && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[#00FF88]/20 bg-[#00FF88]/8 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span className="text-[10px] font-mono text-[#00FF88] uppercase tracking-widest">
                  Workforce Online
                </span>
              </div>
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-sm border border-[#00F5FF]/15 bg-[#050505] text-zinc-500 hover:text-[#00F5FF] hover:border-[#00F5FF]/30 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#00F5FF]/20 to-transparent" />

        {/* ── Trigger feedback toast ──────────────────────────────────────── */}
        <AnimatePresence>
          {triggerFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-sm border text-sm ${
                triggerFeedback.includes("failed") || triggerFeedback.includes("error")
                  ? "border-[#FF4444]/30 bg-[#FF4444]/8 text-[#FF4444]"
                  : "border-[#00FF88]/30 bg-[#00FF88]/8 text-[#00FF88]"
              }`}
            >
              {triggerFeedback.includes("failed") || triggerFeedback.includes("error") ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="font-mono text-xs">{triggerFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: AGENTS.length, icon: <Bot className="w-4 h-4" />, color: "#00F5FF" },
            { label: "Active / Running", value: activeCount, icon: <Activity className="w-4 h-4" />, color: "#00FF88" },
            { label: "Errors", value: errorCount, icon: <AlertCircle className="w-4 h-4" />, color: errorCount > 0 ? "#FF4444" : "#666" },
            { label: "Completed Today", value: completedToday, icon: <CheckCircle2 className="w-4 h-4" />, color: "#00FF88" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#00F5FF]/12 bg-[#050505] rounded-sm p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {stat.label}
                </span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-mono font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Section 1: Active Agents grid ───────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-[#00F5FF]" />
            <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
              Active Agents
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <AgentCard
                  agent={agent}
                  state={agentStates[agent.id]}
                  onTrigger={triggerAgent}
                  onToggle={toggleAgent}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Execution Log ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-[#00F5FF]" />
              <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
                Execution Log
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">
              Last 20 runs · auto-refreshes every 30s
            </span>
          </div>

          <div className="border border-[#00F5FF]/12 bg-[#050505] rounded-sm overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-5 h-5 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
                <span className="text-xs font-mono text-zinc-500">Loading execution logs…</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
                <Clock className="w-6 h-6" />
                <p className="text-xs font-mono">No agent runs found. Trigger an agent to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#00F5FF]/12">
                      {["Timestamp", "Agent", "Status", "Duration", "Summary"].map((h) => (
                        <th
                          key={h}
                          className="py-3 px-4 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((run) => (
                      <LogRow key={run.id} run={run} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Agent Configuration ──────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[#00F5FF]" />
            <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
              Agent Configuration
            </h2>
          </div>

          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <AgentConfigAccordion
                key={agent.id}
                agent={agent}
                state={agentStates[agent.id]}
                onToggle={toggleAgent}
              />
            ))}
          </div>
        </section>

        {/* ── Workforce detail (when available) ───────────────────────────── */}
        {workforce && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Network className="w-4 h-4 text-[#00F5FF]" />
              <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest">
                Workforce Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Registered Agents", items: workforce.agents ?? [] },
                { label: "Loaded Skills", items: workforce.skills ?? [] },
                { label: "Active Hooks", items: workforce.hooks ?? [] },
              ].map(({ label, items }) => (
                <div
                  key={label}
                  className="border border-[#00F5FF]/12 bg-[#050505] rounded-sm p-4 space-y-3"
                >
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {label}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs font-mono text-zinc-600">None registered</p>
                  ) : (
                    <ul className="space-y-1">
                      {items.slice(0, 6).map((item: string) => (
                        <li key={item} className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#00F5FF]/60" />
                          {item}
                        </li>
                      ))}
                      {items.length > 6 && (
                        <li className="text-[10px] font-mono text-zinc-600">
                          +{items.length - 6} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
