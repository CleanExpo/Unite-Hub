/**
 * Technical Health Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Displays technical SEO health metrics (staff only):
 * - Core Web Vitals
 * - Indexing status
 * - Crawl errors
 * - Mobile usability
 *
 * Note: This is a summary panel. Staff can drill down to detailed reports.
 */

"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface TechHealthPanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface TechHealthMetrics {
  overallHealth: "good" | "warning" | "critical";
  indexedPages: number;
  totalPages: number;
  crawlErrors: number;
  mobileUsability: "pass" | "fail";
  coreWebVitals: "pass" | "fail";
}

export default function TechHealthPanel({
  seoProfileId,
  organizationId,
  userRole,
}: TechHealthPanelProps) {
  const [metrics, setMetrics] = useState<TechHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTechHealth() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch tech health metrics
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock metrics
        setMetrics({
          overallHealth: "good",
          indexedPages: 247,
          totalPages: 283,
          crawlErrors: 3,
          mobileUsability: "pass",
          coreWebVitals: "pass",
        });
      } catch (err) {
        console.error("Error fetching tech health:", err);
        setError(err instanceof Error ? err.message : "Failed to load tech health");
      } finally {
        setLoading(false);
      }
    }

    fetchTechHealth();
  }, [seoProfileId, organizationId]);

  // Only show to staff
  if (userRole !== "staff") {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-green-500/10">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Technical Health</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-green-500/10">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Technical Health</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Determine overall health color
  const healthColor =
    metrics?.overallHealth === "good"
      ? "text-green-700 dark:text-green-400"
      : metrics?.overallHealth === "warning"
        ? "text-yellow-700 dark:text-yellow-400"
        : "text-red-700 dark:text-red-400";

  const healthBg =
    metrics?.overallHealth === "good"
      ? "bg-green-500/10"
      : metrics?.overallHealth === "warning"
        ? "bg-yellow-500/10"
        : "bg-red-500/10";

  // Show metrics
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-md ${healthBg}`}>
          <Activity className={`h-5 w-5 ${healthColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Technical Health</h3>
          <p className={`text-sm ${healthColor} font-medium capitalize`}>
            {metrics?.overallHealth}
          </p>
        </div>
      </div>

      {/* Health Checks */}
      <div className="space-y-3">
        {/* Indexing Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Indexing</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.indexedPages}/{metrics?.totalPages} pages
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            {metrics?.indexedPages && metrics?.totalPages
              ? `${((metrics.indexedPages / metrics.totalPages) * 100).toFixed(0)}%`
              : "0%"}
          </span>
        </div>

        {/* Crawl Errors */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-3">
            {(metrics?.crawlErrors || 0) > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <div>
              <p className="text-sm font-medium">Crawl Errors</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.crawlErrors || 0} errors detected
              </p>
            </div>
          </div>
          {(metrics?.crawlErrors || 0) > 0 && (
            <button className="text-xs text-primary hover:underline">Fix</button>
          )}
        </div>

        {/* Mobile Usability */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-3">
            {metrics?.mobileUsability === "pass" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">Mobile Usability</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.mobileUsability === "pass" ? "All checks passed" : "Issues found"}
              </p>
            </div>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-3">
            {metrics?.coreWebVitals === "pass" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">Core Web Vitals</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.coreWebVitals === "pass" ? "Good performance" : "Needs improvement"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <button className="text-sm text-primary hover:underline">View Full Report →</button>
      </div>
    </div>
  );
}
