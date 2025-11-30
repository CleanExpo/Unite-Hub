/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors - Synthex Design System
      colors: {
        // Background
        'bg-base': '#08090a',
        'bg-raised': '#0f1012',
        'bg-card': '#141517',
        'bg-hover': '#1a1b1e',
        'bg-input': '#111214',

        // Text
        'text-primary': '#f8f8f8',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',

        // Accent (Primary Brand Color)
        'accent': {
          50: 'rgba(255, 107, 53, 0.08)',
          100: 'rgba(255, 107, 53, 0.12)',
          200: 'rgba(255, 107, 53, 0.2)',
          300: '#ff8860',
          400: '#ff7d4d',
          500: '#ff6b35',
          600: '#ff5c1a',
          700: '#e85a1a',
          800: '#cc4f15',
          900: '#994012',
        },

        // Semantic
        'success': {
          50: 'rgba(16, 185, 129, 0.08)',
          100: 'rgba(16, 185, 129, 0.12)',
          500: '#10b981',
        },
        'warning': {
          50: 'rgba(245, 158, 11, 0.08)',
          100: 'rgba(245, 158, 11, 0.12)',
          500: '#f59e0b',
        },
        'info': {
          50: 'rgba(59, 130, 246, 0.08)',
          100: 'rgba(59, 130, 246, 0.12)',
          500: '#3b82f6',
        },
        'error': {
          50: 'rgba(239, 68, 68, 0.08)',
          100: 'rgba(239, 68, 68, 0.12)',
          500: '#ef4444',
        },

        // Border
        'border-subtle': 'rgba(255, 255, 255, 0.08)',
        'border-medium': 'rgba(255, 255, 255, 0.14)',
      },

      // Typography
      fontFamily: {
        display: "'Sora', sans-serif",
        body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },

      fontSize: {
        xs: ['11px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        sm: ['12px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        base: ['14px', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        md: ['15px', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        lg: ['17px', { lineHeight: '1.6', letterSpacing: '-0.02em' }],
        xl: ['18px', { lineHeight: '1.6', letterSpacing: '-0.025em' }],
        '2xl': ['20px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '3xl': ['22px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '4xl': ['26px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '5xl': ['32px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '6xl': ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '7xl': ['52px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },

      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },

      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.025em',
        normal: '-0.02em',
        wide: '0.01em',
        wider: '0.06em',
        widest: '0.12em',
      },

      // Spacing
      spacing: {
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

      // Border Radius
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        full: '100px',
      },

      // Shadows
      boxShadow: {
        card: '0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
        'button-primary': '0 8px 24px -6px rgba(255, 107, 53, 0.35)',
      },

      // Transitions
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        fast: '0.2s',
        normal: '0.28s',
        slow: '0.35s',
        slower: '0.5s',
      },

      // Max Width (Container)
      maxWidth: {
        container: '1140px',
      },

      // Gradients
      backgroundImage: {
        'chart-bar': 'linear-gradient(180deg, #ff6b35 0%, rgba(255, 107, 53, 0.3) 100%)',
      },
    },
  },
  plugins: [],
}
