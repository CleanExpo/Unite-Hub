/**
 * Design System Tokens
 * Single source of truth for all design values
 */

export const designTokens = {
  colors: {
    // Primary Palette - Unite Teal
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',  // Unite Teal - Primary
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },

    // Secondary Palette - Unite Blue
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb',  // Unite Blue - Secondary
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a5f',
      950: '#172554',
    },

    // Accent Palette - Unite Orange
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f39c12',  // Unite Orange - Accent
      600: '#e67e22',
      700: '#d97706',
      800: '#b45309',
      900: '#92400e',
      950: '#78350f',
    },

    // Semantic Colors
    success: {
      light: '#d1fae5',
      DEFAULT: '#10b981',
      dark: '#059669',
    },
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#dbeafe',
      DEFAULT: '#3b82f6',
      dark: '#2563eb',
    },

    // Neutrals - Gray Scale
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },

    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      dark: '#111827',
      darkSecondary: '#1f2937',
    },

    // Text Colors
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
      link: '#2563eb',
      linkHover: '#1d4ed8',
    },

    // Border Colors
    border: {
      light: '#e5e7eb',
      DEFAULT: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
      '5xl': ['3rem', { lineHeight: '1' }],          // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
      '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
    },

    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  animation: {
    durations: {
      instant: '0ms',
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      slowest: '1000ms',
    },
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
    toast: '1080',
  },
};

// Export individual token groups for convenience
export const { colors, typography, spacing, borderRadius, shadows, animation, breakpoints, zIndex } = designTokens;

// CSS Custom Properties generator
export function generateCSSVariables(): string {
  const lines: string[] = [':root {'];

  // Colors
  for (const [colorName, colorValue] of Object.entries(colors)) {
    if (typeof colorValue === 'object') {
      for (const [shade, value] of Object.entries(colorValue)) {
        if (typeof value === 'string') {
          lines.push(`  --color-${colorName}-${shade}: ${value};`);
        }
      }
    } else {
      lines.push(`  --color-${colorName}: ${colorValue};`);
    }
  }

  // Spacing
  for (const [name, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${name}: ${value};`);
  }

  // Border Radius
  for (const [name, value] of Object.entries(borderRadius)) {
    lines.push(`  --radius-${name}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

export default designTokens;
