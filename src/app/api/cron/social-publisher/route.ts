// src/app/api/cron/social-publisher/route.ts
// GET /api/cron/social-publisher
// Runs every 15 minutes — publishes scheduled social posts whose scheduled_at <= now().
// Authenticates via CRON_SECRET (set by Vercel CRON).

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decodeToken } from '@/lib/integrations/social/channels'
import { publishToPlatform } from '@/lib/integrations/social/publisher'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface SocialPostRow {
  id: string
  founder_id: string
  business_key: string
  content: string
  media_urls: string[]
  platforms: string[]
  status: string
  scheduled_at: string
  platform_post_ids: Record<string, string>
  error_message: string | null
}

interface SocialChannelRow {
  id: string
  channel_id: string
  access_token_encrypted: string
  metadata: Record<string, unknown> | null
}

export async function GET(request: Request) {
  const startTime = Date.now()

  // 1. Verify CRON_SECRET from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 2. Query social_posts where status = 'scheduled' AND scheduled_at <= now()
  const { data: posts, error: queryError } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (queryError) {
    console.error('[Social CRON] Failed to query scheduled posts:', queryError.message)
    return NextResponse.json(
      { error: 'Failed to query scheduled posts', detail: queryError.message },
      { status: 500 }
    )
  }

  const scheduledPosts = (posts ?? []) as SocialPostRow[]

  if (scheduledPosts.length === 0) {
    return NextResponse.json({ published: 0, failed: 0, skipped: 0, duration_ms: Date.now() - startTime })
  }

  let publishedCount = 0
  let failedCount = 0

  // 3. Process each scheduled post
  for (const post of scheduledPosts) {
    // 3a. Update status to 'publishing'
    await supabase
      .from('social_posts')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', post.id)

    const platformPostIds: Record<string, string> = { ...post.platform_post_ids }
    const errors: string[] = []
    let successCount = 0

    // 3b. For each platform in post.platforms
    for (const platform of post.platforms) {
      try {
        // Load social_channel for the business + platform
        const { data: channelRow, error: channelError } = await supabase
          .from('social_channels')
          .select('id, channel_id, access_token_encrypted, metadata')
          .eq('founder_id', post.founder_id)
          .eq('business_key', post.business_key)
          .eq('platform', platform)
          .eq('is_connected', true)
          .single()

        if (channelError || !channelRow) {
          errors.push(`${platform}: No connected channel found`)
          continue
        }

        const channel = channelRow as SocialChannelRow

        // Decrypt access token
        const accessToken = decodeToken(channel.access_token_encrypted)

        // Publish
        const postId = await publishToPlatform(
          platform,
          accessToken,
          {
            channel_id: channel.channel_id,
            metadata: channel.metadata ?? undefined,
          },
          {
            content: post.content,
            media_urls: post.media_urls ?? [],
          }
        )

        platformPostIds[platform] = postId
        successCount++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${platform}: ${message}`)
        console.error(`[Social CRON] ${platform} publish failed for post ${post.id}:`, message)
      }
    }

    // 3c. Determine final status
    const allFailed = successCount === 0
    const finalStatus = allFailed ? 'failed' : 'published'
    const errorMessage = errors.length > 0 ? errors.join('; ') : null

    // 3d. Update post with result
    await supabase
      .from('social_posts')
      .update({
        status: finalStatus,
        published_at: allFailed ? null : new Date().toISOString(),
        platform_post_ids: platformPostIds,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    // 4. Update linked generated_content rows to 'published'
    if (finalStatus === 'published') {
      await supabase
        .from('generated_content')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('social_post_id', post.id)

      publishedCount++
    } else {
      failedCount++
    }
  }

  const durationMs = Date.now() - startTime

  // 5. Send notification summary
  await notify({
    type: 'cron_complete',
    title: 'Social Publisher CRON',
    body: `Published ${publishedCount}, failed ${failedCount} of ${scheduledPosts.length} scheduled posts (${durationMs}ms)`,
    severity: failedCount > 0 ? 'warning' : 'info',
    metadata: {
      published: publishedCount,
      failed: failedCount,
      total: scheduledPosts.length,
      duration_ms: durationMs,
    },
  })

  return NextResponse.json({
    published: publishedCount,
    failed: failedCount,
    total: scheduledPosts.length,
    duration_ms: durationMs,
  })
}
