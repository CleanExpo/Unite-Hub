/**
 * Keyword Opportunities Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 4)
 *
 * Displays potential keyword opportunities with:
 * - Premium animations (staggered card entrance, 50ms delay)
 * - 2-column span layout for prominence
 * - Platform-neutral yellow accent (opportunity theme)
 * - Animated opportunity cards with hover effects
 * - Type-specific badges (CTR Boost, First Page, Trending)
 * - Glass overlay header with backdrop blur
 * - Premium skeleton loaders
 *
 * Analyzes existing GSC data (no credential required).
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Target, Sparkles } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

interface KeywordOpportunitiesPanelProps {
  seoProfileId: string;
  organizationId: string;
  userRole: UserRole;
}

interface KeywordOpportunity {
  query: string;
  type: "ctr" | "push" | "trending";
  impressions: number;
  clicks: number;
  position: number;
  potential: string;
}

export default function KeywordOpportunitiesPanel({
  seoProfileId,
  organizationId,
  userRole,
}: KeywordOpportunitiesPanelProps) {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKeywordOpportunities() {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to fetch keyword opportunities
        // For Phase 1, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock opportunities
        setOpportunities([
          {
            query: "stainless steel balustrades brisbane",
            type: "push",
            impressions: 1200,
            clicks: 45,
            position: 12.3,
            potential: "Push to page 1",
          },
          {
            query: "glass railing systems",
            type: "ctr",
            impressions: 3400,
            clicks: 85,
            position: 5.2,
            potential: "Improve CTR by 50%+",
          },
          {
            query: "modern balustrade design",
            type: "trending",
            impressions: 890,
            clicks: 78,
            position: 8.1,
            potential: "Growing +45% MoM",
          },
        ]);
      } catch (err) {
        console.error("Error fetching keyword opportunities:", err);
        setError(err instanceof Error ? err.message : "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    }

    fetchKeywordOpportunities();
  }, [seoProfileId, organizationId]);

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
          <div className="p-2.5 rounded-lg bg-yellow-500/10">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className={seoTheme.panel.title}>Keyword Opportunities</h3>
        </div>

        {/* Premium Skeleton Loader */}
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
                className="p-4 border border-border/50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-2/3" />
                  <div className="h-6 bg-muted/30 rounded animate-pulse w-20" />
                </div>
                <div className="h-3 bg-muted/30 rounded animate-pulse w-1/3" />
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-3 bg-muted/40 rounded animate-pulse" />
                      <div className="h-4 bg-muted/30 rounded animate-pulse" />
                    </div>
                  ))}
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
          <div className="p-2.5 rounded-lg bg-yellow-500/10">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className={seoTheme.panel.title}>Keyword Opportunities</h3>
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

  // Show opportunities with premium animations
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
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-400/5 to-transparent rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="p-2.5 rounded-lg bg-yellow-500/10 ring-2 ring-yellow-500/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </motion.div>
          <h3 className={seoTheme.panel.title}>Keyword Opportunities</h3>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No keyword opportunities identified yet. Check back soon!
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={animationPresets.stagger.container}
          initial="hidden"
          animate="visible"
        >
          {opportunities.map((opp, index) => (
            <motion.div
              key={index}
              variants={animationPresets.stagger.item}
              className="p-4 border border-border/50 rounded-lg bg-card hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.01, transition: springs.snappy }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {opp.type === "push" && (
                      <motion.div
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={springs.bouncy}
                      >
                        <Target className="h-4 w-4 text-blue-500" />
                      </motion.div>
                    )}
                    {opp.type === "ctr" && (
                      <motion.div
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={springs.bouncy}
                      >
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </motion.div>
                    )}
                    {opp.type === "trending" && (
                      <motion.div
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={springs.bouncy}
                      >
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </motion.div>
                    )}
                    <h4 className="font-medium text-sm">{opp.query}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{opp.potential}</p>
                </div>
                <motion.span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
                    opp.type === "push"
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                      : opp.type === "ctr"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                        : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springs.bouncy, delay: index * 0.05 + 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {opp.type === "push"
                    ? "First Page"
                    : opp.type === "ctr"
                      ? "CTR Boost"
                      : "Trending"}
                </motion.span>
              </div>
              <motion.div
                className="grid grid-cols-3 gap-4 text-sm"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.smooth, delay: index * 0.05 + 0.15 }}
              >
                <div>
                  <p className={seoTheme.metric.label}>Impressions</p>
                  <p className="font-semibold tabular-nums">{opp.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className={seoTheme.metric.label}>Clicks</p>
                  <p className="font-semibold tabular-nums">{opp.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className={seoTheme.metric.label}>Position</p>
                  <p className="font-semibold tabular-nums">{opp.position.toFixed(1)}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {userRole === "staff" && (
        <motion.div
          className="mt-4 pt-4 border-t border-border/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="text-sm text-primary hover:underline font-medium"
            whileHover={{ x: 5 }}
            transition={springs.snappy}
          >
            View All Opportunities →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
