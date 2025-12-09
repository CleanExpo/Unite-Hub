/**
 * Animation Registry - Central Hub for Visual Experience Engine
 *
 * This registry maintains all animation presets, styles, and configurations.
 * Clients can reference animations by name (e.g., "Beam-Sweep Alpha").
 */

import { Variants, Transition, TargetAndTransition } from 'framer-motion';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AnimationCategory =
  | 'clip'
  | 'beam'
  | 'flashlight'
  | 'cardSwitch'
  | 'transition'
  | 'glow'
  | 'intro'
  | 'scroll'
  | 'hover'
  | 'magnetic'
  | '3d';

export type AnimationIntensity = 'subtle' | 'normal' | 'dramatic';

export interface AnimationPreset {
  id: string;
  name: string;                    // Client-friendly name (e.g., "Beam-Sweep Alpha")
  category: AnimationCategory;
  description: string;
  intensity: AnimationIntensity;
  duration: number;                // in seconds
  variants: Variants;
  transition?: Transition;
  cssKeyframes?: string;           // For CSS-based animations
  tags: string[];                  // For searchability
  previewGif?: string;             // Preview image URL
  codeExample?: string;            // How to use
}

export interface AnimationStyle {
  id: string;
  name: string;                    // Marketing name clients see
  presets: string[];               // Array of preset IDs this style uses
  persona?: string[];              // Target personas (trade, corporate, saas, etc.)
  mood: string;                    // "energetic", "calm", "professional", "playful"
  description: string;
}

// ============================================================================
// REGISTRY STATE
// ============================================================================

class AnimationRegistryClass {
  private presets: Map<string, AnimationPreset> = new Map();
  private styles: Map<string, AnimationStyle> = new Map();
  private activePresets: Set<string> = new Set();

  // Register a new animation preset
  registerPreset(preset: AnimationPreset): void {
    this.presets.set(preset.id, preset);
  }

  // Register multiple presets at once
  registerPresets(presets: AnimationPreset[]): void {
    presets.forEach(preset => this.registerPreset(preset));
  }

  // Register a named style (collection of presets)
  registerStyle(style: AnimationStyle): void {
    this.styles.set(style.id, style);
  }

  // Get a preset by ID
  getPreset(id: string): AnimationPreset | undefined {
    return this.presets.get(id);
  }

  // Get a style by ID
  getStyle(id: string): AnimationStyle | undefined {
    return this.styles.get(id);
  }

  // Get all presets in a category
  getPresetsByCategory(category: AnimationCategory): AnimationPreset[] {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  // Get all presets by tag
  getPresetsByTag(tag: string): AnimationPreset[] {
    return Array.from(this.presets.values()).filter(p =>
      p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  // Get all styles for a persona
  getStylesForPersona(persona: string): AnimationStyle[] {
    return Array.from(this.styles.values()).filter(s =>
      s.persona?.includes(persona)
    );
  }

  // Get all registered presets
  getAllPresets(): AnimationPreset[] {
    return Array.from(this.presets.values());
  }

  // Get all registered styles
  getAllStyles(): AnimationStyle[] {
    return Array.from(this.styles.values());
  }

  // Activate a preset (for demo mode)
  activatePreset(id: string): void {
    this.activePresets.add(id);
  }

  // Deactivate a preset
  deactivatePreset(id: string): void {
    this.activePresets.delete(id);
  }

  // Check if preset is active
  isPresetActive(id: string): boolean {
    return this.activePresets.has(id);
  }

  // Get active presets
  getActivePresets(): AnimationPreset[] {
    return Array.from(this.activePresets)
      .map(id => this.presets.get(id))
      .filter((p): p is AnimationPreset => p !== undefined);
  }

  // Search presets by name or description
  searchPresets(query: string): AnimationPreset[] {
    const q = query.toLowerCase();
    return Array.from(this.presets.values()).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Get preset count
  getPresetCount(): number {
    return this.presets.size;
  }

  // Get style count
  getStyleCount(): number {
    return this.styles.size;
  }

  // Export registry for client preview
  exportForClient(): { presets: AnimationPreset[]; styles: AnimationStyle[] } {
    return {
      presets: this.getAllPresets(),
      styles: this.getAllStyles(),
    };
  }
}

// Singleton instance
export const AnimationRegistry = new AnimationRegistryClass();

// ============================================================================
// COMMON TRANSITIONS
// ============================================================================

export const CommonTransitions = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,

  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  } as Transition,

  springSmooth: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  } as Transition,

  easeOut: {
    duration: 0.5,
    ease: [0.33, 1, 0.68, 1],
  } as Transition,

  easeInOut: {
    duration: 0.6,
    ease: [0.65, 0, 0.35, 1],
  } as Transition,

  dramatic: {
    duration: 0.8,
    ease: [0.34, 1.56, 0.64, 1],
  } as Transition,

  fast: {
    duration: 0.2,
    ease: 'easeOut',
  } as Transition,

  slow: {
    duration: 1.2,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create stagger animation for children
 */
export function createStaggerChildren(
  staggerDelay: number = 0.1,
  delayChildren: number = 0
): Transition {
  return {
    staggerChildren: staggerDelay,
    delayChildren,
  };
}

/**
 * Create a variant with enter/exit states
 */
export function createEnterExitVariant(
  initial: TargetAndTransition,
  animate: TargetAndTransition,
  exit?: TargetAndTransition
): Variants {
  return {
    initial,
    animate,
    exit: exit || initial,
  };
}

/**
 * Get CSS keyframes string from preset
 */
export function getKeyframesCSS(presetId: string): string | null {
  const preset = AnimationRegistry.getPreset(presetId);
  return preset?.cssKeyframes || null;
}

/**
 * Helper to check reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
return false;
}
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation with reduced motion fallback
 */
export function getAccessibleAnimation(presetId: string): AnimationPreset | null {
  if (prefersReducedMotion()) {
    // Return a minimal fade-only version
    return {
      id: `${presetId}-reduced`,
      name: 'Reduced Motion',
      category: 'transition',
      description: 'Accessibility-friendly minimal animation',
      intensity: 'subtle',
      duration: 0.2,
      variants: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      tags: ['accessible', 'reduced-motion'],
    };
  }
  return AnimationRegistry.getPreset(presetId) || null;
}

export default AnimationRegistry;
