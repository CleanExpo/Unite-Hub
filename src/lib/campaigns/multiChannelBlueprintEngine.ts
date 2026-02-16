/**
 * Multi-Channel Blueprint Engine
 * AI-powered campaign blueprint generation with brand-aware content
 * Integrates: Topic Engine, Analytics (v1_1_07), Brand Matrix (v1_1_02), Channel Playbooks
 */

import Anthropic from '@anthropic-ai/sdk';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import { supabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { ChannelPlaybook, getChannelPlaybook, getBrandChannels } from './channelPlaybooks';

const logger = createApiLogger({ service: 'multiChannelBlueprintEngine' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

interface BrandContext {
  brand_name: string;
  positioning: string;
  voice: string;
  audience: string;
}

interface AnalyticsInsights {
  search_volume: number | null;
  keyword_difficulty?: number;
  competition: string | null;
  cpc?: number;
  uncertainty?: string;
}

interface ChannelContentItem {
  channel: string;
  draft_content: string;
  headline: string;
  hook?: string;
  cta?: string;
  meta_description?: string;
  hashtags?: string[];
  visual_prompts?: string[];
  word_count?: number;
  compliance_notes?: string;
  generated_at?: string;
  model_used?: string;
  error?: string;
}

interface VisualConcept {
  visual_type: string;
  description: string;
  dimensions: string;
  vif_prompt_id: string;
  draft_mode: boolean;
}

interface SEORecommendations {
  primary_keyword: string;
  secondary_keywords: string[];
  target_keyword_density: [number, number];
  internal_linking_suggestions: string[];
  meta_title_template: string;
  meta_description_length: [number, number];
  schema_markup_recommended: string[];
  competition_level: string;
  search_volume: number | string;
}

export interface BlueprintGenerationRequest {
  topicTitle: string;
  topicKeywords: string[];
  brandSlug: string;
  workspaceId: string;
  blueprintType: string;
  primaryObjective: string;
  targetAudience: Record<string, unknown>;
  selectedChannels: string[];
  analyticsInsights?: AnalyticsInsights;
}

export interface GeneratedBlueprint {
  blueprint_title: string;
  channels: Record<string, { enabled: boolean; status: string }>;
  website_content?: ChannelContentItem;
  blog_content?: ChannelContentItem;
  social_content?: Record<string, ChannelContentItem> | null;
  email_content?: Record<string, ChannelContentItem> | null;
  video_content?: Record<string, ChannelContentItem> | null;
  visual_concepts?: VisualConcept[];
  vif_references?: string[];
  seo_recommendations?: SEORecommendations;
  uncertainty_notes: string;
  data_sources: string[];
  ai_confidence_score: number;
}

export class MultiChannelBlueprintEngine {
  /**
   * Generate comprehensive multi-channel blueprint from topic
   */
  async generateBlueprint(request: BlueprintGenerationRequest): Promise<GeneratedBlueprint> {
    try {
      logger.info('Starting blueprint generation', {
        topicTitle: request.topicTitle,
        brandSlug: request.brandSlug,
        channels: request.selectedChannels,
      });

      // Get brand context
      const brandContext = await this.getBrandContext(request.brandSlug, request.workspaceId);

      // Get analytics insights for topic keywords
      const analyticsData = request.analyticsInsights || await this.getAnalyticsInsights(
        request.workspaceId,
        request.brandSlug,
        request.topicKeywords
      );

      // Generate content for each channel
      const channelContent: Record<string, ChannelContentItem> = {};

      for (const channel of request.selectedChannels) {
        const playbook = getChannelPlaybook(channel);
        if (!playbook) {
          logger.warn('No playbook found for channel', { channel });
          continue;
        }

        channelContent[channel] = await this.generateChannelContent(
          channel,
          playbook,
          request,
          brandContext,
          analyticsData
        );
      }

      // Generate visual concepts
      const visualConcepts = await this.generateVisualConcepts(
        request.topicTitle,
        request.brandSlug,
        request.selectedChannels
      );

      // Generate SEO recommendations
      const seoRecommendations = this.generateSEORecommendations(
        request.topicKeywords,
        analyticsData,
        channelContent
      );

      // Structure the blueprint
      const blueprint: GeneratedBlueprint = {
        blueprint_title: `${request.topicTitle} - Multi-Channel Campaign`,
        channels: this.structureChannels(request.selectedChannels),
        website_content: channelContent.website_landing_page || channelContent.website_product_page,
        blog_content: channelContent.blog_pillar_post || channelContent.blog_cluster_post,
        social_content: this.consolidateSocialContent(channelContent),
        email_content: this.consolidateEmailContent(channelContent),
        video_content: this.consolidateVideoContent(channelContent),
        visual_concepts: visualConcepts,
        vif_references: visualConcepts.map(v => v.vif_prompt_id),
        seo_recommendations: seoRecommendations,
        uncertainty_notes: this.generateUncertaintyNotes(analyticsData),
        data_sources: [
          'Analytics Cache (v1_1_07)',
          'Brand Matrix (v1_1_02)',
          'Channel Playbooks (v1_1_04)',
          'Claude AI Generation',
        ],
        ai_confidence_score: 0.85, // Base confidence, adjusted by analytics quality
      };

      logger.info('Blueprint generation complete', {
        topicTitle: request.topicTitle,
        channelsGenerated: Object.keys(channelContent).length,
      });

      return blueprint;
    } catch (error) {
      logger.error('Blueprint generation failed', { error, request });
      throw error;
    }
  }

  /**
   * Generate content for a specific channel using AI
   */
  private async generateChannelContent(
    channel: string,
    playbook: ChannelPlaybook,
    request: BlueprintGenerationRequest,
    brandContext: BrandContext,
    analyticsData: AnalyticsInsights
  ): Promise<ChannelContentItem> {
    const systemPrompt = `You are an expert content strategist generating ${playbook.channel} content for ${brandContext.brand_name}.

Brand Voice: ${playbook.brandVoiceGuidelines[request.brandSlug] || 'Professional and engaging'}
Brand Positioning: ${brandContext.positioning || 'Industry leader'}

Channel Specifications:
- Category: ${playbook.category}
- Optimal Length: ${playbook.specs.optimalLength || 'As per best practices'}
- Required Elements: ${playbook.specs.requiredElements.join(', ')}
- Content Structure: ${JSON.stringify(playbook.contentStructure)}

Topic: ${request.topicTitle}
Keywords: ${request.topicKeywords.join(', ')}
Primary Objective: ${request.primaryObjective}
Target Audience: ${JSON.stringify(request.targetAudience)}

${analyticsData.search_volume ? `Search Volume: ${analyticsData.search_volume}/month` : ''}
${analyticsData.competition ? `Competition Level: ${analyticsData.competition}` : ''}

Generate draft content that:
1. Follows the brand voice and positioning
2. Adheres to channel specifications
3. Incorporates target keywords naturally
4. Addresses the target audience
5. Includes clear CTAs aligned with the objective
6. Uses the required content structure

Return ONLY valid JSON with the following structure:
{
  "draft_content": "The main content text",
  "headline": "Compelling headline/title",
  "hook": "Attention-grabbing opening",
  "cta": "Clear call-to-action",
  "meta_description": "SEO meta description (if applicable)",
  "hashtags": ["tag1", "tag2"] (for social),
  "visual_prompts": ["Description of needed visual 1", "Description 2"],
  "word_count": number,
  "compliance_notes": "Any disclaimers or requirements"
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.7,
        system: [
          {
            type: 'text',
            text: `You are an expert content strategist generating ${playbook.channel} content.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: systemPrompt }],
      });

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('BlueprintEngine:generateChannelContent', cacheStats);

      const contentText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse JSON response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const content = JSON.parse(jsonMatch[0]);
        return {
          channel,
          ...content,
          generated_at: new Date().toISOString(),
          model_used: 'claude-sonnet-4-5-20250929',
        };
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      logger.error('Channel content generation failed', { error, channel });
      return {
        channel,
        draft_content: `[Draft content for ${channel}]`,
        headline: request.topicTitle,
        error: 'Generation failed',
      };
    }
  }

  /**
   * Get brand context from Brand Matrix
   */
  private async getBrandContext(brandSlug: string, workspaceId: string): Promise<BrandContext> {
    // In a full implementation, this would query the Brand Matrix (v1_1_02)
    const brandProfiles: Record<string, BrandContext> = {
      unite_group: {
        brand_name: 'Unite Group',
        positioning: 'Premium stainless steel solutions for commercial and residential projects',
        voice: 'Professional, authoritative, solution-focused',
        audience: 'Architects, builders, property developers',
      },
      aussie_stainless: {
        brand_name: 'Aussie Stainless',
        positioning: 'Australian craftsmanship in stainless steel balustrades and metalwork',
        voice: 'Craftsmanship-focused, quality-driven, proud Australian',
        audience: 'Homeowners, renovators, local builders',
      },
      rp_tech: {
        brand_name: 'R&P Tech Solutions',
        positioning: 'Innovative technology solutions for modern businesses',
        voice: 'Technical, innovative, efficiency-focused',
        audience: 'IT managers, CTOs, business owners',
      },
      bne_glass_pool_fencing: {
        brand_name: 'BNE Glass Pool Fencing',
        positioning: 'Safety-first glass pool fencing for Brisbane families',
        voice: 'Safety-focused, family-oriented, local expertise',
        audience: 'Pool owners, families, Brisbane residents',
      },
      ultra_chrome: {
        brand_name: 'Ultra Chrome',
        positioning: 'Premium chrome and metalwork finishing services',
        voice: 'Sleek, premium, detail-focused',
        audience: 'High-end renovators, luxury builders',
      },
    };

    return brandProfiles[brandSlug] || brandProfiles.unite_group;
  }

  /**
   * Get analytics insights for keywords
   */
  private async getAnalyticsInsights(
    workspaceId: string,
    brandSlug: string,
    keywords: string[]
  ): Promise<AnalyticsInsights> {
    try {
      // Query DataForSEO cache for keyword data
      const { data, error } = await supabaseAdmin.rpc('get_dataforseo_cache', {
        p_workspace_id: workspaceId,
        p_brand_slug: brandSlug,
        p_keyword: keywords[0], // Primary keyword
      });

      if (error || !data || data.length === 0) {
        return { search_volume: null, competition: null, uncertainty: 'No analytics data available' };
      }

      return {
        search_volume: data[0].search_volume,
        keyword_difficulty: data[0].keyword_difficulty,
        competition: data[0].competition,
        cpc: data[0].cpc,
        uncertainty: data[0].uncertainty_notes,
      };
    } catch (error) {
      logger.error('Failed to get analytics insights', { error, keywords });
      return { search_volume: null, competition: null, uncertainty: 'Analytics fetch failed' };
    }
  }

  /**
   * Generate visual concepts for blueprint
   */
  private async generateVisualConcepts(
    topicTitle: string,
    brandSlug: string,
    channels: string[]
  ): Promise<VisualConcept[]> {
    const visualNeeds = [];

    if (channels.includes('website_landing_page') || channels.includes('website_product_page')) {
      visualNeeds.push({
        visual_type: 'hero_image',
        description: `Professional hero image for ${topicTitle} landing page`,
        dimensions: '1920x1080',
        vif_prompt_id: `vif_hero_${Date.now()}`,
        draft_mode: true,
      });
    }

    if (channels.includes('blog_pillar_post')) {
      visualNeeds.push({
        visual_type: 'featured_image',
        description: `Featured blog image for ${topicTitle}`,
        dimensions: '1200x630',
        vif_prompt_id: `vif_blog_${Date.now()}`,
        draft_mode: true,
      });
    }

    if (channels.some(c => c.includes('instagram') || c.includes('facebook'))) {
      visualNeeds.push({
        visual_type: 'social_post',
        description: `Social media image for ${topicTitle}`,
        dimensions: '1080x1080',
        vif_prompt_id: `vif_social_${Date.now()}`,
        draft_mode: true,
      });
    }

    return visualNeeds;
  }

  /**
   * Generate SEO recommendations
   */
  private generateSEORecommendations(
    keywords: string[],
    analyticsData: AnalyticsInsights,
    channelContent: Record<string, ChannelContentItem>
  ): SEORecommendations {
    return {
      primary_keyword: keywords[0],
      secondary_keywords: keywords.slice(1, 5),
      target_keyword_density: [1, 2.5],
      internal_linking_suggestions: [
        'Link to related service pages',
        'Link to case studies',
        'Link to FAQ section',
      ],
      meta_title_template: `${keywords[0]} | [Brand Name]`,
      meta_description_length: [150, 160],
      schema_markup_recommended: ['Article', 'Product', 'Organization'],
      competition_level: analyticsData.competition || 'Unknown',
      search_volume: analyticsData.search_volume || 'Unknown',
    };
  }

  /**
   * Structure channels object
   */
  private structureChannels(selectedChannels: string[]): Record<string, { enabled: boolean; status: string }> {
    const channels: Record<string, { enabled: boolean; status: string }> = {};
    selectedChannels.forEach(channel => {
      channels[channel] = { enabled: true, status: 'draft' };
    });
    return channels;
  }

  /**
   * Consolidate social content from multiple channels
   */
  private consolidateSocialContent(channelContent: Record<string, ChannelContentItem>): Record<string, ChannelContentItem> | null {
    const socialContent: Record<string, ChannelContentItem> = {};

    ['facebook_post', 'instagram_post', 'linkedin_post', 'tiktok_video'].forEach(channel => {
      if (channelContent[channel]) {
        socialContent[channel] = channelContent[channel];
      }
    });

    return Object.keys(socialContent).length > 0 ? socialContent : null;
  }

  /**
   * Consolidate email content
   */
  private consolidateEmailContent(channelContent: Record<string, ChannelContentItem>): Record<string, ChannelContentItem> | null {
    const emailContent: Record<string, ChannelContentItem> = {};

    ['email_newsletter', 'email_nurture_sequence'].forEach(channel => {
      if (channelContent[channel]) {
        emailContent[channel] = channelContent[channel];
      }
    });

    return Object.keys(emailContent).length > 0 ? emailContent : null;
  }

  /**
   * Consolidate video content
   */
  private consolidateVideoContent(channelContent: Record<string, ChannelContentItem>): Record<string, ChannelContentItem> | null {
    const videoContent: Record<string, ChannelContentItem> = {};

    ['youtube_short', 'tiktok_video'].forEach(channel => {
      if (channelContent[channel]) {
        videoContent[channel] = channelContent[channel];
      }
    });

    return Object.keys(videoContent).length > 0 ? videoContent : null;
  }

  /**
   * Generate uncertainty notes based on data quality
   */
  private generateUncertaintyNotes(analyticsData: AnalyticsInsights): string {
    const notes = [];

    if (!analyticsData.search_volume) {
      notes.push('Search volume data unavailable - estimates may be inaccurate.');
    }

    if (!analyticsData.competition) {
      notes.push('Competition analysis incomplete - difficulty scoring may be imprecise.');
    }

    notes.push('AI-generated content requires founder review and approval before use.');
    notes.push('All visual concepts are placeholders pending VIF generation.');
    notes.push('SEO recommendations based on available data as of generation date.');

    return notes.join(' ');
  }
}

export const blueprintEngine = new MultiChannelBlueprintEngine();
