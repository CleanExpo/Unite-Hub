/**
 * SEO Mode Toggle Component
 * Phase 4 Step 5: Design Glow-Up (Iteration 2)
 *
 * Premium animated toggle with:
 * - Sliding indicator with spring physics
 * - Mode-specific gradient backgrounds
 * - Micro-interactions (scale on hover/tap)
 * - Icon rotation animations
 */

"use client";

import { motion } from "framer-motion";
import { Brain, BarChart3 } from "lucide-react";
import type { SeoMode } from "./SeoDashboardShell";
import { springs } from "@/lib/seo/seo-motion";
import { seoTheme } from "@/lib/seo/seo-theme";

interface SeoModeToggleProps {
  mode: SeoMode;
  onModeChange: (mode: SeoMode) => void;
}

export default function SeoModeToggle({ mode, onModeChange }: SeoModeToggleProps) {
  const modeStyles = seoTheme.utils.getModeStyles(mode);

  return (
    <div className="flex items-center gap-3">
      <motion.span
        className="text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={springs.smooth}
      >
        Mode:
      </motion.span>

      <div className="relative inline-flex items-center rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm p-1 shadow-lg">
        {/* Animated Sliding Background */}
        <motion.div
          className={`absolute h-[calc(100%-8px)] rounded-lg shadow-md`}
          style={{
            background: modeStyles.gradient,
            width: "calc(50% - 4px)",
          }}
          initial={false}
          animate={{
            x: mode === "standard" ? 4 : "calc(100% + 4px)",
          }}
          transition={springs.snappy}
        />

        {/* Standard Mode Button */}
        <motion.button
          onClick={() => onModeChange("standard")}
          className={`
            relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              mode === "standard"
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          style={{
            focusRing: modeStyles.accentColor,
          }}
          aria-pressed={mode === "standard"}
          aria-label="Switch to Standard Mode"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{
              rotate: mode === "standard" ? 0 : -10,
              scale: mode === "standard" ? 1 : 0.9,
            }}
            transition={springs.snappy}
          >
            <BarChart3 className="h-4 w-4" />
          </motion.div>
          <span>Standard</span>
        </motion.button>

        {/* Hypnotic Mode Button */}
        <motion.button
          onClick={() => onModeChange("hypnotic")}
          className={`
            relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              mode === "hypnotic"
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          style={{
            focusRing: modeStyles.accentColor,
          }}
          aria-pressed={mode === "hypnotic"}
          aria-label="Switch to Hypnotic Velocity Mode"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{
              rotate: mode === "hypnotic" ? 0 : 10,
              scale: mode === "hypnotic" ? 1 : 0.9,
            }}
            transition={springs.snappy}
          >
            <Brain className="h-4 w-4" />
          </motion.div>
          <span>Hypnotic</span>
        </motion.button>
      </div>
    </div>
  );
}
