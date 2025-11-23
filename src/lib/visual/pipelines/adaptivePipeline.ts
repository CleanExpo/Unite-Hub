/**
 * Adaptive Pipeline
 * Phase 68: Context-aware generation that adapts to brand, audience, and platform
 */

import { ProviderType } from '../intelligenceFabricEngine';
import { VisualMethod, getMethodById } from '../methods';

export interface AdaptiveContext {
  brand: BrandContext;
  audience: AudienceContext;
  platform: PlatformContext;
  campaign?: CampaignContext;
}

export interface BrandContext {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
  };
  voice: 'professional' | 'friendly' | 'playful' | 'bold' | 'elegant';
  industry: string;
  logo_url?: string;
  guidelines_url?: string;
}

export interface AudienceContext {
  segment: string;
  age_range: string;
  interests: string[];
  pain_points: string[];
  preferred_style: 'minimal' | 'detailed' | 'colorful' | 'muted';
}

export interface PlatformContext {
  id: string;
  name: string;
  aspect_ratios: string[];
  max_file_size_mb: number;
  preferred_format: string;
  content_guidelines: string[];
}

export interface CampaignContext {
  name: string;
  objective: 'awareness' | 'consideration' | 'conversion';
  theme: string;
  season?: string;
  promotion?: string;
}

export interface AdaptiveRequest {
  method_id: string;
  base_params: Record<string, unknown>;
  context: AdaptiveContext;
  workspace_id: string;
  client_id?: string;
  variations: number;
}

export interface AdaptiveResult {
  id: string;
  request: AdaptiveRequest;
  status: 'analyzing' | 'adapting' | 'generating' | 'completed' | 'failed';
  adaptations: Adaptation[];
  generated_variants: GeneratedVariant[];
  recommendations: string[];
  context_score: number;
  generation_time_ms: number;
}

export interface Adaptation {
  parameter: string;
  original_value: unknown;
  adapted_value: unknown;
  reason: string;
  confidence: number;
}

export interface GeneratedVariant {
  id: string;
  variant_name: string;
  params: Record<string, unknown>;
  output_url?: string;
  platform_fit_score: number;
  brand_alignment_score: number;
  audience_relevance_score: number;
}

export class AdaptivePipeline {
  private results: Map<string, AdaptiveResult> = new Map();

