/**
 * RewriteEngine
 * Phase 13 Week 1-2: AI-powered content rewriting with multi-variant generation
 */

// Types
export interface RewriteOptions {
  variants?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  length?: 'shorter' | 'same' | 'longer';
  style?: 'paragraph' | 'bullets' | 'numbered';
  keywords?: string[];
  avoidWords?: string[];
  targetAudience?: string;
  seed?: number;
}

export interface RewriteResult {
  original: string;
  variants: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    seed: number;
    timestamp: string;
  };
}

export interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'cta';
  content: string;
  metadata?: any;
}

export class RewriteEngine {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY || '';
  }

  /**
   * Rewrite content with multiple variants using Gemini Flash
   */
  async rewrite(content: string, options: RewriteOptions = {}): Promise<RewriteResult> {
    const variants: string[] = [];
    const numVariants = options.variants || 3;
    const seed = options.seed || Math.floor(Math.random() * 1000000);

    for (let i = 0; i < numVariants; i++) {
      const variant = await this.generateVariant(content, options, seed + i);
      variants.push(variant);
    }

    return {
      original: content,
      variants,
      metadata: {
        model: 'gemini-1.5-flash',
        tokensUsed: this.estimateTokens(content) * numVariants * 2,
        seed,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate a single variant
   */
  private async generateVariant(
    content: string,
    options: RewriteOptions,
    seed: number
  ): Promise<string> {
    const prompt = this.buildRewritePrompt(content, options, seed);

    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7 + (seed % 10) * 0.03, // Vary temperature slightly
              maxOutputTokens: 1024,
              topP: 0.9,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No content generated');
      }

      return text.trim();
    } catch (error) {
      console.error('Error generating variant:', error);
      // Fallback: return modified original
      return this.fallbackRewrite(content, options, seed);
    }
  }

  /**
   * Build the rewrite prompt
   */
  private buildRewritePrompt(
    content: string,
    options: RewriteOptions,
    seed: number
  ): string {
    let prompt = 'Rewrite the following content';

    // Tone
    if (options.tone) {
      prompt += ` in a ${options.tone} tone`;
    }

    // Length
    if (options.length === 'shorter') {
      prompt += ', making it more concise';
    } else if (options.length === 'longer') {
      prompt += ', expanding with more detail';
    }

    // Style
    if (options.style === 'bullets') {
      prompt += ', formatted as bullet points';
    } else if (options.style === 'numbered') {
      prompt += ', formatted as a numbered list';
    }

    // Keywords
    if (options.keywords && options.keywords.length > 0) {
      prompt += `. Include these keywords naturally: ${options.keywords.join(', ')}`;
    }

    // Avoid words
    if (options.avoidWords && options.avoidWords.length > 0) {
      prompt += `. Avoid using: ${options.avoidWords.join(', ')}`;
    }

    // Target audience
    if (options.targetAudience) {
      prompt += `. Target audience: ${options.targetAudience}`;
    }

    // Add uniqueness instruction
    prompt += `. Make this variant unique (seed: ${seed}). Output only the rewritten content, no explanations.`;

    prompt += `\n\nOriginal content:\n${content}`;

    return prompt;
  }

  /**
   * Fallback rewrite when API fails
   */
  private fallbackRewrite(
    content: string,
    options: RewriteOptions,
    seed: number
  ): string {
    // Simple synonym replacement and restructuring
    const synonyms: { [key: string]: string[] } = {
      'good': ['excellent', 'great', 'outstanding', 'superior'],
      'bad': ['poor', 'subpar', 'inadequate', 'inferior'],
      'important': ['crucial', 'vital', 'essential', 'significant'],
      'help': ['assist', 'support', 'aid', 'facilitate'],
      'use': ['utilize', 'employ', 'apply', 'leverage'],
      'make': ['create', 'develop', 'produce', 'generate'],
      'get': ['obtain', 'acquire', 'receive', 'gain'],
      'show': ['demonstrate', 'display', 'illustrate', 'present'],
    };

    let result = content;

    // Apply synonyms based on seed
    Object.entries(synonyms).forEach(([word, replacements]) => {
      const replacement = replacements[seed % replacements.length];
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, replacement);
    });

    // Apply style changes
    if (options.style === 'bullets') {
      const sentences = result.split(/[.!?]+/).filter(s => s.trim());
      result = sentences.map(s => `• ${s.trim()}`).join('\n');
    }

    return result;
  }

  /**
   * Generate content blocks for a page
   */
  async generateContentBlocks(
    topic: string,
    blockTypes: ContentBlock['type'][],
    options: RewriteOptions = {}
  ): Promise<ContentBlock[]> {
    const blocks: ContentBlock[] = [];

    for (const blockType of blockTypes) {
      const blockContent = await this.generateBlock(topic, blockType, options);
      blocks.push({
        type: blockType,
        content: blockContent,
        metadata: { generatedAt: new Date().toISOString() },
      });
    }

    return blocks;
  }

  /**
   * Generate a single content block
   */
  private async generateBlock(
    topic: string,
    blockType: ContentBlock['type'],
    options: RewriteOptions
  ): Promise<string> {
    let prompt = '';

    switch (blockType) {
      case 'heading':
        prompt = `Generate a compelling heading for: ${topic}. Keep it under 10 words.`;
        break;
      case 'paragraph':
        prompt = `Write a paragraph about: ${topic}. Keep it informative and engaging.`;
        break;
      case 'list':
        prompt = `Generate a bullet list of 5 key points about: ${topic}.`;
        break;
      case 'quote':
        prompt = `Create an inspiring quote related to: ${topic}.`;
        break;
      case 'cta':
        prompt = `Write a call-to-action for: ${topic}. Make it action-oriented.`;
        break;
    }

    if (options.tone) {
      prompt += ` Use a ${options.tone} tone.`;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 256,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (error) {
      console.error('Error generating block:', error);
      return this.generateFallbackBlock(topic, blockType);
    }
  }

  /**
   * Fallback block generation
   */
  private generateFallbackBlock(topic: string, blockType: ContentBlock['type']): string {
    switch (blockType) {
      case 'heading':
        return `Discover ${topic}`;
      case 'paragraph':
        return `Learn more about ${topic} and how it can benefit you.`;
      case 'list':
        return `• Key aspect of ${topic}\n• Important consideration\n• Best practices`;
      case 'quote':
        return `"Excellence in ${topic} drives success."`;
      case 'cta':
        return `Get Started with ${topic} Today`;
      default:
        return topic;
    }
  }

  /**
   * Generate summary variants
   */
  async generateSummaries(
    content: string,
    lengths: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long']
  ): Promise<{ [key: string]: string }> {
    const summaries: { [key: string]: string } = {};

    for (const length of lengths) {
      let wordCount: number;
      switch (length) {
        case 'short':
          wordCount = 25;
          break;
        case 'medium':
          wordCount = 75;
          break;
        case 'long':
          wordCount = 150;
          break;
      }

      const prompt = `Summarize the following content in approximately ${wordCount} words:\n\n${content}`;

      try {
        const response = await fetch(
          `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: wordCount * 2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          summaries[length] = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }
      } catch (error) {
        console.error(`Error generating ${length} summary:`, error);
        summaries[length] = this.fallbackSummary(content, wordCount);
      }
    }

    return summaries;
  }

  /**
   * Fallback summary generation
   */
  private fallbackSummary(content: string, wordCount: number): string {
    const words = content.split(/\s+/);
    return words.slice(0, wordCount).join(' ') + '...';
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// Export singleton
export const rewriteEngine = new RewriteEngine();
