// src/lib/integrations/social/publisher.ts
// Shared social platform publishing logic.
// Extracted from /api/social/publish/[id] for reuse by CRON and manual publish routes.

export interface PublishablePost {
  content: string
  media_urls: string[]
  video_url?: string // For TikTok/YouTube — URL of the video to publish
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

    case 'tiktok': {
      // TikTok Content Posting API v2 — requires a video URL
      if (!post.video_url) {
        throw new Error('TikTok requires video content — set video_url on the post')
      }

      // Step 1: Initialise upload via inbox method (pull from URL)
      const initRes = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            post_info: {
              title: post.content.slice(0, 150),
              privacy_level: 'PUBLIC_TO_EVERYONE',
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: post.video_url,
            },
          }),
        }
      )
      const initData = await initRes.json() as {
        data?: { publish_id?: string }
        error?: { code?: string; message?: string }
      }
      if (!initRes.ok || !initData.data?.publish_id) {
        throw new Error(
          initData.error?.message ?? `TikTok publish init failed (${initRes.status})`
        )
      }
      return initData.data.publish_id
    }

    case 'youtube': {
      // YouTube Data API v3 — requires a video URL to upload
      if (!post.video_url) {
        throw new Error('YouTube requires video content — set video_url on the post')
      }

      // Step 1: Download the video from the URL
      const videoRes = await fetch(post.video_url)
      if (!videoRes.ok) throw new Error(`Failed to fetch video from ${post.video_url}`)
      const videoBuffer = await videoRes.arrayBuffer()

      // Step 2: Parse title and description from content
      const lines = post.content.split('\n')
      const title = lines[0]?.slice(0, 100) ?? 'Unite-Group Video'
      const description = post.content

      // Step 3: Initiate resumable upload
      const initiateRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': String(videoBuffer.byteLength),
            'X-Upload-Content-Type': 'video/mp4',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
              tags: post.content.match(/#(\w+)/g)?.map((t) => t.slice(1)) ?? [],
              categoryId: '22', // People & Blogs
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false,
            },
          }),
        }
      )

      if (!initiateRes.ok) {
        const errBody = await initiateRes.text()
        throw new Error(`YouTube upload init failed: ${errBody.slice(0, 200)}`)
      }

      const uploadUrl = initiateRes.headers.get('location')
      if (!uploadUrl) throw new Error('YouTube did not return an upload URL')

      // Step 4: Upload the video bytes
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/mp4' },
        body: videoBuffer,
      })

      const uploadData = await uploadRes.json() as { id?: string; error?: { message: string } }
      if (!uploadRes.ok || !uploadData.id) {
        throw new Error(uploadData.error?.message ?? 'YouTube video upload failed')
      }
      return uploadData.id
    }

    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}
