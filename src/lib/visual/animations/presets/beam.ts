/**
 * Beam Animation Presets
 *
 * Soft, flowing light beam effects. ACCESSIBILITY-SAFE:
 * - No rapid flashing or strobing
 * - Minimum 0.5s for any light change
 * - Gradual gradients, not hard edges
 * - All effects respect prefers-reduced-motion
 */

import { AnimationPreset, AnimationRegistry } from '../animationRegistry';

// ============================================================================
// BEAM ANIMATION PRESETS
// ============================================================================

export const beamPresets: AnimationPreset[] = [
  {
    id: 'beam-sweep-alpha',
    name: 'Beam-Sweep Alpha',
    category: 'beam',
    description: 'Gentle horizontal light sweep across element. Soft gradient, no hard edges.',
    intensity: 'subtle',
    duration: 2.0,
    variants: {
      initial: {
        background: 'linear-gradient(90deg, transparent 0%, transparent 100%)',
      },
      animate: {
        background: [
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 0%, transparent 0%)',
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          'linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.1) 100%, transparent 100%)',
        ],
        transition: {
          duration: 2.0,
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 3.0, // Long delay between sweeps
        },
      },
    },
    cssKeyframes: `
      @keyframes beam-sweep-alpha {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
    tags: ['beam', 'sweep', 'horizontal', 'subtle', 'safe'],
    codeExample: `<motion.div className="beam-sweep-alpha" />`,
  },

  {
    id: 'beam-sweep-omega',
    name: 'Beam-Sweep Omega',
    category: 'beam',
    description: 'Vertical soft light beam traveling upward. Ethereal and calming.',
    intensity: 'subtle',
    duration: 2.5,
    variants: {
      initial: {
        backgroundPosition: '0 200%',
      },
      animate: {
        backgroundPosition: '0 -200%',
        transition: {
          duration: 2.5,
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 4.0,
        },
      },
    },
    cssKeyframes: `
      @keyframes beam-sweep-omega {
        0% { background-position: 0 200%; }
        100% { background-position: 0 -200%; }
      }
    `,
    tags: ['beam', 'vertical', 'ethereal', 'calming'],
  },

  {
    id: 'beam-glow-pulse',
    name: 'Beam-Glow Pulse',
    category: 'beam',
    description: 'Soft pulsing glow effect. Very slow (3s cycle) to avoid any triggers.',
    intensity: 'subtle',
    duration: 3.0,
    variants: {
      initial: {
        boxShadow: '0 0 20px 0px rgba(99, 102, 241, 0.2)',
      },
      animate: {
        boxShadow: [
          '0 0 20px 0px rgba(99, 102, 241, 0.2)',
          '0 0 40px 10px rgba(99, 102, 241, 0.3)',
          '0 0 20px 0px rgba(99, 102, 241, 0.2)',
        ],
        transition: {
          duration: 3.0,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      },
    },
    tags: ['glow', 'pulse', 'soft', 'ambient'],
  },

  {
    id: 'beam-edge-trace',
    name: 'Beam-Edge Trace',
    category: 'beam',
    description: 'Soft light traces along the border of an element. Elegant highlight effect.',
    intensity: 'normal',
    duration: 4.0,
    variants: {
      initial: {
        backgroundSize: '200% 200%',
        backgroundPosition: '0% 0%',
      },
      animate: {
        backgroundPosition: ['0% 0%', '100% 0%', '100% 100%', '0% 100%', '0% 0%'],
        transition: {
          duration: 4.0,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    },
    cssKeyframes: `
      .beam-edge-trace {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        background-size: 200% 100%;
        animation: beam-edge-trace 4s linear infinite;
      }
      @keyframes beam-edge-trace {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
    tags: ['border', 'trace', 'elegant', 'highlight'],
  },

  {
    id: 'beam-shimmer',
    name: 'Beam-Shimmer',
    category: 'beam',
    description: 'Gentle shimmer effect like light on water. Very subtle and safe.',
    intensity: 'subtle',
    duration: 3.0,
    variants: {
      initial: {
        backgroundPosition: '-200% 0',
      },
      animate: {
        backgroundPosition: '200% 0',
        transition: {
          duration: 3.0,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    },
    cssKeyframes: `
      .beam-shimmer {
        background: linear-gradient(
          120deg,
          transparent 30%,
          rgba(255, 255, 255, 0.15) 50%,
          transparent 70%
        );
        background-size: 200% 100%;
        animation: beam-shimmer 3s linear infinite;
      }
      @keyframes beam-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
    tags: ['shimmer', 'subtle', 'water', 'gentle'],
  },

  {
    id: 'beam-aurora',
    name: 'Beam-Aurora',
    category: 'beam',
    description: 'Slow-moving aurora borealis effect. Mesmerizing but safe.',
    intensity: 'dramatic',
    duration: 8.0,
    variants: {
      initial: {
        backgroundPosition: '0% 50%',
      },
      animate: {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        transition: {
          duration: 8.0,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    },
    cssKeyframes: `
      .beam-aurora {
        background: linear-gradient(
          -45deg,
          rgba(99, 102, 241, 0.3),
          rgba(168, 85, 247, 0.3),
          rgba(59, 130, 246, 0.3),
          rgba(16, 185, 129, 0.3)
        );
        background-size: 400% 400%;
        animation: beam-aurora 8s ease infinite;
      }
      @keyframes beam-aurora {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `,
    tags: ['aurora', 'gradient', 'mesmerizing', 'colorful'],
  },

  {
    id: 'beam-spotlight-soft',
    name: 'Beam-Spotlight Soft',
    category: 'beam',
    description: 'Soft radial spotlight that gently follows content. No harsh edges.',
    intensity: 'normal',
    duration: 0,
    variants: {
      initial: {
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      },
      animate: {
        background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15) 0%, transparent 50%)',
      },
    },
    tags: ['spotlight', 'soft', 'interactive', 'mouse'],
  },

  {
    id: 'beam-border-glow',
    name: 'Beam-Border Glow',
    category: 'beam',
    description: 'Animated border with soft traveling glow. Premium card effect.',
    intensity: 'normal',
    duration: 4.0,
    variants: {
      initial: {},
      animate: {
        boxShadow: [
          'inset 0 0 0 1px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)',
          'inset 0 0 0 1px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.1)',
          'inset 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)',
          'inset 0 0 0 1px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)',
        ],
        transition: {
          duration: 4.0,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    },
    tags: ['border', 'glow', 'premium', 'card'],
  },
];

// Register all beam presets
export function registerBeamPresets(): void {
  AnimationRegistry.registerPresets(beamPresets);
}

// Export individual variants for direct use
export const beamSweepAlpha = beamPresets[0].variants;
export const beamSweepOmega = beamPresets[1].variants;
export const beamGlowPulse = beamPresets[2].variants;
export const beamEdgeTrace = beamPresets[3].variants;
export const beamShimmer = beamPresets[4].variants;
export const beamAurora = beamPresets[5].variants;
export const beamSpotlightSoft = beamPresets[6].variants;
export const beamBorderGlow = beamPresets[7].variants;

// CSS classes for direct application
export const beamCSS = {
  shimmer: `
    background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
    background-size: 200% 100%;
    animation: beam-shimmer 3s linear infinite;
  `,
  aurora: `
    background: linear-gradient(-45deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3));
    background-size: 400% 400%;
    animation: beam-aurora 8s ease infinite;
  `,
};

export default beamPresets;
