/**
 * SEO Dashboard Theme System
 * Phase 4 Step 5: Design Glow-Up
 *
 * Comprehensive theme utilities combining tokens, Tailwind classes, and CSS-in-JS.
 * Provides mode-specific styling (standard vs hypnotic) and semantic component styles.
 */

import { seoTokens } from "./seo-tokens";
import type { SeoMode } from "@/components/seo/SeoDashboardShell";

/**
 * Base Panel Classes (Bento Card)
 */
export const basePanelClasses =
  "relative overflow-hidden rounded-xl border bg-card backdrop-blur-sm transition-all duration-200";

/**
 * Elevated Panel Classes (with shadow)
 */
export const elevatedPanelClasses = `${basePanelClasses} shadow-lg hover:shadow-xl`;

/**
 * Interactive Panel Classes (clickable/hoverable)
 */
export const interactivePanelClasses = `${elevatedPanelClasses} hover:scale-[1.01] cursor-pointer`;

/**
 * Panel Header Classes
 */
export const panelHeaderClasses = "flex items-center gap-3 mb-6";

/**
 * Panel Icon Container Classes
 */
export const panelIconClasses = "p-2.5 rounded-lg transition-colors duration-200";

/**
 * Panel Title Classes
 */
export const panelTitleClasses = "text-lg font-semibold tracking-tight";

/**
 * Panel Subtitle Classes
 */
export const panelSubtitleClasses = "text-sm text-muted-foreground";

/**
 * Metric Value Classes (large numbers)
 */
export const metricValueClasses = "text-3xl font-bold tabular-nums";

/**
 * Metric Label Classes
 */
export const metricLabelClasses = "text-xs text-muted-foreground uppercase tracking-wide";

/**
 * Badge Classes
 */
export const badgeClasses =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors";

/**
 * Button Primary Classes
 */
export const buttonPrimaryClasses =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

/**
 * Button Secondary Classes
 */
export const buttonSecondaryClasses =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

/**
 * Button Ghost Classes
 */
export const buttonGhostClasses =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

/**
 * Input Classes
 */
export const inputClasses =
  "w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";

/**
 * Textarea Classes
 */
export const textareaClasses =
  "w-full px-3 py-2 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";

/**
 * Get Mode-Specific Styles
 */
export function getModeStyles(mode: SeoMode) {
  if (mode === "hypnotic") {
    return {
      accentColor: seoTokens.colors.mode.hypnotic.accent,
      gradient: seoTokens.colors.mode.hypnotic.gradient,
      glowClass: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
      headerGradient: "from-purple-600 to-pink-600",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/20",
    };
  }

  // Standard mode
  return {
    accentColor: seoTokens.colors.mode.standard.accent,
    gradient: seoTokens.colors.mode.standard.gradient,
    glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    headerGradient: "from-blue-600 to-cyan-600",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/20",
  };
}

/**
 * Get Platform-Specific Icon Background
 */
export function getPlatformIconBg(platform: "gsc" | "bing" | "brave"): string {
  const bgMap = {
    gsc: "bg-blue-500/10",
    bing: "bg-orange-500/10",
    brave: "bg-orange-600/10",
  };
  return bgMap[platform];
}

/**
 * Get Platform-Specific Icon Color
 */
export function getPlatformIconColor(platform: "gsc" | "bing" | "brave"): string {
  const colorMap = {
    gsc: "text-blue-400",
    bing: "text-orange-400",
    brave: "text-orange-500",
  };
  return colorMap[platform];
}

/**
 * Get Status Badge Classes
 */
export function getStatusBadgeClasses(
  status: "success" | "warning" | "error" | "info" | "neutral"
): string {
  const baseClasses = badgeClasses;

  const statusClasses = {
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    error: "bg-red-500/10 text-red-400 border border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    neutral: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };

  return `${baseClasses} ${statusClasses[status]}`;
}

/**
 * Get Metric Trend Classes (up, down, neutral)
 */
export function getMetricTrendClasses(trend: "up" | "down" | "neutral"): string {
  const trendClasses = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-muted-foreground",
  };
  return trendClasses[trend];
}

