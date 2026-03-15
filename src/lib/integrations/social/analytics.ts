// src/lib/integrations/social/analytics.ts
// Per-platform analytics fetchers — pulls post engagement metrics from social APIs

import { decodeToken } from './channels'
import type { SocialChannel } from './types'

export interface PostMetrics {
  postExternalId: string
  impressions: number
  reach: number
  engagements: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  videoViews: number
  videoWatchTimeSeconds: number
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

export async function fetchFacebookAnalytics(
  channel: SocialChannel,
  accessTokenEncrypted: string,
  since: string,
  _until: string
): Promise<PostMetrics[]> {
  const accessToken = decodeToken(accessTokenEncrypted)
  const metrics: PostMetrics[] = []

  const postsRes = await fetch(
    `https://graph.facebook.com/v22.0/${channel.channelId}/posts?` +
    `fields=id,created_time&since=${since}&limit=100&access_token=${accessToken}`
  )
  if (!postsRes.ok) {
    console.error('[Analytics:FB] Posts fetch failed:', await postsRes.text())
    return []
  }

  const postsData = await postsRes.json() as { data?: Array<{ id: string }> }
  const posts = postsData.data ?? []

  for (const post of posts) {
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v22.0/${post.id}/insights?` +
        `metric=post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total` +
        `&access_token=${accessToken}`
      )

      let impressions = 0, engaged = 0, clicks = 0, likes = 0
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json() as {
          data?: Array<{ name: string; values?: Array<{ value: unknown }> }>
        }
        for (const insight of insightsData.data ?? []) {
          const val = insight.values?.[0]?.value ?? 0
          if (insight.name === 'post_impressions') impressions = typeof val === 'number' ? val : 0
          if (insight.name === 'post_engaged_users') engaged = typeof val === 'number' ? val : 0
          if (insight.name === 'post_clicks') clicks = typeof val === 'number' ? val : 0
          if (insight.name === 'post_reactions_by_type_total' && typeof val === 'object' && val !== null) {
            likes = (val as Record<string, number>).like ?? 0
          }
        }
      }

      const detailRes = await fetch(
        `https://graph.facebook.com/v22.0/${post.id}?` +
        `fields=comments.summary(true),shares&access_token=${accessToken}`
      )
      let commentCount = 0, shareCount = 0
      if (detailRes.ok) {
        const detail = await detailRes.json() as {
          comments?: { summary?: { total_count?: number } }
          shares?: { count?: number }
        }
        commentCount = detail.comments?.summary?.total_count ?? 0
        shareCount = detail.shares?.count ?? 0
      }

      metrics.push({
        postExternalId: post.id,
        impressions,
        reach: 0,
        engagements: engaged,
        likes,
        comments: commentCount,
        shares: shareCount,
        saves: 0,
        clicks,
        videoViews: 0,
        videoWatchTimeSeconds: 0,
      })
    } catch (err) {
      console.error(`[Analytics:FB] Error for post ${post.id}:`, err)
    }
  }

  return metrics
}

// ─── Instagram ────────────────────────────────────────────────────────────────

