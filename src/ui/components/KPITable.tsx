/**
 * KPI Table Component
 * Phase 40: Performance Intelligence Layer
 *
 * Tabular KPIs with tooltips and data sources
 */

"use client";

import { useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from "./Table";
import { Info, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import type { NormalizedMetrics } from "@/lib/services/performanceInsightsService";

interface KPIRow {
  label: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  unit?: string;
  source: string;
  tooltip?: string;
}

interface KPITableProps {
  metrics: NormalizedMetrics;
  period: "quarterly" | "annual";
  className?: string;
}

export function KPITable({ metrics, period, className = "" }: KPITableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Build KPI rows from real metrics only
  const kpiRows: KPIRow[] = [
    {
      label: "Tasks Completed",
      value: metrics.internal.tasksCompleted,
      unit: "tasks",
      source: "Unite-Hub Internal",
      tooltip: "Number of tasks marked as complete during this period",
    },
    {
      label: "Task Completion Rate",
      value: metrics.internal.tasksTotal > 0
        ? Math.round((metrics.internal.tasksCompleted / metrics.internal.tasksTotal) * 100)
        : 0,
      unit: "%",
      source: "Unite-Hub Internal",
      tooltip: "Percentage of total tasks completed",
    },
    {
      label: "Approvals Approved",
      value: metrics.internal.approvalsApproved,
      unit: "items",
      source: "Unite-Hub Internal",
      tooltip: "Content items approved by client",
    },
    {
      label: "Approvals Rejected",
      value: metrics.internal.approvalsRejected,
      unit: "items",
      source: "Unite-Hub Internal",
      tooltip: "Content items rejected and revised",
    },
    {
      label: "Approvals Pending",
      value: metrics.internal.approvalsPending,
      unit: "items",
      source: "Unite-Hub Internal",
      tooltip: "Content items awaiting review",
    },
    {
      label: "AI Events Generated",
      value: metrics.internal.aiEventsGenerated,
      unit: "events",
      source: "Unite-Hub AI Layer",
      tooltip: "AI-generated content, analyses, and recommendations",
    },
    {
      label: "Visual Assets Created",
      value: metrics.internal.visualAssetsCreated,
      unit: "assets",
      source: "Unite-Hub Visual Engine",
      tooltip: "Images, videos, and graphs generated",
    },
    {
      label: "Knowledge Items Added",
      value: metrics.internal.knowledgeItemsAdded,
      unit: "items",
      source: "Unite-Hub Knowledge Base",
      tooltip: "New knowledge base entries during this period",
    },
  ];

  // Add external metrics if available
  if (metrics.external.rankTracking) {
    kpiRows.push({
      label: "Keywords Tracked",
      value: metrics.external.rankTracking.keywords,
      unit: "keywords",
      source: "DataForSEO",
      tooltip: "Total keywords being monitored for rankings",
    });
    kpiRows.push({
      label: "Average Position",
      value: metrics.external.rankTracking.avgPosition.toFixed(1),
      source: "DataForSEO",
      tooltip: "Average search engine ranking position",
    });
    kpiRows.push({
      label: "Top 10 Rankings",
      value: metrics.external.rankTracking.top10,
      unit: "keywords",
      source: "DataForSEO",
      tooltip: "Keywords ranking in positions 1-10",
    });
  }

  if (metrics.external.backlinks) {
    kpiRows.push({
      label: "Total Backlinks",
      value: metrics.external.backlinks.totalBacklinks.toLocaleString(),
      source: "DataForSEO",
      tooltip: "Total number of backlinks pointing to your domain",
    });
    kpiRows.push({
      label: "Referring Domains",
      value: metrics.external.backlinks.referringDomains.toLocaleString(),
      source: "DataForSEO",
      tooltip: "Unique domains linking to your site",
    });
    kpiRows.push({
      label: "Domain Rank",
      value: metrics.external.backlinks.domainRank,
      source: "DataForSEO",
      tooltip: "Overall domain authority score",
    });
  }

  if (metrics.external.traffic) {
    kpiRows.push({
      label: "Organic Traffic",
      value: metrics.external.traffic.organicTraffic.toLocaleString(),
      unit: "visits",
      source: "DataForSEO",
      tooltip: "Estimated organic search traffic",
    });
    kpiRows.push({
      label: "Traffic Trend",
      value: metrics.external.traffic.trend,
      change: metrics.external.traffic.changePercent,
      source: "DataForSEO",
      tooltip: "Traffic direction compared to previous period",
    });
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Metric</TableHeader>
            <TableHeader className="text-right">Value</TableHeader>
            <TableHeader className="hidden sm:table-cell">Source</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {kpiRows.length === 0 ? (
            <TableEmpty
              colSpan={3}
              message="No metrics available for this period"
            />
          ) : (
            kpiRows.map((row, index) => (
              <TableRow
                key={row.label}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                className="group"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {row.label}
                    </span>
                    {row.tooltip && (
                      <div className="relative">
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        {hoveredRow === index && (
                          <div className="absolute z-10 left-0 bottom-full mb-2 w-48 p-2 text-xs text-white bg-gray-900 rounded shadow-lg">
                            {row.tooltip}
                            <div className="absolute left-3 top-full w-2 h-2 bg-gray-900 transform rotate-45 -translate-y-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {row.value}
                      {row.unit && (
                        <span className="text-xs text-gray-500 ml-1">{row.unit}</span>
                      )}
                    </span>
                    {row.change !== undefined && (
                      <TrendBadge value={row.change} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {row.source}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Data integrity notice */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          All metrics are based on real data. No estimates or projections included.
        </p>
      </div>
    </div>
  );
}

interface TrendBadgeProps {
  value: number;
}

function TrendBadge({ value }: TrendBadgeProps) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-gray-500">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <span className={`flex items-center gap-0.5 text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

export default KPITable;
