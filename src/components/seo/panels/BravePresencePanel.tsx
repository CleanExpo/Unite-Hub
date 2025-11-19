/**
 * Brave Presence Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 3)
 *
 * Displays Brave Creator Console visibility metrics with:
 * - Premium animations (fadeScale, slideUp, stagger)
 * - Brave platform-specific orange-red accent
 * - Glass overlay and backdrop blur
 * - Premium skeleton loaders
 * - Elevated shadows with hover micro-interactions
 * - Status badges with color-coded styling
 *
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp, Users } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

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
      <motion.div
        className={seoTheme.panel.elevated}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={seoTheme.panel.header}>
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("brave")}`}>
            <Shield className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("brave")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Brave Presence</h3>
        </div>
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Connect Brave Creator Console to track your channel visibility.
          </p>
          {userRole === "staff" && (
            <motion.button
              className={seoTheme.button.primary}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Connect Brave
            </motion.button>
          )}
          {userRole === "client" && (
            <p className="text-xs text-muted-foreground">
              Contact your account manager to enable this feature.
            </p>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Show loading state with premium skeleton
  if (loading) {
    return (
      <motion.div
        className={seoTheme.panel.elevated}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
      >
        <div className={seoTheme.panel.header}>
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("brave")}`}>
            <Shield className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("brave")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Brave Presence</h3>
        </div>

        {/* Premium Skeleton Loader */}
        <div className="space-y-4">
          <motion.div
            className="space-y-4"
            variants={animationPresets.stagger.container}
            initial="hidden"
            animate="visible"
          >
            {/* Status skeleton */}
            <motion.div variants={animationPresets.stagger.item} className="space-y-2">
              <div className="h-4 bg-muted/50 rounded animate-pulse w-1/3" />
              <div className="h-6 bg-muted/30 rounded animate-pulse w-1/2" />
            </motion.div>
            {/* Metrics skeletons */}
            {[...Array(2)].map((_, i) => (
              <motion.div key={i} variants={animationPresets.stagger.item} className="space-y-2">
                <div className="h-4 bg-muted/50 rounded animate-pulse" />
                <div className="h-8 bg-muted/30 rounded animate-pulse" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        className={seoTheme.panel.elevated}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
      >
        <div className={seoTheme.panel.header}>
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("brave")}`}>
            <Shield className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("brave")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Brave Presence</h3>
        </div>
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.smooth}
        >
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Show stats with premium animations
  return (
    <motion.div
      className={seoTheme.panel.elevated}
      variants={animationPresets.panel}
      initial="hidden"
      animate="visible"
      whileHover={{
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        transition: { duration: 0.2 }
      }}
    >
      {/* Gradient Panel Header with Glass Overlay */}
      <div className={`${seoTheme.panel.header} relative`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-red-500/5 to-transparent rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("brave")} ring-2 ring-orange-600/20`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            <Shield className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("brave")}`} />
          </motion.div>
          <h3 className={seoTheme.panel.title}>Brave Presence</h3>
        </div>
      </div>

      {/* Animated Channel Status */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Channel Status</span>
          <motion.span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              stats?.channelStatus === "active"
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                : stats?.channelStatus === "pending"
                  ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20"
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.bouncy}
            whileHover={{ scale: 1.05 }}
          >
            {stats?.channelStatus.toUpperCase()}
          </motion.span>
        </div>
      </motion.div>

      {/* Staggered Metrics */}
      <motion.div
        className="space-y-4"
        variants={animationPresets.stagger.container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>Total Contributions (BAT)</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {stats?.totalContributions.toFixed(2) || "0.00"}
          </motion.p>
        </motion.div>

        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>Active Subscribers</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {stats?.activeSubscribers.toLocaleString() || 0}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Footer with Backdrop Blur */}
      <motion.div
        className="mt-4 pt-4 border-t border-border/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </motion.div>
    </motion.div>
  );
}
