/**
 * BloggerContentEngine - Content Transformation for Blogger
 * Phase 13 Week 5-6: Social stack integration
 *
 * Handles:
 * - Cloud deployment to Blogger post transformation
 * - Randomized layouts and styling
 * - Schema.org JSON-LD injection
 * - Open Graph image embedding
 * - CTA and link insertion
 */

import * as crypto from 'crypto';

export interface ContentSource {
  html: string;
  title: string;
  description?: string;
  schemaJson?: object;
  ogImageUrl?: string;
  targetUrl: string;
  keywords?: string[];
}

export interface BloggerContent {
  title: string;
  content: string;
  labels: string[];
  excerpt: string;
  schemaJson: object;
}

export interface ContentVariant {
  variantIndex: number;
  seed: number;
  titleVariant: string;
  introVariant: string;
  ctaVariant: string;
  layoutTemplate: string;
  headingStyle: string;
  paragraphStyle: string;
  imagePlacement: 'top' | 'middle' | 'bottom' | 'side';
}

// Layout templates
const LAYOUT_TEMPLATES = [
  'standard',
  'magazine',
  'minimal',
  'feature',
  'gallery',
  'sidebar',
];

// Title prefixes for variation
const TITLE_PREFIXES = [
  '',
  'Discover: ',
  'Learn About ',
  'Guide to ',
  'Understanding ',
  'Essential ',
  'Complete ',
  'Expert ',
];

// Intro templates
const INTRO_TEMPLATES = [
  'In this comprehensive guide, we explore {topic}.',
  'Discover everything you need to know about {topic}.',
  'Looking for information about {topic}? You\'ve come to the right place.',
  '{topic} is an essential consideration for many. Here\'s what you need to know.',
  'We\'ve compiled the most important information about {topic}.',
  'This article covers the key aspects of {topic}.',
];

// CTA templates
const CTA_TEMPLATES = [
  'Learn more about {topic} at our main site.',
  'Visit our website for detailed information on {topic}.',
  'Ready to take the next step? Explore {topic} further.',
  'Get expert guidance on {topic} from our team.',
  'Discover how we can help with your {topic} needs.',
  'Contact us today to learn more about {topic}.',
];

// Heading styles
const HEADING_STYLES = [
  'color: #1a1a1a; font-size: 1.5em; margin-bottom: 0.5em;',
  'color: #2c3e50; font-size: 1.4em; border-bottom: 2px solid #3498db; padding-bottom: 0.3em;',
  'color: #34495e; font-size: 1.3em; text-transform: uppercase; letter-spacing: 1px;',
  'color: #2c3e50; font-size: 1.5em; font-weight: 600;',
];

// Paragraph styles
const PARAGRAPH_STYLES = [
  'line-height: 1.6; margin-bottom: 1em; color: #333;',
  'line-height: 1.7; margin-bottom: 1.2em; color: #444; font-size: 1.05em;',
  'line-height: 1.8; margin-bottom: 1em; color: #2c3e50;',
  'line-height: 1.65; margin-bottom: 1.1em; color: #3a3a3a;',
];

export class BloggerContentEngine {
  private baseSeed: number;
  private random: () => number;

  constructor(seed?: number) {
    this.baseSeed = seed || Date.now();
    this.random = this.createSeededRandom(this.baseSeed);
  }

  /**
   * Transform cloud deployment content into Blogger-ready post
   */
  transform(source: ContentSource): BloggerContent {
    const variant = this.generateVariant(0);

    // Generate title with variation
    const title = this.generateTitle(source.title, variant);

    // Generate content with layout
    const content = this.generateContent(source, variant);

    // Extract labels from keywords
    const labels = this.generateLabels(source);

    // Generate excerpt
    const excerpt = this.generateExcerpt(source, variant);

    // Build schema
    const schemaJson = this.buildSchema(source, title);

    return {
      title,
      content,
      labels,
      excerpt,
      schemaJson,
    };
  }

  /**
   * Generate multiple content variants
   */
  generateVariants(source: ContentSource, count: number): BloggerContent[] {
    const variants: BloggerContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant = this.generateVariant(i);

      variants.push({
        title: this.generateTitle(source.title, variant),
        content: this.generateContent(source, variant),
        labels: this.generateLabels(source),
        excerpt: this.generateExcerpt(source, variant),
        schemaJson: this.buildSchema(source, source.title),
      });
    }

