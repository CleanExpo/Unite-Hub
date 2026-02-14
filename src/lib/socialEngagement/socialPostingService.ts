/**
 * Social Posting Service
 *
 * Unified service for creating, scheduling, and publishing posts across
 * Facebook, Instagram, LinkedIn, Reddit, and YouTube.
 *
 * Each platform has specific formatting requirements:
 * - Facebook: Text + optional media, max 63,206 chars
 * - Instagram: Image/video required, max 2,200 chars caption
 * - LinkedIn: Text + optional media, max 3,000 chars
 * - Reddit: Title required, text/link/media, subreddit required
 * - YouTube: Video required, title + description
 *
 * @module lib/socialEngagement/socialPostingService
 */

import type { SocialProvider } from './providerTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type MediaType = 'image' | 'video' | 'carousel';

export interface PostMedia {
  type: MediaType;
  url: string;
  altText?: string;
  thumbnailUrl?: string;
  /** For carousels, multiple items */
  items?: Array<{ url: string; type: 'image' | 'video'; altText?: string }>;
}

export interface SocialPostInput {
  workspaceId: string;
  /** Platform to post to */
  provider: SocialProvider;
  /** Account ID (from social_accounts table) */
  accountId: string;
  /** Post text/caption */
  text: string;
  /** Media attachments */
  media?: PostMedia;
  /** Platform-specific options */
  platformOptions?: PlatformPostOptions;
  /** Schedule for later (ISO string) */
  scheduledAt?: string;
  /** Link to brand voice for tone validation */
  brandSlug?: string;
}

export interface PlatformPostOptions {
  // Facebook
  facebookTargeting?: { ageMin?: number; geoLocations?: string[] };
  // Instagram
  instagramLocation?: { id: string; name: string };
  // LinkedIn
  linkedinVisibility?: 'PUBLIC' | 'CONNECTIONS';
  linkedinOrganizationId?: string;
  // Reddit
  redditSubreddit?: string;
  redditTitle?: string;
  redditFlair?: string;
  redditNsfw?: boolean;
  // YouTube
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubeTags?: string[];
  youtubePrivacy?: 'public' | 'unlisted' | 'private';
  youtubeCategoryId?: string;
}

export interface SocialPostResult {
  success: boolean;
  postId?: string;
  externalId?: string;
  url?: string;
  provider: SocialProvider;
  error?: string;
  publishedAt?: string;
}

export interface FormattedPost {
  provider: SocialProvider;
  text: string;
  truncated: boolean;
  warnings: string[];
  hashtags: string[];
  characterCount: number;
  maxCharacters: number;
}

// ---------------------------------------------------------------------------
// Platform Character Limits
// ---------------------------------------------------------------------------

const CHAR_LIMITS: Record<SocialProvider, number> = {
  facebook: 63206,
  instagram: 2200,
  youtube: 5000,
  tiktok: 2200,
  linkedin: 3000,
  reddit: 40000,
  x: 280,
};

// ---------------------------------------------------------------------------
// Platform Formatters
// ---------------------------------------------------------------------------

/**
 * Format text for a specific platform's requirements.
 */
export function formatForPlatform(
  text: string,
  provider: SocialProvider,
  options?: { hashtags?: string[]; mentions?: string[] }
): FormattedPost {
  const maxChars = CHAR_LIMITS[provider];
  const warnings: string[] = [];
  let formatted = text;
  const hashtags: string[] = [];

  // Extract existing hashtags
  const hashtagPattern = /#[\w]+/g;
  const existingHashtags = formatted.match(hashtagPattern) ?? [];
  hashtags.push(...existingHashtags.map((h) => h.toLowerCase()));

  // Add provided hashtags
  if (options?.hashtags) {
    const newTags = options.hashtags
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .filter((h) => !hashtags.includes(h.toLowerCase()));

    if (newTags.length > 0) {
      formatted += '\n\n' + newTags.join(' ');
      hashtags.push(...newTags.map((h) => h.toLowerCase()));
    }
  }

  // Platform-specific formatting
  switch (provider) {
    case 'instagram':
      // Instagram: First line is critical, hashtags at end
      if (hashtags.length > 30) {
        warnings.push('Instagram allows max 30 hashtags. Extras will be removed.');
        // Remove excess hashtags from text
        const allTags = formatted.match(hashtagPattern) ?? [];
        if (allTags.length > 30) {
          const excess = allTags.slice(30);
          for (const tag of excess) {
            formatted = formatted.replace(tag, '').trim();
          }
        }
      }
      break;

    case 'linkedin':
      // LinkedIn: Professional tone, limited hashtags
      if (hashtags.length > 5) {
        warnings.push('LinkedIn posts perform best with 3-5 hashtags.');
      }
      break;

    case 'reddit':
      // Reddit: No hashtags, markdown supported
      formatted = formatted.replace(hashtagPattern, '').trim();
      if (formatted.length > maxChars) {
        warnings.push('Reddit post exceeds character limit.');
      }
      break;

    case 'x':
      // X/Twitter: 280 chars, shortened URLs
      if (formatted.length > 280) {
        warnings.push('Tweet exceeds 280 characters.');
      }
      break;
  }

  // Truncate if necessary
  let truncated = false;
  if (formatted.length > maxChars) {
    formatted = formatted.slice(0, maxChars - 3) + '...';
    truncated = true;
    warnings.push(`Text truncated to ${maxChars} characters.`);
  }

  return {
    provider,
    text: formatted,
    truncated,
    warnings,
    hashtags,
    characterCount: formatted.length,
    maxCharacters: maxChars,
  };
}

