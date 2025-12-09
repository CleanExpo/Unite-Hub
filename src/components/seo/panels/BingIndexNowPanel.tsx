/**
 * Bing IndexNow Panel
 * Phase 4 Step 5: Design Glow-Up (Iteration 3)
 *
 * Displays Bing IndexNow status with:
 * - Premium animations (fadeScale, slideUp)
 * - Bing platform-specific orange accent
 * - Glass overlay and backdrop blur
 * - Premium form styling
 * - Elevated shadows with hover micro-interactions
 *
 * Allows URL submission for instant indexing (staff only).
 * Gracefully handles missing credentials with CTA.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Check, Clock, AlertCircle } from "lucide-react";
import type { UserRole } from "../SeoDashboardShell";
import { seoTheme } from "@/lib/seo/seo-theme";
import { animationPresets, springs } from "@/lib/seo/seo-motion";

interface BingIndexNowPanelProps {
  seoProfileId: string;
  organizationId: string;
  hasCredential: boolean;
  userRole: UserRole;
}

export default function BingIndexNowPanel({
  seoProfileId,
  organizationId,
  hasCredential,
  userRole,
}: BingIndexNowPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSubmitUrls() {
    if (!urlInput.trim() || !hasCredential) {
return;
}

    setSubmitting(true);
    setSubmitResult(null);

    try {
      // Split URLs by newline, trim, and filter empty
      const urls = urlInput
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urls.length === 0) {
        throw new Error("Please enter at least one URL");
      }

      const response = await fetch("/api/seo/bing/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seo_profile_id: seoProfileId,
          organization_id: organizationId,
          urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit URLs");
      }

      const result = await response.json();
      setSubmitResult({
        success: true,
        message: `Successfully submitted ${urls.length} URL(s) to Bing IndexNow`,
      });
      setUrlInput("");
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to submit URLs",
      });
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("bing")}`}>
            <Zap className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("bing")}`} />
          </div>
          <h3 className={seoTheme.panel.title}>Bing IndexNow</h3>
        </div>
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Connect Bing Webmaster to submit URLs for instant indexing.
          </p>
          {userRole === "staff" && (
            <motion.button
              className={seoTheme.button.primary}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Connect Bing
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

  // Show panel with submission form (staff only) or status view (client)
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
          className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent rounded-t-xl opacity-50"
          style={{ backdropFilter: "blur(8px)" }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className={`${seoTheme.panel.icon} ${seoTheme.utils.getPlatformIconBg("bing")} ring-2 ring-orange-500/20`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            <Zap className={`h-5 w-5 ${seoTheme.utils.getPlatformIconColor("bing")}`} />
          </motion.div>
          <h3 className={seoTheme.panel.title}>Bing IndexNow</h3>
        </div>
      </div>

      {userRole === "staff" ? (
        <>
          {/* Premium URL Submission Form */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.1 }}
          >
            <label htmlFor="url-input" className="block text-sm font-medium mb-2">
              Submit URLs for Instant Indexing
            </label>
            <motion.textarea
              id="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/page1&#10;https://example.com/page2&#10;(one URL per line)"
              className="w-full h-24 px-3 py-2 bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
              disabled={submitting}
              whileFocus={{ scale: 1.01 }}
              transition={springs.snappy}
            />
          </motion.div>

          <motion.button
            onClick={handleSubmitUrls}
            disabled={submitting || !urlInput.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(255, 127, 0, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snappy}
          >
            {submitting ? "Submitting..." : "Submit to Bing"}
          </motion.button>

          {/* Animated Submit Result */}
          {submitResult && (
            <motion.div
              className={`mt-4 p-3 rounded-lg text-sm border ${
                submitResult.success
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
              }`}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springs.bouncy}
            >
              <div className="flex items-start gap-2">
                {submitResult.success ? (
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <p>{submitResult.message}</p>
              </div>
            </motion.div>
          )}

          {/* Animated Status Summary */}
          <motion.div
            className="mt-6 pt-4 border-t border-border/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground mb-3">Recent Activity</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitted Today</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Client View: Animated Status Only */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.1 }}
          >
            <motion.div
              className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20"
              whileHover={{ scale: 1.02 }}
              transition={springs.snappy}
            >
              <Check className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">IndexNow Active</p>
                <p className="text-xs text-muted-foreground">
                  Your pages are being submitted for instant indexing
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.smooth, delay: 0.2 }}
              >
                <p className={seoTheme.metric.label}>This Week</p>
                <p className={seoTheme.metric.value}>-</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springs.smooth, delay: 0.25 }}
              >
                <p className={seoTheme.metric.label}>This Month</p>
                <p className={seoTheme.metric.value}>-</p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
