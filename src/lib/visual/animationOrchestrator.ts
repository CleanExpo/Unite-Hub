/**
 * Animation Orchestrator
 *
 * Central coordination system for all visual animations.
 * Manages animation state, preferences, and accessibility.
 */

import { AnimationRegistry, AnimationPreset, AnimationCategory, prefersReducedMotion } from './animations/animationRegistry';
import { registerClipPresets } from './animations/presets/clip';
import { registerBeamPresets } from './animations/presets/beam';
import { registerFlashlightPresets } from './animations/presets/flashlight';
import { registerCardSwitchPresets } from './animations/presets/cardSwitch';
import { registerTransitionPresets } from './animations/presets/transitions';
import { registerGlowPulsePresets } from './animations/presets/glowPulse';

// ============================================================================
// TYPES
// ============================================================================

export type AnimationMode = 'full' | 'reduced' | 'minimal' | 'off';
export type PersonaType = 'trade' | 'corporate' | 'saas' | 'agency' | 'nonprofit' | 'creative' | 'default';

export interface OrchestratorConfig {
  mode: AnimationMode;
  persona: PersonaType;
  globalDurationMultiplier: number;
  enableFlashlight: boolean;
  enableMagnetic: boolean;
  enableIntro: boolean;
  debugMode: boolean;
}

export interface AnimationContext {
  pageType: string;
  sectionId?: string;
  elementType?: string;
  userInteraction?: 'hover' | 'click' | 'scroll' | 'focus';
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: OrchestratorConfig = {
  mode: 'full',
  persona: 'default',
  globalDurationMultiplier: 1.0,
  enableFlashlight: false,
  enableMagnetic: true,
  enableIntro: true,
  debugMode: false,
};

// ============================================================================
// PERSONA ANIMATION PREFERENCES
// ============================================================================

const personaPreferences: Record<PersonaType, Partial<OrchestratorConfig> & { preferredStyles: string[] }> = {
  trade: {
    mode: 'reduced',
    enableFlashlight: false,
    preferredStyles: ['card-morph-fx', 'transition-slide-up', 'glow-hover-lift'],
  },
  corporate: {
    mode: 'full',
    globalDurationMultiplier: 0.8,
    preferredStyles: ['clip-fade-radiance', 'transition-fade-through', 'glow-soft-breathe'],
  },
  saas: {
    mode: 'full',
    enableFlashlight: true,
    preferredStyles: ['beam-shimmer', 'card-tilt-hover', 'glow-quantum-pulse'],
  },
  agency: {
    mode: 'full',
    enableFlashlight: true,
    enableMagnetic: true,
    preferredStyles: ['beam-aurora', 'card-expand-hero', 'transition-split-reveal'],
  },
  nonprofit: {
    mode: 'reduced',
    globalDurationMultiplier: 1.2,
    preferredStyles: ['transition-fade-through', 'glow-soft-breathe', 'card-fade-scale'],
  },
  creative: {
    mode: 'full',
    enableFlashlight: true,
    enableMagnetic: true,
    preferredStyles: ['clip-iris-open', 'beam-aurora', 'glow-neon-edge'],
  },
  default: {
    preferredStyles: ['clip-fade-radiance', 'transition-slide-up', 'glow-hover-lift'],
  },
};

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

class AnimationOrchestratorClass {
  private config: OrchestratorConfig = { ...defaultConfig };
  private initialized: boolean = false;
  private activeAnimations: Map<string, string> = new Map();

  /**
   * Initialize the orchestrator and register all presets
   */
  initialize(customConfig?: Partial<OrchestratorConfig>): void {
    if (this.initialized) {
return;
}

    // Register all animation presets
    registerClipPresets();
    registerBeamPresets();
    registerFlashlightPresets();
    registerCardSwitchPresets();
    registerTransitionPresets();
    registerGlowPulsePresets();

    // Apply custom config
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Check for reduced motion preference
    if (typeof window !== 'undefined' && prefersReducedMotion()) {
      this.config.mode = 'reduced';
    }

    this.initialized = true;
    this.log('Animation Orchestrator initialized');
    this.log(`Registered ${AnimationRegistry.getPresetCount()} presets`);
  }

