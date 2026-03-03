/**
 * Design Tokens - Scientific Luxury Tier
 * Centralised constants for the design system
 *
 * @see docs/DESIGN_SYSTEM.md for full documentation
 */

// =============================================================================
// SPECTRAL COLOURS
// =============================================================================

export const SPECTRAL = {
  cyan: '#00F5FF',
  emerald: '#00FF88',
  amber: '#FFB800',
  red: '#FF4444',
  magenta: '#FF00FF',
  grey: '#6B7280',
} as const;

export type SpectralColour = keyof typeof SPECTRAL;

// =============================================================================
// BACKGROUNDS
// =============================================================================

export const BACKGROUNDS = {
  /** True OLED black */
  primary: '#050505',
  /** Elevated surface */
  elevated: 'rgba(255, 255, 255, 0.01)',
  /** Hover state */
  hover: 'rgba(255, 255, 255, 0.02)',
  /** Active/pressed state */
  active: 'rgba(255, 255, 255, 0.03)',
} as const;

// =============================================================================
// TEXT OPACITY
// =============================================================================

export const TEXT = {
  primary: 'rgba(255, 255, 255, 0.9)',
  secondary: 'rgba(255, 255, 255, 0.7)',
  tertiary: 'rgba(255, 255, 255, 0.5)',
  muted: 'rgba(255, 255, 255, 0.4)',
  subtle: 'rgba(255, 255, 255, 0.3)',
  ghost: 'rgba(255, 255, 255, 0.2)',
} as const;

// =============================================================================
// BORDERS
// =============================================================================

export const BORDERS = {
  visible: 'rgba(255, 255, 255, 0.1)',
  subtle: 'rgba(255, 255, 255, 0.06)',
  ghost: 'rgba(255, 255, 255, 0.03)',
} as const;

// =============================================================================
// STATUS COLOURS
// =============================================================================

export type AgentStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_verification'
  | 'verification_in_progress'
  | 'verification_passed'
  | 'verification_failed'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'escalated_to_human';

export const STATUS_COLOURS: Record<AgentStatus, string> = {
  pending: SPECTRAL.grey,
  in_progress: SPECTRAL.cyan,
  awaiting_verification: SPECTRAL.amber,
  verification_in_progress: SPECTRAL.amber,
  verification_passed: SPECTRAL.emerald,
  verification_failed: SPECTRAL.red,
  completed: SPECTRAL.emerald,
  failed: SPECTRAL.red,
  blocked: SPECTRAL.amber,
  escalated_to_human: SPECTRAL.magenta,
};

// =============================================================================
// NOTIFICATION COLOURS
// =============================================================================

export type NotificationType =
  | 'start'
  | 'progress'
  | 'complete'
  | 'error'
  | 'escalation'
  | 'verification';

export const NOTIFICATION_COLOURS: Record<NotificationType, string> = {
  start: SPECTRAL.cyan,
  progress: SPECTRAL.cyan,
  complete: SPECTRAL.emerald,
  error: SPECTRAL.red,
  escalation: SPECTRAL.magenta,
  verification: SPECTRAL.amber,
};

// =============================================================================
// COUNCIL COLOURS
// =============================================================================

export type CouncilMember = 'turing' | 'vonNeumann' | 'bezier' | 'shannon';

export const COUNCIL_COLOURS: Record<CouncilMember, string> = {
  turing: SPECTRAL.cyan,
  vonNeumann: SPECTRAL.amber,
  bezier: SPECTRAL.magenta,
  shannon: SPECTRAL.emerald,
};

// =============================================================================
// ANIMATION EASINGS
// =============================================================================

