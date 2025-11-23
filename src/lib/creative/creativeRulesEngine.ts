/**
 * Creative Rules Engine
 * Phase 61: Brand rules, color, typography, tone, visual signatures
 */

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface TypographyScale {
  heading_font: string;
  body_font: string;
  mono_font: string;
  sizes: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  line_heights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  font_weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface ToneOfVoice {
  primary: string;
  characteristics: string[];
  do_use: string[];
  dont_use: string[];
  examples: {
    good: string;
    bad: string;
  }[];
}

export interface IconographyStyle {
  style: 'outline' | 'solid' | 'duotone' | 'custom';
  stroke_width: number;
  corner_radius: number;
  size_scale: number[];
}

export interface GridSpacing {
  base_unit: number;
  columns: number;
  gutter: number;
  margin: number;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
}

export interface MotionStyle {
  type: 'subtle' | 'dynamic' | 'minimal' | 'none';
  duration_scale: number;
  easing: string;
  entrance_animation: string;
  exit_animation: string;
}

export interface BrandRules {
  id: string;
  client_id: string;
  colors: ColorPalette;
  typography: TypographyScale;
  tone: ToneOfVoice;
  iconography: IconographyStyle;
  grid: GridSpacing;
  motion: MotionStyle;
  created_at: string;
  updated_at: string;
}

// Industry-specific defaults
const INDUSTRY_DEFAULTS: Record<string, Partial<BrandRules>> = {
  restoration: {
    tone: {
      primary: 'Professional and reassuring',
      characteristics: ['empathetic', 'knowledgeable', 'prompt', 'trustworthy'],
      do_use: ['we understand', 'immediate response', 'expert team', 'certified'],
      dont_use: ['disaster', 'catastrophe', 'worst case', 'emergency panic'],
      examples: [
        {
          good: 'Our team responds within 60 minutes to begin the restoration process.',
          bad: 'Call now before the disaster gets worse!',
        },
      ],
    },
    motion: {
      type: 'subtle',
      duration_scale: 1,
      easing: 'ease-out',
      entrance_animation: 'fade-in',
      exit_animation: 'fade-out',
    },
  },
  trades: {
    tone: {
      primary: 'Direct and reliable',
      characteristics: ['straightforward', 'skilled', 'honest', 'dependable'],
      do_use: ['quality work', 'fair pricing', 'licensed', 'guaranteed'],
      dont_use: ['cheap', 'budget', 'quick fix', 'no questions asked'],
      examples: [
        {
          good: 'Licensed electricians with 20+ years of experience.',
          bad: 'Cheapest rates in town! No job too small!',
        },
      ],
    },
    motion: {
      type: 'minimal',
      duration_scale: 0.8,
      easing: 'ease-in-out',
      entrance_animation: 'slide-in',
      exit_animation: 'slide-out',
    },
  },
  consulting: {
    tone: {
      primary: 'Authoritative yet approachable',
      characteristics: ['insightful', 'strategic', 'collaborative', 'results-focused'],
      do_use: ['strategy', 'insights', 'growth', 'partnership', 'expertise'],
      dont_use: ['guaranteed', 'overnight', 'instant', 'magic'],
      examples: [
        {
          good: 'We partner with you to develop data-driven growth strategies.',
          bad: 'We guarantee to 10x your revenue overnight!',
        },
      ],
    },
    motion: {
      type: 'subtle',
      duration_scale: 1.2,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      entrance_animation: 'fade-up',
      exit_animation: 'fade-down',
    },
  },
  local_services: {
    tone: {
      primary: 'Friendly and local',
      characteristics: ['neighborly', 'accessible', 'trusted', 'community-focused'],
      do_use: ['local', 'family-owned', 'community', 'neighbors'],
      dont_use: ['corporate', 'franchise', 'automated', 'impersonal'],
      examples: [
        {
          good: 'Serving Brisbane families for over 15 years.',
          bad: 'Part of a national chain with thousands of locations.',
        },
      ],
    },
    motion: {
      type: 'dynamic',
      duration_scale: 1,
      easing: 'ease-out',
      entrance_animation: 'bounce-in',
      exit_animation: 'fade-out',
    },
  },
};

/**
 * Creative Rules Engine
 * Defines and validates brand rules
 */
export class CreativeRulesEngine {
  /**
   * Generate default brand rules for an industry
   */
  generateDefaults(industry: string): Partial<BrandRules> {
    const industryKey = industry.toLowerCase().replace(/\s+/g, '_');
    const defaults = INDUSTRY_DEFAULTS[industryKey] || {};

    return {
      colors: this.generateDefaultColors(),
      typography: this.generateDefaultTypography(),
      iconography: this.generateDefaultIconography(),
      grid: this.generateDefaultGrid(),
      ...defaults,
    };
  }

  /**
   * Validate colors against accessibility standards
   */
  validateColorContrast(foreground: string, background: string): {
    ratio: number;
    wcag_aa: boolean;
    wcag_aaa: boolean;
  } {
    const ratio = this.calculateContrastRatio(foreground, background);
    return {
      ratio,
      wcag_aa: ratio >= 4.5,
      wcag_aaa: ratio >= 7,
    };
  }

  /**
   * Check if text matches tone of voice
   */
  validateTone(text: string, tone: ToneOfVoice): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80;

    // Check for forbidden words
    for (const word of tone.dont_use) {
      if (text.toLowerCase().includes(word.toLowerCase())) {
        issues.push(`Contains discouraged phrase: "${word}"`);
        score -= 10;
      }
    }

    // Check for preferred words
    let hasPreferred = false;
    for (const word of tone.do_use) {
      if (text.toLowerCase().includes(word.toLowerCase())) {
        hasPreferred = true;
        break;
      }
    }

    if (!hasPreferred && tone.do_use.length > 0) {
      suggestions.push(`Consider using: ${tone.do_use.slice(0, 3).join(', ')}`);
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Validate typography usage
   */
  validateTypography(
    fontSize: number,
    fontWeight: number,
    lineHeight: number,
    rules: TypographyScale
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check font size is in scale
    const validSizes = Object.values(rules.sizes);
    if (!validSizes.includes(fontSize)) {
      issues.push(`Font size ${fontSize}px not in typography scale`);
    }

    // Check font weight
    const validWeights = Object.values(rules.font_weights);
    if (!validWeights.includes(fontWeight)) {
      issues.push(`Font weight ${fontWeight} not in typography scale`);
    }

    // Check line height
    const validLineHeights = Object.values(rules.line_heights);
    if (!validLineHeights.includes(lineHeight)) {
      issues.push(`Line height ${lineHeight} not in typography scale`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate spacing against grid
   */
  validateSpacing(value: number, grid: GridSpacing): boolean {
    return value % grid.base_unit === 0;
  }

  // Private helper methods

  private generateDefaultColors(): ColorPalette {
    return {
      primary: ['#2563eb', '#1d4ed8', '#1e40af'],
      secondary: ['#64748b', '#475569', '#334155'],
      accent: ['#f59e0b', '#d97706'],
      neutral: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
      semantic: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    };
  }

  private generateDefaultTypography(): TypographyScale {
    return {
      heading_font: 'Inter',
      body_font: 'Inter',
      mono_font: 'JetBrains Mono',
      sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
      },
      line_heights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
      font_weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    };
  }

  private generateDefaultIconography(): IconographyStyle {
    return {
      style: 'outline',
      stroke_width: 1.5,
      corner_radius: 4,
      size_scale: [16, 20, 24, 32, 48],
    };
  }

  private generateDefaultGrid(): GridSpacing {
    return {
      base_unit: 4,
      columns: 12,
      gutter: 16,
      margin: 24,
      breakpoints: {
        mobile: 320,
        tablet: 768,
        desktop: 1024,
        wide: 1280,
      },
    };
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;

      const [rs, gs, bs] = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }
}

export default CreativeRulesEngine;