export async function fetchInstagramAnalytics(
  channel: SocialChannel,
  accessTokenEncrypted: string,
  since: string,
  until: string
): Promise<PostMetrics[]> {
  const accessToken = decodeToken(accessTokenEncrypted)
  const metrics: PostMetrics[] = []

  const mediaRes = await fetch(
    `https://graph.facebook.com/v22.0/${channel.channelId}/media?` +
    `fields=id,timestamp,media_type&limit=50&access_token=${accessToken}`
  )
  if (!mediaRes.ok) {
    console.error('[Analytics:IG] Media fetch failed:', await mediaRes.text())
    return []
  }

  const mediaData = await mediaRes.json() as { data?: Array<{ id: string; timestamp?: string }> }
  const media = (mediaData.data ?? []).filter((m) => {
    const ts = m.timestamp?.split('T')[0]
    return ts !== undefined && ts >= since && ts <= until
  })

  for (const item of media) {
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v22.0/${item.id}/insights?` +
        `metric=impressions,reach,likes,comments,shares,saved,plays&access_token=${accessToken}`
      )

      const m: PostMetrics = {
        postExternalId: item.id,
        impressions: 0, reach: 0, engagements: 0,
        likes: 0, comments: 0, shares: 0, saves: 0,
        clicks: 0, videoViews: 0, videoWatchTimeSeconds: 0,
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json() as {
          data?: Array<{ name: string; values?: Array<{ value: unknown }> }>
        }
        for (const insight of insightsData.data ?? []) {
          const val = typeof insight.values?.[0]?.value === 'number'
            ? (insight.values[0].value as number)
            : 0
          if (insight.name === 'impressions') m.impressions = val
          if (insight.name === 'reach') m.reach = val
          if (insight.name === 'likes') m.likes = val
          if (insight.name === 'comments') m.comments = val
          if (insight.name === 'shares') m.shares = val
          if (insight.name === 'saved') m.saves = val
          if (insight.name === 'plays') m.videoViews = val
        }
        m.engagements = m.likes + m.comments + m.shares + m.saves
      }

      metrics.push(m)
    } catch (err) {
      console.error(`[Analytics:IG] Error for media ${item.id}:`, err)
    }
  }

  return metrics
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

export async function fetchLinkedInAnalytics(
  channel: SocialChannel,
  accessTokenEncrypted: string,
  since: string,
  _until: string
): Promise<PostMetrics[]> {
  const accessToken = decodeToken(accessTokenEncrypted)
  const sinceTs = new Date(since).getTime()

  const postsRes = await fetch(
    `https://api.linkedin.com/v2/posts?author=urn:li:organization:${channel.channelId}&q=author&count=50&sortBy=LAST_MODIFIED`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
    }
  )

  if (!postsRes.ok) {
    console.error('[Analytics:LI] Posts fetch failed:', postsRes.status)
    return []
  }

  const postsData = await postsRes.json() as {
    elements?: Array<{ id?: string; activity?: string; createdAt?: number }>
  }
  const posts = (postsData.elements ?? []).filter(
    (p) => (p.createdAt ?? 0) >= sinceTs
  )

  const metrics: PostMetrics[] = []

  for (const post of posts) {
    const urn = post.id ?? post.activity
    if (!urn) continue

    try {
      const statsRes = await fetch(
        `https://api.linkedin.com/v2/socialMetadata/${encodeURIComponent(urn)}`,
        { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
      )

      let likeCount = 0, commentCount = 0, shareCount = 0
      if (statsRes.ok) {
        const stats = await statsRes.json() as {
          totalLikes?: number
          totalComments?: number
          totalShares?: number
        }
        likeCount = stats.totalLikes ?? 0
        commentCount = stats.totalComments ?? 0
        shareCount = stats.totalShares ?? 0
      }

      metrics.push({
        postExternalId: urn,
        impressions: 0, reach: 0,
        engagements: likeCount + commentCount + shareCount,
        likes: likeCount,
        comments: commentCount,
        shares: shareCount,
        saves: 0, clicks: 0, videoViews: 0, videoWatchTimeSeconds: 0,
      })
    } catch (err) {
      console.error(`[Analytics:LI] Error for post ${urn}:`, err)
    }
  }

  return metrics
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function fetchAnalyticsForChannel(
  channel: SocialChannel,
  accessTokenEncrypted: string,
  since: string,
  until: string
): Promise<PostMetrics[]> {
  switch (channel.platform) {
    case 'facebook':
      return fetchFacebookAnalytics(channel, accessTokenEncrypted, since, until)
    case 'instagram':
      return fetchInstagramAnalytics(channel, accessTokenEncrypted, since, until)
    case 'linkedin':
      return fetchLinkedInAnalytics(channel, accessTokenEncrypted, since, until)
    case 'tiktok':
    case 'youtube':
      // TikTok Content Posting API and YouTube Data API v3 analytics require
      // additional OAuth scopes — stubbed until those scopes are configured
      console.log(`[Analytics] ${channel.platform} analytics not yet implemented`)
      return []
    default:
      return []
  }
}
