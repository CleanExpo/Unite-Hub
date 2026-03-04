import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      /* ----------------------------------------
         COLORS
         ---------------------------------------- */
      colors: {
        // Base shadcn tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // Brand color scales
        brand: {
          primary: {
            DEFAULT: 'hsl(var(--brand-primary))',
            50: 'hsl(var(--brand-primary-50))',
            100: 'hsl(var(--brand-primary-100))',
            200: 'hsl(var(--brand-primary-200))',
            300: 'hsl(var(--brand-primary-300))',
            400: 'hsl(var(--brand-primary-400))',
            500: 'hsl(var(--brand-primary-500))',
            600: 'hsl(var(--brand-primary-600))',
            700: 'hsl(var(--brand-primary-700))',
            800: 'hsl(var(--brand-primary-800))',
            900: 'hsl(var(--brand-primary-900))',
            950: 'hsl(var(--brand-primary-950))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--brand-secondary))',
            50: 'hsl(var(--brand-secondary-50))',
            100: 'hsl(var(--brand-secondary-100))',
            200: 'hsl(var(--brand-secondary-200))',
            300: 'hsl(var(--brand-secondary-300))',
            400: 'hsl(var(--brand-secondary-400))',
            500: 'hsl(var(--brand-secondary-500))',
            600: 'hsl(var(--brand-secondary-600))',
            700: 'hsl(var(--brand-secondary-700))',
            800: 'hsl(var(--brand-secondary-800))',
            900: 'hsl(var(--brand-secondary-900))',
            950: 'hsl(var(--brand-secondary-950))',
          },
          accent: {
            DEFAULT: 'hsl(var(--brand-accent))',
            50: 'hsl(var(--brand-accent-50))',
            100: 'hsl(var(--brand-accent-100))',
            200: 'hsl(var(--brand-accent-200))',
            300: 'hsl(var(--brand-accent-300))',
            400: 'hsl(var(--brand-accent-400))',
            500: 'hsl(var(--brand-accent-500))',
            600: 'hsl(var(--brand-accent-600))',
            700: 'hsl(var(--brand-accent-700))',
            800: 'hsl(var(--brand-accent-800))',
            900: 'hsl(var(--brand-accent-900))',
            950: 'hsl(var(--brand-accent-950))',
          },
        },

        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          muted: 'hsl(var(--success-muted))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          muted: 'hsl(var(--warning-muted))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
          muted: 'hsl(var(--error-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          muted: 'hsl(var(--info-muted))',
        },

        // Surface colors
        surface: {
          elevated: 'hsl(var(--surface-elevated))',
          recessed: 'hsl(var(--surface-recessed))',
          overlay: 'hsl(var(--surface-overlay))',
        },
      },

      /* ----------------------------------------
         BORDER RADIUS
         ---------------------------------------- */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },

      /* ----------------------------------------
         BOX SHADOW
         ---------------------------------------- */
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        glow: 'var(--shadow-glow)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },

      /* ----------------------------------------
         ANIMATIONS
         ---------------------------------------- */
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        // Accordion animations from shadcn
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Elite Status Command Centre Animations
        'status-glow-pulse': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 8px hsl(var(--status-glow) / 0.4))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 20px hsl(var(--status-glow) / 0.6))',
          },
        },
        'ring-progress': {
          from: { strokeDashoffset: 'var(--ring-circumference, 283)' },
          to: { strokeDashoffset: 'var(--ring-offset, 0)' },
        },
        'orb-rotate': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'thinking-wave': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'pulse-ring-urgent': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'notification-enter': {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'success-ripple': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'badge-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--status-glow) / 0.4)' },
          '50%': { boxShadow: '0 0 0 4px hsl(var(--status-glow) / 0)' },
        },
        'timeline-entry': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'metric-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'connection-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-normal) var(--ease-smooth)',
        'fade-out': 'fade-out var(--duration-normal) var(--ease-smooth)',
        'slide-up': 'slide-up var(--duration-normal) var(--ease-out-expo)',
        'slide-down': 'slide-down var(--duration-normal) var(--ease-out-expo)',
        'slide-left': 'slide-left var(--duration-normal) var(--ease-out-expo)',
        'slide-right': 'slide-right var(--duration-normal) var(--ease-out-expo)',
        'scale-in': 'scale-in var(--duration-fast) var(--ease-spring)',
        'scale-out': 'scale-out var(--duration-fast) var(--ease-smooth)',
        'bounce-in': 'bounce-in var(--duration-slow) var(--ease-spring)',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s var(--ease-smooth) infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        float: 'float 3s var(--ease-smooth) infinite',
        wiggle: 'wiggle 1s var(--ease-smooth) infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Elite Status Command Centre Animations
        'status-glow': 'status-glow-pulse 2s ease-in-out infinite',
        'status-glow-fast': 'status-glow-pulse 1s ease-in-out infinite',
        'ring-progress': 'ring-progress 1s ease-out forwards',
        'orb-rotate': 'orb-rotate 3s linear infinite',
        'orb-pulse': 'orb-pulse 2s ease-in-out infinite',
        'thinking-wave': 'thinking-wave 1.2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'pulse-ring-active': 'pulse-ring 1.2s ease-out infinite',
        'pulse-ring-urgent': 'pulse-ring-urgent 0.8s ease-out infinite',
        'notification-enter': 'notification-enter 0.3s ease-out forwards',
        'success-ripple': 'success-ripple 0.6s ease-out forwards',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
        'timeline-entry': 'timeline-entry 0.3s ease-out forwards',
        'metric-pop': 'metric-pop 0.3s ease-out',
        'connection-pulse': 'connection-pulse 2s ease-in-out infinite',
      },

      /* ----------------------------------------
         TRANSITION
         ---------------------------------------- */
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        smooth: 'var(--ease-smooth)',
        bounce: 'var(--ease-bounce)',
        'out-expo': 'var(--ease-out-expo)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },

      /* ----------------------------------------
         FONT FAMILY (Placeholder for brand fonts)
         ---------------------------------------- */
      fontFamily: {
        sans: ['var(--font-sans, Inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono, JetBrains Mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display, Inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      /* ----------------------------------------
         SPACING EXTENSIONS
         ---------------------------------------- */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
      },

      /* ----------------------------------------
         Z-INDEX
         ---------------------------------------- */
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
} satisfies Config;