/**
 * Format the same content for multiple platforms.
 */
export function formatForAllPlatforms(
  text: string,
  providers: SocialProvider[],
  options?: { hashtags?: string[]; mentions?: string[] }
): FormattedPost[] {
  return providers.map((provider) => formatForPlatform(text, provider, options));
}

// ---------------------------------------------------------------------------
// Social Posting Service
// ---------------------------------------------------------------------------

export class SocialPostingService {
  private posts: Map<string, SocialPostInput & { status: PostStatus; result?: SocialPostResult }> =
    new Map();
  private counter = 0;

  /**
   * Create a new social post (draft).
   */
  createDraft(input: SocialPostInput): string {
    const postId = `sp_${Date.now()}_${this.counter++}`;
    this.posts.set(postId, { ...input, status: 'draft' });
    return postId;
  }

  /**
   * Publish a post to its target platform.
   */
  async publish(postId: string): Promise<SocialPostResult> {
    const post = this.posts.get(postId);
    if (!post) {
      return { success: false, provider: 'facebook', error: 'Post not found' };
    }

    post.status = 'publishing';

    try {
      const result = await this.publishToPlatform(post);
      post.status = result.success ? 'published' : 'failed';
      post.result = result;
      return result;
    } catch (error) {
      post.status = 'failed';
      const result: SocialPostResult = {
        success: false,
        provider: post.provider,
        error: error instanceof Error ? error.message : String(error),
      };
      post.result = result;
      return result;
    }
  }

