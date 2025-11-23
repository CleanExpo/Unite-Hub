/**
 * Spacing System
 * Phase 37: UI/UX Polish
 *
 * Standardized spacing tokens for consistent layouts
 */

export const spacing = {
  // Base scale (rem)
  0: "0",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  3.5: "0.875rem",  // 14px
  4: "1rem",        // 16px
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  7: "1.75rem",     // 28px
  8: "2rem",        // 32px
  9: "2.25rem",     // 36px
  10: "2.5rem",     // 40px
  11: "2.75rem",    // 44px
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px
  20: "5rem",       // 80px
  24: "6rem",       // 96px
  28: "7rem",       // 112px
  32: "8rem",       // 128px
  36: "9rem",       // 144px
  40: "10rem",      // 160px
  44: "11rem",      // 176px
  48: "12rem",      // 192px
  52: "13rem",      // 208px
  56: "14rem",      // 224px
  60: "15rem",      // 240px
  64: "16rem",      // 256px
  72: "18rem",      // 288px
  80: "20rem",      // 320px
  96: "24rem",      // 384px
};

// Semantic spacing tokens
export const semanticSpacing = {
  // Page layout
  page: {
    paddingX: {
      mobile: spacing[4],    // 16px
      tablet: spacing[6],    // 24px
      desktop: spacing[8],   // 32px
    },
    paddingY: {
      mobile: spacing[6],    // 24px
      tablet: spacing[8],    // 32px
      desktop: spacing[8],   // 32px
    },
    maxWidth: "1280px",      // max-w-7xl
  },

  // Section spacing
  section: {
    gap: {
      mobile: spacing[6],    // 24px
      desktop: spacing[8],   // 32px
    },
  },

  // Card spacing
  card: {
    padding: {
      mobile: spacing[4],    // 16px
      desktop: spacing[6],   // 24px
    },
    gap: spacing[4],         // 16px
  },

  // Grid gaps
  grid: {
    sm: {
      mobile: spacing[2],    // 8px
      desktop: spacing[3],   // 12px
    },
    md: {
      mobile: spacing[4],    // 16px
      desktop: spacing[6],   // 24px
    },
    lg: {
      mobile: spacing[6],    // 24px
      desktop: spacing[8],   // 32px
    },
  },

  // Component internal spacing
  component: {
    xs: spacing[1],          // 4px
    sm: spacing[2],          // 8px
    md: spacing[3],          // 12px
    lg: spacing[4],          // 16px
    xl: spacing[6],          // 24px
  },

  // Stack spacing (vertical lists)
  stack: {
    xs: spacing[1],          // 4px
    sm: spacing[2],          // 8px
    md: spacing[4],          // 16px
    lg: spacing[6],          // 24px
  },
};

// Border radius tokens
export const borderRadius = {
  none: "0",
  sm: "0.125rem",    // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem",    // 6px
  lg: "0.5rem",      // 8px
  xl: "0.75rem",     // 12px
  "2xl": "1rem",     // 16px
  "3xl": "1.5rem",   // 24px
  full: "9999px",
};

// Safe zones (for chatbot, fixed elements)
export const safeZones = {
  chatbot: {
    mobile: spacing[20],     // 80px bottom
    desktop: spacing[96],    // 384px right
  },
  navbar: spacing[16],       // 64px top
  sidebar: spacing[64],      // 256px left
};

export default spacing;
