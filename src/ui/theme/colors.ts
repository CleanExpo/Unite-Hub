/**
 * Color System
 * Phase 37: UI/UX Polish
 *
 * Standardized color tokens for consistent theming
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    teal: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6",
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: "#dcfce7",
      DEFAULT: "#22c55e",
      dark: "#15803d",
    },
    warning: {
      light: "#fef3c7",
      DEFAULT: "#f59e0b",
      dark: "#b45309",
    },
    error: {
      light: "#fee2e2",
      DEFAULT: "#ef4444",
      dark: "#b91c1c",
    },
    info: {
      light: "#dbeafe",
      DEFAULT: "#3b82f6",
      dark: "#1d4ed8",
    },
  },

  // UI Colors
  ui: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: "hsl(var(--card))",
    cardForeground: "hsl(var(--card-foreground))",
    border: "hsl(var(--border))",
    muted: "hsl(var(--muted))",
    mutedForeground: "hsl(var(--muted-foreground))",
  },

  // Status Colors (for badges, indicators)
  status: {
    pending: "#f59e0b",
    inProgress: "#3b82f6",
    complete: "#22c55e",
    rejected: "#ef4444",
    planned: "#8b5cf6",
    testing: "#f97316",
    available: "#14b8a6",
  },

  // Chart Colors
  chart: {
    primary: "#14b8a6",
    secondary: "#3b82f6",
    tertiary: "#8b5cf6",
    quaternary: "#f59e0b",
    quinary: "#ef4444",
  },
};

// CSS variable mappings for Tailwind
export const cssVariables = {
  "--color-brand-primary": colors.brand.teal[600],
  "--color-brand-secondary": colors.brand.teal[500],
  "--color-success": colors.semantic.success.DEFAULT,
  "--color-warning": colors.semantic.warning.DEFAULT,
  "--color-error": colors.semantic.error.DEFAULT,
  "--color-info": colors.semantic.info.DEFAULT,
};

export default colors;
