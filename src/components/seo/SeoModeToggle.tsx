/**
 * SEO Mode Toggle Component
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Accessible toggle switch for switching between:
 * - Standard Mode: Rational SEO analysis
 * - Hypnotic Mode: Content velocity and retention engineering
 */

"use client";

import { Brain, BarChart3 } from "lucide-react";
import type { SeoMode } from "./SeoDashboardShell";

interface SeoModeToggleProps {
  mode: SeoMode;
  onModeChange: (mode: SeoMode) => void;
}

export default function SeoModeToggle({ mode, onModeChange }: SeoModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Mode:</span>
      <div className="inline-flex rounded-md border bg-background p-1">
        <button
          onClick={() => onModeChange("standard")}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${
              mode === "standard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          aria-pressed={mode === "standard"}
          aria-label="Switch to Standard Mode"
        >
          <BarChart3 className="h-4 w-4" />
          Standard
        </button>
        <button
          onClick={() => onModeChange("hypnotic")}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            ${
              mode === "hypnotic"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          aria-pressed={mode === "hypnotic"}
          aria-label="Switch to Hypnotic Velocity Mode"
        >
          <Brain className="h-4 w-4" />
          Hypnotic
        </button>
      </div>
    </div>
  );
}
