/**
 * Shadows System
 * Phase 37: UI/UX Polish
 *
 * Standardized shadow tokens for depth and elevation
 */

export const shadows = {
  // Standard shadows
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
};

// Semantic shadow tokens
export const semanticShadows = {
  // Cards and panels
  card: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.lg,
  },

  // Modals and dialogs
  modal: shadows.xl,
  dialog: shadows.lg,

  // Dropdowns and popovers
  dropdown: shadows.lg,
  popover: shadows.md,
  tooltip: shadows.sm,

  // Navigation
  navbar: shadows.sm,
  sidebar: shadows.md,

  // Buttons
  button: {
    rest: shadows.sm,
    hover: shadows.DEFAULT,
    active: shadows.inner,
  },

  // Inputs
  input: {
    focus: "0 0 0 2px hsl(var(--ring))",
  },
};

// Colored shadows (for brand elements)
export const coloredShadows = {
  teal: {
    sm: "0 1px 2px 0 rgb(20 184 166 / 0.2)",
    DEFAULT: "0 4px 6px -1px rgb(20 184 166 / 0.25)",
    lg: "0 10px 15px -3px rgb(20 184 166 / 0.3)",
  },
  blue: {
    sm: "0 1px 2px 0 rgb(59 130 246 / 0.2)",
    DEFAULT: "0 4px 6px -1px rgb(59 130 246 / 0.25)",
    lg: "0 10px 15px -3px rgb(59 130 246 / 0.3)",
  },
  purple: {
    sm: "0 1px 2px 0 rgb(139 92 246 / 0.2)",
    DEFAULT: "0 4px 6px -1px rgb(139 92 246 / 0.25)",
    lg: "0 10px 15px -3px rgb(139 92 246 / 0.3)",
  },
};

// Dark mode shadows (more subtle)
export const darkShadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
};

// Tailwind class mappings
export const shadowClasses = {
  card: "shadow-sm hover:shadow-md transition-shadow",
  cardActive: "shadow-lg",
  modal: "shadow-xl",
  dropdown: "shadow-lg",
  button: "shadow-sm hover:shadow active:shadow-inner",
  input: "focus:ring-2 focus:ring-ring",
};

export default shadows;
