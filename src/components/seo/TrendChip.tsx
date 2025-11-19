"use client";

/**
 * TrendChip Component - Phase 8 Week 21
 *
 * Displays trend indicator (UP, DOWN, FLAT) for audit history.
 * Used in Staff SEO Dashboard to show at-a-glance performance trends.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrendChipProps {
  trend: "IMPROVING" | "DECLINING" | "STABLE" | "INITIAL" | string;
  healthScoreDelta?: number;
  compact?: boolean;
  showTooltip?: boolean;
}

export default function TrendChip({
  trend,
  healthScoreDelta,
  compact = false,
  showTooltip = true,
}: TrendChipProps) {
  const getTrendConfig = () => {
    switch (trend) {
      case "IMPROVING":
        return {
          icon: <TrendingUp className="h-3 w-3" />,
          label: "Improving",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300",
          description: "Performance is trending upward",
        };
      case "DECLINING":
        return {
          icon: <TrendingDown className="h-3 w-3" />,
          label: "Declining",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-300",
          description: "Performance needs attention",
        };
      case "STABLE":
        return {
          icon: <Minus className="h-3 w-3" />,
          label: "Stable",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
          description: "Performance is stable",
        };
      case "INITIAL":
        return {
          icon: <HelpCircle className="h-3 w-3" />,
          label: "Initial",
          variant: "outline" as const,
          className: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
          description: "First audit (no comparison data)",
        };
      default:
        return {
          icon: <Minus className="h-3 w-3" />,
          label: "Unknown",
          variant: "outline" as const,
          className: "",
          description: "Unable to determine trend",
        };
    }
  };

  const config = getTrendConfig();

  const chip = (
    <Badge
      variant={config.variant}
      className={`gap-1 text-xs font-medium ${config.className} ${compact ? "px-1.5 py-0.5" : "px-2 py-1"}`}
    >
      {config.icon}
      {!compact && <span>{config.label}</span>}
      {healthScoreDelta !== undefined && healthScoreDelta !== 0 && (
        <span className="ml-1 font-bold">
          {healthScoreDelta > 0 ? "+" : ""}
          {healthScoreDelta}
        </span>
      )}
    </Badge>
  );

  if (!showTooltip) {
    return chip;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {healthScoreDelta !== undefined && healthScoreDelta !== 0 && (
            <p className="text-xs mt-1">
              Health score changed by {healthScoreDelta > 0 ? "+" : ""}
              {healthScoreDelta} points
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * TrendIndicator - Simpler inline indicator for tables
 */
export function TrendIndicator({
  trend,
  size = "sm",
}: {
  trend: "IMPROVING" | "DECLINING" | "STABLE" | "INITIAL" | string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  switch (trend) {
    case "IMPROVING":
      return (
        <TrendingUp
          className={`${sizeClasses[size]} text-green-600 dark:text-green-400`}
        />
      );
    case "DECLINING":
      return (
        <TrendingDown
          className={`${sizeClasses[size]} text-red-600 dark:text-red-400`}
        />
      );
    case "STABLE":
      return (
        <Minus
          className={`${sizeClasses[size]} text-gray-500 dark:text-gray-400`}
        />
      );
    case "INITIAL":
      return (
        <HelpCircle
          className={`${sizeClasses[size]} text-blue-500 dark:text-blue-400`}
        />
      );
    default:
      return null;
  }
}

/**
 * HealthScoreBadge - Health score with color coding
 */
export function HealthScoreBadge({
  score,
  showLabel = false,
  size = "md",
}: {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const getScoreConfig = () => {
    if (score >= 80) {
      return {
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-950",
        label: "Excellent",
      };
    }
    if (score >= 60) {
      return {
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-950",
        label: "Good",
      };
    }
    if (score >= 40) {
      return {
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-950",
        label: "Fair",
      };
    }
    return {
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-950",
      label: "Poor",
    };
  };

  const config = getScoreConfig();

  const sizeClasses = {
    sm: "text-sm px-2 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-lg px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {score}
      {showLabel && <span className="font-normal text-xs">({config.label})</span>}
    </span>
  );
}

/**
 * DeltaSummaryCard - Quick summary of changes
 */
export function DeltaSummaryCard({
  summary,
}: {
  summary: {
    keywords_improved: number;
    keywords_declined: number;
    keywords_new: number;
    keywords_lost: number;
    top_win?: string;
    top_loss?: string;
  };
}) {
  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-600">+{summary.keywords_improved}</span>
          <span className="text-muted-foreground">improved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-600">-{summary.keywords_declined}</span>
          <span className="text-muted-foreground">declined</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600">+{summary.keywords_new}</span>
          <span className="text-muted-foreground">new</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">-{summary.keywords_lost}</span>
          <span className="text-muted-foreground">lost</span>
        </div>
      </div>

      {summary.top_win && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Top win:</p>
          <p className="text-sm text-green-700 dark:text-green-400 truncate">
            {summary.top_win}
          </p>
        </div>
      )}

      {summary.top_loss && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Top loss:</p>
          <p className="text-sm text-red-700 dark:text-red-400 truncate">
            {summary.top_loss}
          </p>
        </div>
      )}
    </div>
  );
}