/**
 * Get Progress Bar Classes (with color based on percentage)
 */
export function getProgressBarClasses(percentage: number): string {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 60) return "bg-yellow-500";
  if (percentage >= 40) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get Health Status Classes
 */
export function getHealthStatusClasses(
  health: "good" | "warning" | "critical"
): {
  bg: string;
  text: string;
  icon: string;
} {
  const statusMap = {
    good: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      icon: "text-green-500",
    },
    warning: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      icon: "text-yellow-500",
    },
    critical: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      icon: "text-red-500",
    },
  };
  return statusMap[health];
}

/**
 * Get Velocity Impact Classes
 */
export function getVelocityImpactClasses(impact: "high" | "medium" | "low"): string {
  const impactMap = {
    high: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return `${badgeClasses} border ${impactMap[impact]}`;
}

/**
 * Get Hook Test Status Classes
 */
export function getHookTestStatusClasses(
  status: "winning" | "losing" | "active" | "draft"
): string {
  const statusMap = {
    winning: "bg-green-500/10 text-green-400 border-green-500/20",
    losing: "bg-red-500/10 text-red-400 border-red-500/20",
    active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return `${badgeClasses} border ${statusMap[status]}`;
}

/**
 * Skeleton Loading Classes
 */
export const skeletonClasses = "animate-pulse bg-muted rounded";

/**
 * Divider Classes
 */
export const dividerClasses = "h-px bg-border";

/**
 * Scrollbar Classes (custom)
 */
export const scrollbarClasses =
  "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground";

/**
 * Gradient Text Classes
 */
export const gradientTextClasses = "bg-clip-text text-transparent bg-gradient-to-r";

/**
 * Glass Effect Classes (frosted glass)
 */
export const glassEffectClasses = "backdrop-blur-md bg-background/80 border border-border/50";

/**
 * Command Center Layout Classes
 */
export const commandCenterClasses = {
  nav: "fixed left-0 top-0 h-screen w-[280px] border-r bg-card/50 backdrop-blur-md z-10",
  header: "sticky top-0 z-20 h-[72px] border-b bg-background/80 backdrop-blur-md",
  content: "ml-[280px] min-h-screen",
  main: "container mx-auto px-6 py-8 max-w-[1600px]",
};

/**
 * Bento Grid Classes
 */
export const bentoGridClasses = {
  container: "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  singleCol: "col-span-1",
  doubleCol: "lg:col-span-2",
  tripleCol: "lg:col-span-3",
  tallRow: "row-span-2",
};

/**
 * Export all theme utilities
 */
export const seoTheme = {
  panel: {
    base: basePanelClasses,
    elevated: elevatedPanelClasses,
    interactive: interactivePanelClasses,
    header: panelHeaderClasses,
    icon: panelIconClasses,
    title: panelTitleClasses,
    subtitle: panelSubtitleClasses,
  },
  metric: {
    value: metricValueClasses,
    label: metricLabelClasses,
  },
  button: {
    primary: buttonPrimaryClasses,
    secondary: buttonSecondaryClasses,
    ghost: buttonGhostClasses,
  },
  input: {
    base: inputClasses,
    textarea: textareaClasses,
  },
  badge: badgeClasses,
  skeleton: skeletonClasses,
  divider: dividerClasses,
  scrollbar: scrollbarClasses,
  glass: glassEffectClasses,
  commandCenter: commandCenterClasses,
  bento: bentoGridClasses,
  utils: {
    getModeStyles,
    getPlatformIconBg,
    getPlatformIconColor,
    getStatusBadgeClasses,
    getMetricTrendClasses,
    getProgressBarClasses,
    getHealthStatusClasses,
    getVelocityImpactClasses,
    getHookTestStatusClasses,
  },
} as const;
