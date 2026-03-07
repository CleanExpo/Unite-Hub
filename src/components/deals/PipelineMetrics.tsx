"use client";

import { DollarSign, TrendingUp, Target, Clock, BarChart3, Trophy } from "lucide-react";
import type { Deal } from "./DealCard";

interface PipelineMetricsProps {
  deals: Deal[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PipelineMetrics({ deals }: PipelineMetricsProps) {
  const openDeals = deals.filter((d) => d.status === "open");
  const wonDeals = deals.filter((d) => d.status === "won");
  const lostDeals = deals.filter((d) => d.status === "lost");

  // Total pipeline value (open deals only)
  const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  // Weighted pipeline (value * probability / 100)
  const weightedPipeline = openDeals.reduce(
    (sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100),
    0
  );

  // Win rate (won / (won + lost) — last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentWon = wonDeals.filter((d) => new Date(d.updated_at) >= ninetyDaysAgo).length;
  const recentLost = lostDeals.filter((d) => new Date(d.updated_at) >= ninetyDaysAgo).length;
  const winRate = recentWon + recentLost > 0
    ? Math.round((recentWon / (recentWon + recentLost)) * 100)
    : 0;

  // Average deal size (open deals)
  const avgDealSize = openDeals.length > 0
    ? openDeals.reduce((sum, d) => sum + (d.value || 0), 0) / openDeals.length
    : 0;

  // Average days to close (won deals with actual_close_date)
  const closedDealsWithDates = wonDeals.filter((d) => d.actual_close_date && d.created_at);
  const avgDaysToClose = closedDealsWithDates.length > 0
    ? Math.round(
        closedDealsWithDates.reduce((sum, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.actual_close_date!);
          return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / closedDealsWithDates.length
      )
    : 0;

  const metrics = [
    {
      label: "Pipeline Value",
      value: formatCurrency(totalPipeline),
      icon: DollarSign,
      color: "#00FF88",
    },
    {
      label: "Weighted Pipeline",
      value: formatCurrency(weightedPipeline),
      icon: TrendingUp,
      color: "#00F5FF",
    },
    {
      label: "Open Deals",
      value: openDeals.length.toString(),
      icon: BarChart3,
      color: "#FF00FF",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Trophy,
      color: "#FFB800",
    },
    {
      label: "Avg Deal Size",
      value: formatCurrency(avgDealSize),
      icon: Target,
      color: "#00F5FF",
    },
    {
      label: "Avg Days to Close",
      value: avgDaysToClose > 0 ? `${avgDaysToClose}d` : "—",
      icon: Clock,
      color: "#FFB800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-sm bg-white/[0.04]">
              <metric.icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-white">{metric.value}</div>
          <div className="text-[11px] font-mono text-white/30">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