  /**
   * Submit adaptive generation request
   */
  async submit(request: AdaptiveRequest): Promise<AdaptiveResult> {
    const method = getMethodById(request.method_id);
    if (!method) {
      throw new Error(`Method not found: ${request.method_id}`);
    }

    const result: AdaptiveResult = {
      id: `adp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      status: 'analyzing',
      adaptations: [],
      generated_variants: [],
      recommendations: [],
      context_score: 0,
      generation_time_ms: 0,
    };

    this.results.set(result.id, result);

    // Execute adaptive pipeline
    await this.executeAdaptive(result, method);

    return result;
  }

  /**
   * Execute adaptive generation
   */
  private async executeAdaptive(result: AdaptiveResult, method: VisualMethod): Promise<void> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze context
      result.status = 'analyzing';
      const contextAnalysis = this.analyzeContext(result.request.context);
      result.context_score = contextAnalysis.score;
      result.recommendations = contextAnalysis.recommendations;

      // Step 2: Generate adaptations
      result.status = 'adapting';
      result.adaptations = this.generateAdaptations(
        result.request.base_params,
        result.request.context,
        method
      );

      // Step 3: Generate variants
      result.status = 'generating';
      result.generated_variants = await this.generateVariants(
        result.request,
        result.adaptations,
        method
      );

      result.status = 'completed';
    } catch (error) {
      result.status = 'failed';
    }

    result.generation_time_ms = Date.now() - startTime;
  }

  /**
   * Analyze context for generation quality
   */
  private analyzeContext(context: AdaptiveContext): { score: number; recommendations: string[] } {
    let score = 50;
    const recommendations: string[] = [];

    // Brand completeness
    if (context.brand.colors.primary && context.brand.colors.secondary) {
      score += 10;
    } else {
      recommendations.push('Add secondary brand color for better consistency');
    }

    if (context.brand.logo_url) {
      score += 5;
    } else {
      recommendations.push('Upload logo for brand watermarking');
    }

    if (context.brand.guidelines_url) {
      score += 5;
    }

    // Audience clarity
    if (context.audience.interests.length >= 3) {
      score += 10;
    } else {
      recommendations.push('Add more audience interests for better targeting');
    }

    if (context.audience.pain_points.length >= 2) {
      score += 5;
    }

    // Platform optimization
    if (context.platform.aspect_ratios.length > 1) {
      score += 5;
    }

    // Campaign context
    if (context.campaign) {
      score += 10;
      if (context.campaign.season) {
        recommendations.push(`Consider seasonal elements for ${context.campaign.season}`);
      }
    }

    return { score: Math.min(100, score), recommendations };
  }

  /**
   * Generate parameter adaptations based on context
   */
  private generateAdaptations(
    baseParams: Record<string, unknown>,
    context: AdaptiveContext,
    method: VisualMethod
  ): Adaptation[] {
    const adaptations: Adaptation[] = [];

    // Adapt colors to brand
    if ('color_scheme' in baseParams || 'brand_colors' in baseParams) {
      adaptations.push({
        parameter: 'color_scheme',
        original_value: baseParams.color_scheme || '#000000',
        adapted_value: context.brand.colors.primary,
        reason: 'Aligned with brand primary color',
        confidence: 95,
      });
    }

    // Adapt style to audience
    if ('style' in baseParams) {
      const audienceStyle = this.mapAudienceToStyle(context.audience, method);
      if (audienceStyle !== baseParams.style) {
        adaptations.push({
          parameter: 'style',
          original_value: baseParams.style,
          adapted_value: audienceStyle,
          reason: `Optimized for ${context.audience.segment} audience preferences`,
          confidence: 85,
        });
      }
    }

    // Adapt for platform
    if (context.platform.aspect_ratios.length > 0) {
      adaptations.push({
        parameter: 'aspect_ratio',
        original_value: '16:9',
        adapted_value: context.platform.aspect_ratios[0],
        reason: `Optimized for ${context.platform.name}`,
        confidence: 100,
      });
    }

    // Adapt mood/tone based on brand voice
    if ('mood' in baseParams) {
      const brandMood = this.mapBrandVoiceToMood(context.brand.voice);
      adaptations.push({
        parameter: 'mood',
        original_value: baseParams.mood,
        adapted_value: brandMood,
        reason: `Matched to brand voice: ${context.brand.voice}`,
        confidence: 90,
      });
    }

    return adaptations;
  }

  /**
   * Map audience context to visual style
   */
  private mapAudienceToStyle(audience: AudienceContext, method: VisualMethod): string {
    const styleMapping: Record<string, string[]> = {
      minimal: ['modern', 'minimal', 'clean'],
      detailed: ['detailed', 'comprehensive', 'rich'],
      colorful: ['bold', 'vibrant', 'playful'],
      muted: ['elegant', 'subtle', 'refined'],
    };

    const options = method.params.find(p => p.name === 'style')?.options || [];
    const preferredStyles = styleMapping[audience.preferred_style] || [];

    return options.find(o => preferredStyles.includes(o)) || options[0] || 'modern';
  }

  /**
   * Map brand voice to visual mood
   */
  private mapBrandVoiceToMood(voice: BrandContext['voice']): string {
    const moodMapping: Record<string, string> = {
      professional: 'professional',
      friendly: 'friendly',
      playful: 'playful',
      bold: 'dynamic',
      elegant: 'refined',
    };

    return moodMapping[voice] || 'professional';
  }

  /**
   * Generate visual variants
   */
  private async generateVariants(
    request: AdaptiveRequest,
    adaptations: Adaptation[],
    method: VisualMethod
  ): Promise<GeneratedVariant[]> {
    const variants: GeneratedVariant[] = [];

    // Apply adaptations to base params
    const adaptedParams = { ...request.base_params };
    for (const adaptation of adaptations) {
      adaptedParams[adaptation.parameter] = adaptation.adapted_value;
    }

    // Generate requested number of variants
    for (let i = 0; i < request.variations; i++) {
      const variantParams = this.createVariantParams(adaptedParams, i);

      const variant: GeneratedVariant = {
        id: `var_${Date.now()}_${i}`,
        variant_name: `Variant ${String.fromCharCode(65 + i)}`,
        params: variantParams,
        platform_fit_score: this.calculatePlatformFit(variantParams, request.context.platform),
        brand_alignment_score: this.calculateBrandAlignment(variantParams, request.context.brand),
        audience_relevance_score: this.calculateAudienceRelevance(variantParams, request.context.audience),
      };

      variants.push(variant);
    }

    return variants;
  }

  /**
   * Create variant parameters with slight variations
   */
  private createVariantParams(baseParams: Record<string, unknown>, index: number): Record<string, unknown> {
    const params = { ...baseParams };

    // Add variation suffix to any text params
    if (typeof params.headline === 'string' && index > 0) {
      params.variant_index = index;
    }

    return params;
  }

  /**
   * Calculate platform fit score
   */
  private calculatePlatformFit(params: Record<string, unknown>, platform: PlatformContext): number {
    let score = 70;

    if (params.aspect_ratio && platform.aspect_ratios.includes(params.aspect_ratio as string)) {
      score += 20;
    }

    if (params.format === platform.preferred_format) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate brand alignment score
   */
  private calculateBrandAlignment(params: Record<string, unknown>, brand: BrandContext): number {
    let score = 60;

    if (params.color_scheme === brand.colors.primary) {
      score += 25;
    }

    if (params.style && this.styleMatchesBrandVoice(params.style as string, brand.voice)) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Check if style matches brand voice
   */
  private styleMatchesBrandVoice(style: string, voice: BrandContext['voice']): boolean {
    const matches: Record<string, string[]> = {
      professional: ['modern', 'minimal', 'clean'],
      friendly: ['friendly', 'warm', 'approachable'],
      playful: ['playful', 'fun', 'colorful'],
      bold: ['bold', 'dynamic', 'striking'],
      elegant: ['elegant', 'refined', 'sophisticated'],
    };

    return (matches[voice] || []).includes(style);
  }

  /**
   * Calculate audience relevance score
   */
  private calculateAudienceRelevance(params: Record<string, unknown>, audience: AudienceContext): number {
    let score = 65;

    // Style preference match
    if (params.style) {
      const styleMap: Record<string, string[]> = {
        minimal: ['minimal', 'clean', 'modern'],
        detailed: ['detailed', 'comprehensive'],
        colorful: ['colorful', 'bold', 'vibrant'],
        muted: ['muted', 'subtle', 'elegant'],
      };

      if ((styleMap[audience.preferred_style] || []).includes(params.style as string)) {
        score += 25;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Get result by ID
   */
  getResult(id: string): AdaptiveResult | undefined {
    return this.results.get(id);
  }
}

export default AdaptivePipeline;
