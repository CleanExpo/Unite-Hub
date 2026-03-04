'use client';

/**
 * /founder/analytics — Unified Analytics Command Centre
 *
 * Scientific Luxury design system:
 *   bg #050505 | primary #00F5FF | success #00FF88 | warning #FFB800
 *   error #FF4444 | escalation #FF00FF | rounded-sm only | Framer Motion
 *
 * UNI-1453 / UNI-1454 / UNI-1455
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { AnalyticsSummary, SiteSummary, RankingRow } from '@/app/api/founder/analytics/summary/route';

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedNumber(target: number, duration = 1.2) {
  const [display, setDisplay] = useState(0);
  const mv = useMotionValue(0);

  useEffect(() => {
    const controls = animate(mv, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [target]);

  return display;
}

// ---------------------------------------------------------------------------
// Sparkline (SVG bars)
// ---------------------------------------------------------------------------

function Sparkline({ data, colour }: { data: number[]; colour: string }) {
  const max = Math.max(...data, 1);
  const w = 56;
  const h = 24;
  const barW = Math.floor(w / data.length) - 1;

  return (
    <svg width={w} height={h} aria-hidden>
      {data.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * h));
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={h - barH}
            width={barW}
            height={barH}
            fill={colour}
            opacity={0.7 + (i / data.length) * 0.3}
            rx={1}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Source mini-bar
// ---------------------------------------------------------------------------

function SourceBar({ sources }: { sources: SiteSummary['sources'] }) {
  const total = sources.organic + sources.direct + sources.referral + sources.social;
  const pct = (n: number) => `${((n / total) * 100).toFixed(0)}%`;

  const segments = [
    { label: 'Organic', value: sources.organic, colour: '#00FF88' },
    { label: 'Direct', value: sources.direct, colour: '#00F5FF' },
    { label: 'Referral', value: sources.referral, colour: '#FFB800' },
    { label: 'Social', value: sources.social, colour: '#FF00FF' },
  ];

  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-sm">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: pct(s.value), backgroundColor: s.colour }}
            title={`${s.label}: ${pct(s.value)}`}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-2 flex-wrap">
        {segments.map((s) => (
          <span key={s.label} className="text-[10px]" style={{ color: s.colour }}>
            {s.label.slice(0, 3)} {pct(s.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  index: number;
}

function StatCard({ label, value, prefix = '', suffix = '', change, index }: StatCardProps) {
  const displayed = useAnimatedNumber(value);
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="border border-[#00F5FF]/20 rounded-sm p-4 bg-[#0a0a0a]"
    >
      <p className="text-[11px] font-mono text-[#00F5FF]/60 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-mono font-bold text-white">
        {prefix}{displayed.toLocaleString('en-AU')}{suffix}
      </p>
      <p className={`text-[11px] font-mono mt-1 ${isPositive ? 'text-[#00FF88]' : 'text-[#FF4444]'}`}>
        {isPositive ? '(+)' : '(-)'} {Math.abs(change).toFixed(1)}% vs prior period
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Site card
// ---------------------------------------------------------------------------

function SiteCard({ site, index }: { site: SiteSummary; index: number }) {
  const visitorsToday = useAnimatedNumber(site.visitors.today);

  function formatDuration(s: number) {
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="border border-white/10 rounded-sm bg-[#0a0a0a] overflow-hidden"
      style={{ borderLeftColor: site.colour, borderLeftWidth: 3 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono font-semibold text-sm text-white">{site.name}</p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: site.colour }}>
              {site.domain}
            </p>
          </div>
          <Sparkline data={site.sparkline} colour={site.colour} />
        </div>

        {/* Visitor counts */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Today', value: visitorsToday },
            { label: '7 days', value: site.visitors.week },
            { label: '30 days', value: site.visitors.month },
          ].map((item) => (
            <div key={item.label} className="text-center border border-white/5 rounded-sm py-1.5">
              <p className="text-base font-mono font-bold text-white">
                {item.value.toLocaleString('en-AU')}
              </p>
              <p className="text-[10px] font-mono text-white/40">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Metrics row */}
        <div className="flex gap-3 mb-3 text-[11px] font-mono">
          <span className="text-white/50">
            Bounce <span className="text-white">{site.bounceRate.toFixed(1)}%</span>
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/50">
            Session <span className="text-white">{formatDuration(site.avgSessionSeconds)}</span>
          </span>
        </div>

        {/* Top page */}
        <div className="mb-3 bg-[#050505] rounded-sm px-2 py-1.5 border border-white/5">
          <p className="text-[10px] font-mono text-white/40 mb-0.5">TOP PAGE</p>
          <p className="text-[11px] font-mono text-[#00F5FF] truncate">{site.topPage.path}</p>
          <p className="text-[10px] font-mono text-white/40">
            {site.topPage.views.toLocaleString('en-AU')} views
          </p>
        </div>

        {/* Source breakdown */}
        <div className="mb-3">
          <p className="text-[10px] font-mono text-white/40 mb-1">TRAFFIC SOURCES</p>
          <SourceBar sources={site.sources} />
        </div>

        {/* View details */}
        {site.plausibleUrl && (
          <a
            href={site.plausibleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] font-mono border border-white/10 rounded-sm py-1.5 text-white/50 hover:text-[#00F5FF] hover:border-[#00F5FF]/40 transition-colors"
          >
            VIEW IN PLAUSIBLE &rarr;
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Rankings table
// ---------------------------------------------------------------------------

function RankingsTable({ rows }: { rows: RankingRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
      className="border border-white/10 rounded-sm bg-[#0a0a0a] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="font-mono text-sm font-semibold text-[#00F5FF]">SEARCH RANKINGS</p>
        <span className="text-[10px] font-mono text-white/30 border border-white/10 rounded-sm px-2 py-0.5">
          GOOGLE SEARCH CONSOLE
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-white/5 text-white/30">
              <th className="text-left px-4 py-2 font-normal">KEYWORD</th>
              <th className="text-left px-4 py-2 font-normal">SITE</th>
              <th className="text-right px-4 py-2 font-normal">POS</th>
              <th className="text-right px-4 py-2 font-normal">IMPR</th>
              <th className="text-right px-4 py-2 font-normal">CLICKS</th>
              <th className="text-right px-4 py-2 font-normal">CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const changeColour =
                row.change > 0 ? '#00FF88' : row.change < 0 ? '#FF4444' : '#ffffff44';
              const changeLabel =
                row.change > 0 ? `+${row.change}` : row.change < 0 ? String(row.change) : '=';

              return (
                <tr
                  key={i}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-2 text-white/80 max-w-[200px] truncate">{row.keyword}</td>
                  <td className="px-4 py-2 text-[#00F5FF]/70 truncate max-w-[140px]">{row.site}</td>
                  <td className="px-4 py-2 text-right text-white">#{row.position}</td>
                  <td className="px-4 py-2 text-right text-white/60">
                    {row.impressions.toLocaleString('en-AU')}
                  </td>
                  <td className="px-4 py-2 text-right text-white/60">{row.clicks}</td>
                  <td className="px-4 py-2 text-right font-semibold" style={{ color: changeColour }}>
                    {changeLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Weekly report preview
// ---------------------------------------------------------------------------

function WeeklyReportPreview({ summary }: { summary: AnalyticsSummary }) {
  const { aggregate, sites } = summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
      className="border border-[#FFB800]/30 rounded-sm bg-[#0a0a0a] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#FFB800]/20 flex items-center justify-between">
        <p className="font-mono text-sm font-semibold text-[#FFB800]">
          MONDAY WHATSAPP REPORT PREVIEW
        </p>
        <span className="text-[10px] font-mono text-[#FFB800]/50 border border-[#FFB800]/20 rounded-sm px-2 py-0.5">
          08:00 AEST
        </span>
      </div>

      <pre className="px-4 py-3 text-[11px] font-mono text-white/60 whitespace-pre-wrap leading-relaxed overflow-x-auto">
{`[UNITE-GROUP] WEEKLY ANALYTICS

Network visitors (7d): ${aggregate.visitorsWeek.toLocaleString('en-AU')}  (+) ${aggregate.visitorsWeekChange.toFixed(1)}% vs last wk
Network visitors (30d): ${aggregate.visitorsMonth.toLocaleString('en-AU')}  (+) ${aggregate.visitorsMonthChange.toFixed(1)}% vs last mo
Revenue attributed: AUD $${aggregate.revenueAttributedAud.toLocaleString('en-AU')}

Site breakdown:
${sites.map((s) => `  ${s.name}: ${s.visitors.week.toLocaleString('en-AU')} visitors | Bounce ${s.bounceRate.toFixed(1)}%`).join('\n')}

Dashboard: https://unite-group.in/founder/analytics`}
      </pre>

      <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
        <span className="text-[10px] font-mono text-white/30">
          Cron: Sunday 22:00 UTC (Monday 08:00 AEST) via CallMeBot
        </span>
        <span className="ml-auto text-[10px] font-mono text-[#FFB800]/50">
          WHATSAPP_PHONE + WHATSAPP_API_KEY required
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FounderAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/founder/analytics/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnalyticsSummary = await res.json();
      setSummary(data);
      setLastUpdated(
        new Date().toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Australia/Brisbane',
        }) + ' AEST'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[#00F5FF] font-mono text-sm tracking-widest"
          >
            LOADING ANALYTICS...
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error && !summary) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#FF4444] font-mono text-sm">{error}</p>
          <button
            onClick={fetchSummary}
            className="border border-[#00F5FF]/30 text-[#00F5FF] font-mono text-xs px-4 py-2 rounded-sm hover:bg-[#00F5FF]/10 transition-colors"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { aggregate, sites, rankings } = summary;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight" style={{ color: '#00F5FF' }}>
              ANALYTICS COMMAND
            </h1>
            <p className="font-mono text-xs text-white/40 mt-1">
              Unified tracking across all Unite-Group sites
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* LIVE badge */}
            <div className="flex items-center gap-1.5 border border-[#00FF88]/30 rounded-sm px-2 py-1">
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"
              />
              <span className="font-mono text-[10px] text-[#00FF88] tracking-widest">LIVE</span>
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <span className="font-mono text-[10px] text-white/30">
                Updated {lastUpdated}
              </span>
            )}

            {/* Refresh */}
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="border border-white/10 rounded-sm px-3 py-1.5 font-mono text-[10px] text-white/40 hover:text-[#00F5FF] hover:border-[#00F5FF]/30 transition-colors disabled:opacity-30"
            >
              {loading ? 'LOADING...' : 'REFRESH'}
            </button>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------ */}
        {/* Aggregate stats row                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Visitors Today"
            value={aggregate.visitorsToday}
            change={aggregate.visitorsWeekChange}
            index={0}
          />
          <StatCard
            label="Visitors This Week"
            value={aggregate.visitorsWeek}
            change={aggregate.visitorsWeekChange}
            index={1}
          />
          <StatCard
            label="Visitors This Month"
            value={aggregate.visitorsMonth}
            change={aggregate.visitorsMonthChange}
            index={2}
          />
          <StatCard
            label="Revenue Attributed"
            value={aggregate.revenueAttributedAud}
            prefix="$"
            change={aggregate.revenueChange}
            index={3}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Site cards grid                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">
            Site Performance
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site, i) => (
              <SiteCard key={site.id} site={site} index={i} />
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Rankings table                                                      */}
        {/* ------------------------------------------------------------------ */}
        <RankingsTable rows={rankings} />

        {/* ------------------------------------------------------------------ */}
        {/* Weekly report preview                                               */}
        {/* ------------------------------------------------------------------ */}
        <WeeklyReportPreview summary={summary} />

        {/* ------------------------------------------------------------------ */}
        {/* Mock data notice                                                    */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border border-[#FFB800]/20 rounded-sm px-4 py-3 bg-[#FFB800]/5"
        >
          <p className="font-mono text-[11px] text-[#FFB800]/70">
            <span className="text-[#FFB800] font-semibold">MOCK DATA MODE</span> — Set{' '}
            <span className="text-white/60">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</span>,{' '}
            <span className="text-white/60">NEXT_PUBLIC_GA4_ID</span>, and{' '}
            <span className="text-white/60">NEXT_PUBLIC_CLARITY_ID</span> in{' '}
            <span className="text-white/60">.env.local</span> to connect live analytics.
            WhatsApp reports require <span className="text-white/60">WHATSAPP_PHONE</span> +{' '}
            <span className="text-white/60">WHATSAPP_API_KEY</span> +{' '}
            <span className="text-white/60">CRON_SECRET</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