export const EASINGS = {
  /** Smooth deceleration - primary easing */
  outExpo: [0.19, 1, 0.22, 1] as const,
  /** Gentle ease */
  smooth: [0.4, 0, 0.2, 1] as const,
  /** Snappy with overshoot */
  snappy: [0.68, -0.55, 0.265, 1.55] as const,
  /** Bounce effect */
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const;

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================

export const DURATIONS = {
  /** Fast micro-interactions */
  fast: 0.2,
  /** Standard transitions */
  normal: 0.4,
  /** Slower, more deliberate */
  slow: 0.6,
  /** Breathing/pulse animations */
  breathing: 2,
  /** Glow pulse */
  pulse: 1.5,
  /** Ambient glow */
  ambient: 3,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a glow box-shadow for a spectral colour
 */
export function spectralGlow(
  colour: string,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): string {
  const intensities = {
    low: { inner: '20', outer: '10' },
    medium: { inner: '40', outer: '20' },
    high: { inner: '60', outer: '30' },
  };
  const { inner, outer } = intensities[intensity];
  return `0 0 20px ${colour}${inner}, 0 0 40px ${colour}${outer}`;
}

/**
 * Generate text-shadow for glowing text
 */
export function spectralTextGlow(
  colour: string,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): string {
  const intensities = {
    low: '40',
    medium: '60',
    high: '80',
  };
  return `0 0 20px ${colour}${intensities[intensity]}`;
}

/**
 * Generate a colour with opacity
 */
export function withOpacity(colour: string, opacity: number): string {
  // Convert hex to rgba
  const hex = colour.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get colour for border based on spectral colour
 */
export function spectralBorder(colour: string, visible: boolean = true): string {
  return visible ? `${colour}50` : 'rgba(255, 255, 255, 0.1)';
}

/**
 * Get background colour based on spectral colour
 */
export function spectralBackground(
  colour: string,
  intensity: 'subtle' | 'medium' | 'strong' = 'subtle'
): string {
  const intensities = {
    subtle: '10',
    medium: '20',
    strong: '30',
  };
  return `${colour}${intensities[intensity]}`;
}

// =============================================================================
// FRAMER MOTION PRESETS
// =============================================================================

export const MOTION_PRESETS = {
  /** Standard entry animation */
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: DURATIONS.normal, ease: EASINGS.outExpo },
  },

  /** Staggered entry (use with index) */
  staggeredEntry: (index: number) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: {
      delay: index * 0.1,
      duration: DURATIONS.normal,
      ease: EASINGS.outExpo,
    },
  }),

  /** Breathing animation for active elements */
  breathing: {
    animate: {
      opacity: [1, 0.6, 1],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: DURATIONS.breathing,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  /** Pulse animation for indicators */
  pulse: {
    animate: {
      scale: [1, 1.3, 1],
      opacity: [1, 0.6, 1],
    },
    transition: {
      duration: DURATIONS.breathing,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  /** Glow pulse animation (use with spectral colour) */
  glowPulse: (colour: string) => ({
    animate: {
      boxShadow: [`0 0 0 ${colour}00`, `0 0 20px ${colour}40`, `0 0 0 ${colour}00`],
    },
    transition: {
      duration: DURATIONS.pulse,
      repeat: Infinity,
    },
  }),

  /** Scale on hover */
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.98 },
  },
} as const;

// =============================================================================
// TAILWIND CLASS HELPERS
// =============================================================================

export const TW = {
  /** OLED black background */
  bgPrimary: 'bg-[#050505]',

  /** Single pixel border */
  border: 'border-[0.5px] border-white/[0.06]',

  /** Visible border */
  borderVisible: 'border-[0.5px] border-white/[0.1]',

  /** Sharp corners */
  rounded: 'rounded-sm',

  /** Timeline spine */
  spine:
    'absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent',

  /** Hero title */
  heroTitle: 'text-5xl font-extralight tracking-tight text-white lg:text-6xl',

  /** Section title */
  sectionTitle: 'text-2xl font-light tracking-tight',

  /** Label text */
  label: 'text-[10px] uppercase tracking-[0.3em] text-white/30',

  /** Data value */
  dataValue: 'font-mono text-lg font-medium tabular-nums',

  /** Timestamp */
  timestamp: 'font-mono text-[10px] text-white/30',

  /** Body text */
  body: 'font-mono text-xs text-white/50',
} as const;
