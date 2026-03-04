"use client";

/**
 * Founder Alerts Page — KPI Alerting System
 *
 * Scientific Luxury design: #050505 bg, #00F5FF cyan, #00FF88 emerald,
 * #FFB800 amber, #FF4444 red, #FF00FF magenta.
 * Framer Motion only — no CSS transitions.
 * font-mono throughout, rounded-sm corners.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Plus, Trash2, Pencil, RefreshCw, X,
  CheckCircle2, AlertTriangle, XCircle, Activity,
  Building2, TrendingUp, Zap, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthStatus = "healthy" | "warning" | "critical";
type AlertMetric   = "mrr" | "invoice_count" | "xero_connected";
type AlertOperator = "lt" | "gt" | "lte" | "gte" | "eq";

interface BusinessHealth {
  businessId: string;
  name: string;
  score: HealthStatus;
  stripeConnected: boolean;
  xeroConnected: boolean;
  recentAlertCount: number;
}

interface AlertRule {
  id: string;
  owner_id: string;
  business_id: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  label: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AlertEvent {
  id: string;
  rule_id: string | null;
  owner_id: string;
  business_id: string;
  metric: AlertMetric;
  actual_value: number | null;
  threshold_value: number | null;
  label: string | null;
  fired_at: string;
}

interface RuleFormData {
  business_id: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: string;
  label: string;
  enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESSES = [
  { id: "disaster-recovery", name: "Disaster Recovery" },
  { id: "restore-assist",    name: "RestoreAssist"      },
  { id: "ato",               name: "ATO"                },
  { id: "nrpg",              name: "NRPG"               },
  { id: "unite-group",       name: "Unite Group"        },
];

const METRIC_LABELS: Record<AlertMetric, string> = {
  mrr:             "MRR ($)",
  invoice_count:   "Invoice Count (7d)",
  xero_connected:  "Xero Connected",
};

const OPERATOR_LABELS: Record<AlertOperator, string> = {
  lt:  "< (less than)",
  gt:  "> (greater than)",
  lte: "≤ (at most)",
  gte: "≥ (at least)",
  eq:  "= (equals)",
};

const DEFAULT_FORM: RuleFormData = {
  business_id: "disaster-recovery",
  metric:      "mrr",
  operator:    "lt",
  threshold:   "0",
  label:       "",
  enabled:     true,
};

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthChip({ biz }: { biz: BusinessHealth }) {
  const colors: Record<HealthStatus, { ring: string; dot: string; label: string }> = {
    healthy:  { ring: "border-[#00FF88]/40", dot: "bg-[#00FF88]", label: "text-[#00FF88]" },
    warning:  { ring: "border-[#FFB800]/40", dot: "bg-[#FFB800]", label: "text-[#FFB800]" },
    critical: { ring: "border-[#FF4444]/40", dot: "bg-[#FF4444]", label: "text-[#FF4444]" },
  };
  const c = colors[biz.score];

  return (
    <motion.div
      variants={fadeUp}
      className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${c.ring} bg-white/[0.02]`}
    >
      <motion.span
        className={`w-2 h-2 rounded-full ${c.dot}`}
        animate={{ opacity: biz.score === "critical" ? [1, 0.3, 1] : 1 }}
        transition={{ duration: 1.2, repeat: biz.score === "critical" ? Infinity : 0 }}
      />
      <span className="font-mono text-xs text-white/70">{biz.name}</span>
      <span className={`font-mono text-xs font-semibold uppercase ${c.label}`}>{biz.score}</span>
      {biz.recentAlertCount > 0 && (
        <span className="font-mono text-xs text-[#FF4444] ml-1">
          {biz.recentAlertCount}▲
        </span>
      )}
    </motion.div>
  );
}

function MetricIcon({ metric }: { metric: AlertMetric }) {
  if (metric === "mrr")            return <TrendingUp   className="w-3.5 h-3.5 text-[#00F5FF]" />;
  if (metric === "invoice_count")  return <Activity     className="w-3.5 h-3.5 text-[#00FF88]" />;
  if (metric === "xero_connected") return <Zap          className="w-3.5 h-3.5 text-[#FFB800]" />;
  return null;
}

function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AlertRule;
  onToggle: (rule: AlertRule) => void;
  onEdit:   (rule: AlertRule) => void;
  onDelete: (id: string)     => void;
}) {
  const bizName = BUSINESSES.find(b => b.id === rule.business_id)?.name ?? rule.business_id;

  return (
    <motion.div
      variants={fadeUp}
      layout
      className={`
        rounded-sm border p-4 flex items-start gap-3 group
        transition-colors
        ${rule.enabled
          ? "border-[#00F5FF]/20 bg-[#00F5FF]/[0.02]"
          : "border-white/10 bg-white/[0.01] opacity-50"
        }
      `}
    >
      {/* Metric icon */}
      <div className="mt-0.5">
        <MetricIcon metric={rule.metric} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-white truncate">{rule.label}</p>
        <p className="font-mono text-xs text-white/40 mt-0.5">
          <span className="text-white/60">{bizName}</span>
          {" · "}
          <span className="text-[#00F5FF]/70">{METRIC_LABELS[rule.metric]}</span>
          {" "}
          <span className="text-white/50">
            {OPERATOR_LABELS[rule.operator].split(" ")[0]}
          </span>
          {" "}
          <span className="text-[#FFB800]">{rule.threshold}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(rule)}
          className="p-1.5 rounded-sm hover:bg-white/10 transition-colors"
          title={rule.enabled ? "Disable alert" : "Enable alert"}
        >
          {rule.enabled
            ? <Bell    className="w-3.5 h-3.5 text-[#00FF88]" />
            : <BellOff className="w-3.5 h-3.5 text-white/40" />
          }
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="p-1.5 rounded-sm hover:bg-white/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-[#00F5FF]" />
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          className="p-1.5 rounded-sm hover:bg-[#FF4444]/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#FF4444]" />
        </button>
      </div>
    </motion.div>
  );
}

