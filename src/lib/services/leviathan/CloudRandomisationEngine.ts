/**
 * CloudRandomisationEngine - Anti-Footprint Randomization
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - Template variant selection
 * - Color scheme randomization
 * - Font family rotation
 * - Layout variation
 * - Timing offset generation
 * - Provider distribution
 */

import * as crypto from 'crypto';

export interface RandomisationConfig {
  variantCount: number;
  providers: ('aws' | 'gcs' | 'azure' | 'netlify')[];
  seed?: number;
}

export interface VariantSpec {
  variantIndex: number;
  seed: number;
  provider: 'aws' | 'gcs' | 'azure' | 'netlify';
  templateVariant: string;
  colorScheme: ColorScheme;
  fontFamily: string;
  layoutVariant: string;
  publishDelayMs: number;
  cssModifications: CSSModifications;
  htmlModifications: HTMLModifications;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface CSSModifications {
  borderRadius: string;
  spacing: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface HTMLModifications {
  classPrefix: string;
  idPrefix: string;
  dataAttributes: Record<string, string>;
}

// Template variants
const TEMPLATE_VARIANTS = [
  'modern-clean',
  'corporate-professional',
  'minimal-elegant',
  'bold-dynamic',
  'classic-traditional',
  'tech-forward',
  'creative-artistic',
  'startup-fresh',
];

// Color palettes (all accessible, professional)
const COLOR_PALETTES: ColorScheme[] = [
  {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1e293b',
    muted: '#64748b',
  },
  {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#6366f1',
    background: '#f8fafc',
    text: '#0f172a',
    muted: '#475569',
  },
  {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#fefce8',
    text: '#18181b',
    muted: '#52525b',
  },
  {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#3b82f6',
    background: '#fff7ed',
    text: '#292524',
    muted: '#57534e',
  },
  {
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#f97316',
    background: '#ecfdf5',
    text: '#134e4a',
    muted: '#5eead4',
  },
  {
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#22c55e',
    background: '#f5f5f4',
    text: '#1c1917',
    muted: '#78716c',
  },
];

// Font stacks
const FONT_FAMILIES = [
  "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  "'Roboto', 'Helvetica Neue', Arial, sans-serif",
  "'Open Sans', 'Segoe UI', Tahoma, sans-serif",
  "'Lato', 'Lucida Grande', Geneva, sans-serif",
  "'Source Sans Pro', 'Trebuchet MS', sans-serif",
  "'Poppins', 'Verdana', sans-serif",
  "'Montserrat', 'Arial Black', sans-serif",
  "'Nunito', 'DejaVu Sans', sans-serif",
];

// Layout variants
const LAYOUT_VARIANTS = [
  'centered-hero',
  'split-screen',
  'card-grid',
  'full-bleed',
  'sidebar-main',
  'stacked-sections',
  'asymmetric',
  'masonry-flow',
];

export class CloudRandomisationEngine {
  private baseSeed: number;
  private random: () => number;

  constructor(seed?: number) {
    this.baseSeed = seed || Date.now();
    this.random = this.createSeededRandom(this.baseSeed);
  }

  /**
   * Generate variant specifications for deployment
   */
  generateVariants(config: RandomisationConfig): VariantSpec[] {
    const variants: VariantSpec[] = [];
    const providerCounts: Record<string, number> = {};

    // Initialize provider counts
    for (const provider of config.providers) {
      providerCounts[provider] = 0;
    }

    for (let i = 0; i < config.variantCount; i++) {
      const variantSeed = this.hashToNumber(`${this.baseSeed}-variant-${i}`);
      const variantRandom = this.createSeededRandom(variantSeed);

      // Distribute providers evenly with some randomization
      const provider = this.selectProvider(config.providers, providerCounts, variantRandom);
      providerCounts[provider]++;

      const variant: VariantSpec = {
        variantIndex: i,
        seed: variantSeed,
        provider,
        templateVariant: this.selectFromArray(TEMPLATE_VARIANTS, variantRandom),
        colorScheme: this.selectFromArray(COLOR_PALETTES, variantRandom),
        fontFamily: this.selectFromArray(FONT_FAMILIES, variantRandom),
        layoutVariant: this.selectFromArray(LAYOUT_VARIANTS, variantRandom),
        publishDelayMs: this.generatePublishDelay(i, config.variantCount, variantRandom),
        cssModifications: this.generateCSSModifications(variantRandom),
        htmlModifications: this.generateHTMLModifications(i, variantRandom),
      };

      variants.push(variant);
    }

    return variants;
  }

  /**
   * Apply randomization to HTML content
   */
  applyToHTML(html: string, variant: VariantSpec): string {
    let modified = html;

    // Replace class prefixes
    modified = modified.replace(
      /class="([^"]+)"/g,
      (match, classes) => {
        const prefixed = classes
          .split(' ')
          .map((c: string) => `${variant.htmlModifications.classPrefix}${c}`)
          .join(' ');
        return `class="${prefixed}"`;
      }
    );

    // Add data attributes
    const dataAttrs = Object.entries(variant.htmlModifications.dataAttributes)
      .map(([key, value]) => `data-${key}="${value}"`)
      .join(' ');

    modified = modified.replace(
      /<body([^>]*)>/,
      `<body$1 ${dataAttrs}>`
    );

    return modified;
  }

