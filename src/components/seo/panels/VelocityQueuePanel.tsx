/**
 * Velocity Queue Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 5)
 *
 * HYPNOTIC MODE ONLY
 *
 * Displays content velocity queue with:
 * - Purple-pink gradient aesthetic (Hypnotic Velocity Matrix)
 * - Glow effects with shadow-[0_0_30px_rgba(168,85,247,0.35)]
 * - Animated velocity score ring (radial progress)
 * - Staggered queue item cards (50ms delay)
 * - Velocity impact badges with glow on hover
 * - Premium skeleton loaders with neon pulse
 * - 2-column span for prominence
 * - Neuro-retention visual cues (pulse animations)
 *
 * Applies Hypnotic Velocity Matrix principles:
 * - High-frequency publishing visualization
 * - Retention-focused hook scores
 * - Pattern interrupt mechanisms
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Calendar, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

interface VelocityQueuePanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface ContentQueueItem {
  id: string;
  title: string;
  status: "planned" | "in_progress" | "ready" | "published";
  scheduledDate: string;
  hookScore: number; // 0-100
  velocityImpact: "high" | "medium" | "low";
}

export default function VelocityQueuePanel({
  seoProfileId,
  organizationId,
  userRole,
}: VelocityQueuePanelProps) {
  const [queueItems, setQueueItems] = useState<ContentQueueItem[]>([]);
  const [velocityScore, setVelocityScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVelocityQueue() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch content queue
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock queue items
        setQueueItems([
          {
            id: "1",
            title: "7 Signs Your Balustrade Needs Immediate Replacement",
            status: "ready",
            scheduledDate: "2025-01-20",
            hookScore: 87,
            velocityImpact: "high",
          },
          {
            id: "2",
            title: "Modern Glass vs Steel: The 2025 Balustrade Debate",
            status: "in_progress",
            scheduledDate: "2025-01-22",
            hookScore: 72,
            velocityImpact: "high",
          },
          {
            id: "3",
            title: "Brisbane's New Balustrade Safety Standards Explained",
            status: "planned",
            scheduledDate: "2025-01-24",
            hookScore: 65,
            velocityImpact: "medium",
          },
        ]);

        setVelocityScore(3.5); // pieces per week
      } catch (err) {
        console.error("Error fetching velocity queue:", err);
        setError(err instanceof Error ? err.message : "Failed to load velocity queue");
      } finally {
        setLoading(false);
      }
    }

    fetchVelocityQueue();
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
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20">
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className={seoTheme.panel.title}>Content Velocity Queue</h3>
            <div className="h-3 bg-muted/30 rounded animate-pulse w-24 mt-1" />
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
                className="p-4 border border-purple-500/20 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-purple-500/20 rounded animate-pulse w-3/4" />
                  <div className="flex items-center gap-3">
                    <div className="h-3 bg-purple-500/20 rounded animate-pulse w-16" />
                    <div className="h-3 bg-pink-500/20 rounded animate-pulse w-20" />
                  </div>
                  <div className="h-2 bg-purple-500/20 rounded-full animate-pulse" />
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
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20">
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className={seoTheme.panel.title}>Content Velocity Queue</h3>
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

  // Calculate velocity percentage (target: 5.0 pieces/week)
  const velocityPercentage = Math.min((velocityScore / 5.0) * 100, 100);

  // Show velocity queue with Hypnotic Mode aesthetic
  return (
    <motion.div
      className={`${seoTheme.panel.elevated} lg:col-span-2 relative overflow-hidden`}
      variants={animationPresets.panel}
      initial="hidden"
      animate="visible"
      style={{
        boxShadow: "0 0 30px rgba(168, 85, 247, 0.35)",
      }}
      whileHover={{
        boxShadow: "0 0 40px rgba(168, 85, 247, 0.45), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
        transition: { duration: 0.2 },
      }}
    >
      {/* Hypnotic Gradient Panel Header with Glass Overlay */}
      <div className={`${seoTheme.panel.header} relative`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-800/10 rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 ring-2 ring-purple-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={springs.snappy}
              style={{
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
              }}
            >
              <Zap className="h-5 w-5 text-purple-400" />
            </motion.div>
            <div>
              <h3 className={seoTheme.panel.title}>Content Velocity Queue</h3>
              <motion.p
                className="text-xs text-purple-400 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: 0.1 }}
              >
                Publishing at {velocityScore} pieces/week
              </motion.p>
            </div>
          </div>
          {userRole === "staff" && (
            <motion.button
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium shadow-md"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
            >
              Add Content
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Velocity Score Ring */}
      <motion.div
        className="mb-6 p-4 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-purple-800/20 rounded-lg border border-purple-500/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
        style={{
          boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-400 mb-1">Current Velocity</p>
            <motion.p
              className="text-3xl font-bold text-purple-400"
              variants={animationPresets.metric}
              initial="hidden"
              animate="visible"
            >
              {velocityScore} <span className="text-sm font-normal">pieces/week</span>
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-pink-400 mb-1">Target</p>
            <motion.p
              className="text-3xl font-bold text-pink-400"
              variants={animationPresets.metric}
              initial="hidden"
              animate="visible"
            >
              5.0
            </motion.p>
          </div>
        </div>
        {/* Animated Progress Bar with Gradient */}
        <div className="mt-3 h-2 bg-purple-900/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${velocityPercentage}%` }}
            transition={{ ...springs.smooth, delay: 0.2, duration: 0.8 }}
            style={{
              boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
            }}
          />
        </div>
        <motion.p
          className="mt-2 text-xs text-purple-300 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {velocityPercentage.toFixed(0)}% of target velocity
        </motion.p>
      </motion.div>

      {/* Staggered Queue Items */}
      {queueItems.length === 0 ? (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <Zap className="h-12 w-12 text-purple-500/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No content in queue. Add your first piece to start building velocity!
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={animationPresets.stagger.container}
          initial="hidden"
          animate="visible"
        >
          {queueItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={animationPresets.stagger.item}
              className="p-4 border border-purple-500/20 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 transition-all"
              whileHover={{ scale: 1.01, transition: springs.snappy }}
              style={{
                boxShadow: "0 0 15px rgba(168, 85, 247, 0.15)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <motion.span
                      className="flex items-center gap-1"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.smooth, delay: index * 0.05 + 0.1 }}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(item.scheduledDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </motion.span>
                    <motion.span
                      className="flex items-center gap-1"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springs.smooth, delay: index * 0.05 + 0.15 }}
                    >
                      <Clock className="h-3 w-3" />
                      {item.status.replace("_", " ")}
                    </motion.span>
                  </div>
                </div>
                <motion.span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${
                    item.velocityImpact === "high"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : item.velocityImpact === "medium"
                        ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springs.bouncy, delay: index * 0.05 + 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      item.velocityImpact === "high"
                        ? "0 0 15px rgba(168, 85, 247, 0.5)"
                        : "0 0 15px rgba(236, 72, 153, 0.5)",
                  }}
                >
                  {item.velocityImpact} impact
                </motion.span>
              </div>

              {/* Hook Score Progress Bar */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Hook Score</span>
                    <motion.span
                      className="font-medium text-purple-400"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ...springs.bouncy, delay: index * 0.05 + 0.2 }}
                    >
                      {item.hookScore}/100
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-purple-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        item.hookScore >= 80
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : item.hookScore >= 60
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-red-500 to-orange-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.hookScore}%` }}
                      transition={{ ...springs.smooth, delay: index * 0.05 + 0.3, duration: 0.6 }}
                      style={{
                        boxShadow:
                          item.hookScore >= 80
                            ? "0 0 8px rgba(34, 197, 94, 0.5)"
                            : item.hookScore >= 60
                              ? "0 0 8px rgba(234, 179, 8, 0.5)"
                              : "0 0 8px rgba(239, 68, 68, 0.5)",
                      }}
                    />
                  </div>
                </div>
                {item.status === "ready" && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...springs.bouncy, delay: index * 0.05 + 0.3 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Footer with Backdrop Blur */}
      {userRole === "staff" && (
        <motion.div
          className="mt-4 pt-4 border-t border-purple-500/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="text-sm text-purple-400 hover:underline font-medium flex items-center gap-2"
            whileHover={{ x: 5 }}
            transition={springs.snappy}
          >
            <TrendingUp className="h-4 w-4" />
            View Full Content Calendar →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
