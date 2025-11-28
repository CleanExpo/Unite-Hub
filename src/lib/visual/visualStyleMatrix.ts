/**
 * Visual Style Matrix for Synthex.social
 * Phase 10: UX-02 Visual System Integration
 *
 * Defines visual styles A-D and how they blend per persona
 */

import { getPersona, VisualPersona, StyleMix } from './visualPersonas';

/**
 * Visual Style Definitions
 */
export interface VisualStyle {
  id: string;
  label: string;
  description: string;
  cssVariables: Record<string, string>;
  imagePromptModifiers: string[];
  videoPromptModifiers: string[];
  typography: {
    headingWeight: number;
    bodyWeight: number;
    letterSpacing: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
}

export const VISUAL_STYLES: Record<string, VisualStyle> = {
  // A - Corporate Tech Premium
  industrial_metallic: {
    id: 'industrial_metallic',
    label: 'Corporate Tech Premium',
    description: 'Dark, metallic, high-contrast, strong geometry',
    cssVariables: {
      '--primary': '#347bf7',
      '--secondary': '#0d2a5c',
      '--accent': '#00d4aa',
      '--background': '#0a1e3b',
      '--foreground': '#ffffff',
      '--muted': '#1a3a5c',
      '--border': '#2a4a7c',
    },
    imagePromptModifiers: [
      'dark background',
      'metallic accents',
      'high contrast',
      'geometric shapes',
      'professional lighting',
      'tech aesthetic',
    ],
    videoPromptModifiers: [
      'slow camera movement',
      'metallic surfaces',
      'dark atmosphere',
      'subtle reflections',
    ],
    typography: {
      headingWeight: 800,
      bodyWeight: 400,
      letterSpacing: '-0.02em',
    },
    shadows: {
      small: '0 2px 8px rgba(0,0,0,0.3)',
      medium: '0 8px 24px rgba(0,0,0,0.4)',
      large: '0 16px 48px rgba(0,0,0,0.5)',
    },
    borderRadius: '8px',
  },

  // B - Clean SaaS
  saas_minimal: {
    id: 'saas_minimal',
    label: 'Clean SaaS',
    description: 'White space, soft shadows, pastel accents, calm visuals',
    cssVariables: {
      '--primary': '#007bff',
      '--secondary': '#6c63ff',
      '--accent': '#28a745',
      '--background': '#ffffff',
      '--foreground': '#1a1a1a',
      '--muted': '#f4f7fa',
      '--border': '#e2e8f0',
    },
    imagePromptModifiers: [
      'clean white background',
      'soft shadows',
      'minimal design',
      'pastel accents',
      'professional',
      'organized',
    ],
    videoPromptModifiers: [
      'smooth transitions',
      'clean aesthetic',
      'soft lighting',
      'minimal motion',
    ],
    typography: {
      headingWeight: 700,
      bodyWeight: 400,
      letterSpacing: '-0.01em',
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 4px 12px rgba(0,0,0,0.1)',
      large: '0 8px 32px rgba(0,0,0,0.12)',
    },
    borderRadius: '12px',
  },

  // C - Creator / high-energy
  creator_energy: {
    id: 'creator_energy',
    label: 'Creator Energy',
    description: 'Bold colour, motion graphics, video hero',
    cssVariables: {
      '--primary': '#ff5722',
      '--secondary': '#ff784e',
      '--accent': '#ffc107',
      '--background': '#1a1a1a',
      '--foreground': '#ffffff',
      '--muted': '#2d2d2d',
      '--border': '#404040',
    },
    imagePromptModifiers: [
      'vibrant colors',
      'dynamic composition',
      'bold graphics',
      'energetic',
      'creative',
      'modern',
    ],
    videoPromptModifiers: [
      'fast cuts',
      'dynamic camera',
      'bold colors',
      'high energy',
      'motion graphics',
    ],
    typography: {
      headingWeight: 900,
      bodyWeight: 500,
      letterSpacing: '0em',
    },
    shadows: {
      small: '0 2px 8px rgba(255,87,34,0.2)',
      medium: '0 8px 24px rgba(255,87,34,0.3)',
      large: '0 16px 48px rgba(255,87,34,0.4)',
    },
    borderRadius: '16px',
  },

  // D - Real-world small business + trades
  trades_hybrid: {
    id: 'trades_hybrid',
    label: 'Trades & Local Business',
    description: 'Practical, relatable, tool & site imagery',
    cssVariables: {
      '--primary': '#007bff',
      '--secondary': '#28a745',
      '--accent': '#ff5722',
      '--background': '#f8f9fa',
      '--foreground': '#212529',
      '--muted': '#e9ecef',
      '--border': '#dee2e6',
    },
    imagePromptModifiers: [
      'real world setting',
      'practical tools',
      'worksite environment',
      'authentic people',
      'local business',
      'relatable',
    ],
    videoPromptModifiers: [
      'documentary style',
      'natural lighting',
      'real locations',
      'authentic movement',
    ],
    typography: {
      headingWeight: 700,
      bodyWeight: 400,
      letterSpacing: '0em',
    },
    shadows: {
      small: '0 1px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 16px rgba(0,0,0,0.15)',
      large: '0 8px 32px rgba(0,0,0,0.2)',
    },
    borderRadius: '8px',
  },
};

/**
 * Visual Profile - computed from persona and style mix
 */
export interface VisualProfile {
  personaId: string;
  dominantStyle: string;
  styleMix: StyleMix;
  computedPromptModifiers: string[];
  computedVideoModifiers: string[];
  cssVariables: Record<string, string>;
  typography: {
    headingWeight: number;
    bodyWeight: number;
    letterSpacing: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
}

/**
 * Select visual profile based on persona and optional overrides
 */
export function selectVisualProfile(
  personaId: string | null,
  options?: {
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    trafficSource?: string;
    preferDarkMode?: boolean;
  }
): VisualProfile {
  const persona = getPersona(personaId);
  const styleMix = persona.suggestedVisualStyleMix;

  // Determine dominant style
  const dominantStyle = Object.entries(styleMix)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Get dominant style definition
  const dominant = VISUAL_STYLES[dominantStyle];

  // Compute blended prompt modifiers based on style mix
  const computedPromptModifiers: string[] = [];
  const computedVideoModifiers: string[] = [];

  for (const [styleId, weight] of Object.entries(styleMix)) {
    if (weight > 0.1) { // Only include styles with >10% weight
      const style = VISUAL_STYLES[styleId];
      // Add top 2 modifiers from each significant style
      computedPromptModifiers.push(...style.imagePromptModifiers.slice(0, Math.ceil(weight * 4)));
      computedVideoModifiers.push(...style.videoPromptModifiers.slice(0, Math.ceil(weight * 2)));
    }
  }

  // Deduplicate
  const uniquePromptMods = [...new Set(computedPromptModifiers)];
  const uniqueVideoMods = [...new Set(computedVideoModifiers)];

  // Blend CSS variables (use dominant style as base)
  let cssVariables = { ...dominant.cssVariables };

  // If dark mode preference, adjust background/foreground
  if (options?.preferDarkMode && dominantStyle !== 'industrial_metallic' && dominantStyle !== 'creator_energy') {
    cssVariables = {
      ...cssVariables,
      '--background': '#0a1e3b',
      '--foreground': '#ffffff',
      '--muted': '#1a3a5c',
    };
  }

  return {
    personaId: persona.id,
    dominantStyle,
    styleMix,
    computedPromptModifiers: uniquePromptMods,
    computedVideoModifiers: uniqueVideoMods,
    cssVariables,
    typography: dominant.typography,
    shadows: dominant.shadows,
    borderRadius: dominant.borderRadius,
  };
}

/**
 * Generate image prompt from visual profile
 */
export function generateImagePrompt(
  basePrompt: string,
  profile: VisualProfile
): string {
  const modifiers = profile.computedPromptModifiers.slice(0, 5).join(', ');
  return `${basePrompt}. Style: ${modifiers}. Professional quality, high resolution.`;
}

/**
 * Generate video prompt from visual profile
 */
export function generateVideoPrompt(
  basePrompt: string,
  profile: VisualProfile
): string {
  const modifiers = profile.computedVideoModifiers.slice(0, 3).join(', ');
  return `${basePrompt}. Visual style: ${modifiers}. Professional production quality.`;
}

/**
 * Get CSS variables string for injection
 */
export function getCSSVariablesString(profile: VisualProfile): string {
  return Object.entries(profile.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

export default VISUAL_STYLES;
