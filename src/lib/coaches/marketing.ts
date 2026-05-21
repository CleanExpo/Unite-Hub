// src/lib/coaches/marketing.ts
// Marketing Coach data fetcher — social channel health + real engagement analytics

import type { CoachContext, CoachDataFetcher } from './types'
import { BUSINESSES } from '@/lib/businesses'
import { getChannels } from '@/lib/integrations/social/channels'
import { createServiceClient } from '@/lib/supabase/service'
import type { SocialChannel } from '@/lib/integrations/social/types'

interface AnalyticsRow {
  platform: string
  business_key: string
  impressions: number
  reach: number
  engagements: number
  likes: number
  comments: number
  shares: number
  clicks: number
  video_views: number
  engagement_rate: number
}

interface PlatformAggregate {
  platform: string
  totalImpressions: number
  totalReach: number
  totalEngagements: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalClicks: number
  totalVideoViews: number
  avgEngagementRate: number
  postCount: number
}

export const fetchMarketingData: CoachDataFetcher = async (founderId: string): Promise<CoachContext> => {
  const reportDate = new Date().toISOString().split('T')[0]
  const supabase = createServiceClient()

  // ── 1. Channel metadata ───────────────────────────────────────────────────
  let channels: SocialChannel[]
  try {
    channels = await getChannels(founderId)
  } catch (err) {
    console.warn('[Marketing Coach] Failed to fetch channels:', err)
    channels = []
  }

  const businessNameMap = new Map<string, string>(BUSINESSES.map((b) => [b.key, b.name]))

  const channelData = channels.map((c) => ({
    platform: c.platform,
    businessKey: c.businessKey,
    businessName: businessNameMap.get(c.businessKey) ?? c.businessKey,
    channelName: c.channelName,
    handle: c.handle,
    followerCount: c.followerCount,
    isConnected: c.isConnected,
    lastSyncedAt: c.lastSyncedAt,
  }))

  // ── 2. Analytics — last 30 days ───────────────────────────────────────────
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]

  let analyticsRows: AnalyticsRow[] = []
  try {
    const { data, error } = await supabase
      .from('platform_analytics')
      .select(
        'platform, business_key, impressions, reach, engagements, likes, comments, shares, clicks, video_views, engagement_rate'
      )
      .eq('founder_id', founderId)
      .gte('metric_date', sinceStr)

    if (error) {
      console.warn('[Marketing Coach] Analytics query failed:', error.message)
    } else {
      analyticsRows = (data ?? []) as AnalyticsRow[]
    }
  } catch (err) {
    console.warn('[Marketing Coach] Analytics fetch error:', err)
  }

  // ── 3. Aggregate by platform ──────────────────────────────────────────────
  const platformMap = new Map<string, PlatformAggregate>()

  for (const row of analyticsRows) {
    const existing = platformMap.get(row.platform)
    if (existing) {
      existing.totalImpressions += row.impressions ?? 0
      existing.totalReach += row.reach ?? 0
      existing.totalEngagements += row.engagements ?? 0
      existing.totalLikes += row.likes ?? 0
      existing.totalComments += row.comments ?? 0
      existing.totalShares += row.shares ?? 0
      existing.totalClicks += row.clicks ?? 0
      existing.totalVideoViews += row.video_views ?? 0
      existing.avgEngagementRate =
        (existing.avgEngagementRate * existing.postCount + Number(row.engagement_rate ?? 0)) /
        (existing.postCount + 1)
      existing.postCount += 1
    } else {
      platformMap.set(row.platform, {
        platform: row.platform,
        totalImpressions: row.impressions ?? 0,
        totalReach: row.reach ?? 0,
        totalEngagements: row.engagements ?? 0,
        totalLikes: row.likes ?? 0,
        totalComments: row.comments ?? 0,
        totalShares: row.shares ?? 0,
        totalClicks: row.clicks ?? 0,
        totalVideoViews: row.video_views ?? 0,
        avgEngagementRate: Number(row.engagement_rate ?? 0),
        postCount: 1,
      })
    }
  }

  const byPlatform = Object.fromEntries(platformMap)

  // ── 4. Roll-up totals ─────────────────────────────────────────────────────
  const totalImpressions = analyticsRows.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const totalReach = analyticsRows.reduce((s, r) => s + (r.reach ?? 0), 0)
  const totalEngagements = analyticsRows.reduce((s, r) => s + (r.engagements ?? 0), 0)
  const totalClicks = analyticsRows.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const avgEngagementRate =
    analyticsRows.length > 0
      ? analyticsRows.reduce((s, r) => s + Number(r.engagement_rate ?? 0), 0) / analyticsRows.length
      : 0

  // Top platform by engagements
  const topPlatform = [...platformMap.values()].sort(
    (a, b) => b.totalEngagements - a.totalEngagements
  )[0]?.platform ?? null

  // ── 5. Content pipeline — posts in last 30 days ───────────────────────────
  let publishedPostCount = 0
  let scheduledPostCount = 0
  try {
    const { count: published } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('status', 'published')
      .gte('published_at', sinceStr)

    const { count: scheduled } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('status', 'scheduled')

    publishedPostCount = published ?? 0
    scheduledPostCount = scheduled ?? 0
  } catch (err) {
    console.warn('[Marketing Coach] Post count fetch error:', err)
  }

  return {
    coachType: 'marketing',
    reportDate,
    data: {
      // Channel metadata
      channels: channelData,
      totalChannels: channelData.length,
      connectedChannels: channelData.filter((c) => c.isConnected).length,
      disconnectedChannels: channelData.filter((c) => !c.isConnected).length,
      totalFollowers: channelData.reduce((sum, c) => sum + c.followerCount, 0),

      // Real engagement analytics (last 30 days)
      analytics: {
        periodDays: 30,
        totalImpressions,
        totalReach,
        totalEngagements,
        totalClicks,
        avgEngagementRate: Number(avgEngagementRate.toFixed(4)),
        topPlatform,
        byPlatform,
        hasData: analyticsRows.length > 0,
      },

      // Content pipeline
      contentPipeline: {
        publishedLast30Days: publishedPostCount,
        currentlyScheduled: scheduledPostCount,
      },
    },
    metadata: {
      analyticsSince: sinceStr,
      analyticsRowCount: analyticsRows.length,
    },
  }
}
