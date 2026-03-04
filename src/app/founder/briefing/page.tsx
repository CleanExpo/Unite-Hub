'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Mail, MailCheck, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface WeeklyBriefing {
  id: string;
  owner_id: string;
  week_starting: string;
  summary_html: string;
  summary_text: string;
  metrics: Record<string, unknown>;
  alerts: unknown[];
  delivered_email: boolean;
  delivered_push: boolean;
  created_at: string;
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-[#1a1a1a] rounded-sm w-1/3" />
      <div className="h-3 bg-[#1a1a1a] rounded-sm w-full" />
      <div className="h-3 bg-[#1a1a1a] rounded-sm w-5/6" />
      <div className="h-3 bg-[#1a1a1a] rounded-sm w-4/6" />
    </div>
  );
}

// ── Delivery badge ──────────────────────────────────────────────────────────────
function DeliveryBadge({ delivered, label }: { delivered: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono border ${
        delivered
          ? 'border-[#00FF88]/30 text-[#00FF88] bg-[#00FF88]/5'
          : 'border-[#333] text-[#555] bg-transparent'
      }`}
    >
      {delivered ? (
        <MailCheck className="w-3 h-3" />
      ) : (
        <Mail className="w-3 h-3" />
      )}
      {label}
    </span>
  );
}

// ── Briefing summary renderer (safe HTML from server) ──────────────────────────
function SummaryContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none font-mono text-[#b0b0b0] leading-relaxed
        prose-p:text-[#b0b0b0] prose-p:my-2
        prose-ul:my-2 prose-li:text-[#b0b0b0] prose-li:my-0.5
        prose-strong:text-[#00F5FF]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── History accordion card ──────────────────────────────────────────────────────
function HistoryCard({ briefing }: { briefing: WeeklyBriefing }) {
  const [open, setOpen] = useState(false);
  const alertCount = Array.isArray(briefing.alerts) ? briefing.alerts.length : 0;

  return (
    <motion.div
      layout
      className="rounded-sm border border-[#1a1a1a] bg-[#080808] overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#0f0f0f] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-[#666]">Week of</span>
          <span className="font-mono text-sm text-[#00F5FF]">{briefing.week_starting}</span>
          {alertCount > 0 && (
            <span className="text-xs font-mono text-[#FFB800] border border-[#FFB800]/30 px-1.5 py-0.5 rounded-sm">
              {alertCount} alert{alertCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DeliveryBadge delivered={briefing.delivered_email} label="Email" />
          {open ? (
            <ChevronUp className="w-4 h-4 text-[#444]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#444]" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3">
              <SummaryContent html={briefing.summary_html} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
export default function FounderBriefingPage() {
  const [latest, setLatest] = useState<WeeklyBriefing | null>(null);
  const [history, setHistory] = useState<WeeklyBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder/briefing');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setLatest(data.latest ?? null);
      setHistory(data.history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/founder/briefing/generate', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Re-fetch to pick up freshly generated briefing
      await fetchBriefings();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchBriefings();
  }, []);

  const alertCount = Array.isArray(latest?.alerts) ? latest.alerts.length : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#00F5FF]" />
              <h1 className="text-lg font-mono text-[#00F5FF] tracking-widest uppercase">
                Weekly Briefing
              </h1>
            </div>
            <p className="text-xs text-[#555] font-mono">
              Auto-generated every Monday 07:00 AEST
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBriefings}
              disabled={loading}
              className="p-2 rounded-sm border border-[#1a1a1a] hover:border-[#333] text-[#555] hover:text-[#888] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={generateNow}
              disabled={generating || loading}
              className="flex items-center gap-2 px-3 py-2 rounded-sm border border-[#00F5FF]/30
                text-[#00F5FF] text-xs hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-40"
            >
              {generating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {generating ? 'Generating…' : 'Generate Now'}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-sm border border-[#FF4444]/30 bg-[#FF4444]/5 px-4 py-3 text-[#FF4444] text-xs"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeletons ─────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !latest && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-sm border border-[#1a1a1a] bg-[#080808] p-12 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-sm border border-[#1a1a1a] flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5 text-[#333]" />
            </div>
            <p className="text-[#444] text-sm font-mono">
              No briefings yet — click Generate Now
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={generateNow}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-[#00F5FF]/30
                text-[#00F5FF] text-xs hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-40"
            >
              {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {generating ? 'Generating…' : 'Generate Now'}
            </motion.button>
          </motion.div>
        )}

        {/* ── Latest briefing card ──────────────────────────────────────────── */}
        {!loading && latest && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-sm border border-[#00F5FF]/20 bg-[#0a0a0a] overflow-hidden"
          >
            {/* Card header */}
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-[#555] font-mono">WEEK OF</span>
                  <span className="text-sm text-[#00F5FF] font-mono">{latest.week_starting}</span>
                </div>
                {alertCount > 0 && (
                  <span className="text-xs text-[#FFB800] font-mono">
                    {alertCount} alert{alertCount !== 1 ? 's' : ''} this week
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DeliveryBadge delivered={latest.delivered_email} label="Email" />
                <DeliveryBadge delivered={latest.delivered_push} label="Push" />
              </div>
            </div>

            {/* Card body — summary */}
            <div className="px-5 py-5">
              <SummaryContent html={latest.summary_html} />
            </div>

            {/* Card footer */}
            <div className="px-5 py-3 border-t border-[#1a1a1a] flex items-center justify-between">
              <span className="text-xs text-[#333] font-mono">
                Generated {new Date(latest.created_at).toLocaleString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Australia/Sydney',
                })} AEST
              </span>
            </div>
          </motion.div>
        )}

        {/* ── History ───────────────────────────────────────────────────────── */}
        {!loading && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <p className="text-xs text-[#444] font-mono uppercase tracking-widest">
              Previous Weeks
            </p>
            {history.map((b) => (
              <HistoryCard key={b.id} briefing={b} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}
