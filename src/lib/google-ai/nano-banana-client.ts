/**
 * Nano Banana 2 Pro Image Generation Client
 * Google's edge-optimized image AI for SVG-compatible, high-density visuals
 *
 * Part of Anthropic UI/UX Phase - Visual Generation Strategy
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'diagram' | 'comparison' | 'icon' | 'infographic';
  format?: 'svg' | 'png' | 'jpg';
  dimensions?: {
    width: number;
    height: number;
  };
  geoLocations?: string[]; // For contentLocation schema
}

export interface ImageGenerationResult {
  imageUrl: string;
  format: string;
  dimensions: { width: number; height: number };
  svgCode?: string; // If format is SVG
  metadata: {
    model: string;
    prompt: string;
    generatedAt: string;
    extractableElements: string[]; // Text, shapes AI can parse
  };
}

export class NanoBanana2ProClient {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Missing Google AI API key for Nano Banana 2 Pro');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Generate image using Nano Banana 2 Pro
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Generating image with Nano Banana 2 Pro...');
      console.log(`   Style: ${request.style || 'default'}`);
      console.log(`   Format: ${request.format || 'png'}`);

      // Enhanced prompt for AI-parseable output
      const enhancedPrompt = this.buildEnhancedPrompt(request);

      // For SVG generation, use Gemini to generate SVG code
      if (request.format === 'svg') {
        return await this.generateSVG(enhancedPrompt, request);
      }

      // For raster images, use image generation API
      // Mock implementation - real would call Google AI Studio API
      const mockResult: ImageGenerationResult = {
        imageUrl: `/api/images/generated/${Date.now()}.${request.format || 'png'}`,
        format: request.format || 'png',
        dimensions: request.dimensions || { width: 1200, height: 630 },
        metadata: {
          model: 'nano-banana-2-pro',
          prompt: enhancedPrompt,
          generatedAt: new Date().toISOString(),
          extractableElements: this.extractKeyElements(request)
        }
      };

      return mockResult;

    } catch (err) {
      console.error('Nano Banana 2 Pro generation failed:', err);
      throw err;
    }
  }

  /**
   * Generate SVG using Gemini (for AI-parseable diagrams)
   */
  private async generateSVG(prompt: string, request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const svgPrompt = `${prompt}

Generate ONLY the SVG code (no markdown, no explanation). The SVG must be:
- High-contrast for readability
- Text-heavy (labels, not just shapes)
- Semantic (uses <title> and <desc> elements)
- Accessible (proper ARIA labels)
- Dimensions: ${request.dimensions?.width || 1200}x${request.dimensions?.height || 630}

Return raw SVG code starting with <svg> tag.`;

      const result = await model.generateContent(svgPrompt);
      const response = result.response;
      let svgCode = response.text();

      // Clean up markdown if present
      svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();

      // Ensure it starts with <svg>
      if (!svgCode.startsWith('<svg')) {
        throw new Error('Generated output is not valid SVG');
      }

      return {
        imageUrl: `/api/images/svg/${Date.now()}.svg`,
        format: 'svg',
        dimensions: request.dimensions || { width: 1200, height: 630 },
        svgCode,
        metadata: {
          model: 'gemini-2.0-flash-exp',
          prompt: svgPrompt,
          generatedAt: new Date().toISOString(),
          extractableElements: ['svg', 'text', 'shapes', 'semantic']
        }
      };

    } catch (err) {
      console.error('SVG generation failed:', err);
      throw err;
    }
  }

  /**
   * Build enhanced prompt for AI-parseable output
   */
  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    let prompt = request.prompt;

    // Add style-specific instructions
    if (request.style === 'diagram') {
      prompt += '\n\nStyle: Clean, professional architecture diagram with clear labels and high contrast. Use boxes, arrows, and text annotations. Suitable for technical documentation.';
    } else if (request.style === 'comparison') {
      prompt += '\n\nStyle: Split-screen comparison (before/after or option A vs option B). Use contrasting colors (left: red/warning, right: green/success). Include clear labels and data points.';
    } else if (request.style === 'icon') {
      prompt += '\n\nStyle: Minimalist icon design, SVG-compatible, single color with outline. Clear symbolic representation.';
    } else if (request.style === 'infographic') {
      prompt += '\n\nStyle: Data-rich infographic with charts, numbers, and visual hierarchy. High information density.';
    }

    // Add AI-parsing optimization
    prompt += '\n\nOptimize for AI parsing: Include text labels, semantic structure, high contrast, and clear hierarchy.';

    return prompt;
  }

  /**
   * Extract key elements that AI can parse from the image
   */
  private extractKeyElements(request: ImageGenerationRequest): string[] {
    const elements: string[] = [];

    if (request.style === 'diagram') {
      elements.push('architecture', 'layers', 'connections', 'labels');
    } else if (request.style === 'comparison') {
      elements.push('before-after', 'metrics', 'improvements', 'contrast');
    } else if (request.style === 'icon') {
      elements.push('symbol', 'action', 'semantic-meaning');
    }

    return elements;
  }

  /**
   * Generate Unite-Hub architecture diagram
   */
  async generateArchitectureDiagram(): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: `Create a clean, professional architecture diagram for Unite-Hub showing 3 layers:

TOP LAYER: "Next.js App Router (React 19)" - Blue/Modern
- CRM Dashboard
- Synthex Product
- API Routes (100+)

MIDDLE LAYER: "AI Agent Layer (43 Agents)" - Orange/Accent
- Email Agent (intent extraction)
- Content Generator (Claude Opus 4)
- Orchestrator (workflow automation)
- Project Vend Phase 2 Enhanced ✓

BOTTOM LAYER: "Supabase PostgreSQL" - Purple/Data
- Multi-tenant isolation
- Row Level Security
- Real-time subscriptions

Use arrows showing data flow: User → Next.js → Agents → Database
Include "Project Vend Phase 2" badge on the Agent layer
Professional, technical, high-contrast for AI parsing`,
      style: 'diagram',
      format: 'svg',
      dimensions: { width: 1200, height: 800 }
    });
  }

  /**
   * Generate Client vs Agency comparison visual
   */
  async generateComparisonVisual(): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: `Create a split-screen comparison image:

LEFT SIDE (Past - Agency Control):
- Header: "Traditional Agency" (red text)
- High bills: "$5,000/month" (large red text)
- Slow: "2-3 weeks response" (clock icon)
- Black box: "No visibility" (locked icon)
- Background: Dark red/warning tones

RIGHT SIDE (Now - Client Control with Unite-Hub):
- Header: "Unite-Hub" (green text)
- Transparent costs: "$0.05/email" (small green text)
- Instant: "Real-time AI" (lightning icon)
- Full access: "Open source GitHub" (code icon)
- Background: Bright green/success tones

Center divider with arrow pointing right: "Transform →"

High contrast, data-focused, professional. Emphasize the cost difference and speed improvement.`,
      style: 'comparison',
      format: 'svg',
      dimensions: { width: 1200, height: 630 }
    });
  }

  /**
   * Generate step-by-step icons for HowTo schema
   */
  async generateStepIcons(steps: string[]): Promise<ImageGenerationResult[]> {
    const icons = await Promise.all(
      steps.map((step, index) =>
        this.generateImage({
          prompt: `Create a minimalist icon for: ${step}

Style: Clean line art, single color (orange #ff6b35), circular background
Size: 200x200px
Format: SVG for perfect scaling
Semantic: Icon should clearly represent the action

Step ${index + 1} of ${steps.length}`,
          style: 'icon',
          format: 'svg',
          dimensions: { width: 200, height: 200 }
        })
      )
    );

    return icons;
  }

  /**
   * Generate GitHub social proof visual
   */
  async generateGitHubSocialProof(): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: `Create a professional image showing the connection between GitHub and the live product:

Left third: GitHub branding
- GitHub logo
- "CleanExpo/Unite-Hub" repo name
- Code snippet preview (TypeScript)
- "Open Source" badge
- Stars/forks count placeholder

Center: Large arrow connecting left to right
- Text: "Powers →"

Right two-thirds: Live product screenshot
- unite-group.in website header
- Dashboard preview
- "Production Ready" badge
- "43 AI Agents" metric

Bottom banner: "Transparent Development → Production Excellence"

Professional, trust-building, technical credibility visual`,
      style: 'infographic',
      format: 'png',
      dimensions: { width: 1200, height: 630 }
    });
  }
}

// Singleton
let nanoInstance: NanoBanana2ProClient | null = null;

export function getNanoBanana2ProClient(): NanoBanana2ProClient {
  if (!nanoInstance) {
    nanoInstance = new NanoBanana2ProClient();
  }
  return nanoInstance;
}
