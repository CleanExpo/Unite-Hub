/**
 * GSC Overview Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 3)
 *
 * Displays Google Search Console metrics with:
 * - Premium animations (fadeScale, slideUp, stagger)
 * - GSC platform-specific blue accent
 * - Glass overlay and backdrop blur
 * - Premium skeleton loaders
 * - Elevated shadows with hover micro-interactions
 *
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, MousePointer, Eye, Target } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

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
      <motion.div
        className={seoTheme.panel.elevated}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={seoTheme.panel.header}>
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("gsc")}`}>
            <Eye className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("gsc")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Google Search Console</h3>
        </div>
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Connect Google Search Console to view search performance metrics.
          </p>
          {userRole === "staff" && (
            <motion.button
              className={seoTheme.button.primary}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Connect GSC
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
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("gsc")}`}>
            <Eye className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("gsc")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Google Search Console</h3>
        </div>

        {/* Premium Skeleton Loader */}
        <div className="space-y-4">
          <motion.div
            className="grid grid-cols-2 gap-4"
            variants={animationPresets.stagger.container}
            initial="hidden"
            animate="visible"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                variants={animationPresets.stagger.item}
                className="space-y-2"
              >
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
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("gsc")}`}>
            <Eye className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("gsc")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Google Search Console</h3>
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

  // Show metrics with premium animations
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
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/5 to-transparent rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("gsc")} ring-2 ring-blue-500/20`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            <Eye className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("gsc")}`} />
          </motion.div>
          <h3 className={seoTheme.panel.title}>Google Search Console</h3>
        </div>
      </div>

      {/* Staggered Metrics Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={animationPresets.stagger.container}
        initial="hidden"
        animate="visible"
      >
        {/* Impressions */}
        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>Impressions</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {metrics?.impressions.toLocaleString() || 0}
          </motion.p>
        </motion.div>

        {/* Clicks */}
        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>Clicks</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {metrics?.clicks.toLocaleString() || 0}
          </motion.p>
        </motion.div>

        {/* CTR */}
        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>CTR</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {metrics?.ctr ? `${(metrics.ctr * 100).toFixed(1)}%` : "0%"}
          </motion.p>
        </motion.div>

        {/* Position */}
        <motion.div variants={animationPresets.stagger.item}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className={seoTheme.metric.label}>Avg Position</p>
          </div>
          <motion.p
            className={seoTheme.metric.value}
            variants={animationPresets.metric}
            initial="hidden"
            animate="visible"
          >
            {metrics?.position.toFixed(1) || "0.0"}
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
        <p className="text-xs text-muted-foreground">Last 28 days</p>
      </motion.div>
    </motion.div>
  );
}
