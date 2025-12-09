/**
 * StealthWrapperEngine - Wrapper Content Generation
 * Phase 13 Week 5-6: Social stack integration
 *
 * Handles:
 * - Wrapper text generation for Google Sites
 * - Contextual summaries and descriptions
 * - Natural language variations
 * - RewriteEngine integration
 */

import * as crypto from 'crypto';
import { RewriteEngine } from './RewriteEngine';

export interface WrapperSource {
  title: string;
  description?: string;
  content?: string;
  keywords?: string[];
  targetUrl: string;
  embeddedUrls: string[];
}

export interface WrapperContent {
  headline: string;
  introduction: string;
  summary: string;
  contextSections: string[];
  conclusion: string;
  fullContent: string;
}

export interface WrapperVariant {
  variantIndex: number;
  seed: number;
  tone: string;
  style: string;
  length: 'short' | 'medium' | 'long';
}

// Tone options
const TONES = [
  'professional',
  'informative',
  'friendly',
  'authoritative',
  'conversational',
];

// Writing styles
const STYLES = [
  'direct',
  'narrative',
  'educational',
  'descriptive',
  'persuasive',
];

// Introduction templates
const INTRO_TEMPLATES = [
  'This resource provides comprehensive information about {topic}. Below you\'ll find curated content from trusted sources.',
  'Welcome to our guide on {topic}. We\'ve assembled key insights and resources to help you understand this subject.',
  'Looking to learn more about {topic}? This page brings together essential information and expert perspectives.',
  'Explore everything about {topic} in this carefully curated collection of resources and information.',
  '{topic} is an important subject that deserves attention. Here we present the most relevant information.',
];

// Summary templates
const SUMMARY_TEMPLATES = [
  'In summary, {topic} encompasses various important aspects that professionals and enthusiasts should understand.',
  'The key points about {topic} include several critical considerations that we\'ve outlined above.',
  'Understanding {topic} requires familiarity with the concepts and resources presented on this page.',
  'We hope this overview of {topic} has been helpful in providing the information you were seeking.',
];

// Conclusion templates
const CONCLUSION_TEMPLATES = [
  'For more detailed information about {topic}, visit our main resource page.',
  'Ready to take the next step? Explore our comprehensive guide to {topic}.',
  'Get expert guidance and more information at our dedicated {topic} resource.',
  'Continue your learning journey with our complete {topic} guide.',
];

// Context section starters
const CONTEXT_STARTERS = [
  'Key considerations for',
  'Important aspects of',
  'Essential information about',
  'Understanding the basics of',
  'Critical factors in',
];

export class StealthWrapperEngine {
  private baseSeed: number;
  private random: () => number;
  private rewriteEngine: RewriteEngine | null = null;

  constructor(seed?: number) {
    this.baseSeed = seed || Date.now();
    this.random = this.createSeededRandom(this.baseSeed);
  }

  /**
   * Enable AI rewriting with Gemini
   */
  setRewriteEngine(engine: RewriteEngine): void {
    this.rewriteEngine = engine;
  }

  /**
   * Generate wrapper content for Google Sites
   */
  async generate(source: WrapperSource): Promise<WrapperContent> {
    const variant = this.generateVariant(0);
    return this.generateContent(source, variant);
  }

  /**
   * Generate multiple wrapper variants
   */
  async generateVariants(source: WrapperSource, count: number): Promise<WrapperContent[]> {
    const variants: WrapperContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant = this.generateVariant(i);
      variants.push(await this.generateContent(source, variant));
    }

