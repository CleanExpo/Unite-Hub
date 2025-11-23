/**
 * Brand Compliance Engine
 * Phase 63: Validate brand consistency across all outputs
 */

export interface BrandComplianceResult {
  compliant: boolean;
  score: number;
  issues: BrandIssue[];
  suggestions: string[];
}

export interface BrandIssue {
  type: 'color' | 'typography' | 'tone' | 'imagery' | 'layout';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

// Forbidden brand elements
const FORBIDDEN_ELEMENTS = {
  colors: ['#ff0000', '#00ff00'], // Example forbidden colors
  phrases: [
    'guaranteed results',
    'instant success',
    'overnight growth',
    '10x your',
    'dominate the market',
    'crush the competition',
  ],
  styles: ['comic sans', 'papyrus', 'impact'],
};

/**
 * Brand Compliance Engine
 * Validates outputs against brand guidelines
 */
export class BrandComplianceEngine {
  /**
   * Check content for brand compliance
   */
  checkContent(content: {
    text?: string;
    colors?: string[];
    fonts?: string[];
    imagery?: string[];
  }): BrandComplianceResult {
    const issues: BrandIssue[] = [];
    let score = 100;

    // Check text for forbidden phrases
    if (content.text) {
      for (const phrase of FORBIDDEN_ELEMENTS.phrases) {
        if (content.text.toLowerCase().includes(phrase.toLowerCase())) {
          issues.push({
            type: 'tone',
            severity: 'high',
            description: `Contains forbidden phrase: "${phrase}"`,
          });
          score -= 15;
        }
      }
    }

    // Check colors
    if (content.colors) {
      for (const color of content.colors) {
        if (FORBIDDEN_ELEMENTS.colors.includes(color.toLowerCase())) {
          issues.push({
            type: 'color',
            severity: 'medium',
            description: `Uses forbidden color: ${color}`,
          });
          score -= 10;
        }
      }
    }

    // Check fonts
    if (content.fonts) {
      for (const font of content.fonts) {
        if (FORBIDDEN_ELEMENTS.styles.some((s) => font.toLowerCase().includes(s))) {
          issues.push({
            type: 'typography',
            severity: 'high',
            description: `Uses forbidden font: ${font}`,
          });
          score -= 15;
        }
      }
    }

    const suggestions: string[] = [];
    if (issues.length > 0) {
      suggestions.push('Review brand guidelines before publishing');
      if (issues.some((i) => i.type === 'tone')) {
        suggestions.push('Use approved tone of voice keywords');
      }
      if (issues.some((i) => i.type === 'color')) {
        suggestions.push('Use colors from approved brand palette');
      }
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Validate against client brand signature
   */
  validateAgainstSignature(
    content: Record<string, any>,
    signature: {
      primary_colors: string[];
      secondary_colors: string[];
      tone_of_voice: string;
      typography: { heading_font: string; body_font: string };
    }
  ): BrandComplianceResult {
    const issues: BrandIssue[] = [];
    let score = 100;

    // Check colors match signature
    if (content.colors) {
      const allowedColors = [...signature.primary_colors, ...signature.secondary_colors];
      for (const color of content.colors) {
        if (!allowedColors.some((ac) => this.colorsMatch(color, ac))) {
          issues.push({
            type: 'color',
            severity: 'medium',
            description: `Color ${color} not in brand palette`,
          });
          score -= 10;
        }
      }
    }

    // Check fonts match signature
    if (content.fonts) {
      const allowedFonts = [signature.typography.heading_font, signature.typography.body_font];
      for (const font of content.fonts) {
        if (!allowedFonts.some((af) => font.toLowerCase().includes(af.toLowerCase()))) {
          issues.push({
            type: 'typography',
            severity: 'low',
            description: `Font ${font} not in brand typography`,
          });
          score -= 5;
        }
      }
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues,
      suggestions: issues.length > 0 ? ['Align content with brand signature'] : [],
    };
  }

  private colorsMatch(color1: string, color2: string): boolean {
    return color1.toLowerCase() === color2.toLowerCase();
  }
}

export default BrandComplianceEngine;
