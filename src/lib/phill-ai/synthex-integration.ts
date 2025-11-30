/**
 * Synthex Visual Generation Pipeline
 * Integration with Gemini 3 Pro Image Preview for visual asset generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PhillAIClient, ChatMessage } from './llm-client';
import { getPersona } from './personas';

// Gemini 3 Pro Image Preview - the only allowed model for image generation
const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

export interface VisualRequest {
  id: string;
  type: 'hero' | 'illustration' | 'icon' | 'banner' | 'social' | 'thumbnail' | 'custom';
  prompt: string;
  style?: VisualStyle;
  dimensions?: {
    width: number;
    height: number;
  };
  brandContext?: BrandContext;
  clientId?: string;
  projectId?: string;
}

export interface VisualStyle {
  mood: string;
  colorPalette: string[];
  typography?: string;
  aesthetic: 'minimalist' | 'bold' | 'elegant' | 'playful' | 'corporate' | 'artistic';
}

export interface BrandContext {
  primaryColor: string;
  secondaryColors: string[];
  fontFamily: string;
  voiceAttributes: string[];
  industryKeywords: string[];
}

export interface GeneratedVisual {
  id: string;
  requestId: string;
  prompt: string;
  enhancedPrompt: string;
  imageUrl?: string;
  base64Data?: string;
  mimeType: string;
  status: 'pending' | 'generating' | 'review' | 'approved' | 'rejected' | 'revised';
  approvalWorkflow: ApprovalStep[];
  generatedAt: Date;
  cost: number;
}

export interface ApprovalStep {
  step: number;
  status: 'pending' | 'approved' | 'rejected' | 'revised';
  reviewer?: string;
  feedback?: string;
  timestamp?: Date;
}

export interface VisualPromptEnhancement {
  original: string;
  enhanced: string;
  styleDirectives: string[];
  qualityMarkers: string[];
  negativePrompts: string[];
}

/**
 * Privacy-compliant prompt templates (no vendor names in output)
 */
const PROMPT_TEMPLATES = {
  hero: `Create a stunning hero image for a premium {industry} brand.
Style: {aesthetic}, professional, Awwwards-worthy
Colors: {colors}
Mood: {mood}
Requirements: High-end visual suitable for above-the-fold website placement.
Aspect ratio: 16:9, landscape orientation.`,

  illustration: `Create a custom illustration for {purpose}.
Style: {aesthetic}, original, bespoke design
Colors: {colors}
Requirements: Clean lines, scalable quality, unique artistic interpretation.`,

  icon: `Create a set of cohesive icons for {purpose}.
Style: {aesthetic}, consistent stroke weight, modern
Colors: {colors}
Requirements: Clear silhouettes, works at multiple sizes (16px to 64px).`,

  banner: `Create a web banner for {purpose}.
Style: {aesthetic}, attention-grabbing, conversion-focused
Colors: {colors}
Dimensions: {width}x{height}
Requirements: Clear visual hierarchy, supports text overlay.`,

  social: `Create a social media visual for {platform}.
Style: {aesthetic}, engaging, shareable
Colors: {colors}
Requirements: Platform-optimized dimensions, thumb-stopping quality.`,

  thumbnail: `Create a video thumbnail for {purpose}.
Style: {aesthetic}, high contrast, compelling
Colors: {colors}
Requirements: Clear focal point, works at small sizes, click-worthy.`,
};

/**
 * Synthex Visual Pipeline
 */
export class SynthexVisualPipeline {
  private gemini: GoogleGenerativeAI | null = null;
  private phillClient: PhillAIClient;
  private pendingApprovals: Map<string, GeneratedVisual> = new Map();

