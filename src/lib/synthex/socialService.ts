/**
 * Synthex Social Media Service
 * Phase B31: Omni-Channel Social Posting & Scheduling Engine
 *
 * Provides social media automation for Facebook, LinkedIn, Instagram,
 * X/Twitter, YouTube, TikTok, Threads, and more.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Lazy Anthropic client initialization
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }
  return anthropicClient;
}

// Types
export type SocialProvider =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'threads'
  | 'pinterest'
  | 'snapchat'
  | 'reddit';

export type ContentType = 'post' | 'story' | 'reel' | 'video' | 'carousel' | 'thread' | 'poll' | 'live';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type ConnectionStatus = 'connected' | 'expired' | 'revoked' | 'error';

export interface SocialAccount {
  id: string;
  tenant_id: string;
  provider: SocialProvider;
  account_id: string;
  account_name?: string;
  account_handle?: string;
  profile_url?: string;
  avatar_url?: string;
  account_type: 'personal' | 'business' | 'creator' | 'page';
  follower_count?: number;
  is_active: boolean;
  connection_status: ConnectionStatus;
  last_error?: string;
  connected_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  tenant_id: string;
  account_id: string;
  content_type: ContentType;
  text_content?: string;
  hashtags: string[];
  mentions: string[];
  media_urls: string[];
  media_types: string[];
  platform_content: Record<string, unknown>;
  link_url?: string;
  status: PostStatus;
  scheduled_for?: string;
  published_at?: string;
  platform_post_id?: string;
  platform_url?: string;
  ai_optimized: boolean;
  original_content?: string;
  campaign_id?: string;
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPostAnalytics {
  post_id: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  captured_at: string;
}

export interface SocialTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  platforms: SocialProvider[];
  content_type: ContentType;
  text_template?: string;
  hashtag_suggestions: string[];
  ai_tone?: string;
  ai_length: 'short' | 'medium' | 'long';
  use_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CreatePostInput {
  tenant_id: string;
  account_id: string;
  content_type?: ContentType;
  text_content: string;
  hashtags?: string[];
  mentions?: string[];
  media_urls?: string[];
  link_url?: string;
  scheduled_for?: string;
  campaign_id?: string;
}

export interface PlatformContentSpec {
  max_length: number;
  supports_hashtags: boolean;
  supports_mentions: boolean;
  max_hashtags?: number;
  max_media?: number;
  supported_media_types: string[];
  optimal_post_times: string[];
}

// Platform specifications
const PLATFORM_SPECS: Record<SocialProvider, PlatformContentSpec> = {
  twitter: {
    max_length: 280,
    supports_hashtags: true,
    supports_mentions: true,
    max_hashtags: 3,
    max_media: 4,
    supported_media_types: ['image', 'video', 'gif'],
    optimal_post_times: ['09:00', '12:00', '17:00'],
  },
  facebook: {
    max_length: 63206,
    supports_hashtags: true,
    supports_mentions: true,
    max_media: 10,
    supported_media_types: ['image', 'video'],
    optimal_post_times: ['09:00', '13:00', '16:00'],
  },
  instagram: {
    max_length: 2200,
    supports_hashtags: true,
    supports_mentions: true,
    max_hashtags: 30,
    max_media: 10,
    supported_media_types: ['image', 'video'],
    optimal_post_times: ['11:00', '13:00', '19:00'],
  },
  linkedin: {
    max_length: 3000,
    supports_hashtags: true,
    supports_mentions: true,
    max_hashtags: 5,
    max_media: 9,
    supported_media_types: ['image', 'video', 'document'],
    optimal_post_times: ['08:00', '12:00', '17:00'],
  },
  youtube: {
    max_length: 5000,
    supports_hashtags: true,
    supports_mentions: false,
    max_hashtags: 15,
    max_media: 1,
    supported_media_types: ['video'],
    optimal_post_times: ['14:00', '16:00', '21:00'],
  },
  tiktok: {
    max_length: 2200,
    supports_hashtags: true,
    supports_mentions: true,
    max_hashtags: 5,
    max_media: 1,
    supported_media_types: ['video'],
    optimal_post_times: ['19:00', '21:00', '22:00'],
  },
  threads: {
    max_length: 500,
    supports_hashtags: false,
    supports_mentions: true,
    max_media: 10,
    supported_media_types: ['image', 'video'],
    optimal_post_times: ['09:00', '12:00', '20:00'],
  },
  pinterest: {
    max_length: 500,
    supports_hashtags: true,
    supports_mentions: false,
    max_hashtags: 20,
    max_media: 1,
    supported_media_types: ['image', 'video'],
    optimal_post_times: ['20:00', '21:00', '22:00'],
  },
  snapchat: {
    max_length: 250,
    supports_hashtags: false,
    supports_mentions: true,
    max_media: 1,
    supported_media_types: ['image', 'video'],
    optimal_post_times: ['22:00', '23:00'],
  },
  reddit: {
    max_length: 40000,
    supports_hashtags: false,
    supports_mentions: true,
    max_media: 20,
    supported_media_types: ['image', 'video', 'gif', 'link'],
    optimal_post_times: ['06:00', '08:00', '12:00', '17:00'],
  },
};

// Get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/**
 * Connect a social media account
 * Note: In production, this would handle OAuth flow
 */
