/**
 * SEO Dashboard Bento Layout Utilities
 * Phase 4 Step 5: Design Glow-Up
 *
 * Utilities for creating responsive Bento grid layouts with smart panel sizing.
 * Supports 1-3 column layouts with automatic column spanning based on panel importance.
 */

import type { SeoMode, UserRole } from "@/components/seo/SeoDashboardShell";

/**
 * Panel Configuration Type
 */
export interface PanelConfig {
  id: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  colSpan: 1 | 2 | 3; // How many columns to span
  rowSpan?: 1 | 2; // How many rows to span (optional)
  priority: number; // Order priority (lower = earlier)
  visibleFor: UserRole[] | "all"; // Which roles can see this panel
  mode: SeoMode | "both"; // Which mode(s) to show in
}

/**
 * Standard Mode Panel Layouts
 */
export const standardModePanels: Omit<PanelConfig, "props">[] = [
  {
    id: "gsc-overview",
    component: null as any, // Will be set by consumer
    colSpan: 1,
    priority: 1,
    visibleFor: "all",
    mode: "standard",
  },
  {
    id: "bing-indexnow",
    component: null as any,
    colSpan: 1,
    priority: 2,
    visibleFor: "all",
    mode: "standard",
  },
  {
    id: "brave-presence",
    component: null as any,
    colSpan: 1,
    priority: 3,
    visibleFor: "all",
    mode: "standard",
  },
  {
    id: "keyword-opportunities",
    component: null as any,
    colSpan: 2, // Wide panel
    priority: 4,
    visibleFor: "all",
    mode: "standard",
  },
  {
    id: "tech-health",
    component: null as any,
    colSpan: 1,
    priority: 5,
    visibleFor: ["staff"],
    mode: "standard",
  },
];

/**
 * Hypnotic Mode Panel Layouts
 */
export const hypnoticModePanels: Omit<PanelConfig, "props">[] = [
  {
    id: "velocity-queue",
    component: null as any,
    colSpan: 2, // Wide panel
    priority: 1,
    visibleFor: "all",
    mode: "hypnotic",
  },
  {
    id: "hook-lab",
    component: null as any,
    colSpan: 2, // Wide panel
    priority: 2,
    visibleFor: "all",
    mode: "hypnotic",
  },
  {
    id: "gsc-overview",
    component: null as any,
    colSpan: 1,
    priority: 3,
    visibleFor: ["staff"],
    mode: "hypnotic",
  },
  {
    id: "bing-indexnow",
    component: null as any,
    colSpan: 1,
    priority: 4,
    visibleFor: ["staff"],
    mode: "hypnotic",
  },
];

/**
 * Get Column Span Class
 */
export function getColSpanClass(colSpan: 1 | 2 | 3): string {
  const colSpanMap = {
    1: "col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
  };
  return colSpanMap[colSpan];
}

/**
 * Get Row Span Class
 */
export function getRowSpanClass(rowSpan?: 1 | 2): string {
  if (!rowSpan || rowSpan === 1) {
return "";
}
  return "row-span-2";
}

/**
 * Filter Panels by Mode and Role
 */
