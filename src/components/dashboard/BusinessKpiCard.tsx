"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessKpiData {
  id: string;
  name: string;
  code: string;
  emoji: string;
  url?: string;
  status: "healthy" | "warning" | "critical" | "building";
  mrr: number;
  mrrChange: number; // % change vs last month
  activeUsers: number;
  topMetric: { label: string; value: number | string };
  sparkline: number[]; // 30 days of MRR values
  updatedAt: string;
}

// ─── Status config — Scientific Luxury tokens ─────────────────────────────────

const STATUS_CONFIG = {
  healthy:  { label: "Healthy",  dot: "#00FF88", badge: { color: "#00FF88", bg: "#00FF8810", border: "#00FF8840" } },
  warning:  { label: "Warning",  dot: "#FFB800", badge: { color: "#FFB800", bg: "#FFB80010", border: "#FFB80040" } },
  critical: { label: "Critical", dot: "#FF4444", badge: { color: "#FF4444", bg: "#FF444410", border: "#FF444440" } },
  building: { label: "Building", dot: "#00F5FF", badge: { color: "#00F5FF", bg: "#00F5FF10", border: "#00F5FF40" } },
};

// ─── Sparkline tooltip ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-sm px-2 py-1 font-mono text-xs text-white">
      ${payload[0].value?.toLocaleString()}
    </div>
  );
}

// ─── BusinessKpiCard ──────────────────────────────────────────────────────────

interface BusinessKpiCardProps {
  data: BusinessKpiData;
  className?: string;
  onDrillDown?: (id: string) => void;
}

export function BusinessKpiCard({ data, className, onDrillDown }: BusinessKpiCardProps) {
  const status = STATUS_CONFIG[data.status];
  const trendUp = data.mrrChange > 0;
  const trendFlat = data.mrrChange === 0;
  const sparkData = data.sparkline.map((v, i) => ({ day: i + 1, mrr: v }));

  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown;
  const trendColor = trendFlat ? "rgba(255,255,255,0.3)" : trendUp ? "#00FF88" : "#FF4444";

  return (
    <div
      className={cn(
        "group flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden transition-all hover:border-white/[0.10]",
        className
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" role="img" aria-label={data.name}>
            {data.emoji}
          </span>
          <div>
            <h3 className="font-mono text-sm font-semibold text-white leading-tight">{data.name}</h3>
            <span className="font-mono text-[10px] text-white/30">{data.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium px-2 py-0.5 rounded-sm border"
            style={{ color: status.badge.color, backgroundColor: status.badge.bg, borderColor: status.badge.border }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
          {/* External link */}
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 hover:text-white/60 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.04] mx-4 rounded-sm overflow-hidden mb-3">
        {/* MRR */}
        <div className="bg-[#050505] px-3 py-2.5">
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-0.5">MRR</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-white">
              ${data.mrr >= 1000 ? `${(data.mrr / 1000).toFixed(1)}k` : data.mrr.toLocaleString()}
            </span>
            <div className="flex items-center gap-0.5 font-mono text-xs" style={{ color: trendColor }}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(data.mrrChange)}%</span>
            </div>
          </div>
        </div>

        {/* Active users */}
        <div className="bg-[#050505] px-3 py-2.5">
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Active Users</p>
          <span className="font-mono text-lg font-bold text-white">
            {data.activeUsers >= 1000 ? `${(data.activeUsers / 1000).toFixed(1)}k` : data.activeUsers.toLocaleString()}
          </span>
        </div>

        {/* Top metric */}
        <div className="bg-[#050505] px-3 py-2.5 col-span-2">
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{data.topMetric.label}</p>
          <span className="font-mono text-sm font-semibold" style={{ color: '#00F5FF' }}>
            {typeof data.topMetric.value === "number"
              ? data.topMetric.value.toLocaleString()
              : data.topMetric.value}
          </span>
        </div>
      </div>

      {/* Sparkline — 30-day MRR */}
      <div className="px-4 pb-1">
        <p className="font-mono text-[9px] text-white/20 uppercase tracking-wider mb-1">30-day MRR trend</p>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="mrr"
                stroke={data.mrrChange >= 0 ? "#00F5FF" : "#FF4444"}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip content={<SparkTooltip />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 mt-auto border-t border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => onDrillDown?.(data.id)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onDrillDown?.(data.id)}
        aria-label={`View ${data.name} details`}
      >
        <div className="flex items-center gap-1 font-mono text-[10px] text-white/30">
          <Clock className="w-3 h-3" />
          <span>Updated {new Date(data.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <span
          className="font-mono text-[10px] font-medium transition-colors"
          style={{ color: '#00F5FF60' }}
        >
          View details →
        </span>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function BusinessKpiCardSkeleton() {
  return (
    <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden animate-pulse">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-sm bg-white/[0.04]" />
        <div>
          <div className="h-3.5 w-28 bg-white/[0.04] rounded-sm mb-1" />
          <div className="h-2.5 w-12 bg-white/[0.04] rounded-sm" />
        </div>
        <div className="ml-auto h-5 w-16 bg-white/[0.04] rounded-sm" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/[0.04] mx-4 rounded-sm overflow-hidden mb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cn("bg-[#050505] px-3 py-2.5", i === 2 ? "col-span-2" : "")}>
            <div className="h-2 w-10 bg-white/[0.04] rounded-sm mb-1.5" />
            <div className="h-5 w-16 bg-white/[0.04] rounded-sm" />
          </div>
        ))}
      </div>
      <div className="h-10 mx-4 mb-1 bg-white/[0.04] rounded-sm" />
      <div className="h-10 border-t border-white/[0.04] mx-0 bg-[#050505]" />
    </div>
  );
}
