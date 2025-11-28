/**
 * Animation Styles - Client-Friendly Named Styles
 *
 * These are the marketing-friendly names that clients can reference.
 * Each style combines multiple presets into a cohesive visual language.
 */

import { AnimationRegistry, AnimationStyle } from './animations/animationRegistry';

// ============================================================================
// CLIENT-FRIENDLY ANIMATION STYLES
// ============================================================================

export const animationStyles: AnimationStyle[] = [
  {
    id: 'clip-fade-radiance',
    name: 'Clip-Fade Radiance',
    description: 'Elegant circular reveal with soft fade. Perfect for hero sections and introductions. Creates a cinematic "iris open" effect.',
    presets: ['clip-fade-radiance', 'glow-soft-breathe'],
    persona: ['corporate', 'saas', 'agency'],
    mood: 'elegant',
  },
  {
    id: 'beam-sweep-alpha',
    name: 'Beam-Sweep Alpha',
    description: 'Subtle horizontal light sweep across elements. Adds polish without distraction. Great for cards and featured content.',
    presets: ['beam-sweep-alpha', 'glow-hover-lift'],
    persona: ['corporate', 'saas'],
    mood: 'professional',
  },
  {
    id: 'beam-sweep-omega',
    name: 'Beam-Sweep Omega',
    description: 'Vertical ascending light beam. Ethereal and calming. Ideal for spiritual, wellness, or premium brands.',
    presets: ['beam-sweep-omega', 'glow-soft-breathe'],
    persona: ['nonprofit', 'creative'],
    mood: 'calm',
  },
  {
    id: 'flashlight-cursor-tracking',
    name: 'Flashlight Cursor Tracking',
    description: 'Soft spotlight follows cursor movement. Creates an exploratory, interactive experience. Clients love this for portfolios.',
    presets: ['flashlight-cursor-soft', 'glow-gradient-shift'],
    persona: ['agency', 'creative', 'saas'],
    mood: 'interactive',
  },
  {
    id: 'switching-card-morph',
    name: 'Switching Card Morph FX',
    description: 'Cards transform smoothly between states. Fluid, organic transitions. Perfect for product showcases and galleries.',
    presets: ['card-morph-fx', 'card-tilt-hover', 'glow-hover-lift'],
    persona: ['saas', 'agency', 'creative'],
    mood: 'dynamic',
  },
  {
    id: 'glass-distortion-intro',
    name: 'Glass-Distortion Intro',
    description: 'Content emerges from frosted glass blur. Modern, premium feel. Excellent for SaaS dashboards and app interfaces.',
    presets: ['transition-blur-fade', 'beam-shimmer'],
    persona: ['saas', 'corporate'],
    mood: 'modern',
  },
  {
    id: 'quantum-glow-pulse',
    name: 'Quantum Glow Pulse',
    description: 'Mesmerizing color-shifting glow effect. Slow, hypnotic pulse. Great for tech brands and AI products.',
    presets: ['glow-quantum-pulse', 'beam-aurora'],
    persona: ['saas', 'creative', 'agency'],
    mood: 'futuristic',
  },
  {
    id: 'ribbon-trail-scroller',
    name: 'Ribbon-Trail Scroller',
    description: 'Smooth scroll animations with trailing ribbon effects. Creates depth and dimension during page scroll.',
    presets: ['transition-velocity-panel', 'transition-section-reveal'],
    persona: ['agency', 'creative'],
    mood: 'dynamic',
  },
  {
    id: 'magnetic-cursor-pull',
    name: 'Magnetic Cursor Pull',
    description: 'Interactive elements subtly pull toward cursor. Satisfying magnetic snap effect. Adds playful interactivity.',
    presets: ['card-magnetic-snap', 'flashlight-card-hover'],
    persona: ['agency', 'creative', 'saas'],
    mood: 'playful',
  },
  {
    id: 'split-reveal-slider',
    name: 'Split-Reveal Slider',
    description: 'Content splits apart to reveal new content. Dramatic, theatrical transition. Perfect for before/after showcases.',
    presets: ['transition-split-reveal', 'clip-curtain-reveal'],
    persona: ['agency', 'creative'],
    mood: 'dramatic',
  },
  {
    id: 'parallax-depth-field',
    name: 'Parallax Depth Field',
    description: 'Multi-layer parallax creating 3D depth. Cinematic scroll experience. Immersive storytelling.',
    presets: ['transition-parallax-layers', 'beam-shimmer'],
    persona: ['agency', 'creative', 'corporate'],
    mood: 'immersive',
  },
  {
    id: 'neon-edge-reactive',
    name: 'Neon Edge-Reactive UI',
    description: 'Cyberpunk-inspired neon border effects. Reactive to hover and focus. Bold and attention-grabbing.',
    presets: ['glow-neon-edge', 'glow-border-trace'],
    persona: ['creative', 'saas'],
    mood: 'bold',
  },
  {
    id: 'soft-material-morph',
    name: 'Soft-Material Morph Drift',
    description: 'Organic shape morphing with soft materials. Gentle, flowing transitions. Approachable and friendly.',
    presets: ['transition-morph-container', 'glow-soft-breathe'],
    persona: ['nonprofit', 'corporate'],
    mood: 'friendly',
  },
  {
    id: 'velocity-triggered-panels',
    name: 'Velocity-Triggered Panels',
    description: 'Panels animate based on scroll speed. Dynamic response to user interaction. Creates urgency and energy.',
    presets: ['transition-velocity-panel', 'card-stagger-grid'],
    persona: ['saas', 'agency'],
    mood: 'energetic',
  },
  {
    id: 'cinematic-iris-open',
    name: 'Cinematic Iris Open',
    description: 'Film-style iris transition. Classic Hollywood feel. Perfect for video-centric sites and creative portfolios.',
    presets: ['clip-iris-open', 'glow-soft-breathe'],
    persona: ['creative', 'agency'],
    mood: 'cinematic',
  },
];

