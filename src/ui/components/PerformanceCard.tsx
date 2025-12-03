/**
 * Performance Card Component
 * Phase 40: Performance Intelligence Layer
 *
 * Displays performance metrics with visuals and narrative summary
 */

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import { BarChart3, TrendingUp, TrendingDown, Minus, Calendar, Database, RefreshCw } from "lucide-react";
import type { NormalizedMetrics, PerformanceReport } from "@/lib/services/performanceInsightsService";

interface PerformanceCardProps {
  report: PerformanceReport;
  onRefresh?: () => void;
  onApprove?: (reportId: string) => void;
  className?: string;
}

export function PerformanceCard({ report, onRefresh, onApprove, className = "" }: PerformanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const metrics = report.metrics as NormalizedMetrics;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const periodLabel = report.period === "quarterly" ? "Quarterly Report" : "Annual Report";

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <CardTitle>{periodLabel}</CardTitle>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              report.status === "approved"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : report.status === "ready_for_review"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {report.status.replace(/_/g, " ")}
          </span>
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <Calendar className="w-3 h-3" />
          {formatDate(report.start_date)} - {formatDate(report.end_date)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="Tasks Completed"
            value={metrics.internal.tasksCompleted}
            total={metrics.internal.tasksTotal}
            type="progress"
          />
          <MetricBox
            label="Approvals"
            value={metrics.internal.approvalsApproved}
            total={
              metrics.internal.approvalsApproved +
              metrics.internal.approvalsRejected +
              metrics.internal.approvalsPending
            }
            type="progress"
          />
          <MetricBox
            label="AI Events"
            value={metrics.internal.aiEventsGenerated}
            type="count"
          />
          <MetricBox
            label="Visual Assets"
            value={metrics.internal.visualAssetsCreated}
            type="count"
          />
        </div>

        {/* Narrative Summary */}
        {report.narrative && (
          <div className="pt-3 border-t border-border-subtle">
            <p className={`text-sm text-text-secondary ${!isExpanded && "line-clamp-3"}`}>
              {report.narrative}
            </p>
            {report.narrative.length > 200 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-teal-600 hover:text-teal-700 mt-1"
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Data Sources */}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Database className="w-3 h-3" />
          <span>{report.data_sources.length} data source{report.data_sources.length !== 1 ? "s" : ""}</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t border-border-subtle">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-bg-hover dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        )}
        {onApprove && report.status === "ready_for_review" && (
          <button
            type="button"
            onClick={() => onApprove(report.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700"
          >
            Approve Report
          </button>
        )}
      </CardFooter>
    </Card>
  );
}

interface MetricBoxProps {
  label: string;
  value: number;
  total?: number;
  type: "progress" | "count" | "trend";
  trend?: "up" | "down" | "stable";
}

function MetricBox({ label, value, total, type, trend }: MetricBoxProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-400";

  return (
    <div className="p-3 bg-bg-raised/50 rounded-lg">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-text-primary">{value}</span>
        {type === "progress" && total !== undefined && (
          <span className="text-xs text-gray-500">/ {total}</span>
        )}
        {type === "trend" && trend && (
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
        )}
      </div>
      {type === "progress" && total !== undefined && total > 0 && (
        <div className="mt-2 h-1.5 bg-bg-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((value / total) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default PerformanceCard;
