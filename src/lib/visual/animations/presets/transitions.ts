/**
 * Page & Section Transition Presets
 *
 * Smooth transitions for pages, sections, and content blocks.
 * Professional-grade transitions for premium feel.
 */

import { AnimationPreset, AnimationRegistry } from '../animationRegistry';

// ============================================================================
// TRANSITION ANIMATION PRESETS
// ============================================================================

export const transitionPresets: AnimationPreset[] = [
  {
    id: 'transition-fade-through',
    name: 'Transition Fade Through',
    category: 'transition',
    description: 'Content fades out, new content fades in. Clean and universal.',
    intensity: 'subtle',
    duration: 0.4,
    variants: {
      initial: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
      },
      exit: {
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeIn' },
      },
    },
    tags: ['fade', 'page', 'universal', 'clean'],
  },

  {
    id: 'transition-slide-up',
    name: 'Transition Slide Up',
    category: 'transition',
    description: 'Content slides up into view. Modern and dynamic.',
    intensity: 'normal',
    duration: 0.5,
    variants: {
      initial: {
        opacity: 0,
        y: 40,
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 },
      },
    },
    tags: ['slide', 'up', 'modern', 'dynamic'],
  },

  {
    id: 'transition-slide-horizontal',
    name: 'Transition Slide Horizontal',
    category: 'transition',
    description: 'Content slides horizontally. Great for step wizards.',
    intensity: 'normal',
    duration: 0.4,
    variants: {
      initial: (direction: number = 1) => ({
        opacity: 0,
        x: direction * 100,
      }),
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.4,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: (direction: number = 1) => ({
        opacity: 0,
        x: direction * -100,
        transition: { duration: 0.3 },
      }),
    },
    tags: ['slide', 'horizontal', 'wizard', 'steps'],
  },

  {
    id: 'transition-scale-fade',
    name: 'Transition Scale Fade',
    category: 'transition',
    description: 'Subtle scale with fade. Elegant modal/dialog transition.',
    intensity: 'subtle',
    duration: 0.3,
    variants: {
      initial: {
        opacity: 0,
        scale: 0.95,
      },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      exit: {
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.2 },
      },
    },
    tags: ['scale', 'fade', 'modal', 'dialog'],
  },

  {
    id: 'transition-split-reveal',
    name: 'Split-Reveal Slider',
    category: 'transition',
    description: 'Content splits and reveals new content. Dramatic effect.',
    intensity: 'dramatic',
    duration: 0.8,
    variants: {
      initial: {
        clipPath: 'inset(0 50% 0 50%)',
        opacity: 0,
      },
      animate: {
        clipPath: 'inset(0 0% 0 0%)',
        opacity: 1,
        transition: {
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
      exit: {
        clipPath: 'inset(50% 0 50% 0)',
        opacity: 0,
        transition: { duration: 0.5 },
      },
    },
    tags: ['split', 'reveal', 'dramatic', 'slider'],
  },

  {
    id: 'transition-parallax-layers',
    name: 'Parallax Depth Field',
    category: 'transition',
    description: 'Layered parallax effect creating depth. Cinematic feel.',
    intensity: 'dramatic',
    duration: 0.6,
    variants: {
      initial: {
        opacity: 0,
        z: -100,
        scale: 1.1,
      },
      animate: {
        opacity: 1,
        z: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      exit: {
        opacity: 0,
        z: 50,
        scale: 0.95,
      },
    },
    tags: ['parallax', 'depth', 'layers', 'cinematic'],
  },

  {
    id: 'transition-morph-container',
    name: 'Soft-Material Morph Drift',
    category: 'transition',
    description: 'Container morphs shape during transition. Fluid and organic.',
    intensity: 'normal',
    duration: 0.5,
    variants: {
      initial: {
        borderRadius: '50%',
        scale: 0.8,
        opacity: 0,
      },
      animate: {
        borderRadius: '16px',
        scale: 1,
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
      exit: {
        borderRadius: '50%',
        scale: 0.9,
        opacity: 0,
      },
    },
    tags: ['morph', 'container', 'fluid', 'organic'],
  },

  {
    id: 'transition-blur-fade',
    name: 'Glass-Distortion Intro',
    category: 'transition',
    description: 'Content emerges from blur. Glass morphism transition.',
    intensity: 'normal',
    duration: 0.5,
    variants: {
      initial: {
        opacity: 0,
        filter: 'blur(10px)',
        scale: 1.02,
      },
      animate: {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        },
      },
      exit: {
        opacity: 0,
        filter: 'blur(5px)',
        scale: 0.98,
      },
    },
    tags: ['blur', 'glass', 'distortion', 'intro'],
  },

  {
    id: 'transition-velocity-panel',
    name: 'Velocity-Triggered Panels',
    category: 'transition',
    description: 'Panels animate based on scroll velocity. Dynamic response.',
    intensity: 'dramatic',
    duration: 0.4,
    variants: {
      initial: {
        opacity: 0,
        y: 60,
        rotateX: -15,
        transformPerspective: 1000,
      },
      animate: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
          duration: 0.4,
          ease: [0.33, 1, 0.68, 1],
        },
      },
      exit: {
        opacity: 0,
        y: -30,
      },
    },
    tags: ['velocity', 'scroll', 'panels', 'dynamic'],
  },

  {
    id: 'transition-section-reveal',
    name: 'Section Slide Reveal',
    category: 'transition',
    description: 'Sections reveal with slide animation on scroll.',
    intensity: 'normal',
    duration: 0.6,
    variants: {
      hidden: {
        opacity: 0,
        y: 50,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: [0.33, 1, 0.68, 1],
        },
      },
    },
    tags: ['section', 'scroll', 'reveal'],
  },
];

// Register all transition presets
export function registerTransitionPresets(): void {
  AnimationRegistry.registerPresets(transitionPresets);
}

// Export variants
export const transitionFadeThrough = transitionPresets[0].variants;
export const transitionSlideUp = transitionPresets[1].variants;
export const transitionSlideHorizontal = transitionPresets[2].variants;
export const transitionScaleFade = transitionPresets[3].variants;
export const transitionSplitReveal = transitionPresets[4].variants;
export const transitionParallaxLayers = transitionPresets[5].variants;
export const transitionMorphContainer = transitionPresets[6].variants;
export const transitionBlurFade = transitionPresets[7].variants;
export const transitionVelocityPanel = transitionPresets[8].variants;
export const transitionSectionReveal = transitionPresets[9].variants;

export default transitionPresets;
