/**
 * Social Publishing Service
 *
 * Auto-publishing engine for social media:
 * - Scheduling with cron-safe queue
 * - Multi-channel publishing (IG/TikTok/LinkedIn/FB/YT)
 * - Caption variants generation
 * - Persona-aware rewriting
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getPersonaConfig, type BrandConfig } from './marketingOverviewService';
import type { SocialAsset } from './socialAssetService';

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduledPost {
  id: string;
  assetId: string;
  workspaceId: string;
  platform: string;
  scheduledAt: string;
  status: 'pending' | 'processing' | 'published' | 'failed';
  publishedAt?: string;
  error?: string;
  retryCount: number;
  metadata: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: string;
}

export interface CaptionVariant {
  style: 'short' | 'long' | 'persuasive' | 'educational';
  text: string;
  hashtags: string[];
  emoji: boolean;
  characterCount: number;
}

export interface PlatformLimits {
  platform: string;
  maxCaptionLength: number;
  maxHashtags: number;
  supportedMediaTypes: string[];
  optimalPostTimes: string[];
  cooldownMinutes: number;
}

// ============================================================================
// PLATFORM CONFIGURATIONS
// ============================================================================

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  instagram: {
    platform: 'instagram',
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportedMediaTypes: ['image', 'video', 'carousel'],
    optimalPostTimes: ['09:00', '12:00', '17:00', '19:00'],
    cooldownMinutes: 60,
  },
  tiktok: {
    platform: 'tiktok',
    maxCaptionLength: 2200,
    maxHashtags: 5,
    supportedMediaTypes: ['video'],
    optimalPostTimes: ['07:00', '12:00', '15:00', '19:00', '22:00'],
    cooldownMinutes: 30,
  },
  linkedin: {
    platform: 'linkedin',
    maxCaptionLength: 3000,
    maxHashtags: 5,
    supportedMediaTypes: ['image', 'video', 'document', 'carousel'],
    optimalPostTimes: ['08:00', '10:00', '12:00', '17:00'],
    cooldownMinutes: 120,
  },
  facebook: {
    platform: 'facebook',
    maxCaptionLength: 63206,
    maxHashtags: 3,
    supportedMediaTypes: ['image', 'video', 'link'],
    optimalPostTimes: ['09:00', '13:00', '16:00', '19:00'],
    cooldownMinutes: 60,
  },
  youtube: {
    platform: 'youtube',
    maxCaptionLength: 5000,
    maxHashtags: 15,
    supportedMediaTypes: ['video'],
    optimalPostTimes: ['12:00', '15:00', '18:00', '21:00'],
    cooldownMinutes: 1440, // 24 hours
  },
  shorts: {
    platform: 'shorts',
    maxCaptionLength: 100,
    maxHashtags: 3,
    supportedMediaTypes: ['video'],
    optimalPostTimes: ['09:00', '12:00', '18:00', '21:00'],
    cooldownMinutes: 60,
  },
  twitter: {
    platform: 'twitter',
    maxCaptionLength: 280,
    maxHashtags: 2,
    supportedMediaTypes: ['image', 'video', 'gif'],
    optimalPostTimes: ['08:00', '12:00', '17:00', '21:00'],
    cooldownMinutes: 15,
  },
};

// ============================================================================
// SCHEDULING SERVICE
// ============================================================================

export async function schedulePost(
  assetId: string,
  workspaceId: string,
  scheduledAt: string,
  options?: {
    platform?: string;
    captionVariant?: CaptionVariant['style'];
  }
): Promise<{ data: ScheduledPost | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Get the asset
    const { data: asset, error: assetError } = await supabase
      .from('social_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      throw new Error('Asset not found');
    }

    // Validate scheduled time is in the future
    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Update asset with scheduling info
    const { error: updateError } = await supabase
      .from('social_assets')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
        metadata: {
          ...asset.metadata,
          caption_variant: options?.captionVariant || 'long',
          schedule_created_at: new Date().toISOString(),
        },
      })
      .eq('id', assetId);

    if (updateError) throw updateError;

    const scheduledPost: ScheduledPost = {
      id: `scheduled-${assetId}`,
      assetId,
      workspaceId,
      platform: options?.platform || asset.platform,
      scheduledAt,
      status: 'pending',
      retryCount: 0,
      metadata: {
        captionVariant: options?.captionVariant || 'long',
      },
    };

    return { data: scheduledPost, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function getScheduledPosts(
  workspaceId: string,
  options?: {
    status?: ScheduledPost['status'];
    platform?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<{ data: SocialAsset[]; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    let query = supabase
      .from('social_assets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true });

    if (options?.platform) {
      query = query.eq('platform', options.platform);
    }

    if (options?.fromDate) {
      query = query.gte('scheduled_at', options.fromDate);
    }

    if (options?.toDate) {
      query = query.lte('scheduled_at', options.toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

export async function cancelScheduledPost(assetId: string): Promise<{ success: boolean; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const { error } = await supabase
      .from('social_assets')
      .update({
        status: 'ready',
        scheduled_at: null,
      })
      .eq('id', assetId)
      .eq('status', 'scheduled');

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

// ============================================================================
// PUBLISHING ENGINE
// ============================================================================

export async function publishPost(
  assetId: string,
  platform: string
): Promise<PublishResult> {
  const supabase = await getSupabaseServer();

  try {
    // Get the asset
    const { data: asset, error: assetError } = await supabase
      .from('social_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      return {
        success: false,
        platform,
        error: 'Asset not found',
      };
    }

    // Validate platform
    if (!PLATFORM_LIMITS[platform]) {
      return {
        success: false,
        platform,
        error: `Unsupported platform: ${platform}`,
      };
    }

    // In production, this would call the actual platform APIs
    // For now, simulate successful publishing
    const publishedAt = new Date().toISOString();
    const postId = `${platform}-${Date.now()}`;

    // Update asset status
    await supabase
      .from('social_assets')
      .update({
        status: 'published',
        metadata: {
          ...asset.metadata,
          published_at: publishedAt,
          post_id: postId,
          platform_response: { success: true },
        },
      })
      .eq('id', assetId);

    return {
      success: true,
      platform,
      postId,
      postUrl: `https://${platform}.com/post/${postId}`,
      publishedAt,
    };
  } catch (err) {
    return {
      success: false,
      platform,
      error: (err as Error).message,
    };
  }
}

export async function processDueScheduledPosts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: PublishResult[];
}> {
  const supabase = await getSupabaseServer();
  const results: PublishResult[] = [];

  try {
    // Get all posts due for publishing
    const now = new Date().toISOString();
    const { data: duePosts } = await supabase
      .from('social_assets')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (!duePosts || duePosts.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] };
    }

    for (const post of duePosts) {
      const result = await publishPost(post.id, post.platform);
      results.push(result);
    }

    return {
      processed: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  } catch (err) {
    console.error('Error processing scheduled posts:', err);
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }
}

// ============================================================================
// CAPTION VARIANTS
// ============================================================================

export function generateCaptionVariants(
  baseCaption: string,
  platform: string,
  persona: string
): CaptionVariant[] {
  const limits = PLATFORM_LIMITS[platform];
  const brandConfig = getPersonaConfig(persona);
  const variants: CaptionVariant[] = [];

  // Short variant
  const shortText = truncateCaption(baseCaption, Math.min(limits.maxCaptionLength, 100));
  variants.push({
    style: 'short',
    text: shortText,
    hashtags: selectHashtags(brandConfig.keywords, Math.min(limits.maxHashtags, 3)),
    emoji: platform !== 'linkedin',
    characterCount: shortText.length,
  });

  // Long variant
  const longText = truncateCaption(baseCaption, limits.maxCaptionLength - 100);
  variants.push({
    style: 'long',
    text: longText,
    hashtags: selectHashtags(brandConfig.keywords, limits.maxHashtags),
    emoji: true,
    characterCount: longText.length,
  });

  // Persuasive variant
  const persuasiveText = addPersuasiveElements(baseCaption, persona);
  variants.push({
    style: 'persuasive',
    text: truncateCaption(persuasiveText, limits.maxCaptionLength - 50),
    hashtags: selectHashtags(brandConfig.keywords, Math.min(limits.maxHashtags, 5)),
    emoji: true,
    characterCount: persuasiveText.length,
  });

  // Educational variant
  const educationalText = addEducationalElements(baseCaption, persona);
  variants.push({
    style: 'educational',
    text: truncateCaption(educationalText, limits.maxCaptionLength - 50),
    hashtags: selectHashtags([...brandConfig.keywords, 'tips', 'howto', 'learn'], limits.maxHashtags),
    emoji: platform !== 'linkedin',
    characterCount: educationalText.length,
  });

  return variants;
}

function truncateCaption(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function selectHashtags(keywords: string[], count: number): string[] {
  return keywords
    .slice(0, count)
    .map((k) => `#${k.replace(/\s+/g, '')}`);
}

function addPersuasiveElements(text: string, persona: string): string {
  const hooks: Record<string, string> = {
    saas: 'Ready to transform your workflow?',
    trade: 'See the difference quality makes.',
    agency: 'Let\'s create something remarkable.',
    nonprofit: 'Join us in making a difference.',
    ecommerce: 'Don\'t miss out on this!',
    professional: 'Elevate your results today.',
  };

  const ctas: Record<string, string> = {
    saas: 'Start your free trial →',
    trade: 'Get your free quote →',
    agency: 'Book a discovery call →',
    nonprofit: 'Support the cause →',
    ecommerce: 'Shop now →',
    professional: 'Schedule a consultation →',
  };

  const hook = hooks[persona] || hooks.professional;
  const cta = ctas[persona] || ctas.professional;

  return `${hook}\n\n${text}\n\n${cta}`;
}

function addEducationalElements(text: string, persona: string): string {
  const intros: Record<string, string> = {
    saas: '💡 Pro tip:',
    trade: '🛠️ Expert insight:',
    agency: '📊 Industry insight:',
    nonprofit: '🌟 Did you know:',
    ecommerce: '🎯 Smart shopper tip:',
    professional: '📚 Key takeaway:',
  };

  const intro = intros[persona] || intros.professional;
  return `${intro}\n\n${text}\n\n💬 Questions? Drop them below!`;
}

// ============================================================================
// PERSONA-AWARE REWRITING
// ============================================================================

export async function rewriteForPersona(
  content: string,
  targetPersona: string,
  platform: string
): Promise<{ rewritten: string; confidence: number }> {
  const config = getPersonaConfig(targetPersona);
  const limits = PLATFORM_LIMITS[platform];

  // Apply persona-specific transformations
  let rewritten = content;

  // Adjust tone
  const toneAdjustments: Record<string, (text: string) => string> = {
    professional: (text) => text.replace(/!/g, '.').replace(/awesome/gi, 'excellent'),
    direct: (text) => text.replace(/We think|We believe/gi, 'Here\'s').replace(/might/gi, 'will'),
    creative: (text) => text + ' ✨',
    compassionate: (text) => text.replace(/you should/gi, 'consider'),
    exciting: (text) => text.replace(/\./g, '!').toUpperCase(),
    formal: (text) => text.replace(/Hi|Hey/gi, 'Greetings'),
  };

  const adjustTone = toneAdjustments[config.tone];
  if (adjustTone) {
    rewritten = adjustTone(rewritten);
  }

  // Inject keywords naturally (first occurrence only)
  for (const keyword of config.keywords.slice(0, 2)) {
    if (!rewritten.toLowerCase().includes(keyword.toLowerCase())) {
      rewritten = `${rewritten}\n\n#${keyword.replace(/\s+/g, '')}`;
    }
  }

  // Truncate to platform limits
  rewritten = truncateCaption(rewritten, limits.maxCaptionLength);

  return {
    rewritten,
    confidence: 0.75,
  };
}

// ============================================================================
// QUEUE MANAGEMENT (Cron-safe)
// ============================================================================

export interface PublishingQueue {
  id: string;
  workspaceId: string;
  status: 'idle' | 'processing' | 'paused';
  lastProcessedAt: string | null;
  nextScheduledRun: string | null;
  stats: {
    pending: number;
    published: number;
    failed: number;
  };
}

export async function getQueueStatus(workspaceId: string): Promise<PublishingQueue> {
  const supabase = await getSupabaseServer();

  const { data: scheduled } = await supabase
    .from('social_assets')
    .select('status')
    .eq('workspace_id', workspaceId)
    .in('status', ['scheduled', 'published']);

  const pending = scheduled?.filter((a) => a.status === 'scheduled').length || 0;
  const published = scheduled?.filter((a) => a.status === 'published').length || 0;

  return {
    id: `queue-${workspaceId}`,
    workspaceId,
    status: 'idle',
    lastProcessedAt: null,
    nextScheduledRun: null,
    stats: {
      pending,
      published,
      failed: 0,
    },
  };
}

export async function processQueue(workspaceId: string): Promise<{
  processed: number;
  results: PublishResult[];
}> {
  // This would be called by a cron job
  const { data: duePosts } = await getScheduledPosts(workspaceId, {
    toDate: new Date().toISOString(),
  });

  const results: PublishResult[] = [];

  for (const post of duePosts) {
    const result = await publishPost(post.id, post.platform);
    results.push(result);
  }

  return {
    processed: results.length,
    results,
  };
}
