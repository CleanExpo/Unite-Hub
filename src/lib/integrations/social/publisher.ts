// src/lib/integrations/social/publisher.ts
// Shared social platform publishing logic.
// Extracted from /api/social/publish/[id] for reuse by CRON and manual publish routes.

export interface PublishablePost {
  content: string
  media_urls: string[]
}

export interface ChannelInfo {
  channel_id: string
  metadata?: Record<string, unknown>
}

/**
 * Publish a post to a specific social platform via its API.
 *
 * @param platform - The platform key (facebook, instagram, linkedin, youtube, tiktok)
 * @param accessToken - Decrypted OAuth access token for the channel
 * @param channel - Channel identifiers and optional metadata
 * @param post - The content and media URLs to publish
 * @returns The platform-specific post ID on success
 * @throws Error if the platform rejects the post or the platform is unsupported
 */
export async function publishToPlatform(
  platform: string,
  accessToken: string,
  channel: ChannelInfo,
  post: PublishablePost
): Promise<string> {
  switch (platform) {
    case 'facebook': {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: post.content, access_token: accessToken }),
        }
      )
      const data = await res.json() as { id?: string; error?: { message: string } }
      if (!res.ok || !data.id) throw new Error(data.error?.message ?? 'Facebook post failed')
      return data.id
    }

    case 'instagram': {
      const pageId = (channel.metadata as Record<string, string> | undefined)?.pageId
      if (!pageId) throw new Error('No linked Facebook Page ID for Instagram')
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption: post.content,
            image_url: post.media_urls[0] ?? undefined,
            media_type: 'IMAGE',
            access_token: accessToken,
          }),
        }
      )
      const container = await containerRes.json() as { id?: string; error?: { message: string } }
      if (!containerRes.ok || !container.id) throw new Error(container.error?.message ?? 'IG container failed')
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${channel.channel_id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
        }
      )
      const published = await publishRes.json() as { id?: string; error?: { message: string } }
      if (!publishRes.ok || !published.id) throw new Error(published.error?.message ?? 'IG publish failed')
      return published.id
    }

    case 'linkedin': {
      const body = {
        author: `urn:li:person:${channel.channel_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: post.content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }
      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { id?: string; message?: string }
      if (!res.ok) throw new Error(data.message ?? 'LinkedIn post failed')
      return data.id ?? 'ok'
    }

    case 'youtube':
      throw new Error('YouTube requires video content — text-only posts not supported')

    case 'tiktok':
      throw new Error('TikTok requires video content')

    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}
