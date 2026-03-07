"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  accentColor = '#00F5FF',
  className,
}: StatsCardProps) {
  const trendColor = trend?.isPositive ? '#00FF88' : '#FF4444';

  return (
    <div
      className={cn(
        "bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden",
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-mono text-sm font-medium text-white/50 mb-1">{title}</p>
            <p className="font-mono text-3xl font-bold text-white mb-2">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" style={{ color: trendColor }} />
                ) : (
                  <TrendingDown className="h-4 w-4" style={{ color: trendColor }} />
                )}
                <span
                  className="font-mono text-sm font-medium"
                  style={{ color: trendColor }}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="font-mono text-xs text-white/30 ml-1">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className="p-3 rounded-sm"
            style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
          >
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Pre-configured stat card variants matching Scientific Luxury design
export function RevenueStatsCard({ value, trend }: { value: string; trend?: StatsCardProps["trend"] }) {
  return (
    <StatsCard
      title="Total Revenue"
      value={value}
      icon={TrendingUp}
      trend={trend}
      accentColor="#00F5FF"
    />
  );
}

export function ProjectsStatsCard({ value, trend }: { value: number; trend?: StatsCardProps["trend"] }) {
  return (
    <StatsCard
      title="Active Projects"
      value={value}
      icon={TrendingUp}
      trend={trend}
      accentColor="#00F5FF"
    />
  );
}

export function ClientsStatsCard({ value, trend }: { value: number; trend?: StatsCardProps["trend"] }) {
  return (
    <StatsCard
      title="Total Clients"
      value={value}
      icon={TrendingUp}
      trend={trend}
      accentColor="#FFB800"
    />
  );
}

export function CompletionStatsCard({ value, trend }: { value: string; trend?: StatsCardProps["trend"] }) {
  return (
    <StatsCard
      title="Completion Rate"
      value={value}
      icon={TrendingUp}
      trend={trend}
      accentColor="#00FF88"
    />
  );
}
