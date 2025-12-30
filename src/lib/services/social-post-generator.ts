/**
 * Social Post Generator Service
 * Generates and schedules social media posts for all Synthex tiers
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lazy Anthropic client
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

export interface SocialPostRequest {
  workspaceId: string;
  tier: 'starter' | 'professional' | 'elite';
  industry: string;
  brandVoice?: {
    tone?: string;
    keywords?: string[];
    avoid?: string[];
  };
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  contentType?: 'promotional' | 'educational' | 'engagement' | 'announcement';
  scheduledFor?: string; // ISO timestamp
}

export interface SocialPostResponse {
  id: string;
  content: string;
  hashtags: string[];
  mediaRecommendations?: string[];
  scheduledFor?: string;
  status: string;
}

// Tier limits (posts per week)
const TIER_LIMITS = {
  starter: 10,
  professional: 25,
  elite: null // unlimited
};

export class SocialPostGenerator {
  /**
   * Check if workspace has capacity for more posts this week
   */
  async checkWeeklyLimit(workspaceId: string, tier: 'starter' | 'professional' | 'elite'): Promise<boolean> {
    const limit = TIER_LIMITS[tier];
    if (limit === null) {
return true;
} // Elite = unlimited

    // Get start of current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('synthex_content_queue')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('content_type', 'social_post')
      .gte('created_at', startOfWeek.toISOString());

    if (error) {
throw error;
}

    return (count || 0) < limit;
  }

  /**
   * Generate social post content using AI
   */
  async generatePost(request: SocialPostRequest): Promise<SocialPostResponse> {
    // Check weekly limit
    const hasCapacity = await this.checkWeeklyLimit(request.workspaceId, request.tier);
    if (!hasCapacity) {
      throw new Error(`Weekly limit reached for ${request.tier} tier (${TIER_LIMITS[request.tier]} posts/week)`);
    }

    // Build AI prompt
    const prompt = this.buildPrompt(request);

    // Generate content with Claude
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const generatedContent = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse response (expecting JSON format)
    const parsed = this.parseAIResponse(generatedContent);

    // Save to queue
    const { data: queuedPost, error } = await supabase
      .from('synthex_content_queue')
      .insert({
        workspace_id: request.workspaceId,
        content_type: 'social_post',
        platform: request.platform,
        body: parsed.content,
        hashtags: parsed.hashtags,
        status: request.scheduledFor ? 'scheduled' : 'pending',
        scheduled_for: request.scheduledFor,
        tier: request.tier,
        weekly_limit: TIER_LIMITS[request.tier],
        generated_by: 'social-post-generator',
        prompt_used: prompt,
        industry: request.industry,
        brand_voice: request.brandVoice
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return {
      id: queuedPost.id,
      content: parsed.content,
      hashtags: parsed.hashtags,
      mediaRecommendations: parsed.mediaRecommendations,
      scheduledFor: request.scheduledFor,
      status: queuedPost.status
    };
  }

  /**
   * Generate multiple posts in batch
   */
  async generateBatch(requests: SocialPostRequest[]): Promise<SocialPostResponse[]> {
    const results: SocialPostResponse[] = [];

    for (const request of requests) {
      try {
        const post = await this.generatePost(request);
        results.push(post);
      } catch (error) {
        console.error(`Failed to generate post for workspace ${request.workspaceId}:`, error);
        // Continue with other posts
      }
    }

    return results;
  }

  /**
   * Get scheduled posts for a workspace
   */
  async getScheduledPosts(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('synthex_content_queue')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('content_type', 'social_post')
      .in('status', ['pending', 'scheduled'])
      .order('scheduled_for', { ascending: true });

    if (error) {
throw error;
}
    return data || [];
  }

  /**
   * Cancel a scheduled post
   */
  async cancelPost(postId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('synthex_content_queue')
      .update({ status: 'cancelled' })
      .eq('id', postId)
      .eq('workspace_id', workspaceId);

    if (error) {
throw error;
}
  }

  /**
   * Build AI prompt for content generation
   */
  private buildPrompt(request: SocialPostRequest): string {
    const { industry, brandVoice, platform, contentType = 'promotional' } = request;

    let prompt = `Generate a ${contentType} social media post for a ${industry} business targeting ${platform}.

Platform: ${platform}
Industry: ${industry}
Content Type: ${contentType}`;

    if (brandVoice?.tone) {
      prompt += `\nBrand Tone: ${brandVoice.tone}`;
    }

    if (brandVoice?.keywords && brandVoice.keywords.length > 0) {
      prompt += `\nKeywords to include: ${brandVoice.keywords.join(', ')}`;
    }

    if (brandVoice?.avoid && brandVoice.avoid.length > 0) {
      prompt += `\nAvoid these words/phrases: ${brandVoice.avoid.join(', ')}`;
    }

    prompt += `

Requirements:
- Keep it engaging and authentic
- Match the ${platform} platform style
- Include 3-5 relevant hashtags
- Suggest image/video type (don't generate URLs)

Return response in this JSON format:
{
  "content": "the post text here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "mediaRecommendations": ["suggested image/video type"]
}`;

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): {
    content: string;
    hashtags: string[];
    mediaRecommendations?: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: parsed.content || response,
          hashtags: parsed.hashtags || [],
          mediaRecommendations: parsed.mediaRecommendations
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, using raw text');
    }

    // Fallback: extract hashtags from text
    const hashtags = response.match(/#\w+/g) || [];
    const content = response.replace(/#\w+/g, '').trim();

    return {
      content,
      hashtags,
      mediaRecommendations: []
    };
  }
}

export const socialPostGenerator = new SocialPostGenerator();
