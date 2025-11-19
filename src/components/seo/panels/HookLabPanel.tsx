/**
 * Hook Lab Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 5)
 *
 * HYPNOTIC MODE ONLY
 *
 * Hook engineering laboratory with:
 * - Purple-pink gradient aesthetic (lab-style hypnotic theme)
 * - Glow effects with shadow-[0_0_30px_rgba(236,72,153,0.35)]
 * - Lab-style pattern backgrounds
 * - Animated test status badges (winning: green pulse, losing: red flicker)
 * - Staggered hook template cards (50ms delay)
 * - Retention score visualizations with glow
 * - Premium skeleton loaders with neon pulse
 * - 2-column span for prominence
 * - Neuro-retention visual cues
 *
 * Applies Hypnotic Velocity Matrix principles:
 * - First 3-second pattern interrupt testing
 * - Open loop mechanisms analysis
 * - Curiosity gap engineering metrics
 * - Retention optimization tracking
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Beaker, TrendingUp, Target, Sparkles, Zap, Eye } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

interface HookLabPanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface HookTemplate {
  id: string;
  name: string;
  pattern: string;
  retentionScore: number; // 0-100
  testStatus: "active" | "winning" | "losing" | "draft";
  impressions: number;
  avgWatchTime: number; // seconds
}

export default function HookLabPanel({
  seoProfileId,
  organizationId,
  userRole,
}: HookLabPanelProps) {
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHookTemplates() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch hook templates
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock hook templates
        setHooks([
          {
            id: "1",
            name: "The Unexpected Problem",
            pattern: "pattern_interrupt",
            retentionScore: 89,
            testStatus: "winning",
            impressions: 12400,
            avgWatchTime: 47.3,
          },
          {
            id: "2",
            name: "The Curiosity Gap",
            pattern: "open_loop",
            retentionScore: 76,
            testStatus: "active",
            impressions: 8900,
            avgWatchTime: 38.2,
          },
          {
            id: "3",
            name: "The Bold Claim",
            pattern: "controversy",
            retentionScore: 82,
            testStatus: "active",
            impressions: 10200,
            avgWatchTime: 41.8,
          },
        ]);
      } catch (err) {
        console.error("Error fetching hook templates:", err);
        setError(err instanceof Error ? err.message : "Failed to load hook templates");
      } finally {
        setLoading(false);
      }
    }

    fetchHookTemplates();
  }, [seoProfileId, organizationId]);

  // Show loading state with premium neon skeleton
  if (loading) {
    return (
      <motion.div
        className={`${seoTheme.panel.elevated} lg:col-span-2`}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
      >
        <div className={seoTheme.panel.header}>
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20">
            <Beaker className="h-5 w-5 text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className={seoTheme.panel.title}>Hook Engineering Lab</h3>
            <div className="h-3 bg-muted/30 rounded animate-pulse w-32 mt-1" />
          </div>
        </div>

        {/* Premium Neon Skeleton Loader */}
        <div className="space-y-3">
          <motion.div
            className="space-y-3"
            variants={animationPresets.stagger.container}
            initial="hidden"
            animate="visible"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                variants={animationPresets.stagger.item}
                className="p-4 border border-pink-500/20 rounded-lg bg-gradient-to-r from-pink-500/5 to-purple-500/5"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-pink-500/20 rounded animate-pulse w-1/2" />
                    <div className="h-6 bg-pink-500/20 rounded-full animate-pulse w-16" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-3 bg-pink-500/20 rounded animate-pulse" />
                        <div className="h-5 bg-purple-500/20 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-pink-500/20 rounded-full animate-pulse" />
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
        className={`${seoTheme.panel.elevated} lg:col-span-2`}
        variants={animationPresets.panel}
        initial="hidden"
        animate="visible"
      >
        <div className={seoTheme.panel.header}>
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20">
            <Beaker className="h-5 w-5 text-pink-400" />
          </div>
          <h3 className={seoTheme.panel.title}>Hook Engineering Lab</h3>
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

  // Show hook lab with Hypnotic Mode aesthetic
  return (
    <motion.div
      className={`${seoTheme.panel.elevated} lg:col-span-2 relative overflow-hidden`}
      variants={animationPresets.panel}
      initial="hidden"
      animate="visible"
      style={{
        boxShadow: "0 0 30px rgba(236, 72, 153, 0.35)",
      }}
      whileHover={{
        boxShadow: "0 0 40px rgba(236, 72, 153, 0.45), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
        transition: { duration: 0.2 },
      }}
    >
      {/* Lab-Style Pattern Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(236, 72, 153, 0.1) 35px, rgba(236, 72, 153, 0.1) 70px)",
        }}
      />

      {/* Hypnotic Gradient Panel Header with Glass Overlay */}
      <div className={`${seoTheme.panel.header} relative`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-pink-800/10 rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2.5 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20 ring-2 ring-pink-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={springs.snappy}
              style={{
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)",
              }}
            >
              <Beaker className="h-5 w-5 text-pink-400" />
            </motion.div>
            <div>
              <h3 className={seoTheme.panel.title}>Hook Engineering Lab</h3>
              <motion.p
                className="text-xs text-pink-400 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: 0.1 }}
              >
                A/B testing retention mechanisms
              </motion.p>
            </div>
          </div>
          {userRole === "staff" && (
            <motion.button
              className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg text-sm font-medium shadow-md"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
            >
              New Hook
            </motion.button>
          )}
        </div>
      </div>

      {/* Hook Pattern Guide with Glow */}
      <motion.div
        className="mb-6 p-4 bg-gradient-to-br from-pink-600/20 via-purple-600/10 to-pink-800/20 rounded-lg border border-pink-500/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
        style={{
          boxShadow: "0 0 20px rgba(236, 72, 153, 0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springs.bouncy}
          >
            <Sparkles className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="text-sm">
            <p className="font-medium text-pink-400 mb-1">Hook Patterns in Use</p>
            <ul className="text-xs text-pink-300 space-y-1">
              <li>• Pattern Interrupt: Unexpected opening that breaks scroll</li>
              <li>• Open Loop: Create curiosity gap that demands resolution</li>
              <li>• Controversy: Bold claim that triggers engagement</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Staggered Hook Templates */}
      {hooks.length === 0 ? (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <Beaker className="h-12 w-12 text-pink-500/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No hook templates yet. Create your first hook to start optimizing retention!
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={animationPresets.stagger.container}
          initial="hidden"
          animate="visible"
        >
          {hooks.map((hook, index) => (
            <motion.div
              key={hook.id}
              variants={animationPresets.stagger.item}
              className="p-4 border border-pink-500/20 rounded-lg bg-gradient-to-r from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 transition-all relative"
              whileHover={{ scale: 1.01, transition: springs.snappy }}
              style={{
                boxShadow:
                  hook.testStatus === "winning"
                    ? "0 0 20px rgba(34, 197, 94, 0.3)"
                    : "0 0 15px rgba(236, 72, 153, 0.15)",
              }}
            >
              {/* Winning Hook Glow Pulse */}
              {hook.testStatus === "winning" && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-green-500/5"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{hook.name}</h4>
                    <motion.span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        hook.testStatus === "winning"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : hook.testStatus === "losing"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : hook.testStatus === "active"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ...springs.bouncy, delay: index * 0.05 + 0.1 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow:
                          hook.testStatus === "winning"
                            ? "0 0 15px rgba(34, 197, 94, 0.6)"
                            : hook.testStatus === "losing"
                              ? "0 0 15px rgba(239, 68, 68, 0.6)"
                              : "0 0 15px rgba(59, 130, 246, 0.6)",
                      }}
                    >
                      {hook.testStatus}
                    </motion.span>
                  </div>
                  <motion.p
                    className="text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                  >
                    Pattern: {hook.pattern.replace("_", " ")}
                  </motion.p>
                </div>
              </div>

              {/* Animated Metrics Grid */}
              <motion.div
                className="grid grid-cols-3 gap-4 mb-3 relative z-10"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: index * 0.05 + 0.2 }}
              >
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="h-3 w-3 text-pink-400" />
                    <p className="text-xs text-muted-foreground">Retention</p>
                  </div>
                  <motion.p
                    className="text-lg font-bold text-pink-400"
                    variants={animationPresets.metric}
                    initial="hidden"
                    animate="visible"
                  >
                    {hook.retentionScore}%
                  </motion.p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Eye className="h-3 w-3 text-purple-400" />
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <motion.p
                    className="text-lg font-bold text-purple-400"
                    variants={animationPresets.metric}
                    initial="hidden"
                    animate="visible"
                  >
                    {hook.impressions.toLocaleString()}
                  </motion.p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-pink-400" />
                    <p className="text-xs text-muted-foreground">Avg Watch</p>
                  </div>
                  <motion.p
                    className="text-lg font-bold text-pink-400"
                    variants={animationPresets.metric}
                    initial="hidden"
                    animate="visible"
                  >
                    {hook.avgWatchTime}s
                  </motion.p>
                </div>
              </motion.div>

              {/* Animated Retention Bar */}
              <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1">
                  <div className="h-1.5 bg-pink-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        hook.retentionScore >= 80
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : hook.retentionScore >= 60
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-red-500 to-orange-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${hook.retentionScore}%` }}
                      transition={{ ...springs.smooth, delay: index * 0.05 + 0.3, duration: 0.6 }}
                      style={{
                        boxShadow:
                          hook.retentionScore >= 80
                            ? "0 0 8px rgba(34, 197, 94, 0.6)"
                            : hook.retentionScore >= 60
                              ? "0 0 8px rgba(234, 179, 8, 0.6)"
                              : "0 0 8px rgba(239, 68, 68, 0.6)",
                      }}
                    />
                  </div>
                </div>
                {userRole === "staff" && (
                  <motion.button
                    className="text-xs text-pink-400 hover:underline font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Footer with Backdrop Blur */}
      {userRole === "staff" && (
        <motion.div
          className="mt-4 pt-4 border-t border-pink-500/20 backdrop-blur-sm relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="text-sm text-pink-400 hover:underline font-medium flex items-center gap-2"
            whileHover={{ x: 5 }}
            transition={springs.snappy}
          >
            <Zap className="h-4 w-4" />
            View Hook Analytics Dashboard →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
