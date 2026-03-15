// src/lib/integrations/social/engagement.ts
// Social engagement monitoring — fetches comments from connected platforms
// and posts AI-generated replies.

import { createServiceClient } from '@/lib/supabase/service'
import { decodeToken } from './channels'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SocialComment {
  externalId: string
  postExternalId: string
  platform: string
  authorName: string
  authorId: string
  content: string
  createdAt: string
}

interface FacebookComment {
  id: string
  message: string
  from?: { id: string; name: string }
  created_time: string
}

interface FacebookPost {
  id: string
}

interface InstagramMedia {
  id: string
}

interface InstagramComment {
  id: string
  text: string
  username: string
  timestamp: string
  from?: { id: string }
}

// ── Facebook ─────────────────────────────────────────────────────────────────

/**
 * Fetch recent comments from Facebook posts for a page.
 * Uses Graph API: GET /{page-id}/posts then GET /{post-id}/comments
 */
export async function fetchFacebookComments(
  accessToken: string,
  pageId: string,
  since?: string
): Promise<SocialComment[]> {
  const comments: SocialComment[] = []

  // Fetch recent posts from the page
  const sinceParam = since ? `&since=${encodeURIComponent(since)}` : ''
  const postsUrl = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=id&limit=25${sinceParam}&access_token=${accessToken}`

  const postsRes = await fetch(postsUrl)
  if (!postsRes.ok) {
    const err = await postsRes.text()
    console.error(`[engagement] Facebook posts fetch failed for page ${pageId}:`, err)
    return comments
  }

  const postsData = (await postsRes.json()) as { data: FacebookPost[] }
  const posts = postsData.data ?? []

  // Fetch comments for each post
  for (const post of posts) {
    const commentsUrl =
      `https://graph.facebook.com/v21.0/${post.id}/comments` +
      `?fields=id,message,from,created_time&limit=100` +
      (since ? `&since=${encodeURIComponent(since)}` : '') +
      `&access_token=${accessToken}`

    const commentsRes = await fetch(commentsUrl)
    if (!commentsRes.ok) {
      console.error(`[engagement] Facebook comments fetch failed for post ${post.id}`)
      continue
    }

    const commentsData = (await commentsRes.json()) as { data: FacebookComment[] }
    for (const c of commentsData.data ?? []) {
      comments.push({
        externalId: c.id,
        postExternalId: post.id,
        platform: 'facebook',
        authorName: c.from?.name ?? 'Unknown',
        authorId: c.from?.id ?? '',
        content: c.message,
        createdAt: c.created_time,
      })
    }
  }

  return comments
}

// ── Instagram ────────────────────────────────────────────────────────────────

/**
 * Fetch recent comments from Instagram posts.
 * Uses Graph API: GET /{ig-user-id}/media then GET /{media-id}/comments
 */
export async function fetchInstagramComments(
  accessToken: string,
  igUserId: string,
  since?: string
): Promise<SocialComment[]> {
  const comments: SocialComment[] = []

  // Fetch recent media
  const sinceParam = since ? `&since=${encodeURIComponent(since)}` : ''
  const mediaUrl =
    `https://graph.facebook.com/v21.0/${igUserId}/media` +
    `?fields=id&limit=25${sinceParam}&access_token=${accessToken}`

  const mediaRes = await fetch(mediaUrl)
  if (!mediaRes.ok) {
    const err = await mediaRes.text()
    console.error(`[engagement] Instagram media fetch failed for user ${igUserId}:`, err)
    return comments
  }

  const mediaData = (await mediaRes.json()) as { data: InstagramMedia[] }
  const media = mediaData.data ?? []

  // Fetch comments for each media item
  for (const item of media) {
    const commentsUrl =
      `https://graph.facebook.com/v21.0/${item.id}/comments` +
      `?fields=id,text,username,timestamp,from&limit=100` +
      `&access_token=${accessToken}`

    const commentsRes = await fetch(commentsUrl)
    if (!commentsRes.ok) {
      console.error(`[engagement] Instagram comments fetch failed for media ${item.id}`)
      continue
    }

    const commentsData = (await commentsRes.json()) as { data: InstagramComment[] }
    for (const c of commentsData.data ?? []) {
      // Filter by since timestamp if provided
      if (since && new Date(c.timestamp) <= new Date(since)) continue

      comments.push({
        externalId: c.id,
        postExternalId: item.id,
        platform: 'instagram',
        authorName: c.username ?? 'Unknown',
        authorId: c.from?.id ?? c.username ?? '',
        content: c.text,
        createdAt: c.timestamp,
      })
    }
  }

  return comments
}

// ── Reply Functions ──────────────────────────────────────────────────────────

/**
 * Reply to a Facebook comment.
 * POST /{comment-id}/comments with message body.
 */
export async function replyToFacebookComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<string> {
  const url = `https://graph.facebook.com/v21.0/${commentId}/comments`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Facebook reply failed for comment ${commentId}: ${err}`)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

/**
 * Reply to an Instagram comment.
 * POST /{comment-id}/replies with message body.
 */
export async function replyToInstagramComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<string> {
  const url = `https://graph.facebook.com/v21.0/${commentId}/replies`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instagram reply failed for comment ${commentId}: ${err}`)
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

// ── Aggregated Fetcher ───────────────────────────────────────────────────────

interface SocialChannelRow {
  platform: string
  channel_id: string
  access_token_encrypted: string
  last_synced_at: string | null
  metadata: Record<string, unknown> | null
}

/**
 * Fetch all new comments across all connected platforms for a business.
 * Loads channels from DB, decodes tokens, calls platform-specific fetchers.
 */
export async function fetchNewComments(
  founderId: string,
  businessKey: string
): Promise<SocialComment[]> {
  const supabase = createServiceClient()

  // Load connected channels for this business
  const { data: channels, error } = await supabase
    .from('social_channels')
    .select('platform, channel_id, access_token_encrypted, last_synced_at, metadata')
    .eq('founder_id', founderId)
    .eq('business_key', businessKey)
    .eq('is_connected', true)

  if (error) {
    console.error(`[engagement] Failed to load channels for ${businessKey}:`, error.message)
    throw error
  }

  if (!channels || channels.length === 0) {
    return []
  }

  const allComments: SocialComment[] = []

  // Process each channel with error isolation
  const results = await Promise.allSettled(
    (channels as SocialChannelRow[]).map(async (channel) => {
      const accessToken = decodeToken(channel.access_token_encrypted)
      const since = channel.last_synced_at ?? undefined

      switch (channel.platform) {
        case 'facebook':
          return fetchFacebookComments(accessToken, channel.channel_id, since)
        case 'instagram': {
          // Instagram uses ig_user_id from channel metadata or channel_id
          const igUserId =
            (channel.metadata?.ig_user_id as string) ?? channel.channel_id
          return fetchInstagramComments(accessToken, igUserId, since)
        }
        default:
          // LinkedIn, TikTok, YouTube — not yet supported for comment monitoring
          return [] as SocialComment[]
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allComments.push(...result.value)
    } else {
      console.error('[engagement] Channel comment fetch failed:', result.reason)
    }
  }

  return allComments
}