    return variants;
  }

  /**
   * Generate a content variant specification
   */
  generateVariant(index: number): ContentVariant {
    const variantSeed = this.hashToNumber(`${this.baseSeed}-variant-${index}`);
    const variantRandom = this.createSeededRandom(variantSeed);

    return {
      variantIndex: index,
      seed: variantSeed,
      titleVariant: this.selectFromArray(TITLE_PREFIXES, variantRandom),
      introVariant: this.selectFromArray(INTRO_TEMPLATES, variantRandom),
      ctaVariant: this.selectFromArray(CTA_TEMPLATES, variantRandom),
      layoutTemplate: this.selectFromArray(LAYOUT_TEMPLATES, variantRandom),
      headingStyle: this.selectFromArray(HEADING_STYLES, variantRandom),
      paragraphStyle: this.selectFromArray(PARAGRAPH_STYLES, variantRandom),
      imagePlacement: this.selectFromArray(['top', 'middle', 'bottom', 'side'], variantRandom) as 'top' | 'middle' | 'bottom' | 'side',
    };
  }

  /**
   * Generate title with variant prefix
   */
  private generateTitle(baseTitle: string, variant: ContentVariant): string {
    return `${variant.titleVariant}${baseTitle}`;
  }

  /**
   * Generate full content with layout
   */
  private generateContent(source: ContentSource, variant: ContentVariant): string {
    const topic = this.extractTopic(source.title);
    const intro = variant.introVariant.replace(/{topic}/g, topic);
    const cta = variant.ctaVariant.replace(/{topic}/g, topic);

    let content = '';

    // Schema.org JSON-LD
    if (source.schemaJson) {
      content += `<script type="application/ld+json">${JSON.stringify(source.schemaJson)}</script>\n`;
    }

    // Container with styling
    content += `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;

    // OG Image at top
    if (source.ogImageUrl && variant.imagePlacement === 'top') {
      content += this.renderImage(source.ogImageUrl, source.title);
    }

    // Introduction
    content += `<p style="${variant.paragraphStyle}">${intro}</p>\n`;

    // OG Image in middle
    if (source.ogImageUrl && variant.imagePlacement === 'middle') {
      content += this.renderImage(source.ogImageUrl, source.title);
    }

    // Main content (cleaned HTML)
    content += `<div style="margin: 1.5em 0;">\n`;
    content += this.cleanHtml(source.html);
    content += `</div>\n`;

    // OG Image at bottom
    if (source.ogImageUrl && variant.imagePlacement === 'bottom') {
      content += this.renderImage(source.ogImageUrl, source.title);
    }

    // CTA section
    content += `<div style="margin-top: 2em; padding: 1em; background: #f8f9fa; border-radius: 8px;">\n`;
    content += `<h3 style="${variant.headingStyle}">Next Steps</h3>\n`;
    content += `<p style="${variant.paragraphStyle}">${cta}</p>\n`;
    content += `<p><a href="${source.targetUrl}" style="color: #3498db; font-weight: 500;">Visit Website →</a></p>\n`;
    content += `</div>\n`;

    content += `</div>`;

    return content;
  }

  /**
   * Render image with styling
   */
  private renderImage(url: string, alt: string): string {
    return `<div style="text-align: center; margin: 1.5em 0;">
      <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
    </div>\n`;
  }

  /**
   * Clean HTML for Blogger compatibility
   */
  private cleanHtml(html: string): string {
    // Remove script tags (except JSON-LD)
    let cleaned = html.replace(/<script(?! type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove style tags
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove potentially dangerous attributes
    cleaned = cleaned.replace(/\s(on\w+)="[^"]*"/gi, '');

    return cleaned;
  }

  /**
   * Generate labels from keywords and title
   */
  private generateLabels(source: ContentSource): string[] {
    const labels: string[] = [];

    // Add keywords
    if (source.keywords) {
      labels.push(...source.keywords.slice(0, 5));
    }

    // Extract from title
    const titleWords = source.title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 3);

    labels.push(...titleWords);

    // Deduplicate
    return [...new Set(labels)].slice(0, 8);
  }

  /**
   * Generate excerpt from description or content
   */
  private generateExcerpt(source: ContentSource, variant: ContentVariant): string {
    if (source.description) {
      return source.description.substring(0, 160);
    }

    const topic = this.extractTopic(source.title);
    return variant.introVariant.replace(/{topic}/g, topic).substring(0, 160);
  }

  /**
   * Build Schema.org JSON-LD
   */
  private buildSchema(source: ContentSource, title: string): object {
    if (source.schemaJson) {
      return source.schemaJson;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: source.description || '',
      image: source.ogImageUrl || '',
      url: source.targetUrl,
      datePublished: new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: 'Content Team',
      },
    };
  }

  /**
   * Extract topic from title
   */
  private extractTopic(title: string): string {
    // Remove common prefixes
    let topic = title
      .replace(/^(guide to|understanding|discover|learn about|essential|complete|expert)\s+/i, '')
      .toLowerCase();

    return topic;
  }

  /**
   * Create seeded random function
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  /**
   * Hash string to number
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
   * Get base seed
   */
  getSeed(): number {
    return this.baseSeed;
  }
}

export default BloggerContentEngine;
