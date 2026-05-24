// GET /api/cron/analytics-sync
// Daily analytics pull from all connected social platforms → platform_analytics table
// Schedule: 04:00 AEST / 18:00 UTC — runs after content has had time to accumulate engagement

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchAnalyticsForChannel } from '@/lib/integrations/social/analytics'
import type { SocialChannel } from '@/lib/integrations/social/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: channelRows, error: channelError } = await supabase
    .from('social_channels')
    .select('*')
    .eq('is_connected', true)

  if (channelError) {
    console.error('[AnalyticsSync] Channel query error:', channelError.message)
    return NextResponse.json({ error: 'Failed to query channels' }, { status: 500 })
  }

  if (!channelRows || channelRows.length === 0) {
    return NextResponse.json({ message: 'No connected channels', synced: 0 })
  }

  // Last 30 days — idempotent via upsert on conflict
  const now = new Date()
  const since = new Date(now)
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]
  const untilStr = now.toISOString().split('T')[0]

  let totalUpserted = 0
  let channelsFailed = 0

  const results = await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channelRows.map(async (row: Record<string, any>) => {
      const channel: SocialChannel = {
        id: row.id,
        founderId: row.founder_id,
        platform: row.platform,
        businessKey: row.business_key ?? '',
        channelId: row.channel_id,
        channelName: row.channel_name,
        handle: row.handle,
        name: row.name,
        followerCount: row.follower_count ?? 0,
        profileImageUrl: row.profile_image_url,
        isConnected: row.is_connected ?? false,
        tokenExpiresAt: row.token_expires_at,
        lastSyncedAt: row.last_synced_at,
      }

      if (!row.access_token_encrypted) {
        console.warn(`[AnalyticsSync] No token for ${channel.platform}:${channel.channelId}`)
        return 0
      }

      const postMetrics = await fetchAnalyticsForChannel(
        channel,
        row.access_token_encrypted as string,
        sinceStr,
        untilStr
      )
      if (postMetrics.length === 0) return 0

      const analyticsRows = postMetrics.map((m) => ({
        founder_id: channel.founderId,
        business_key: channel.businessKey,
        platform: channel.platform,
        post_external_id: m.postExternalId,
        metric_date: untilStr,
        impressions: m.impressions,
        reach: m.reach,
        engagements: m.engagements,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        saves: m.saves,
        clicks: m.clicks,
        video_views: m.videoViews,
        video_watch_time_seconds: m.videoWatchTimeSeconds,
        engagement_rate: m.impressions > 0
          ? Number(((m.engagements / m.impressions) * 100).toFixed(4))
          : 0,
      }))

      const { error: upsertError } = await supabase
        .from('platform_analytics')
        .upsert(analyticsRows, {
          onConflict: 'founder_id,platform,post_external_id,metric_date',
        })

      if (upsertError) {
        console.error(`[AnalyticsSync] Upsert error for ${channel.platform}:`, upsertError.message)
        throw upsertError
      }

      return analyticsRows.length
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') totalUpserted += result.value
    else { channelsFailed++; console.error('[AnalyticsSync] Channel failed:', result.reason) }
  }

  return NextResponse.json({ synced: totalUpserted, channelsFailed, dateRange: { since: sinceStr, until: untilStr } })
}