export function filterPanels(
  panels: Omit<PanelConfig, "props">[],
  mode: SeoMode,
  role: UserRole
): Omit<PanelConfig, "props">[] {
  return panels
    .filter((panel) => {
      // Check mode
      if (panel.mode !== "both" && panel.mode !== mode) {
return false;
}

      // Check role
      if (panel.visibleFor === "all") {
return true;
}
      return panel.visibleFor.includes(role);
    })
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Calculate Grid Template Columns
 */
export function getGridTemplateColumns(maxColumns: 1 | 2 | 3 = 3): string {
  // Mobile: always 1 column
  // Tablet (md): 2 columns
  // Desktop (lg): maxColumns
  return `grid-cols-1 md:grid-cols-2 lg:grid-cols-${maxColumns}`;
}

/**
 * Bento Grid Container Props
 */
export interface BentoGridProps {
  mode: SeoMode;
  role: UserRole;
  className?: string;
}

/**
 * Get Bento Grid Classes
 */
export function getBentoGridClasses({ mode, className = "" }: BentoGridProps): string {
  const baseClasses = "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  const modeClasses = mode === "hypnotic" ? "hypnotic-grid" : "standard-grid";
  return `${baseClasses} ${modeClasses} ${className}`.trim();
}

/**
 * Get Panel Wrapper Classes (with animation support)
 */
export function getPanelWrapperClasses(
  colSpan: 1 | 2 | 3,
  rowSpan?: 1 | 2,
  className = ""
): string {
  const colClass = getColSpanClass(colSpan);
  const rowClass = getRowSpanClass(rowSpan);
  return `${colClass} ${rowClass} ${className}`.trim();
}

/**
 * Responsive Panel Sizing Logic
 */
export function getResponsivePanelSizes(
  totalPanels: number,
  screenSize: "mobile" | "tablet" | "desktop"
): { columns: number; panelsPerRow: number } {
  if (screenSize === "mobile") {
    return { columns: 1, panelsPerRow: 1 };
  }

  if (screenSize === "tablet") {
    return { columns: 2, panelsPerRow: 2 };
  }

  // Desktop - use 3 columns if we have enough panels
  if (totalPanels <= 2) {
    return { columns: 2, panelsPerRow: 2 };
  }

  return { columns: 3, panelsPerRow: 3 };
}

/**
 * Calculate Optimal Panel Distribution
 *
 * Distributes panels across rows to minimize empty space.
 */
export function calculatePanelDistribution(
  panels: Omit<PanelConfig, "props">[],
  maxColumns: number
): Array<Omit<PanelConfig, "props">[]> {
  const rows: Array<Omit<PanelConfig, "props">[]> = [];
  let currentRow: Omit<PanelConfig, "props">[] = [];
  let currentRowSpan = 0;

  panels.forEach((panel) => {
    const panelColSpan = panel.colSpan;

    // If adding this panel would exceed max columns, start new row
    if (currentRowSpan + panelColSpan > maxColumns) {
      rows.push(currentRow);
      currentRow = [panel];
      currentRowSpan = panelColSpan;
    } else {
      currentRow.push(panel);
      currentRowSpan += panelColSpan;
    }
  });

  // Push last row if not empty
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Panel Priority Presets
 */
export const panelPriorities = {
  critical: 1, // Always first (e.g., main metrics)
  high: 2, // Important but not critical
  medium: 3, // Standard panels
  low: 4, // Supplementary panels
  optional: 5, // Can be hidden on mobile
} as const;

/**
 * Breakpoint Detection Helper
 */
export function detectBreakpoint(width: number): "mobile" | "tablet" | "desktop" | "wide" {
  if (width < 768) {
return "mobile";
}
  if (width < 1024) {
return "tablet";
}
  if (width < 1536) {
return "desktop";
}
  return "wide";
}

/**
 * Get Animation Delay for Staggered Entrance
 */
export function getStaggerDelay(index: number, baseDelay: number = 0.05): number {
  return index * baseDelay;
}

/**
 * Panel Aspect Ratios (for maintaining consistent heights)
 */
export const panelAspectRatios = {
  square: "aspect-square", // 1:1
  wide: "aspect-[2/1]", // 2:1
  tall: "aspect-[1/2]", // 1:2
  video: "aspect-video", // 16:9
  standard: "", // No fixed aspect ratio
} as const;

/**
 * Get Min Height Class for Panel
 */
export function getMinHeightClass(variant: "compact" | "standard" | "tall"): string {
  const heightMap = {
    compact: "min-h-[200px]",
    standard: "min-h-[300px]",
    tall: "min-h-[400px]",
  };
  return heightMap[variant];
}

/**
 * Export layout utilities
 */
export const bentoLayout = {
  standardModePanels,
  hypnoticModePanels,
  getColSpanClass,
  getRowSpanClass,
  filterPanels,
  getGridTemplateColumns,
  getBentoGridClasses,
  getPanelWrapperClasses,
  getResponsivePanelSizes,
  calculatePanelDistribution,
  panelPriorities,
  detectBreakpoint,
  getStaggerDelay,
  panelAspectRatios,
  getMinHeightClass,
} as const;
