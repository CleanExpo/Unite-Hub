// src/app/api/analytics/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business')
  const platform = searchParams.get('platform')
  const days = parseInt(searchParams.get('days') ?? '30', 10)

  const supabase = createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  let query = supabase
    .from('platform_analytics')
    .select('*')
    .eq('founder_id', user.id)
    .gte('metric_date', since.toISOString().split('T')[0])
    .order('metric_date', { ascending: false })
    .limit(500)

  if (business && business !== 'all') query = query.eq('business_key', business)
  if (platform && platform !== 'all') query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map snake_case → camelCase
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    businessKey: row.business_key,
    platform: row.platform,
    postExternalId: row.post_external_id,
    metricDate: row.metric_date,
    impressions: row.impressions ?? 0,
    reach: row.reach ?? 0,
    engagements: row.engagements ?? 0,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    shares: row.shares ?? 0,
    saves: row.saves ?? 0,
    clicks: row.clicks ?? 0,
    videoViews: row.video_views ?? 0,
    engagementRate: Number(row.engagement_rate ?? 0),
  }))

  return NextResponse.json({ data: rows })
}