export async function connectAccount(
  tenantId: string,
  provider: SocialProvider,
  oauthData: {
    account_id: string;
    account_name?: string;
    account_handle?: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  }
): Promise<SocialAccount> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_accounts')
    .upsert(
      {
        tenant_id: tenantId,
        provider,
        account_id: oauthData.account_id,
        account_name: oauthData.account_name,
        account_handle: oauthData.account_handle,
        access_token: oauthData.access_token,
        refresh_token: oauthData.refresh_token,
        token_expires_at: oauthData.expires_at,
        is_active: true,
        connection_status: 'connected',
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,provider,account_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error connecting account:', error);
    throw new Error(`Failed to connect account: ${error.message}`);
  }

  return data;
}

/**
 * Get all connected accounts for a tenant
 */
export async function getAccounts(tenantId: string): Promise<SocialAccount[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('provider');

  if (error) {
    console.error('Error fetching accounts:', error);
    throw new Error(`Failed to get accounts: ${error.message}`);
  }

  return data || [];
}

/**
 * Schedule a social media post
 */
export async function schedulePost(input: CreatePostInput): Promise<SocialPost> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_posts')
    .insert({
      tenant_id: input.tenant_id,
      account_id: input.account_id,
      content_type: input.content_type || 'post',
      text_content: input.text_content,
      hashtags: input.hashtags || [],
      mentions: input.mentions || [],
      media_urls: input.media_urls || [],
      media_types: [],
      platform_content: {},
      link_url: input.link_url,
      status: input.scheduled_for ? 'scheduled' : 'draft',
      scheduled_for: input.scheduled_for,
      campaign_id: input.campaign_id,
      ai_optimized: false,
      retry_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data;
}

/**
 * Get posts for a tenant
 */
export async function getPosts(
  tenantId: string,
  options: { status?: PostStatus; account_id?: string; limit?: number } = {}
): Promise<SocialPost[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('synthex_social_posts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scheduled_for', { ascending: true, nullsFirst: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.account_id) {
    query = query.eq('account_id', options.account_id);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    throw new Error(`Failed to get posts: ${error.message}`);
  }

  return data || [];
}

/**
 * Update post status
 */
export async function updatePost(
  tenantId: string,
  postId: string,
  updates: Partial<Pick<SocialPost, 'text_content' | 'hashtags' | 'scheduled_for' | 'status' | 'media_urls'>>
): Promise<SocialPost> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_posts')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data;
}

/**
 * Publish a post (placeholder - would call actual platform APIs)
 */
export async function publishPost(tenantId: string, postId: string): Promise<SocialPost> {
  const supabase = getSupabaseAdmin();

  // Get post and account
  const { data: post, error: postError } = await supabase
    .from('synthex_social_posts')
    .select('*, account:synthex_social_accounts(*)')
    .eq('tenant_id', tenantId)
    .eq('id', postId)
    .single();

  if (postError || !post) {
    throw new Error('Post not found');
  }

  // Mark as publishing
  await supabase
    .from('synthex_social_posts')
    .update({ status: 'publishing' })
    .eq('id', postId);

  try {
    // Placeholder: In production, call actual platform API based on provider
    // const result = await publishToProvider(post.account.provider, post);

    // Simulate successful publish
    const platformPostId = `sim_${Date.now()}`;
    const platformUrl = `https://${post.account.provider}.com/post/${platformPostId}`;

    const { data: updated, error: updateError } = await supabase
      .from('synthex_social_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        platform_post_id: platformPostId,
        platform_url: platformUrl,
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated;
  } catch (error) {
    // Handle failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase.from('synthex_social_posts').update({
      status: 'failed',
      last_error: errorMessage,
      retry_count: post.retry_count + 1,
    }).eq('id', postId);

    // Log error
    await supabase.from('synthex_social_errors').insert({
      tenant_id: tenantId,
      account_id: post.account_id,
      post_id: postId,
      error_type: 'api_error',
      error_message: errorMessage,
      operation: 'publish',
    });

    throw error;
  }
}

/**
 * AI-powered content rewrite for specific platform
 */
export async function rewriteForPlatform(
  content: string,
  targetPlatform: SocialProvider,
  options: { tone?: string; includeHashtags?: boolean } = {}
): Promise<{
  text: string;
  hashtags: string[];
  characterCount: number;
}> {
  const anthropic = getAnthropicClient();
  const spec = PLATFORM_SPECS[targetPlatform];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Rewrite this content for ${targetPlatform}.

Original content:
${content}

Requirements:
- Maximum ${spec.max_length} characters
- Tone: ${options.tone || 'professional but engaging'}
- ${options.includeHashtags && spec.supports_hashtags ? `Include up to ${spec.max_hashtags || 5} relevant hashtags` : 'No hashtags'}
- Optimize for ${targetPlatform}'s audience and style

Return JSON with:
- "text": the rewritten content (without hashtags in the text)
- "hashtags": array of hashtags (without # symbol)
- "character_count": length of text

Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return { text: content, hashtags: [], characterCount: content.length };
  }

  try {
    const result = JSON.parse(textContent.text);
    return {
      text: result.text,
      hashtags: result.hashtags || [],
      characterCount: result.character_count || result.text.length,
    };
  } catch {
    return { text: content, hashtags: [], characterCount: content.length };
  }
}

