/**
 * GSC Overview Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Displays Google Search Console metrics:
 * - Total impressions
 * - Total clicks
 * - Average CTR
 * - Average position
 *
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState, useEffect } from "react";
import { TrendingUp, MousePointer, Eye, Target } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface GscOverviewPanelProps {
  seoProfileId: string;
  organizationId: string;
  hasCredential: boolean;
  userRole: UserRole;
}

interface GscMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export default function GscOverviewPanel({
  seoProfileId,
  organizationId,
  hasCredential,
  userRole,
}: GscOverviewPanelProps) {
  const [metrics, setMetrics] = useState<GscMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGscMetrics() {
      if (!hasCredential) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate date range (last 28 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);

        const response = await fetch("/api/seo/gsc/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seo_profile_id: seoProfileId,
            organization_id: organizationId,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            dimensions: [],
            row_limit: 1,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch GSC metrics: ${response.statusText}`);
        }

        const result = await response.json();

        // Extract metrics from GSC API response
        if (result.success && result.data?.rows?.[0]) {
          const row = result.data.rows[0];
          setMetrics({
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
          });
        } else {
          setMetrics({
            impressions: 0,
            clicks: 0,
            ctr: 0,
            position: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching GSC metrics:", err);
        setError(err instanceof Error ? err.message : "Failed to load GSC metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchGscMetrics();
  }, [seoProfileId, organizationId, hasCredential]);

  // Show CTA if no credential
  if (!hasCredential) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Google Search Console</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Connect Google Search Console to view search performance metrics.
          </p>
          {userRole === "staff" && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
              Connect GSC
            </button>
          )}
          {userRole === "client" && (
            <p className="text-xs text-muted-foreground">
              Contact your account manager to enable this feature.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Google Search Console</h3>
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
          <div className="p-2 rounded-md bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Google Search Console</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Show metrics
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-md bg-primary/10">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Google Search Console</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Impressions */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
          <p className="text-2xl font-bold">{metrics?.impressions.toLocaleString() || 0}</p>
        </div>

        {/* Clicks */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
          <p className="text-2xl font-bold">{metrics?.clicks.toLocaleString() || 0}</p>
        </div>

        {/* CTR */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <p className="text-2xl font-bold">
            {metrics?.ctr ? `${(metrics.ctr * 100).toFixed(1)}%` : "0%"}
          </p>
        </div>

        {/* Position */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Avg Position</p>
          </div>
          <p className="text-2xl font-bold">{metrics?.position.toFixed(1) || "0.0"}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">Last 28 days</p>
      </div>
    </div>
  );
}
