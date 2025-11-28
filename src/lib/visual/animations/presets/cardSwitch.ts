/**
 * Card Switch / Card Transition Presets
 *
 * Smooth card transitions, morphing, and switching effects.
 * Perfect for portfolios, galleries, and product showcases.
 */

import { AnimationPreset, AnimationRegistry } from '../animationRegistry';

// ============================================================================
// CARD SWITCH ANIMATION PRESETS
// ============================================================================

export const cardSwitchPresets: AnimationPreset[] = [
  {
    id: 'card-morph-fx',
    name: 'Switching Card Morph FX',
    category: 'cardSwitch',
    description: 'Cards morph and transform smoothly between states. Fluid and organic.',
    intensity: 'normal',
    duration: 0.5,
    variants: {
      initial: {
        opacity: 0,
        scale: 0.9,
        y: 20,
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: -10,
        transition: {
          duration: 0.3,
        },
      },
    },
    tags: ['card', 'morph', 'smooth', 'transform'],
    codeExample: `<AnimatePresence mode="wait"><motion.div key={id} variants={cardMorphFx} /></AnimatePresence>`,
  },

  {
    id: 'card-flip-3d',
    name: 'Card Flip 3D',
    category: 'cardSwitch',
    description: '3D card flip revealing back side. Interactive and engaging.',
    intensity: 'dramatic',
    duration: 0.6,
    variants: {
      front: {
        rotateY: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      },
      back: {
        rotateY: 180,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      },
    },
    tags: ['card', 'flip', '3d', 'interactive'],
  },

  {
    id: 'card-stack-shuffle',
    name: 'Card Stack Shuffle',
    category: 'cardSwitch',
    description: 'Cards shuffle in a stack formation. Playful deck effect.',
    intensity: 'dramatic',
    duration: 0.4,
    variants: {
      initial: (i: number) => ({
        opacity: 0,
        scale: 0.8,
        y: 50 + i * 10,
        rotate: -5 + i * 2,
      }),
      animate: (i: number) => ({
        opacity: 1,
        scale: 1 - i * 0.02,
        y: i * 4,
        rotate: i * 1,
        transition: {
          duration: 0.4,
          delay: i * 0.1,
          ease: [0.34, 1.56, 0.64, 1],
        },
      }),
      exit: {
        opacity: 0,
        scale: 0.9,
        y: -30,
        transition: { duration: 0.3 },
      },
    },
    tags: ['card', 'stack', 'shuffle', 'deck'],
  },

  {
    id: 'card-slide-replace',
    name: 'Card Slide Replace',
    category: 'cardSwitch',
    description: 'Old card slides out, new card slides in. Clean transition.',
    intensity: 'normal',
    duration: 0.4,
    variants: {
      initial: {
        opacity: 0,
        x: 100,
      },
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.4,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        opacity: 0,
        x: -100,
        transition: {
          duration: 0.3,
        },
      },
    },
    tags: ['card', 'slide', 'replace', 'clean'],
  },

  {
    id: 'card-fade-scale',
    name: 'Card Fade Scale',
    category: 'cardSwitch',
    description: 'Subtle fade with scale. Minimal and elegant.',
    intensity: 'subtle',
    duration: 0.3,
    variants: {
      initial: {
        opacity: 0,
        scale: 0.96,
      },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      },
      exit: {
        opacity: 0,
        scale: 0.98,
        transition: {
          duration: 0.2,
        },
      },
    },
    tags: ['card', 'fade', 'scale', 'minimal'],
  },

  {
    id: 'card-expand-hero',
    name: 'Card Expand Hero',
    category: 'cardSwitch',
    description: 'Card expands to hero/full view. Shared element transition.',
    intensity: 'dramatic',
    duration: 0.5,
    variants: {
      collapsed: {
        scale: 1,
        borderRadius: '16px',
      },
      expanded: {
        scale: 1,
        borderRadius: '0px',
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        },
      },
    },
    tags: ['card', 'expand', 'hero', 'fullscreen'],
  },

  {
    id: 'card-tilt-hover',
    name: 'Card Tilt Hover',
    category: 'cardSwitch',
    description: '3D tilt effect on hover following cursor. Premium feel.',
    intensity: 'subtle',
    duration: 0.1,
    variants: {
      initial: {
        rotateX: 0,
        rotateY: 0,
        transformPerspective: 1000,
      },
      hover: {
        rotateX: 'var(--rotate-x, 0deg)',
        rotateY: 'var(--rotate-y, 0deg)',
        transition: { duration: 0.1 },
      },
    },
    tags: ['card', 'tilt', 'hover', '3d', 'premium'],
  },

  {
    id: 'card-magnetic-snap',
    name: 'Card Magnetic Snap',
    category: 'cardSwitch',
    description: 'Cards snap into position with magnetic feel. Satisfying interaction.',
    intensity: 'normal',
    duration: 0.4,
    variants: {
      initial: {
        scale: 1,
        x: 0,
        y: 0,
      },
      drag: {
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      snap: {
        scale: 1,
        x: 0,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 500,
          damping: 30,
        },
      },
    },
    tags: ['card', 'magnetic', 'snap', 'drag'],
  },

  {
    id: 'card-stagger-grid',
    name: 'Card Stagger Grid',
    category: 'cardSwitch',
    description: 'Cards appear in staggered grid pattern. Great for galleries.',
    intensity: 'normal',
    duration: 0.5,
    variants: {
      initial: {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.5,
          ease: [0.33, 1, 0.68, 1],
        },
      },
    },
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
    tags: ['card', 'stagger', 'grid', 'gallery'],
  },
];

// Register all card switch presets
export function registerCardSwitchPresets(): void {
  AnimationRegistry.registerPresets(cardSwitchPresets);
}

// Export variants
export const cardMorphFx = cardSwitchPresets[0].variants;
export const cardFlip3d = cardSwitchPresets[1].variants;
export const cardStackShuffle = cardSwitchPresets[2].variants;
export const cardSlideReplace = cardSwitchPresets[3].variants;
export const cardFadeScale = cardSwitchPresets[4].variants;
export const cardExpandHero = cardSwitchPresets[5].variants;
export const cardTiltHover = cardSwitchPresets[6].variants;
export const cardMagneticSnap = cardSwitchPresets[7].variants;
export const cardStaggerGrid = cardSwitchPresets[8].variants;

export default cardSwitchPresets;