  /**
   * Apply randomization to CSS content
   */
  applyToCSS(css: string, variant: VariantSpec): string {
    let modified = css;

    // Replace color values
    modified = modified
      .replace(/--primary:\s*[^;]+;/g, `--primary: ${variant.colorScheme.primary};`)
      .replace(/--secondary:\s*[^;]+;/g, `--secondary: ${variant.colorScheme.secondary};`)
      .replace(/--accent:\s*[^;]+;/g, `--accent: ${variant.colorScheme.accent};`)
      .replace(/--background:\s*[^;]+;/g, `--background: ${variant.colorScheme.background};`)
      .replace(/--text:\s*[^;]+;/g, `--text: ${variant.colorScheme.text};`);

    // Apply font family
    modified = modified.replace(
      /font-family:\s*var\(--font-family\)/g,
      `font-family: ${variant.fontFamily}`
    );

    // Apply CSS modifications
    modified = modified
      .replace(/border-radius:\s*var\(--radius\)/g, `border-radius: ${variant.cssModifications.borderRadius}`)
      .replace(/font-size:\s*var\(--font-size\)/g, `font-size: ${variant.cssModifications.fontSize}`)
      .replace(/line-height:\s*var\(--line-height\)/g, `line-height: ${variant.cssModifications.lineHeight}`);

    // Prefix all class selectors
    modified = modified.replace(
      /\.([a-zA-Z][a-zA-Z0-9_-]*)/g,
      `.${variant.htmlModifications.classPrefix}$1`
    );

    return modified;
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  /**
   * Hash a string to a number
   */
  private hashToNumber(str: string): number {
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Select from array using random function
   */
  private selectFromArray<T>(array: T[], random: () => number): T {
    const index = Math.floor(random() * array.length);
    return array[index];
  }

  /**
   * Select provider with even distribution
   */
  private selectProvider(
    providers: string[],
    counts: Record<string, number>,
    random: () => number
  ): 'aws' | 'gcs' | 'azure' | 'netlify' {
    // Find minimum count
    const minCount = Math.min(...providers.map(p => counts[p]));

    // Filter to providers at minimum
    const candidates = providers.filter(p => counts[p] === minCount);

    // Random selection from candidates
    const index = Math.floor(random() * candidates.length);
    return candidates[index] as 'aws' | 'gcs' | 'azure' | 'netlify';
  }

  /**
   * Generate staggered publish delays
   */
  private generatePublishDelay(
    index: number,
    total: number,
    random: () => number
  ): number {
    // Base delay: spread over 24 hours
    const baseDelay = (index / total) * 24 * 60 * 60 * 1000;

    // Add randomization: +/- 30 minutes
    const jitter = (random() - 0.5) * 60 * 60 * 1000;

    return Math.max(0, Math.floor(baseDelay + jitter));
  }

  /**
   * Generate CSS modifications for anti-footprint
   */
  private generateCSSModifications(random: () => number): CSSModifications {
    const radiusOptions = ['0.25rem', '0.375rem', '0.5rem', '0.75rem', '1rem'];
    const spacingOptions = ['0.5rem', '0.75rem', '1rem', '1.25rem', '1.5rem'];
    const fontSizeOptions = ['0.875rem', '0.9rem', '1rem', '1.0625rem', '1.125rem'];
    const lineHeightOptions = ['1.4', '1.5', '1.6', '1.625', '1.75'];
    const letterSpacingOptions = ['-0.01em', '0', '0.01em', '0.02em', '0.025em'];

    return {
      borderRadius: this.selectFromArray(radiusOptions, random),
      spacing: this.selectFromArray(spacingOptions, random),
      fontSize: this.selectFromArray(fontSizeOptions, random),
      lineHeight: this.selectFromArray(lineHeightOptions, random),
      letterSpacing: this.selectFromArray(letterSpacingOptions, random),
    };
  }

  /**
   * Generate HTML modifications for anti-footprint
   */
  private generateHTMLModifications(
    index: number,
    random: () => number
  ): HTMLModifications {
    // Generate unique prefixes
    const prefixChars = 'abcdefghijklmnopqrstuvwxyz';
    let classPrefix = '';
    let idPrefix = '';

    for (let i = 0; i < 3; i++) {
      classPrefix += prefixChars[Math.floor(random() * prefixChars.length)];
      idPrefix += prefixChars[Math.floor(random() * prefixChars.length)];
    }

    return {
      classPrefix: `${classPrefix}-`,
      idPrefix: `${idPrefix}-`,
      dataAttributes: {
        v: index.toString(),
        t: Date.now().toString(36),
        r: Math.floor(random() * 10000).toString(),
      },
    };
  }

  /**
   * Get the base seed
   */
  getSeed(): number {
    return this.baseSeed;
  }
}

export default CloudRandomisationEngine;
