// GET /api/campaigns/[id] — returns campaign with all its assets
// DELETE /api/campaigns/[id] — deletes campaign and assets

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Campaign, CampaignAsset } from '@/lib/campaigns/types'

export const dynamic = 'force-dynamic'

function mapCampaignRow(row: Record<string, unknown>): Campaign {
  return {
    id: row['id'] as string,
    founderId: row['founder_id'] as string,
    brandProfileId: row['brand_profile_id'] as string,
    theme: row['theme'] as string,
    objective: row['objective'] as Campaign['objective'],
    platforms: (row['platforms'] as string[]) as Campaign['platforms'],
    postCount: row['post_count'] as number,
    dateRangeStart: row['date_range_start'] as string | null,
    dateRangeEnd: row['date_range_end'] as string | null,
    status: row['status'] as Campaign['status'],
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

function mapAssetRow(row: Record<string, unknown>): CampaignAsset {
  return {
    id: row['id'] as string,
    campaignId: row['campaign_id'] as string,
    founderId: row['founder_id'] as string,
    platform: row['platform'] as CampaignAsset['platform'],
    copy: row['copy'] as string,
    headline: row['headline'] as string | null,
    cta: row['cta'] as string | null,
    hashtags: (row['hashtags'] as string[]) ?? [],
    imageUrl: row['image_url'] as string | null,
    imagePrompt: row['image_prompt'] as string,
    width: row['width'] as number,
    height: row['height'] as number,
    variant: row['variant'] as number,
    socialPostId: row['social_post_id'] as string | null,
    status: row['status'] as CampaignAsset['status'],
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const { data: assets } = await supabase
    .from('campaign_assets')
    .select('*')
    .eq('campaign_id', id)
    .order('platform')
    .order('variant')

  return NextResponse.json({
    campaign: mapCampaignRow(campaign as Record<string, unknown>),
    assets: (assets ?? []).map(a => mapAssetRow(a as Record<string, unknown>)),
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