  /**
   * Publish the same content across multiple platforms.
   */
  async publishToAll(
    inputs: SocialPostInput[]
  ): Promise<SocialPostResult[]> {
    const results = await Promise.allSettled(
      inputs.map(async (input) => {
        const postId = this.createDraft(input);
        return this.publish(postId);
      })
    );

    return results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            success: false,
            provider: 'facebook' as SocialProvider,
            error: r.reason?.message ?? 'Unknown error',
          }
    );
  }

  /**
   * Validate post content before publishing.
   */
  validate(input: SocialPostInput): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!input.text && !input.media) {
      errors.push('Post must have text or media');
    }

    // Platform-specific validation
    switch (input.provider) {
      case 'instagram':
        if (!input.media) {
          errors.push('Instagram posts require an image or video');
        }
        if (input.text && input.text.length > CHAR_LIMITS.instagram) {
          errors.push(`Caption exceeds ${CHAR_LIMITS.instagram} characters`);
        }
        break;

      case 'reddit':
        if (!input.platformOptions?.redditSubreddit) {
          errors.push('Reddit posts require a subreddit');
        }
        if (!input.platformOptions?.redditTitle) {
          errors.push('Reddit posts require a title');
        }
        break;

      case 'youtube':
        if (!input.media || input.media.type !== 'video') {
          errors.push('YouTube posts require a video');
        }
        if (!input.platformOptions?.youtubeTitle) {
          errors.push('YouTube posts require a title');
        }
        break;

      case 'linkedin':
        if (input.text && input.text.length > CHAR_LIMITS.linkedin) {
          warnings.push(`Post text exceeds ${CHAR_LIMITS.linkedin} characters`);
        }
        break;
    }

    // Format check
    const formatted = formatForPlatform(input.text, input.provider);
    warnings.push(...formatted.warnings);

    return { valid: errors.length === 0, errors, warnings };
  }

  // ---------------------------------------------------------------------------
  // Private — Platform API Calls
  // ---------------------------------------------------------------------------

  private async publishToPlatform(
    post: SocialPostInput & { status: PostStatus }
  ): Promise<SocialPostResult> {
    switch (post.provider) {
      case 'facebook':
        return this.publishToFacebook(post);
      case 'instagram':
        return this.publishToInstagram(post);
      case 'linkedin':
        return this.publishToLinkedIn(post);
      case 'reddit':
        return this.publishToReddit(post);
      case 'youtube':
        return this.publishToYouTube(post);
      default:
        return { success: false, provider: post.provider, error: `Posting not supported for ${post.provider}` };
    }
  }

  private async publishToFacebook(post: SocialPostInput): Promise<SocialPostResult> {
    const accessToken = post.platformOptions?.facebookTargeting
      ? process.env.META_ACCESS_TOKEN
      : process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      return { success: false, provider: 'facebook', error: 'Meta access token not configured' };
    }

    const url = `https://graph.facebook.com/v19.0/${post.accountId}/feed`;
    const body: Record<string, string> = { message: post.text, access_token: accessToken };

    if (post.media?.url) {
      body.link = post.media.url;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, provider: 'facebook', error };
    }

    const data = await response.json();
    return {
      success: true,
      provider: 'facebook',
      externalId: data.id,
      url: `https://www.facebook.com/${data.id}`,
      publishedAt: new Date().toISOString(),
    };
  }

  private async publishToInstagram(post: SocialPostInput): Promise<SocialPostResult> {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      return { success: false, provider: 'instagram', error: 'Meta access token not configured' };
    }

    if (!post.media?.url) {
      return { success: false, provider: 'instagram', error: 'Instagram requires media' };
    }

    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v19.0/${post.accountId}/media`;
    const containerBody: Record<string, string> = {
      access_token: accessToken,
      caption: post.text,
    };

    if (post.media.type === 'video') {
      containerBody.video_url = post.media.url;
      containerBody.media_type = 'VIDEO';
    } else {
      containerBody.image_url = post.media.url;
    }

    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });

    if (!containerRes.ok) {
      return { success: false, provider: 'instagram', error: await containerRes.text() };
    }

    const { id: containerId } = await containerRes.json();

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v19.0/${post.accountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    });

    if (!publishRes.ok) {
      return { success: false, provider: 'instagram', error: await publishRes.text() };
    }

    const publishData = await publishRes.json();
    return {
      success: true,
      provider: 'instagram',
      externalId: publishData.id,
      publishedAt: new Date().toISOString(),
    };
  }

  private async publishToLinkedIn(post: SocialPostInput): Promise<SocialPostResult> {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!accessToken) {
      return { success: false, provider: 'linkedin', error: 'LinkedIn access token not configured' };
    }

    const orgId = post.platformOptions?.linkedinOrganizationId ?? post.accountId;
    const visibility = post.platformOptions?.linkedinVisibility ?? 'PUBLIC';

    const body = {
      author: `urn:li:organization:${orgId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: post.text },
          shareMediaCategory: post.media ? 'ARTICLE' : 'NONE',
          ...(post.media && {
            media: [
              {
                status: 'READY',
                originalUrl: post.media.url,
                description: { text: post.media.altText ?? '' },
              },
            ],
          }),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { success: false, provider: 'linkedin', error: await response.text() };
    }

    const postId = response.headers.get('x-restli-id') ?? '';
    return {
      success: true,
      provider: 'linkedin',
      externalId: postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
      publishedAt: new Date().toISOString(),
    };
  }

  private async publishToReddit(post: SocialPostInput): Promise<SocialPostResult> {
    const accessToken = process.env.REDDIT_ACCESS_TOKEN;
    if (!accessToken) {
      return { success: false, provider: 'reddit', error: 'Reddit access token not configured' };
    }

    const subreddit = post.platformOptions?.redditSubreddit;
    const title = post.platformOptions?.redditTitle;
    if (!subreddit || !title) {
      return { success: false, provider: 'reddit', error: 'Subreddit and title required' };
    }

    const body = new URLSearchParams({
      sr: subreddit,
      title,
      text: post.text,
      kind: post.media?.url ? 'link' : 'self',
      api_type: 'json',
      nsfw: String(post.platformOptions?.redditNsfw ?? false),
    });

    if (post.media?.url) {
      body.set('url', post.media.url);
    }
    if (post.platformOptions?.redditFlair) {
      body.set('flair_text', post.platformOptions.redditFlair);
    }

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'UniteHub/1.0',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      return { success: false, provider: 'reddit', error: await response.text() };
    }

    const data = await response.json();
    if (data.json?.errors?.length) {
      return {
        success: false,
        provider: 'reddit',
        error: data.json.errors.map((e: string[]) => e.join(': ')).join('; '),
      };
    }

    return {
      success: true,
      provider: 'reddit',
      externalId: data.json?.data?.id,
      url: data.json?.data?.url,
      publishedAt: new Date().toISOString(),
    };
  }

  private async publishToYouTube(post: SocialPostInput): Promise<SocialPostResult> {
    // YouTube video upload requires a resumable upload flow
    // For now, we support updating video metadata (title, description, tags)
    return {
      success: false,
      provider: 'youtube',
      error: 'YouTube video upload requires the YouTube resumable upload API. Use the YouTube Studio UI for uploads, or connect via the media upload pipeline.',
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const socialPostingService = new SocialPostingService();