  /**
   * Set the current persona
   */
  setPersona(persona: PersonaType): void {
    this.config.persona = persona;
    const prefs = personaPreferences[persona];
    if (prefs) {
      this.config = { ...this.config, ...prefs };
    }
    this.log(`Persona set to: ${persona}`);
  }

  /**
   * Set animation mode
   */
  setMode(mode: AnimationMode): void {
    this.config.mode = mode;
    this.log(`Animation mode set to: ${mode}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get animation preset for context
   */
  getPresetForContext(
    category: AnimationCategory,
    context?: AnimationContext
  ): AnimationPreset | null {
    // If animations are off, return null
    if (this.config.mode === 'off') {
return null;
}

    // Get presets for category
    const presets = AnimationRegistry.getPresetsByCategory(category);
    if (presets.length === 0) {
return null;
}

    // Filter by intensity based on mode
    let filteredPresets = presets;
    if (this.config.mode === 'reduced') {
      filteredPresets = presets.filter(p => p.intensity === 'subtle');
    } else if (this.config.mode === 'minimal') {
      filteredPresets = presets.filter(p => p.intensity === 'subtle').slice(0, 1);
    }

    if (filteredPresets.length === 0) {
filteredPresets = presets;
}

    // Check persona preferences
    const personaPrefs = personaPreferences[this.config.persona];
    const preferredPreset = filteredPresets.find(p =>
      personaPrefs.preferredStyles.includes(p.id)
    );

    return preferredPreset || filteredPresets[0];
  }

  /**
   * Get recommended presets for persona
   */
  getRecommendedPresets(): AnimationPreset[] {
    const prefs = personaPreferences[this.config.persona];
    return prefs.preferredStyles
      .map(id => AnimationRegistry.getPreset(id))
      .filter((p): p is AnimationPreset => p !== undefined);
  }

  /**
   * Apply duration multiplier to animation
   */
  adjustDuration(baseDuration: number): number {
    return baseDuration * this.config.globalDurationMultiplier;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: 'flashlight' | 'magnetic' | 'intro'): boolean {
    switch (feature) {
      case 'flashlight':
        return this.config.enableFlashlight && this.config.mode !== 'off';
      case 'magnetic':
        return this.config.enableMagnetic && this.config.mode !== 'off';
      case 'intro':
        return this.config.enableIntro && this.config.mode !== 'off' && this.config.mode !== 'minimal';
      default:
        return false;
    }
  }

  /**
   * Set active animation for an element
   */
  setActiveAnimation(elementId: string, presetId: string): void {
    this.activeAnimations.set(elementId, presetId);
  }

  /**
   * Get active animation for an element
   */
  getActiveAnimation(elementId: string): string | undefined {
    return this.activeAnimations.get(elementId);
  }

  /**
   * Clear active animation
   */
  clearActiveAnimation(elementId: string): void {
    this.activeAnimations.delete(elementId);
  }

  /**
   * Get all presets grouped by category
   */
  getPresetsByCategory(): Record<AnimationCategory, AnimationPreset[]> {
    const categories: AnimationCategory[] = [
      'clip', 'beam', 'flashlight', 'cardSwitch', 'transition', 'glow', 'intro', 'scroll', 'hover', 'magnetic', '3d'
    ];

    return categories.reduce((acc, category) => {
      acc[category] = AnimationRegistry.getPresetsByCategory(category);
      return acc;
    }, {} as Record<AnimationCategory, AnimationPreset[]>);
  }

  /**
   * Search presets
   */
  searchPresets(query: string): AnimationPreset[] {
    return AnimationRegistry.searchPresets(query);
  }

  /**
   * Export current state for client preview
   */
  exportState(): {
    config: OrchestratorConfig;
    presetCount: number;
    activeAnimations: [string, string][];
    recommendedPresets: AnimationPreset[];
  } {
    return {
      config: this.config,
      presetCount: AnimationRegistry.getPresetCount(),
      activeAnimations: Array.from(this.activeAnimations.entries()),
      recommendedPresets: this.getRecommendedPresets(),
    };
  }

  /**
   * Debug logging
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[AnimationOrchestrator] ${message}`);
    }
  }
}

// Singleton instance
export const AnimationOrchestrator = new AnimationOrchestratorClass();

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  AnimationOrchestrator.initialize();
}

export default AnimationOrchestrator;
