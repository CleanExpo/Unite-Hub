/**
 * Gemini 2.5 Flash Image Service (LATEST - December 2025)
 * Fast, affordable image generation using Gemini's native image capabilities
 *
 * Model: gemini-2.5-flash-image (Nano Banana)
 * Pricing: $0.039 per image (~1290 tokens @ $30/1M tokens)
 * Quality: Balanced speed and quality, optimized for web assets
 *
 * Official Docs: https://ai.google.dev/gemini-api/docs/image-generation
 * Updated: December 18, 2025
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'photorealistic' | 'professional' | 'diagram' | 'marketing' | 'technical';
  saveTo?: string; // File path to save (optional)
  includeText?: string; // Text to render in image (for Gemini 3 Pro Image)
}

export interface ImageGenerationResult {
  status: 'completed' | 'failed';
  imageData?: string; // Base64 encoded
  mimeType?: string; // image/png or image/jpeg
  savedPath?: string;
  estimatedCost: number;
  metadata: {
    model: string;
    prompt: string;
    generatedAt: string;
    tokensUsed: number;
  };
}

export class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  private costPer1MTokens = 30.00;
  private tokensPerImage = 1290; // Average for Gemini 2.5 Flash Image

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Missing Google AI API key for Gemini Image');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Generate image using Gemini 2.5 Flash Image
   * Official method from: https://ai.google.dev/gemini-api/docs/image-generation
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const estimatedCost = (this.tokensPerImage / 1_000_000) * this.costPer1MTokens;

      console.log('🎨 Generating image with Gemini 2.5 Flash Image...');
      console.log(`   Style: ${request.style || 'default'}`);
      console.log(`   Estimated cost: $${estimatedCost.toFixed(4)}`);

      // Get Gemini 2.5 Flash Image model
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image'
      });

      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(request);

      // Generate image
      const result = await model.generateContent({
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }]
      });

      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No image generated');
      }

      // Extract image data
      const imagePart = candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data in response');
      }

      const imageData = imagePart.inlineData.data; // Base64
      const mimeType = imagePart.inlineData.mimeType; // image/png or image/jpeg

      // Save to file if path provided
      let savedPath: string | undefined;
      if (request.saveTo) {
        const buffer = Buffer.from(imageData, 'base64');
        writeFileSync(request.saveTo, buffer);
        savedPath = request.saveTo;
        console.log(`   ✅ Saved to: ${savedPath}`);
      }

      const generationResult: ImageGenerationResult = {
        status: 'completed',
        imageData,
        mimeType,
        savedPath,
        estimatedCost,
        metadata: {
          model: 'gemini-2.5-flash-image',
          prompt: enhancedPrompt,
          generatedAt: new Date().toISOString(),
          tokensUsed: this.tokensPerImage
        }
      };

      console.log('✅ Image generated successfully');

      return generationResult;

    } catch (err) {
      console.error('Gemini image generation failed:', err);
      return {
        status: 'failed',
        estimatedCost: 0,
        metadata: {
          model: 'gemini-2.5-flash-image',
          prompt: request.prompt,
          generatedAt: new Date().toISOString(),
          tokensUsed: 0
        }
      };
    }
  }

  /**
   * Build enhanced prompt with style directives
   */
  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    let prompt = request.prompt;

    // Add style-specific instructions
    switch (request.style) {
      case 'photorealistic':
        prompt += '\n\nStyle: Photorealistic, high-quality photography. Natural lighting, professional composition, suitable for marketing materials.';
        break;
      case 'professional':
        prompt += '\n\nStyle: Clean professional business visual. Modern design, high contrast, suitable for presentations and websites.';
        break;
      case 'diagram':
        prompt += '\n\nStyle: Technical diagram or infographic. Clear layout, labeled components, data visualization, professional aesthetic.';
        break;
      case 'marketing':
        prompt += '\n\nStyle: Eye-catching marketing hero image. Vibrant colors, clear value proposition, professional branding.';
        break;
      case 'technical':
        prompt += '\n\nStyle: Technical screenshot or UI mockup. Clean interface, readable text, developer-focused design.';
        break;
    }

    // Add text rendering hint if text provided
    if (request.includeText) {
      prompt += `\n\nImportant: Include this text in the image (must be sharp and legible): "${request.includeText}"`;
    }

    // Add Google ranking optimization
    prompt += '\n\nOptimize for: High information density, semantic clarity, suitable for AI parsing and web ranking.';

    return prompt;
  }

  /**
   * Generate GitHub social proof image (raster version)
   */
  async generateGitHubSocialProof(outputPath?: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: `Professional marketing image showing the connection between GitHub open source and production deployment:

LEFT SECTION: GitHub branding and repository
- GitHub logo prominent
- Repository: "CleanExpo/Unite-Hub"
- Code preview showing TypeScript
- Metrics: "43 AI Agents", "14K+ lines", "136 tests passing"
- Badge: "Open Source"

CENTER: Connection visual
- Large arrow or flow diagram →
- Text: "Powers"

RIGHT SECTION: Live production
- Website: unite-group.in
- Dashboard screenshot (modern, clean interface)
- Status indicator: "● Live"
- Badge: "Production Ready"

BOTTOM: "Open Source Transparency → Production Excellence"

Professional, high-trust, technical credibility. Orange accent color #ff6b35.`,
      style: 'professional',
      includeText: 'Open Source → Production Excellence',
      saveTo: outputPath
    });
  }

  /**
   * Generate Project Vend Phase 2 feature overview
   */
  async generatePhase2Overview(outputPath?: string): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: `Professional infographic showing Project Vend Phase 2 systems:

TITLE: "Project Vend Phase 2: Agent Optimization Framework"

5 FEATURE BOXES in grid layout:

1. METRICS & OBSERVABILITY
   Icon: Chart/analytics
   "Real-time tracking • Cost monitoring • Health analysis"

2. BUSINESS RULES ENGINE
   Icon: Checklist with shield
   "18 predefined rules • Prevent naive decisions • Constraint enforcement"

3. ESCALATION SYSTEM
   Icon: Alert bell with approval chain
   "Approval workflows • Auto-resolution • Smart routing"

4. VERIFICATION LAYER
   Icon: Magnifying glass with checkmark
   "7 verification methods • Catch errors • Quality control"

5. COST CONTROL & BUDGETS
   Icon: Dollar sign with lock
   "Budget limits • Auto-pause • Real-time alerts"

CENTER: "43 Agents Enhanced Automatically"

BOTTOM: "Transform: tool-with-agents → self-improving autonomous system"

Modern, professional, data-focused. Orange/blue/purple color scheme.`,
      style: 'marketing',
      includeText: 'Project Vend Phase 2: 8 Systems, 136 Tests, 100% Operational',
      saveTo: outputPath
    });
  }
}

// Singleton
let instance: GeminiImageService | null = null;

export function getGeminiImageService(): GeminiImageService {
  if (!instance) {
    instance = new GeminiImageService();
  }
  return instance;
}
