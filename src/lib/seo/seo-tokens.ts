/**
 * SEO Dashboard Design Tokens
 * Phase 4 Step 5: Design Glow-Up
 *
 * Comprehensive design token system for the Hybrid Bento + Command Center aesthetic.
 * Provides semantic tokens for colors, spacing, typography, shadows, and more.
 */

export const seoTokens = {
  /**
   * Color Palette - Semantic Tokens
   */
  colors: {
    // Backgrounds
    bg: {
      primary: "hsl(var(--background))", // Main background
      secondary: "hsl(220 13% 8%)", // neutral-950
      panel: "hsl(220 13% 10%)", // neutral-900
      hover: "hsl(220 13% 12%)", // Panel hover state
      elevated: "hsl(220 13% 14%)", // Elevated panels
    },

    // Borders
    border: {
      default: "hsl(220 13% 18%)", // neutral-800
      subtle: "hsl(220 13% 15%)",
      strong: "hsl(220 13% 25%)",
      accent: "hsl(217 91% 60%)", // Blue accent
    },

    // Text
    text: {
      primary: "hsl(var(--foreground))",
      secondary: "hsl(220 9% 65%)", // Muted text
      tertiary: "hsl(220 9% 46%)",
      inverse: "hsl(0 0% 100%)",
    },

    // Status Colors
    status: {
      success: {
        bg: "hsl(142 76% 36% / 0.1)",
        text: "hsl(142 76% 50%)",
        border: "hsl(142 76% 40%)",
      },
      warning: {
        bg: "hsl(38 92% 50% / 0.1)",
        text: "hsl(38 92% 60%)",
        border: "hsl(38 92% 50%)",
      },
      error: {
        bg: "hsl(0 84% 60% / 0.1)",
        text: "hsl(0 84% 70%)",
        border: "hsl(0 84% 60%)",
      },
      info: {
        bg: "hsl(217 91% 60% / 0.1)",
        text: "hsl(217 91% 70%)",
        border: "hsl(217 91% 60%)",
      },
    },

    // Platform Colors (for integrations)
    platform: {
      gsc: {
        primary: "hsl(217 89% 61%)", // Google blue
        bg: "hsl(217 89% 61% / 0.1)",
      },
      bing: {
        primary: "hsl(24 100% 50%)", // Bing orange
        bg: "hsl(24 100% 50% / 0.1)",
      },
      brave: {
        primary: "hsl(14 100% 62%)", // Brave orange
        bg: "hsl(14 100% 62% / 0.1)",
      },
    },

    // Mode-specific Colors
    mode: {
      standard: {
        accent: "hsl(217 91% 60%)",
        gradient: "linear-gradient(135deg, hsl(217 91% 60%), hsl(224 76% 48%))",
      },
      hypnotic: {
        accent: "hsl(291 64% 42%)", // Purple
        gradient: "linear-gradient(135deg, hsl(291 64% 42%), hsl(314 100% 47%))",
        glow: "hsl(291 64% 42% / 0.3)",
      },
    },
  },

  /**
   * Spacing Scale (4px base, fluid)
   */
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },

  /**
   * Border Radius (Soft Rounded)
   */
  radius: {
    none: "0",
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },

  /**
   * Shadows (Depth System)
   */
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 hsl(220 13% 5% / 0.05)",
    md: "0 4px 6px -1px hsl(220 13% 5% / 0.1), 0 2px 4px -1px hsl(220 13% 5% / 0.06)",
    lg: "0 10px 15px -3px hsl(220 13% 5% / 0.1), 0 4px 6px -2px hsl(220 13% 5% / 0.05)",
    xl: "0 20px 25px -5px hsl(220 13% 5% / 0.1), 0 10px 10px -5px hsl(220 13% 5% / 0.04)",
    "2xl": "0 25px 50px -12px hsl(220 13% 5% / 0.25)",
    glow: "0 0 20px hsl(217 91% 60% / 0.3)",
    glowHypnotic: "0 0 30px hsl(291 64% 42% / 0.4)",
  },

  /**
   * Typography Scale
   */
  typography: {
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
  },

  /**
   * Animation Timings
   */
  transitions: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  /**
   * Z-Index Scale
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },

  /**
   * Breakpoints (Mobile-first)
   */
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  /**
   * Bento Grid System
   */
  bento: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4,
    },
    gap: {
      mobile: "1rem", // 16px
      tablet: "1.25rem", // 20px
      desktop: "1.5rem", // 24px
    },
    panelMinHeight: "200px",
  },

  /**
   * Command Center Layout
   */
  commandCenter: {
    navWidth: "280px",
    headerHeight: "72px",
    contentMaxWidth: "1600px",
    sidebarWidth: "320px",
  },
} as const;

/**
 * Utility: Get color with opacity
 */
export function colorWithOpacity(color: string, opacity: number): string {
  // If HSL color, add opacity
  if (color.includes("hsl")) {
    return color.replace(")", ` / ${opacity})`).replace("hsl(", "hsl(");
  }
  return color;
}

/**
 * Utility: Get responsive value
 */
export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): { base: T; md?: T; lg?: T } {
  return {
    base: mobile,
    ...(tablet && { md: tablet }),
    ...(desktop && { lg: desktop }),
  };
}

/**
 * Export type for TypeScript autocomplete
 */
export type SeoTokens = typeof seoTokens;
