/**
 * Design Tokens for Synthex Design System
 *
 * This file defines all design tokens used across the application.
 * Generated from the Synthex Design System specification.
 *
 * @version 1.0.0
 * @updated 2025-11-30
 */

export const designTokens = {
  // Color System
  colors: {
    // Background Colors
    background: {
      base: '#08090a',
      raised: '#0f1012',
      card: '#141517',
      hover: '#1a1b1e',
      input: '#111214',
    },

    // Border Colors
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.14)',
    },

    // Text Colors
    text: {
      primary: '#f8f8f8',
      secondary: '#9ca3af',
      muted: '#6b7280',
    },

    // Accent Colors
    accent: {
      primary: '#ff6b35',
      hover: '#ff7d4d',
      soft: 'rgba(255, 107, 53, 0.12)',
    },

    // Semantic Colors
    semantic: {
      success: '#10b981',
      successSoft: 'rgba(16, 185, 129, 0.12)',
      info: '#3b82f6',
      infoSoft: 'rgba(59, 130, 246, 0.12)',
      warning: '#f59e0b',
      warningSoft: 'rgba(245, 158, 11, 0.12)',
      error: '#ef4444',
      errorSoft: 'rgba(239, 68, 68, 0.12)',
    },
  },

  // Typography
  typography: {
    fontFamilies: {
      display: "'Sora', sans-serif",
      body: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    fontSizes: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '15px',
      lg: '17px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '22px',
      '4xl': '26px',
      '5xl': '32px',
      '6xl': '40px',
      '7xl': '52px',
    },

    lineHeights: {
      tight: 1.1,
      snug: 1.2,
      normal: 1.5,
      relaxed: 1.6,
      loose: 1.7,
    },

    letterSpacing: {
      tighter: '-0.03em',
      tight: '-0.025em',
      normal: '-0.02em',
      wide: '0.01em',
      wider: '0.06em',
      widest: '0.12em',
    },
  },

  // Spacing Scale
  spacing: {
    scale: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '10px',
      4: '12px',
      5: '14px',
      6: '16px',
      7: '18px',
      8: '20px',
      9: '24px',
      10: '28px',
      11: '32px',
      12: '36px',
      13: '40px',
      14: '48px',
      15: '56px',
      16: '64px',
      17: '80px',
      18: '100px',
      19: '120px',
      20: '160px',
    },

    container: {
      maxWidth: '1140px',
      padding: '28px',
    },

    section: {
      paddingY: '120px',
      paddingYMobile: '80px',
    },
  },

  // Border Radius
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '100px',
  },

  // Shadows
  shadows: {
    card: '0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
    button: '0 8px 24px -6px rgba(255, 107, 53, 0.35)',
  },

  // Transitions
  transitions: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    durations: {
      fast: '0.2s',
      normal: '0.28s',
      slow: '0.35s',
      slower: '0.5s',
    },
  },

  // Component-specific tokens
  components: {
    button: {
      variants: {
        primary: {
          background: '#ff6b35',
          color: 'white',
          hoverBackground: '#ff7d4d',
          hoverTransform: 'translateY(-2px)',
          hoverShadow: '0 8px 24px -6px rgba(255, 107, 53, 0.35)',
        },
        secondary: {
          background: '#141517',
          color: '#f8f8f8',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          hoverBackground: '#1a1b1e',
          hoverBorder: '1px solid rgba(255, 255, 255, 0.14)',
        },
      },
      sizes: {
        sm: {
          padding: '10px 20px',
          fontSize: '14px',
        },
        md: {
          padding: '14px 28px',
          fontSize: '15px',
        },
      },
      base: {
        fontWeight: 600,
        borderRadius: '10px',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
      },
    },

    card: {
      base: {
        background: '#141517',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
      },
      hover: {
        borderColor: 'rgba(255, 255, 255, 0.14)',
        transform: 'translateY(-4px)',
      },
      accentBar: {
        height: '3px',
        background: '#ff6b35',
        position: 'top',
        animateOnHover: true,
      },
    },

    input: {
      base: {
        background: '#111214',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        color: '#f8f8f8',
        fontSize: '14px',
      },
      focus: {
        borderColor: '#ff6b35',
        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.12)',
      },
      placeholder: {
        color: '#6b7280',
      },
    },

    badge: {
      variants: {
        success: {
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
        },
        warning: {
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
        },
        accent: {
          background: 'rgba(255, 107, 53, 0.12)',
          color: '#ff6b35',
        },
        neutral: {
          background: '#1a1b1e',
          color: '#6b7280',
        },
      },
      base: {
        padding: '6px 12px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: 600,
      },
    },

    navigation: {
      height: 'auto',
      padding: '18px 0',
      paddingScrolled: '12px 0',
      background: 'rgba(8, 9, 10, 0.85)',
      backgroundScrolled: 'rgba(8, 9, 10, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },

    sidebar: {
      width: '260px',
      background: '#0f1012',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    },

    table: {
      headerBackground: '#0f1012',
      rowHoverBackground: '#1a1b1e',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },

    chart: {
      barGradient: 'linear-gradient(180deg, #ff6b35 0%, rgba(255, 107, 53, 0.3) 100%)',
      barBorderRadius: '4px 4px 0 0',
    },
  },

  // Responsive Breakpoints
  responsive: {
    breakpoints: {
      mobile: '768px',
      tablet: '1024px',
      desktop: '1200px',
    },
  },

  // Accessibility
  accessibility: {
    focusRing: {
      color: '#ff6b35',
      offset: '3px',
      style: '0 0 0 3px rgba(255, 107, 53, 0.12)',
    },
    minimumContrast: '4.5:1',
  },
} as const;

export type DesignTokens = typeof designTokens;
