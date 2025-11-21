/**
 * Animation Presets
 * Phase 15 Week 5-6 - Production Polish
 *
 * Unified animation system for consistent motion design.
 * Based on 8px baseline grid and 60fps performance target.
 */

// ============================================================================
// DURATION TOKENS
// ============================================================================

export const duration = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// ============================================================================
// EASING TOKENS
// ============================================================================

export const easing = {
  // Standard easings
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',

  // Spring-like
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Smooth
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================================================
// CSS ANIMATION CLASSES
// ============================================================================

export const animationClasses = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-150',

  // Slide animations
  slideInUp: 'animate-in slide-in-from-bottom-2 duration-200',
  slideInDown: 'animate-in slide-in-from-top-2 duration-200',
  slideInLeft: 'animate-in slide-in-from-left-2 duration-200',
  slideInRight: 'animate-in slide-in-from-right-2 duration-200',

  // Combined fade + slide
  fadeSlideUp: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
  fadeSlideDown: 'animate-in fade-in slide-in-from-top-4 duration-300',

  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-150',

  // Pulse (for notifications, alerts)
  subtlePulse: 'animate-pulse',

  // Spin (for loaders)
  spin: 'animate-spin',
} as const;

// ============================================================================
// TRANSITION CLASSES
// ============================================================================

export const transitionClasses = {
  // All properties
  all: 'transition-all duration-200 ease-out',
  allFast: 'transition-all duration-150 ease-out',
  allSlow: 'transition-all duration-300 ease-out',

  // Specific properties
  colors: 'transition-colors duration-150 ease-out',
  opacity: 'transition-opacity duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  shadow: 'transition-shadow duration-200 ease-out',

  // Interactive states
  interactive: 'transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]',
  button: 'transition-all duration-150 ease-out active:scale-95',
} as const;

// ============================================================================
// STAGGER DELAYS (for lists)
// ============================================================================

export const staggerDelay = (index: number, baseDelay = 50): string => {
  return `${index * baseDelay}ms`;
};

export const staggerStyle = (index: number, baseDelay = 50) => ({
  animationDelay: staggerDelay(index, baseDelay),
});

// ============================================================================
// MOTION PREFERENCES
// ============================================================================

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ============================================================================
// CSS KEYFRAME DEFINITIONS (for tailwind.config.js)
// ============================================================================

export const keyframes = {
  fadeSlide: {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  scaleIn: {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  subtlePulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.7' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
};

export const animations = {
  fadeSlide: 'fadeSlide 0.3s ease-out',
  scaleIn: 'scaleIn 0.2s ease-out',
  subtlePulse: 'subtlePulse 2s ease-in-out infinite',
  shimmer: 'shimmer 1.5s infinite',
};
