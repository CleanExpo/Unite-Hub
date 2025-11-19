/**
 * Brave Presence Panel
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Displays Brave Creator Console visibility metrics:
 * - Channel status
 * - BAT contributions
 * - Creator stats
 *
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState, useEffect } from "react";
import { Shield, TrendingUp, Users } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";

interface BravePresencePanelProps {
  seoProfileId: string;
  organizationId: string;
  hasCredential: boolean;
  userRole: UserRole;
}

interface BraveStats {
  channelStatus: "active" | "pending" | "inactive";
  totalContributions: number;
  activeSubscribers: number;
}

export default function BravePresencePanel({
  seoProfileId,
  organizationId,
  hasCredential,
  userRole,
}: BravePresencePanelProps) {
  const [stats, setStats] = useState<BraveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBraveStats() {
      if (!hasCredential) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // TODO: Replace with actual channel_id from SEO profile
        const channelId = "placeholder-channel-id";

        const response = await fetch("/api/seo/brave/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seo_profile_id: seoProfileId,
            organization_id: organizationId,
            channel_id: channelId,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Brave stats: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setStats({
            channelStatus: result.data.status || "inactive",
            totalContributions: result.data.total_contributions || 0,
            activeSubscribers: result.data.active_subscribers || 0,
          });
        } else {
          setStats({
            channelStatus: "inactive",
            totalContributions: 0,
            activeSubscribers: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching Brave stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load Brave stats");
      } finally {
        setLoading(false);
      }
    }

    fetchBraveStats();
  }, [seoProfileId, organizationId, hasCredential]);

  // Show CTA if no credential
  if (!hasCredential) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-orange-500/10">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold">Brave Presence</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Connect Brave Creator Console to track your channel visibility.
          </p>
          {userRole === "staff" && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
              Connect Brave
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
          <div className="p-2 rounded-md bg-orange-500/10">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold">Brave Presence</h3>
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
          <div className="p-2 rounded-md bg-orange-500/10">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold">Brave Presence</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Show stats
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-md bg-orange-500/10">
          <Shield className="h-5 w-5 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold">Brave Presence</h3>
      </div>

      {/* Channel Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Channel Status</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              stats?.channelStatus === "active"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : stats?.channelStatus === "pending"
                  ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
            }`}
          >
            {stats?.channelStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Contributions (BAT)</p>
          </div>
          <p className="text-2xl font-bold">{stats?.totalContributions.toFixed(2) || "0.00"}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Active Subscribers</p>
          </div>
          <p className="text-2xl font-bold">{stats?.activeSubscribers.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </div>
    </div>
  );
}
