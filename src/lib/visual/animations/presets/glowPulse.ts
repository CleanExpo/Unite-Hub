/**
 * Glow & Pulse Animation Presets
 *
 * Soft glowing and pulsing effects for emphasis and ambiance.
 * ACCESSIBILITY-SAFE: All pulses are >1s cycle, gentle intensity.
 */

import { AnimationPreset, AnimationRegistry } from '../animationRegistry';

// ============================================================================
// GLOW PULSE ANIMATION PRESETS
// ============================================================================

export const glowPulsePresets: AnimationPreset[] = [
  {
    id: 'glow-quantum-pulse',
    name: 'Quantum Glow Pulse',
    category: 'glow',
    description: 'Ethereal quantum-like glow pulsing. Slow and mesmerizing.',
    intensity: 'subtle',
    duration: 4.0,
    variants: {
      initial: {
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.2), 0 0 40px rgba(99, 102, 241, 0.1)',
      },
      animate: {
        boxShadow: [
          '0 0 20px rgba(99, 102, 241, 0.2), 0 0 40px rgba(99, 102, 241, 0.1)',
          '0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.15)',
          '0 0 25px rgba(168, 85, 247, 0.25), 0 0 50px rgba(168, 85, 247, 0.12)',
          '0 0 20px rgba(99, 102, 241, 0.2), 0 0 40px rgba(99, 102, 241, 0.1)',
        ],
        transition: {
          duration: 4.0,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      },
    },
    cssKeyframes: `
      @keyframes quantum-glow-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2), 0 0 40px rgba(99, 102, 241, 0.1); }
        33% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.15); }
        66% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.25), 0 0 50px rgba(168, 85, 247, 0.12); }
      }
    `,
    tags: ['glow', 'pulse', 'quantum', 'ethereal'],
  },

  {
    id: 'glow-neon-edge',
    name: 'Neon Edge-Reactive UI',
    category: 'glow',
    description: 'Neon glow on element edges. Cyberpunk aesthetic.',
    intensity: 'normal',
    duration: 3.0,
    variants: {
      initial: {
        boxShadow: 'inset 0 0 0 1px rgba(34, 211, 238, 0.3), 0 0 15px rgba(34, 211, 238, 0.2)',
      },
      animate: {
        boxShadow: [
          'inset 0 0 0 1px rgba(34, 211, 238, 0.3), 0 0 15px rgba(34, 211, 238, 0.2)',
          'inset 0 0 0 1px rgba(34, 211, 238, 0.5), 0 0 25px rgba(34, 211, 238, 0.3)',
          'inset 0 0 0 1px rgba(34, 211, 238, 0.3), 0 0 15px rgba(34, 211, 238, 0.2)',
        ],
        transition: {
          duration: 3.0,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      },
    },
    tags: ['neon', 'edge', 'cyberpunk', 'reactive'],
  },

  {
    id: 'glow-soft-breathe',
    name: 'Glow Soft Breathe',
    category: 'glow',
    description: 'Gentle breathing glow effect. Calm and organic.',
    intensity: 'subtle',
    duration: 5.0,
    variants: {
      initial: {
        opacity: 0.7,
        boxShadow: '0 0 30px rgba(255, 255, 255, 0.05)',
      },
      animate: {
        opacity: [0.7, 1, 0.7],
        boxShadow: [
          '0 0 30px rgba(255, 255, 255, 0.05)',
          '0 0 50px rgba(255, 255, 255, 0.1)',
          '0 0 30px rgba(255, 255, 255, 0.05)',
        ],
        transition: {
          duration: 5.0,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      },
    },
    tags: ['soft', 'breathe', 'calm', 'organic'],
  },

  {
    id: 'glow-ring-expand',
    name: 'Glow Ring Expand',
    category: 'glow',
    description: 'Expanding ring of light emanating outward. Notification style.',
    intensity: 'normal',
    duration: 2.0,
    variants: {
      initial: {
        scale: 1,
        opacity: 1,
      },
      animate: {
        scale: [1, 1.5, 2],
        opacity: [0.4, 0.2, 0],
        transition: {
          duration: 2.0,
          ease: 'easeOut',
          repeat: Infinity,
          repeatDelay: 1.0,
        },
      },
    },
    tags: ['ring', 'expand', 'notification', 'attention'],
  },

  {
    id: 'glow-gradient-shift',
    name: 'Glow Gradient Shift',
    category: 'glow',
    description: 'Gradient colors slowly shift. Ambient background effect.',
    intensity: 'subtle',
    duration: 10.0,
    variants: {
      initial: {
        backgroundPosition: '0% 50%',
      },
      animate: {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        transition: {
          duration: 10.0,
          ease: 'linear',
          repeat: Infinity,
        },
      },
    },
    cssKeyframes: `
      .glow-gradient-shift {
        background: linear-gradient(-45deg,
          rgba(99, 102, 241, 0.1),
          rgba(168, 85, 247, 0.1),
          rgba(236, 72, 153, 0.1),
          rgba(59, 130, 246, 0.1)
        );
        background-size: 400% 400%;
        animation: gradient-shift 10s ease infinite;
      }
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `,
    tags: ['gradient', 'shift', 'ambient', 'background'],
  },

  {
    id: 'glow-text-highlight',
    name: 'Glow Text Highlight',
    category: 'glow',
    description: 'Soft glow behind text for emphasis. Readable and elegant.',
    intensity: 'subtle',
    duration: 0,
    variants: {
      initial: {
        textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
      },
      hover: {
        textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
        transition: { duration: 0.3 },
      },
    },
    tags: ['text', 'highlight', 'emphasis', 'readable'],
  },

  {
    id: 'glow-border-trace',
    name: 'Glow Border Trace',
    category: 'glow',
    description: 'Glowing light traces around border. Premium card effect.',
    intensity: 'normal',
    duration: 6.0,
    variants: {
      initial: {},
      animate: {},
    },
    cssKeyframes: `
      .glow-border-trace {
        position: relative;
        overflow: hidden;
      }
      .glow-border-trace::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          rgba(99, 102, 241, 0.5) 60deg,
          transparent 120deg
        );
        animation: border-trace 6s linear infinite;
        border-radius: inherit;
        z-index: -1;
      }
      .glow-border-trace::after {
        content: '';
        position: absolute;
        inset: 1px;
        background: inherit;
        border-radius: inherit;
        z-index: -1;
      }
      @keyframes border-trace {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
    tags: ['border', 'trace', 'premium', 'card'],
  },

  {
    id: 'glow-status-indicator',
    name: 'Glow Status Indicator',
    category: 'glow',
    description: 'Status dot with gentle pulsing glow. For online/active states.',
    intensity: 'subtle',
    duration: 2.0,
    variants: {
      initial: {
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)',
      },
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(34, 197, 94, 0.4)',
          '0 0 0 8px rgba(34, 197, 94, 0)',
        ],
        transition: {
          duration: 2.0,
          ease: 'easeOut',
          repeat: Infinity,
        },
      },
    },
    tags: ['status', 'indicator', 'online', 'active'],
  },

  {
    id: 'glow-hover-lift',
    name: 'Glow Hover Lift',
    category: 'glow',
    description: 'Element lifts with glow on hover. Interactive feedback.',
    intensity: 'normal',
    duration: 0.3,
    variants: {
      initial: {
        y: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      hover: {
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 30px rgba(99, 102, 241, 0.2)',
        transition: {
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1],
        },
      },
    },
    tags: ['hover', 'lift', 'interactive', 'feedback'],
  },
];

// Register all glow pulse presets
export function registerGlowPulsePresets(): void {
  AnimationRegistry.registerPresets(glowPulsePresets);
}

// Export variants
export const glowQuantumPulse = glowPulsePresets[0].variants;
export const glowNeonEdge = glowPulsePresets[1].variants;
export const glowSoftBreathe = glowPulsePresets[2].variants;
export const glowRingExpand = glowPulsePresets[3].variants;
export const glowGradientShift = glowPulsePresets[4].variants;
export const glowTextHighlight = glowPulsePresets[5].variants;
export const glowBorderTrace = glowPulsePresets[6].variants;
export const glowStatusIndicator = glowPulsePresets[7].variants;
export const glowHoverLift = glowPulsePresets[8].variants;

export default glowPulsePresets;