// ============================================================================
// MOOD-BASED GROUPINGS
// ============================================================================

export const stylesByMood: Record<string, AnimationStyle[]> = {
  professional: animationStyles.filter(s => s.mood === 'professional' || s.mood === 'elegant'),
  playful: animationStyles.filter(s => s.mood === 'playful' || s.mood === 'dynamic'),
  calm: animationStyles.filter(s => s.mood === 'calm' || s.mood === 'friendly'),
  bold: animationStyles.filter(s => s.mood === 'bold' || s.mood === 'dramatic'),
  futuristic: animationStyles.filter(s => s.mood === 'futuristic' || s.mood === 'modern'),
  immersive: animationStyles.filter(s => s.mood === 'immersive' || s.mood === 'cinematic'),
};

// ============================================================================
// PERSONA-BASED RECOMMENDATIONS
// ============================================================================

export const stylesForPersona: Record<string, AnimationStyle[]> = {
  trade: animationStyles.filter(s => s.persona?.includes('trade') || s.mood === 'professional'),
  corporate: animationStyles.filter(s => s.persona?.includes('corporate')),
  saas: animationStyles.filter(s => s.persona?.includes('saas')),
  agency: animationStyles.filter(s => s.persona?.includes('agency')),
  nonprofit: animationStyles.filter(s => s.persona?.includes('nonprofit')),
  creative: animationStyles.filter(s => s.persona?.includes('creative')),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get style by ID
 */
export function getStyleById(id: string): AnimationStyle | undefined {
  return animationStyles.find(s => s.id === id);
}

/**
 * Get styles by mood
 */
export function getStylesByMood(mood: string): AnimationStyle[] {
  return stylesByMood[mood] || [];
}

/**
 * Get recommended styles for persona
 */
export function getRecommendedStyles(persona: string): AnimationStyle[] {
  return stylesForPersona[persona] || animationStyles.slice(0, 5);
}

/**
 * Search styles by name or description
 */
export function searchStyles(query: string): AnimationStyle[] {
  const q = query.toLowerCase();
  return animationStyles.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.mood.toLowerCase().includes(q)
  );
}

/**
 * Register all styles with the registry
 */
export function registerAllStyles(): void {
  animationStyles.forEach(style => {
    AnimationRegistry.registerStyle(style);
  });
}

// Auto-register on import
if (typeof window !== 'undefined') {
  registerAllStyles();
}

export default animationStyles;