/**
 * AI-powered hashtag optimization
 */
export async function optimizeHashtags(
  content: string,
  platform: SocialProvider,
  existingHashtags: string[] = []
): Promise<{
  recommended: string[];
  trending: string[];
  niche: string[];
}> {
  const anthropic = getAnthropicClient();
  const spec = PLATFORM_SPECS[platform];

  if (!spec.supports_hashtags) {
    return { recommended: [], trending: [], niche: [] };
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Suggest hashtags for this ${platform} post.

Content: ${content}
${existingHashtags.length > 0 ? `Current hashtags: ${existingHashtags.join(', ')}` : ''}

Return JSON with:
- "recommended": top ${spec.max_hashtags || 5} hashtags for reach
- "trending": 3 currently trending relevant hashtags
- "niche": 3 specific niche hashtags for engagement

All without # symbol. Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return { recommended: [], trending: [], niche: [] };
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return { recommended: [], trending: [], niche: [] };
  }
}

/**
 * Get optimal posting times for a platform
 */
export function getOptimalPostTimes(platform: SocialProvider): string[] {
  return PLATFORM_SPECS[platform].optimal_post_times;
}

/**
 * Get platform specifications
 */
export function getPlatformSpec(platform: SocialProvider): PlatformContentSpec {
  return PLATFORM_SPECS[platform];
}

/**
 * Process due posts (called by scheduler)
 */
export async function processDuePosts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const supabase = getSupabaseAdmin();

  // Use database function to get due posts
  const { data: duePosts, error } = await supabase.rpc('get_due_social_posts', {
    p_limit: 50,
  });

  if (error) {
    console.error('Error fetching due posts:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const post of duePosts || []) {
    try {
      await publishPost(post.tenant_id, post.post_id);
      succeeded++;
    } catch {
      failed++;
    }
  }

  return {
    processed: (duePosts || []).length,
    succeeded,
    failed,
  };
}

/**
 * Get post analytics
 */
export async function getPostAnalytics(
  tenantId: string,
  postId: string
): Promise<SocialPostAnalytics | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_post_analytics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('post_id', postId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    console.error('Error fetching analytics:', error);
    return null;
  }

  return data;
}

/**
 * Get templates
 */
export async function getTemplates(tenantId: string): Promise<SocialTemplate[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_social_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('use_count', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a post from template
 */
export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  accountId: string,
  variables: Record<string, string> = {}
): Promise<SocialPost> {
  const supabase = getSupabaseAdmin();

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('synthex_social_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  // Replace variables in template
  let content = template.text_template || '';
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Create post
  const post = await schedulePost({
    tenant_id: tenantId,
    account_id: accountId,
    content_type: template.content_type,
    text_content: content,
    hashtags: template.hashtag_suggestions,
  });

  // Update template usage
  await supabase
    .from('synthex_social_templates')
    .update({
      use_count: template.use_count + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', templateId);

  return post;
}

/**
 * Get social dashboard summary
 */
export async function getSocialSummary(tenantId: string): Promise<{
  connected_accounts: number;
  scheduled_posts: number;
  published_today: number;
  total_engagement: number;
  accounts_by_platform: Record<SocialProvider, number>;
}> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const [accountsResult, scheduledResult, publishedResult] = await Promise.all([
    supabase
      .from('synthex_social_accounts')
      .select('provider')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('synthex_social_posts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled'),
    supabase
      .from('synthex_social_posts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .gte('published_at', today),
  ]);

  const accounts = accountsResult.data || [];
  const accountsByPlatform: Partial<Record<SocialProvider, number>> = {};

  for (const acc of accounts) {
    accountsByPlatform[acc.provider as SocialProvider] =
      (accountsByPlatform[acc.provider as SocialProvider] || 0) + 1;
  }

  return {
    connected_accounts: accounts.length,
    scheduled_posts: (scheduledResult.data || []).length,
    published_today: (publishedResult.data || []).length,
    total_engagement: 0, // Would aggregate from analytics
    accounts_by_platform: accountsByPlatform as Record<SocialProvider, number>,
  };
}

/**
 * Disconnect account
 */
export async function disconnectAccount(tenantId: string, accountId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('synthex_social_accounts')
    .update({
      is_active: false,
      connection_status: 'revoked',
      access_token: null,
      refresh_token: null,
    })
    .eq('tenant_id', tenantId)
    .eq('id', accountId);

  if (error) {
    console.error('Error disconnecting account:', error);
    throw new Error(`Failed to disconnect account: ${error.message}`);
  }
}
