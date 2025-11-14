"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  gradientFrom: string;
  gradientTo: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  gradientFrom,
  gradientTo,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("border-0 shadow-lg overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className={cn("p-6 bg-gradient-to-br", gradientFrom, gradientTo)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
              <p className="text-3xl font-bold text-white mb-2">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-white" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-white" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium text-white"
                    )}
                  >
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-xs text-white/70 ml-1">{trend.label}</span>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-configured stat card variants matching the design
export function RevenueStatsCard({ value, trend }: { value: string; trend?: StatsCardProps["trend"] }) {
  return (
    <StatsCard
      title="Total Revenue"
      value={value}
      icon={TrendingUp}
      trend={trend}
      gradientFrom="from-unite-teal"
      gradientTo="to-unite-blue"
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
      gradientFrom="from-unite-blue"
      gradientTo="to-purple-600"
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
      gradientFrom="from-unite-orange"
      gradientTo="to-unite-gold"
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
      gradientFrom="from-green-500"
      gradientTo="to-emerald-600"
    />
  );
}
