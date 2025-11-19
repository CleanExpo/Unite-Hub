/**
 * Technical Health Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 4)
 *
 * Displays technical SEO health metrics with:
 * - Premium animations (staggered health checks, 50ms delay)
 * - Animated health score badge (color-coded: good/warning/critical)
 * - Progress bar with spring physics animation
 * - Health check cards with status icons
 * - Staff-only visibility enforcement
 * - Glass overlay header with backdrop blur
 * - Premium skeleton loaders
 *
 * Staff-only summary panel with drill-down capability.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

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
          <div className="p-2.5 rounded-lg bg-green-500/10">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className={seoTheme.panel.title}>Technical Health</h3>
            <div className="h-3 bg-muted/30 rounded animate-pulse w-16 mt-1" />
          </div>
        </div>

        {/* Premium Skeleton Loader */}
        <div className="space-y-3">
          <motion.div
            className="space-y-3"
            variants={animationPresets.stagger.container}
            initial="hidden"
            animate="visible"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                variants={animationPresets.stagger.item}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-5 w-5 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted/40 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
                  </div>
                </div>
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
          <div className="p-2.5 rounded-lg bg-green-500/10">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <h3 className={seoTheme.panel.title}>Technical Health</h3>
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

  // Get health status utilities
  const healthStyles = seoTheme.utils.getHealthStatusClasses(
    metrics?.overallHealth === "good"
      ? "good"
      : metrics?.overallHealth === "warning"
        ? "warning"
        : "critical"
  );

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
          className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-400/5 to-transparent rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className={`p-2.5 rounded-lg ${healthStyles.bg} ring-2 ${healthStyles.ring || 'ring-green-500/20'}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            <Activity className={`h-5 w-5 ${healthStyles.text}`} />
          </motion.div>
          <div className="flex-1">
            <h3 className={seoTheme.panel.title}>Technical Health</h3>
            <motion.p
              className={`text-sm ${healthStyles.text} font-semibold capitalize`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.bouncy}
            >
              {metrics?.overallHealth}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Staggered Health Checks */}
      <motion.div
        className="space-y-3"
        variants={animationPresets.stagger.container}
        initial="hidden"
        animate="visible"
      >
        {/* Indexing Status with Progress Bar */}
        <motion.div
          variants={animationPresets.stagger.item}
          className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={springs.snappy}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={springs.bouncy}
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-medium">Indexing</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.indexedPages}/{metrics?.totalPages} pages
                </p>
              </div>
            </div>
            <motion.span
              className="text-xs font-semibold text-green-700 dark:text-green-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springs.bouncy, delay: 0.1 }}
            >
              {metrics?.indexedPages && metrics?.totalPages
                ? `${((metrics.indexedPages / metrics.totalPages) * 100).toFixed(0)}%`
                : "0%"}
            </motion.span>
          </div>
          {/* Animated Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{
                width: metrics?.indexedPages && metrics?.totalPages
                  ? `${(metrics.indexedPages / metrics.totalPages) * 100}%`
                  : "0%"
              }}
              transition={{ ...springs.smooth, delay: 0.2, duration: 0.8 }}
            />
          </div>
        </motion.div>

        {/* Crawl Errors */}
        <motion.div
          variants={animationPresets.stagger.item}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={springs.snappy}
        >
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.bouncy}
            >
              {(metrics?.crawlErrors || 0) > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-medium">Crawl Errors</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.crawlErrors || 0} errors detected
              </p>
            </div>
          </div>
          {(metrics?.crawlErrors || 0) > 0 && (
            <motion.button
              className="text-xs text-primary hover:underline font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Fix
            </motion.button>
          )}
        </motion.div>

        {/* Mobile Usability */}
        <motion.div
          variants={animationPresets.stagger.item}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={springs.snappy}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.bouncy}
            >
              {metrics?.mobileUsability === "pass" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-medium">Mobile Usability</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.mobileUsability === "pass" ? "All checks passed" : "Issues found"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Core Web Vitals */}
        <motion.div
          variants={animationPresets.stagger.item}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={springs.snappy}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.bouncy}
            >
              {metrics?.coreWebVitals === "pass" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-medium">Core Web Vitals</p>
              <p className="text-xs text-muted-foreground">
                {metrics?.coreWebVitals === "pass" ? "Good performance" : "Needs improvement"}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer with Backdrop Blur */}
      <motion.div
        className="mt-4 pt-4 border-t border-border/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          className="text-sm text-primary hover:underline font-medium"
          whileHover={{ x: 5 }}
          transition={springs.snappy}
        >
          View Full Report →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
