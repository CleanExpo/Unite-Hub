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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  healthy:  { label: "Healthy",  dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  warning:  { label: "Warning",  dot: "bg-amber-400",   badge: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
  critical: { label: "Critical", dot: "bg-red-400",     badge: "bg-red-500/10    text-red-400    border-red-500/20"    },
  building: { label: "Building", dot: "bg-blue-400",    badge: "bg-blue-500/10   text-blue-400   border-blue-500/20"   },
};

// ─── Sparkline tooltip ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white shadow">
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
  const trendColor = trendFlat ? "text-zinc-400" : trendUp ? "text-emerald-400" : "text-red-400";

  return (
    <div
      className={cn(
        "group flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/30",
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
            <h3 className="text-sm font-semibold text-white leading-tight">{data.name}</h3>
            <span className="text-[10px] font-mono text-zinc-500">{data.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border", status.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
          {/* External link */}
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-px bg-zinc-800 mx-4 rounded-xl overflow-hidden mb-3">
        {/* MRR */}
        <div className="bg-zinc-900 px-3 py-2.5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">MRR</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">
              ${data.mrr >= 1000 ? `${(data.mrr / 1000).toFixed(1)}k` : data.mrr.toLocaleString()}
            </span>
            <div className={cn("flex items-center gap-0.5 text-xs", trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(data.mrrChange)}%</span>
            </div>
          </div>
        </div>

        {/* Active users */}
        <div className="bg-zinc-900 px-3 py-2.5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Active Users</p>
          <span className="text-lg font-bold text-white">
            {data.activeUsers >= 1000 ? `${(data.activeUsers / 1000).toFixed(1)}k` : data.activeUsers.toLocaleString()}
          </span>
        </div>

        {/* Top metric */}
        <div className="bg-zinc-900 px-3 py-2.5 col-span-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{data.topMetric.label}</p>
          <span className="text-sm font-semibold text-cyan-400">
            {typeof data.topMetric.value === "number"
              ? data.topMetric.value.toLocaleString()
              : data.topMetric.value}
          </span>
        </div>
      </div>

      {/* Sparkline — 30-day MRR */}
      <div className="px-4 pb-1">
        <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">30-day MRR trend</p>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="mrr"
                stroke={data.mrrChange >= 0 ? "#22d3ee" : "#f87171"}
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
        className="flex items-center justify-between px-4 py-2.5 mt-auto border-t border-zinc-800 cursor-pointer hover:bg-zinc-800/40 transition-colors"
        onClick={() => onDrillDown?.(data.id)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && onDrillDown?.(data.id)}
        aria-label={`View ${data.name} details`}
      >
        <div className="flex items-center gap-1 text-[10px] text-zinc-600">
          <Clock className="w-3 h-3" />
          <span>Updated {new Date(data.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <span className="text-[10px] text-cyan-600 group-hover:text-cyan-400 transition-colors font-medium">
          View details →
        </span>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function BusinessKpiCardSkeleton() {
  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-zinc-800" />
        <div>
          <div className="h-3.5 w-28 bg-zinc-800 rounded mb-1" />
          <div className="h-2.5 w-12 bg-zinc-800 rounded" />
        </div>
        <div className="ml-auto h-5 w-16 bg-zinc-800 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-zinc-800 mx-4 rounded-xl overflow-hidden mb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cn("bg-zinc-900 px-3 py-2.5", i === 2 ? "col-span-2" : "")}>
            <div className="h-2 w-10 bg-zinc-800 rounded mb-1.5" />
            <div className="h-5 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 mx-4 mb-1 bg-zinc-800 rounded" />
      <div className="h-10 border-t border-zinc-800 mx-0 bg-zinc-900" />
    </div>
  );
}