    return variants;
  }

  /**
   * Generate variant specification
   */
  generateVariant(index: number): WrapperVariant {
    const variantSeed = this.hashToNumber(`${this.baseSeed}-wrapper-${index}`);
    const variantRandom = this.createSeededRandom(variantSeed);

    const lengths: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];

    return {
      variantIndex: index,
      seed: variantSeed,
      tone: this.selectFromArray(TONES, variantRandom),
      style: this.selectFromArray(STYLES, variantRandom),
      length: this.selectFromArray(lengths, variantRandom),
    };
  }

  /**
   * Generate wrapper content based on variant
   */
  private async generateContent(
    source: WrapperSource,
    variant: WrapperVariant
  ): Promise<WrapperContent> {
    const topic = this.extractTopic(source.title);

    // Generate headline
    const headline = this.generateHeadline(source.title, variant);

    // Generate introduction
    let introduction = this.selectFromArray(INTRO_TEMPLATES, this.random)
      .replace(/{topic}/g, topic);

    // Generate summary
    const summary = this.selectFromArray(SUMMARY_TEMPLATES, this.random)
      .replace(/{topic}/g, topic);

    // Generate context sections
    const contextSections = this.generateContextSections(source, variant);

    // Generate conclusion
    const conclusion = this.selectFromArray(CONCLUSION_TEMPLATES, this.random)
      .replace(/{topic}/g, topic);

    // If AI rewriting is available, enhance content
    if (this.rewriteEngine) {
      try {
        const rewritten = await this.rewriteEngine.rewrite(introduction, {
          style: variant.tone,
          preserveKeywords: source.keywords,
        });
        if (rewritten.success && rewritten.variants.length > 0) {
          introduction = rewritten.variants[0].text;
        }
      } catch (error) {
        // Fall back to template-based content
        console.warn('AI rewriting failed, using templates');
      }
    }

    // Build full content
    const fullContent = this.buildFullContent(
      headline,
      introduction,
      contextSections,
      source.embeddedUrls,
      summary,
      conclusion,
      source.targetUrl,
      variant
    );

    return {
      headline,
      introduction,
      summary,
      contextSections,
      conclusion,
      fullContent,
    };
  }

  /**
   * Generate headline with variation
   */
  private generateHeadline(title: string, variant: WrapperVariant): string {
    const prefixes = [
      'Complete Guide: ',
      'Understanding ',
      'Essential ',
      'Learn About ',
      '',
      'Resources for ',
    ];

    const prefix = this.selectFromArray(prefixes, this.random);
    return `${prefix}${title}`;
  }

  /**
   * Generate context sections based on keywords
   */
  private generateContextSections(
    source: WrapperSource,
    variant: WrapperVariant
  ): string[] {
    const sections: string[] = [];
    const keywords = source.keywords || [];

    const sectionCount = variant.length === 'short' ? 1 :
                         variant.length === 'medium' ? 2 : 3;

    for (let i = 0; i < Math.min(sectionCount, keywords.length || 1); i++) {
      const keyword = keywords[i] || this.extractTopic(source.title);
      const starter = this.selectFromArray(CONTEXT_STARTERS, this.random);

      sections.push(
        `${starter} ${keyword} include understanding the fundamentals and ` +
        `staying informed about best practices and current developments.`
      );
    }

    return sections;
  }

  /**
   * Build full formatted content
   */
  private buildFullContent(
    headline: string,
    introduction: string,
    contextSections: string[],
    embeddedUrls: string[],
    summary: string,
    conclusion: string,
    targetUrl: string,
    variant: WrapperVariant
  ): string {
    let content = '';

    // Headline
    content += `# ${headline}\n\n`;

    // Introduction
    content += `${introduction}\n\n`;

    // Context sections
    for (const section of contextSections) {
      content += `${section}\n\n`;
    }

    // Embedded content references
    if (embeddedUrls.length > 0) {
      content += `## Featured Resources\n\n`;
      content += `Below you'll find carefully selected content related to this topic:\n\n`;

      for (let i = 0; i < embeddedUrls.length; i++) {
        content += `- [Resource ${i + 1}](${embeddedUrls[i]})\n`;
      }
      content += '\n';
    }

    // Summary
    content += `## Summary\n\n`;
    content += `${summary}\n\n`;

    // Conclusion with CTA
    content += `## Learn More\n\n`;
    content += `${conclusion}\n\n`;
    content += `[Visit Main Resource →](${targetUrl})\n`;

    return content;
  }

  /**
   * Extract topic from title
   */
  private extractTopic(title: string): string {
    return title
      .replace(/^(guide to|understanding|discover|learn about|essential|complete)\s+/i, '')
      .toLowerCase();
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
   * Select from array
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

export default StealthWrapperEngine;