  constructor() {
    this.phillClient = new PhillAIClient();

    // Initialize Gemini if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(geminiApiKey);
    }
  }

  /**
   * Enhance a visual prompt using Phill-Vision persona
   */
  async enhancePrompt(request: VisualRequest): Promise<VisualPromptEnhancement> {
    const persona = getPersona('phill-vision');

    const enhancementPrompt = `As Creative Director, enhance this visual prompt for premium quality generation.

ORIGINAL REQUEST:
Type: ${request.type}
Prompt: ${request.prompt}
Style: ${JSON.stringify(request.style || {})}
Brand Context: ${JSON.stringify(request.brandContext || {})}

OUTPUT (JSON):
{
  "enhanced": "detailed, production-ready prompt",
  "styleDirectives": ["list", "of", "style", "keywords"],
  "qualityMarkers": ["list", "of", "quality", "attributes"],
  "negativePrompts": ["things", "to", "avoid"]
}

REQUIREMENTS:
- Premium, agency-grade quality
- No stock-looking aesthetics
- Brand-consistent visual language
- NEVER mention AI, Gemini, or any vendor names
- Use "custom illustration" or "platform-generated visual" terminology`;

    const response = await this.phillClient.free(enhancementPrompt, persona.systemPrompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          original: request.prompt,
          enhanced: parsed.enhanced,
          styleDirectives: parsed.styleDirectives || [],
          qualityMarkers: parsed.qualityMarkers || [],
          negativePrompts: parsed.negativePrompts || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse prompt enhancement:', error);
    }

    // Fallback enhancement
    return {
      original: request.prompt,
      enhanced: this.buildFallbackPrompt(request),
      styleDirectives: ['premium', 'professional', 'high-quality'],
      qualityMarkers: ['8K', 'detailed', 'polished'],
      negativePrompts: ['stock', 'generic', 'template'],
    };
  }

  /**
   * Generate a visual asset
   */
  async generateVisual(request: VisualRequest): Promise<GeneratedVisual> {
    if (!this.gemini) {
      throw new Error('Gemini API not configured. Set GEMINI_API_KEY environment variable.');
    }

    // Enhance the prompt
    const enhancement = await this.enhancePrompt(request);

    // Build the final prompt
    const finalPrompt = this.buildGenerationPrompt(enhancement, request);

    const visual: GeneratedVisual = {
      id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestId: request.id,
      prompt: request.prompt,
      enhancedPrompt: finalPrompt,
      mimeType: 'image/png',
      status: 'generating',
      approvalWorkflow: [
        { step: 1, status: 'pending' }, // Phill-Vision review
        { step: 2, status: 'pending' }, // Phill-Brand check
        { step: 3, status: 'pending' }, // Final approval
      ],
      generatedAt: new Date(),
      cost: 0.02, // Estimated Gemini cost
    };

    try {
      const model = this.gemini.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });

      const result = await model.generateContent(finalPrompt);
      const response = result.response;

      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if ('inlineData' in part && part.inlineData) {
          visual.base64Data = part.inlineData.data;
          visual.mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }

      visual.status = 'review';
      this.pendingApprovals.set(visual.id, visual);

      return visual;
    } catch (error) {
      console.error('Visual generation failed:', error);
      visual.status = 'rejected';
      visual.approvalWorkflow[0] = {
        step: 1,
        status: 'rejected',
        feedback: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      return visual;
    }
  }

  /**
   * Submit approval decision for a visual
   */
  async submitApproval(
    visualId: string,
    step: number,
    decision: 'approved' | 'rejected' | 'revised',
    feedback?: string
  ): Promise<GeneratedVisual | null> {
    const visual = this.pendingApprovals.get(visualId);
    if (!visual) return null;

    const workflowStep = visual.approvalWorkflow.find((s) => s.step === step);
    if (!workflowStep) return null;

    workflowStep.status = decision;
    workflowStep.feedback = feedback;
    workflowStep.timestamp = new Date();

    // Update overall status based on workflow
    if (decision === 'rejected') {
      visual.status = 'rejected';
    } else if (decision === 'revised') {
      visual.status = 'revised';
    } else if (step === visual.approvalWorkflow.length) {
      // Last step approved
      visual.status = 'approved';
      this.pendingApprovals.delete(visualId);
    }

    return visual;
  }

  /**
   * Get all pending approvals
   */
  getPendingApprovals(): GeneratedVisual[] {
    return Array.from(this.pendingApprovals.values());
  }

  /**
   * Regenerate a visual with revised prompt
   */
  async regenerateVisual(
    visualId: string,
    revisedPrompt?: string
  ): Promise<GeneratedVisual | null> {
    const original = this.pendingApprovals.get(visualId);
    if (!original) return null;

    const newRequest: VisualRequest = {
      id: `${original.requestId}-revised`,
      type: 'custom',
      prompt: revisedPrompt || original.prompt,
    };

    // Remove the old one
    this.pendingApprovals.delete(visualId);

    // Generate new
    return this.generateVisual(newRequest);
  }

  /**
   * Build generation prompt from enhancement
   */
  private buildGenerationPrompt(
    enhancement: VisualPromptEnhancement,
    request: VisualRequest
  ): string {
    const parts = [
      enhancement.enhanced,
      '',
      'STYLE DIRECTIVES:',
      enhancement.styleDirectives.join(', '),
      '',
      'QUALITY REQUIREMENTS:',
      enhancement.qualityMarkers.join(', '),
    ];

    if (enhancement.negativePrompts.length > 0) {
      parts.push('', 'AVOID:', enhancement.negativePrompts.join(', '));
    }

    if (request.dimensions) {
      parts.push('', `DIMENSIONS: ${request.dimensions.width}x${request.dimensions.height}`);
    }

    return parts.join('\n');
  }

  /**
   * Build fallback prompt when enhancement fails
   */
  private buildFallbackPrompt(request: VisualRequest): string {
    const template = PROMPT_TEMPLATES[request.type] || PROMPT_TEMPLATES.illustration;

    return template
      .replace('{industry}', request.brandContext?.industryKeywords?.[0] || 'technology')
      .replace('{aesthetic}', request.style?.aesthetic || 'elegant')
      .replace('{colors}', request.style?.colorPalette?.join(', ') || 'professional palette')
      .replace('{mood}', request.style?.mood || 'sophisticated')
      .replace('{purpose}', request.prompt)
      .replace('{platform}', 'LinkedIn')
      .replace('{width}', String(request.dimensions?.width || 1200))
      .replace('{height}', String(request.dimensions?.height || 628));
  }

  /**
   * Get cost estimate for a visual request
   */
  estimateCost(request: VisualRequest): { estimate: number; breakdown: string } {
    // Gemini 3 Pro Image Preview estimated costs
    const baseCost = 0.02; // Base generation cost
    const enhancementCost = 0.001; // DeepSeek FREE for enhancement

    let multiplier = 1;

    // Higher resolution = higher cost
    if (request.dimensions) {
      const pixels = request.dimensions.width * request.dimensions.height;
      if (pixels > 2000000) multiplier *= 1.5;
      if (pixels > 4000000) multiplier *= 2;
    }

    const total = baseCost * multiplier + enhancementCost;

    return {
      estimate: total,
      breakdown: `Prompt enhancement: $${enhancementCost.toFixed(4)} | Generation: $${(baseCost * multiplier).toFixed(4)} | Total: $${total.toFixed(4)}`,
    };
  }
}

/**
 * Singleton pipeline instance
 */
let pipelineInstance: SynthexVisualPipeline | null = null;

export function getSynthexPipeline(): SynthexVisualPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new SynthexVisualPipeline();
  }
  return pipelineInstance;
}

export default SynthexVisualPipeline;
