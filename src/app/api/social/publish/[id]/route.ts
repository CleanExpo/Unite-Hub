// POST /api/social/publish/[id]
// Publishes a scheduled or draft post to all target platforms
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decodeToken } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (!['draft', 'scheduled'].includes(post.status)) {
    return NextResponse.json({ error: 'Post is not in a publishable state' }, { status: 400 })
  }

  await supabase.from('social_posts').update({ status: 'publishing' }).eq('id', id)

  const platformPostIds: Record<string, string> = {}
  const errors: string[] = []

  for (const platform of post.platforms as string[]) {
    const { data: channel } = await supabase
      .from('social_channels')
      .select('access_token_encrypted, channel_id, metadata')
      .eq('founder_id', user.id)
      .eq('platform', platform)
      .eq('business_key', post.business_key)
      .eq('is_connected', true)
      .maybeSingle()

    if (!channel) {
      errors.push(`${platform}: no connected account`)
      continue
    }

    let accessToken: string
    try {
      accessToken = decodeToken(channel.access_token_encrypted)
    } catch {
      errors.push(`${platform}: token decrypt failed`)
      continue
    }

    try {
      const postId = await publishToPlatform(platform, accessToken, channel, post)
      platformPostIds[platform] = postId
    } catch (err) {
      errors.push(`${platform}: ${err instanceof Error ? err.message : 'publish failed'}`)
    }
  }

  const allFailed = errors.length === post.platforms.length
  const status = allFailed ? 'failed' : 'published'

  await supabase.from('social_posts').update({
    status,
    published_at: allFailed ? null : new Date().toISOString(),
    platform_post_ids: { ...(post.platform_post_ids ?? {}), ...platformPostIds },
    error_message: errors.length ? errors.join('; ') : null,
  }).eq('id', id)

  return NextResponse.json({
    status,
    platformPostIds,
    errors: errors.length ? errors : undefined,
  })
}

async function publishToPlatform(
  platform: string,
  accessToken: string,
  channel: { channel_id: string; metadata?: Record<string, unknown> },
  post: { content: string; media_urls: string[] }
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
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
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
