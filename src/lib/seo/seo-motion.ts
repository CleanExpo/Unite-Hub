/**
 * SEO Dashboard Motion Configuration
 * Phase 4 Step 5: Design Glow-Up
 *
 * Framer Motion animation variants and configuration for smooth, premium interactions.
 * Follows the 60fps principle with spring physics and micro-interactions.
 */

import type { Variants, Transition } from "framer-motion";

/**
 * Spring Configurations
 */
export const springs = {
  // Snappy interactions (buttons, toggles)
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  // Smooth panels and cards
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 1,
  },

  // Gentle modals and overlays
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1.2,
  },

  // Bouncy for attention-grabbing elements
  bouncy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
    mass: 0.6,
  },
} as const;

/**
 * Easing Curves
 */
export const easings = {
  easeOut: [0.16, 1, 0.3, 1], // Smooth deceleration
  easeIn: [0.7, 0, 0.84, 0], // Smooth acceleration
  easeInOut: [0.65, 0, 0.35, 1], // Balanced
  anticipate: [0.34, 1.56, 0.64, 1], // Anticipation bounce
} as const;

/**
 * Panel Animation Variants
 */
export const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Staggered Children Animation
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

/**
 * Mode Toggle Animation
 */
export const modeToggleVariants: Variants = {
  standard: {
    x: 0,
    transition: springs.snappy,
  },
  hypnotic: {
    x: "100%",
    transition: springs.snappy,
  },
};

/**
 * Metric Counter Animation
 */
export const metricVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springs.bouncy,
      delay: 0.2,
    },
  },
};

/**
 * Progress Bar Animation
 */
export const progressBarVariants: Variants = {
  hidden: {
    scaleX: 0,
    originX: 0,
  },
  visible: (width: number) => ({
    scaleX: width / 100,
    originX: 0,
    transition: {
      duration: 0.8,
      ease: easings.easeOut as any,
      delay: 0.3,
    },
  }),
};

/**
 * Button Hover Animation
 */
export const buttonHoverVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
};

/**
 * Card Hover Animation (Bento)
 */
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.01,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    transition: springs.smooth,
  },
};

/**
 * Fade In Animation
 */
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Slide In from Bottom
 */
export const slideInBottomVariants: Variants = {
  hidden: {
    y: 50,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.smooth,
  },
};

/**
 * Slide In from Top
 */
export const slideInTopVariants: Variants = {
  hidden: {
    y: -50,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.smooth,
  },
};

/**
 * Slide In from Left
 */
export const slideInLeftVariants: Variants = {
  hidden: {
    x: -50,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
};

/**
 * Slide In from Right
 */
export const slideInRightVariants: Variants = {
  hidden: {
    x: 50,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
};

/**
 * Scale Up Animation (for modals)
 */
export const scaleUpVariants: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: springs.gentle,
  },
};

/**
 * Hypnotic Glow Pulse Animation
 */
export const hypnoticGlowVariants: Variants = {
  initial: {
    boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
  },
  animate: {
    boxShadow: [
      "0 0 20px rgba(168, 85, 247, 0.3)",
      "0 0 40px rgba(168, 85, 247, 0.5)",
      "0 0 20px rgba(168, 85, 247, 0.3)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Loading Skeleton Pulse
 */
export const skeletonPulseVariants: Variants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Success Checkmark Animation
 */
export const checkmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.5,
        ease: easings.easeOut as any,
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
};

/**
 * Number Count-Up Animation Config
 */
export const countUpTransition: Transition = {
  duration: 1,
  ease: easings.easeOut as any,
};

/**
 * Layout Shift Animation (for reordering)
 */
export const layoutTransition: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 40,
};

/**
 * Tab Switching Animation
 */
export const tabVariants: Variants = {
  inactive: {
    opacity: 0.6,
    scale: 0.98,
  },
  active: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
};

/**
 * Tooltip Animation
 */
export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: easings.easeOut as any,
    },
  },
};

/**
 * Notification Toast Animation
 */
export const toastVariants: Variants = {
  hidden: {
    x: 400,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Utility: Create custom delay transition
 */
export function withDelay(delay: number, transition: Transition = springs.smooth): Transition {
  return {
    ...transition,
    delay,
  };
}

/**
 * Utility: Create stagger parent container
 */
export function createStaggerContainer(staggerDelay: number = 0.05): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };
}

/**
 * Export animation presets for common use cases
 */
export const animationPresets = {
  panel: panelVariants,
  stagger: { container: staggerContainer, item: staggerItem },
  button: buttonHoverVariants,
  card: cardHoverVariants,
  fade: fadeInVariants,
  slideBottom: slideInBottomVariants,
  slideTop: slideInTopVariants,
  slideLeft: slideInLeftVariants,
  slideRight: slideInRightVariants,
  scale: scaleUpVariants,
  glow: hypnoticGlowVariants,
  skeleton: skeletonPulseVariants,
  tab: tabVariants,
  tooltip: tooltipVariants,
  toast: toastVariants,
} as const;