function EventRow({ event }: { event: AlertEvent }) {
  const bizName = BUSINESSES.find(b => b.id === event.business_id)?.name ?? event.business_id;
  const time    = new Date(event.fired_at);
  const timeStr = time.toLocaleString("en-AU", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      variants={fadeUp}
      className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-[#FFB800] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-white truncate">
          {event.label ?? `${event.metric} alert`}
        </p>
        <p className="font-mono text-xs text-white/40 mt-0.5">
          <span className="text-white/60">{bizName}</span>
          {" · "}
          <span className="text-[#00F5FF]/70">{METRIC_LABELS[event.metric as AlertMetric] ?? event.metric}</span>
          {event.actual_value != null && (
            <>
              {" — actual "}
              <span className="text-[#FF4444]">{event.actual_value}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 text-white/30 shrink-0">
        <Clock className="w-3 h-3" />
        <span className="font-mono text-xs">{timeStr}</span>
      </div>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function RuleModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial:  RuleFormData;
  onSave:   (data: RuleFormData) => void;
  onClose:  () => void;
  saving:   boolean;
}) {
  const [form, setForm] = useState<RuleFormData>(initial);

  function set<K extends keyof RuleFormData>(key: K, value: RuleFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const labelClass = "font-mono text-xs text-white/50 mb-1 block";
  const inputClass =
    "w-full bg-white/[0.04] border border-white/10 rounded-sm px-3 py-2 " +
    "font-mono text-sm text-white focus:outline-none focus:border-[#00F5FF]/50 " +
    "placeholder:text-white/20";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.95, opacity: 0, y: 10  }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="bg-[#0a0a0a] border border-white/10 rounded-sm p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-mono text-sm font-semibold text-white uppercase tracking-widest">
            {initial.label ? "Edit Alert Rule" : "New Alert Rule"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-sm">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className={labelClass}>Label</label>
            <input
              className={inputClass}
              placeholder="e.g. DR MRR drops below $5k"
              value={form.label}
              onChange={e => set("label", e.target.value)}
            />
          </div>

          {/* Business */}
          <div>
            <label className={labelClass}>Business</label>
            <select
              className={inputClass}
              value={form.business_id}
              onChange={e => set("business_id", e.target.value)}
            >
              {BUSINESSES.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className={labelClass}>Metric</label>
            <select
              className={inputClass}
              value={form.metric}
              onChange={e => set("metric", e.target.value as AlertMetric)}
            >
              {(Object.entries(METRIC_LABELS) as [AlertMetric, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Operator + Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Operator</label>
              <select
                className={inputClass}
                value={form.operator}
                onChange={e => set("operator", e.target.value as AlertOperator)}
              >
                {(Object.entries(OPERATOR_LABELS) as [AlertOperator, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Threshold</label>
              <input
                type="number"
                className={inputClass}
                value={form.threshold}
                onChange={e => set("threshold", e.target.value)}
              />
            </div>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("enabled", !form.enabled)}
              className={`
                relative w-10 h-5 rounded-full transition-colors
                ${form.enabled ? "bg-[#00FF88]/30" : "bg-white/10"}
              `}
            >
              <motion.span
                layout
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full
                  ${form.enabled ? "bg-[#00FF88] left-5" : "bg-white/40 left-0.5"}
                `}
              />
            </button>
            <span className="font-mono text-xs text-white/50">
              {form.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSave(form)}
          disabled={saving || !form.label.trim()}
          className="
            mt-6 w-full py-2.5 rounded-sm font-mono text-sm font-semibold
            bg-[#00F5FF] text-[#050505] disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-[#00F5FF]/90
          "
        >
          {saving ? "Saving…" : "Save Rule"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FounderAlertsPage() {
  const [health,      setHealth]      = useState<BusinessHealth[]>([]);
  const [rules,       setRules]       = useState<AlertRule[]>([]);
  const [events,      setEvents]      = useState<AlertEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<AlertRule | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    setError(null);

    try {
      const [healthRes, rulesRes, eventsRes] = await Promise.all([
        fetch("/api/founder/health"),
        fetch("/api/founder/alerts"),
        fetch("/api/founder/alerts/triggered?limit=30"),
      ]);

      if (healthRes.ok) {
        const d = await healthRes.json();
        setHealth(d.scores ?? []);
      }
      if (rulesRes.ok) {
        const d = await rulesRes.json();
        setRules(d.rules ?? []);
      }
      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  async function handleSave(form: RuleFormData) {
    setSaving(true);
    try {
      if (editTarget) {
        // Update
        const res = await fetch(`/api/founder/alerts/${editTarget.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            label:     form.label,
            threshold: Number(form.threshold),
            operator:  form.operator,
            enabled:   form.enabled,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
        const { rule } = await res.json();
        setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
      } else {
        // Create
        const res = await fetch("/api/founder/alerts", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ ...form, threshold: Number(form.threshold) }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
        const { rule } = await res.json();
        setRules(prev => [rule, ...prev]);
      }
      setShowModal(false);
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: AlertRule) {
    const res = await fetch(`/api/founder/alerts/${rule.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ enabled: !rule.enabled }),
    });
    if (res.ok) {
      const { rule: updated } = await res.json();
      setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/founder/alerts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  }

  function openCreate() {
    setEditTarget(null);
    setShowModal(true);
  }

  function openEdit(rule: AlertRule) {
    setEditTarget(rule);
    setShowModal(true);
  }

  // ── Health summary ──────────────────────────────────────────────────────────

  const criticalCount = health.filter(b => b.score === "critical").length;
  const warningCount  = health.filter(b => b.score === "warning").length;
  const bannerColor   = criticalCount > 0 ? "#FF4444" : warningCount > 0 ? "#FFB800" : "#00FF88";
  const bannerLabel   = criticalCount > 0 ? "CRITICAL" : warningCount > 0 ? "WARNING" : "HEALTHY";

  const modalInitial: RuleFormData = editTarget
    ? {
        business_id: editTarget.business_id,
        metric:      editTarget.metric,
        operator:    editTarget.operator,
        threshold:   String(editTarget.threshold),
        label:       editTarget.label,
        enabled:     editTarget.enabled,
      }
    : DEFAULT_FORM;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-6 h-6 text-[#00F5FF]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-mono text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-[#00F5FF]" />
              <h1 className="text-xl font-semibold tracking-tight uppercase text-white">
                KPI Alerts
              </h1>
            </div>
            <p className="text-xs text-white/40">
              Business health monitoring &amp; threshold alerting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => loadAll(true)}
              disabled={refreshing}
              className="p-2 rounded-sm border border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <RefreshCw className={`w-4 h-4 text-white/40 ${refreshing ? "animate-spin" : ""}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#00F5FF] text-[#050505] text-xs font-semibold uppercase tracking-wider hover:bg-[#00F5FF]/90"
            >
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </motion.button>
          </div>
        </motion.div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex items-center gap-3 px-4 py-3 rounded-sm border border-[#FF4444]/30 bg-[#FF4444]/[0.06] text-[#FF4444]"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Health Score Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40 uppercase tracking-widest">
              Portfolio Health
            </span>
            <motion.span
              style={{ color: bannerColor }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-auto text-xs font-semibold uppercase tracking-widest"
            >
              {bannerLabel}
            </motion.span>
          </div>

          {health.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2"
            >
              {health.map(biz => (
                <HealthChip key={biz.businessId} biz={biz} />
              ))}
            </motion.div>
          ) : (
            <p className="text-xs text-white/30">No health data available.</p>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-white/[0.06]">
            {(["healthy", "warning", "critical"] as HealthStatus[]).map(s => {
              const dot = s === "healthy" ? "bg-[#00FF88]" : s === "warning" ? "bg-[#FFB800]" : "bg-[#FF4444]";
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs text-white/30 capitalize">{s}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Alert Rules ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs text-white/50 uppercase tracking-widest">
              Alert Rules
              <span className="ml-2 text-[#00F5FF]">{rules.length}</span>
            </h2>
          </div>

          {rules.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-sm border border-white/[0.06] p-8 text-center"
            >
              <BellOff className="w-6 h-6 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">No alert rules yet.</p>
              <button
                onClick={openCreate}
                className="mt-3 text-xs text-[#00F5FF] hover:underline"
              >
                Create your first rule →
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              <AnimatePresence mode="popLayout">
                {rules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* ── Triggered Alerts Timeline ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
            <h2 className="text-xs text-white/50 uppercase tracking-widest">
              Triggered Alerts
            </h2>
            <span className="ml-auto text-xs text-[#FFB800]">{events.length}</span>
          </div>

          {events.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-6 h-6 text-[#00FF88]/40 mx-auto mb-2" />
              <p className="text-xs text-white/30">No alerts triggered — all thresholds clear.</p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {events.map(ev => (
                <EventRow key={ev.id} event={ev} />
              ))}
            </motion.div>
          )}
        </motion.div>

      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <RuleModal
            initial={modalInitial}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditTarget(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
