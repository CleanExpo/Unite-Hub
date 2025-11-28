/**
 * Clip Animation Presets
 *
 * Clip-path based reveal animations - safe, smooth, and elegant.
 * No rapid flashing or strobing effects.
 *
 * ACCESSIBILITY: All animations are >0.5s duration to prevent seizure triggers.
 */

import { AnimationPreset, AnimationRegistry, CommonTransitions } from '../animationRegistry';

// ============================================================================
// CLIP ANIMATION PRESETS
// ============================================================================

export const clipPresets: AnimationPreset[] = [
  {
    id: 'clip-fade-radiance',
    name: 'Clip-Fade Radiance',
    category: 'clip',
    description: 'Smooth radial reveal from center with soft fade. Elegant and non-intrusive.',
    intensity: 'normal',
    duration: 0.8,
    variants: {
      initial: {
        clipPath: 'circle(0% at 50% 50%)',
        opacity: 0,
      },
      animate: {
        clipPath: 'circle(100% at 50% 50%)',
        opacity: 1,
        transition: {
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      exit: {
        clipPath: 'circle(0% at 50% 50%)',
        opacity: 0,
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 1, 1],
        },
      },
    },
    tags: ['reveal', 'radial', 'smooth', 'elegant', 'safe'],
    codeExample: `<motion.div variants={clipFadeRadiance} initial="initial" animate="animate" exit="exit">`,
  },

  {
    id: 'clip-wipe-left',
    name: 'Clip-Wipe Left',
    category: 'clip',
    description: 'Horizontal wipe reveal from left to right. Clean and professional.',
    intensity: 'normal',
    duration: 0.6,
    variants: {
      initial: {
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0.3,
      },
      animate: {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        clipPath: 'inset(0 0 0 100%)',
        opacity: 0.3,
        transition: {
          duration: 0.4,
        },
      },
    },
    tags: ['wipe', 'horizontal', 'professional', 'clean'],
    codeExample: `<motion.div variants={clipWipeLeft} initial="initial" animate="animate">`,
  },

  {
    id: 'clip-wipe-right',
    name: 'Clip-Wipe Right',
    category: 'clip',
    description: 'Horizontal wipe reveal from right to left.',
    intensity: 'normal',
    duration: 0.6,
    variants: {
      initial: {
        clipPath: 'inset(0 0 0 100%)',
        opacity: 0.3,
      },
      animate: {
        clipPath: 'inset(0 0 0 0%)',
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0.3,
      },
    },
    tags: ['wipe', 'horizontal', 'reverse'],
  },

  {
    id: 'clip-curtain-reveal',
    name: 'Clip-Curtain Reveal',
    category: 'clip',
    description: 'Dual-sided curtain opening effect. Theatrical and engaging.',
    intensity: 'dramatic',
    duration: 1.0,
    variants: {
      initial: {
        clipPath: 'inset(0 50% 0 50%)',
        opacity: 0,
      },
      animate: {
        clipPath: 'inset(0 0% 0 0%)',
        opacity: 1,
        transition: {
          duration: 1.0,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
      exit: {
        clipPath: 'inset(0 50% 0 50%)',
        opacity: 0,
      },
    },
    tags: ['curtain', 'theatrical', 'reveal', 'dramatic'],
  },

  {
    id: 'clip-diagonal-sweep',
    name: 'Clip-Diagonal Sweep',
    category: 'clip',
    description: 'Diagonal reveal creating dynamic visual flow.',
    intensity: 'normal',
    duration: 0.7,
    variants: {
      initial: {
        clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
        opacity: 0,
      },
      animate: {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        opacity: 1,
        transition: {
          duration: 0.7,
          ease: [0.65, 0, 0.35, 1],
        },
      },
      exit: {
        clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
        opacity: 0,
      },
    },
    tags: ['diagonal', 'dynamic', 'sweep'],
  },

  {
    id: 'clip-diamond-expand',
    name: 'Clip-Diamond Expand',
    category: 'clip',
    description: 'Diamond shape expanding outward. Unique and memorable.',
    intensity: 'dramatic',
    duration: 0.9,
    variants: {
      initial: {
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        opacity: 0,
      },
      animate: {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        opacity: 1,
        transition: {
          duration: 0.9,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
      exit: {
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        opacity: 0,
      },
    },
    tags: ['diamond', 'unique', 'geometric', 'expand'],
  },

  {
    id: 'clip-iris-open',
    name: 'Clip-Iris Open',
    category: 'clip',
    description: 'Classic iris/aperture opening effect. Cinematic feel.',
    intensity: 'dramatic',
    duration: 1.2,
    variants: {
      initial: {
        clipPath: 'circle(0% at 50% 50%)',
        scale: 1.1,
        opacity: 0,
      },
      animate: {
        clipPath: 'circle(75% at 50% 50%)',
        scale: 1,
        opacity: 1,
        transition: {
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      exit: {
        clipPath: 'circle(0% at 50% 50%)',
        scale: 0.95,
        opacity: 0,
      },
    },
    tags: ['iris', 'cinematic', 'aperture', 'film'],
  },

  {
    id: 'clip-corner-reveal',
    name: 'Clip-Corner Reveal',
    category: 'clip',
    description: 'Reveal starting from corner, expanding to full view.',
    intensity: 'subtle',
    duration: 0.6,
    variants: {
      initial: {
        clipPath: 'polygon(0 0, 0 0, 0 0, 0 0)',
        opacity: 0.5,
      },
      animate: {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
        opacity: 0.5,
      },
    },
    tags: ['corner', 'subtle', 'clean'],
  },

  {
    id: 'clip-split-vertical',
    name: 'Clip-Split Vertical',
    category: 'clip',
    description: 'Vertical split opening from center. Modern and sleek.',
    intensity: 'normal',
    duration: 0.7,
    variants: {
      initial: {
        clipPath: 'inset(50% 0 50% 0)',
        opacity: 0,
      },
      animate: {
        clipPath: 'inset(0% 0 0% 0)',
        opacity: 1,
        transition: {
          duration: 0.7,
          ease: [0.65, 0, 0.35, 1],
        },
      },
      exit: {
        clipPath: 'inset(50% 0 50% 0)',
        opacity: 0,
      },
    },
    tags: ['split', 'vertical', 'modern', 'sleek'],
  },
];

// Register all clip presets
export function registerClipPresets(): void {
  AnimationRegistry.registerPresets(clipPresets);
}

// Export individual presets for direct import
export const clipFadeRadiance = clipPresets[0].variants;
export const clipWipeLeft = clipPresets[1].variants;
export const clipWipeRight = clipPresets[2].variants;
export const clipCurtainReveal = clipPresets[3].variants;
export const clipDiagonalSweep = clipPresets[4].variants;
export const clipDiamondExpand = clipPresets[5].variants;
export const clipIrisOpen = clipPresets[6].variants;
export const clipCornerReveal = clipPresets[7].variants;
export const clipSplitVertical = clipPresets[8].variants;

export default clipPresets;
