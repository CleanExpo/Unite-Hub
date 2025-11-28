/**
 * Flashlight / Spotlight Cursor Effects
 *
 * Soft spotlight effects that follow cursor or highlight areas.
 * ACCESSIBILITY-SAFE: No strobing, gentle gradients only.
 */

import { AnimationPreset, AnimationRegistry } from '../animationRegistry';

// ============================================================================
// FLASHLIGHT ANIMATION PRESETS
// ============================================================================

export const flashlightPresets: AnimationPreset[] = [
  {
    id: 'flashlight-cursor-soft',
    name: 'Flashlight Cursor Soft',
    category: 'flashlight',
    description: 'Soft spotlight follows cursor with gentle falloff. Non-intrusive.',
    intensity: 'subtle',
    duration: 0,
    variants: {
      initial: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
        transition: { duration: 0.3 },
      },
    },
    cssKeyframes: `
      .flashlight-cursor-soft {
        position: fixed;
        pointer-events: none;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.08) 0%,
          rgba(255, 255, 255, 0.04) 30%,
          transparent 70%
        );
        transform: translate(-50%, -50%);
        z-index: 9999;
        mix-blend-mode: overlay;
      }
    `,
    tags: ['cursor', 'spotlight', 'interactive', 'soft'],
    codeExample: `<FlashlightCursor variant="soft" />`,
  },

  {
    id: 'flashlight-cursor-warm',
    name: 'Flashlight Cursor Warm',
    category: 'flashlight',
    description: 'Warm-toned spotlight with amber glow. Cozy and inviting.',
    intensity: 'subtle',
    duration: 0,
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    cssKeyframes: `
      .flashlight-cursor-warm {
        position: fixed;
        pointer-events: none;
        width: 350px;
        height: 350px;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(251, 191, 36, 0.1) 0%,
          rgba(251, 191, 36, 0.05) 30%,
          transparent 60%
        );
        transform: translate(-50%, -50%);
        z-index: 9999;
        mix-blend-mode: screen;
      }
    `,
    tags: ['cursor', 'warm', 'amber', 'cozy'],
  },

  {
    id: 'flashlight-cursor-cool',
    name: 'Flashlight Cursor Cool',
    category: 'flashlight',
    description: 'Cool blue-tinted spotlight. Professional and modern.',
    intensity: 'subtle',
    duration: 0,
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    cssKeyframes: `
      .flashlight-cursor-cool {
        position: fixed;
        pointer-events: none;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(59, 130, 246, 0.08) 0%,
          rgba(99, 102, 241, 0.04) 30%,
          transparent 60%
        );
        transform: translate(-50%, -50%);
        z-index: 9999;
        mix-blend-mode: screen;
      }
    `,
    tags: ['cursor', 'cool', 'blue', 'professional'],
  },

  {
    id: 'flashlight-reveal-mask',
    name: 'Flashlight Reveal Mask',
    category: 'flashlight',
    description: 'Content revealed only within spotlight radius. Exploration effect.',
    intensity: 'dramatic',
    duration: 0,
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    cssKeyframes: `
      .flashlight-reveal-container {
        position: relative;
        overflow: hidden;
      }
      .flashlight-reveal-mask {
        position: absolute;
        inset: 0;
        background: #0a0a0a;
        mask-image: radial-gradient(
          circle 150px at var(--mouse-x, 50%) var(--mouse-y, 50%),
          transparent 0%,
          black 100%
        );
        -webkit-mask-image: radial-gradient(
          circle 150px at var(--mouse-x, 50%) var(--mouse-y, 50%),
          transparent 0%,
          black 100%
        );
        pointer-events: none;
      }
    `,
    tags: ['reveal', 'mask', 'exploration', 'dramatic'],
  },

  {
    id: 'flashlight-card-hover',
    name: 'Flashlight Card Hover',
    category: 'flashlight',
    description: 'Spotlight effect on card hover. Highlights focus area.',
    intensity: 'normal',
    duration: 0.3,
    variants: {
      initial: {
        background: 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%)',
      },
      hover: {
        background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1) 0%, transparent 50%)',
        transition: { duration: 0.3 },
      },
    },
    tags: ['card', 'hover', 'focus', 'highlight'],
  },

  {
    id: 'flashlight-text-reveal',
    name: 'Flashlight Text Reveal',
    category: 'flashlight',
    description: 'Text becomes visible only within spotlight. Mystery effect.',
    intensity: 'dramatic',
    duration: 0,
    variants: {
      initial: { opacity: 0.1 },
      animate: { opacity: 1 },
    },
    cssKeyframes: `
      .flashlight-text-reveal {
        color: transparent;
        background: linear-gradient(to right, currentColor, currentColor);
        background-clip: text;
        -webkit-background-clip: text;
        mask-image: radial-gradient(
          circle 100px at var(--mouse-x, 50%) var(--mouse-y, 50%),
          black 0%,
          transparent 100%
        );
        -webkit-mask-image: radial-gradient(
          circle 100px at var(--mouse-x, 50%) var(--mouse-y, 50%),
          black 0%,
          transparent 100%
        );
      }
    `,
    tags: ['text', 'reveal', 'mystery', 'interactive'],
  },

  {
    id: 'flashlight-gradient-follow',
    name: 'Flashlight Gradient Follow',
    category: 'flashlight',
    description: 'Gradient background shifts based on cursor position.',
    intensity: 'subtle',
    duration: 0,
    variants: {
      initial: {},
      animate: {},
    },
    cssKeyframes: `
      .flashlight-gradient-follow {
        background: radial-gradient(
          ellipse 600px 600px at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(99, 102, 241, 0.15) 0%,
          rgba(168, 85, 247, 0.1) 25%,
          transparent 50%
        );
      }
    `,
    tags: ['gradient', 'follow', 'background', 'interactive'],
  },
];

// Register all flashlight presets
export function registerFlashlightPresets(): void {
  AnimationRegistry.registerPresets(flashlightPresets);
}

// Export variants
export const flashlightCursorSoft = flashlightPresets[0].variants;
export const flashlightCursorWarm = flashlightPresets[1].variants;
export const flashlightCursorCool = flashlightPresets[2].variants;
export const flashlightRevealMask = flashlightPresets[3].variants;
export const flashlightCardHover = flashlightPresets[4].variants;
export const flashlightTextReveal = flashlightPresets[5].variants;
export const flashlightGradientFollow = flashlightPresets[6].variants;

export default flashlightPresets;
