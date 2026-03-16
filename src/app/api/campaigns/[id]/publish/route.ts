// POST /api/campaigns/[id]/publish
// Promotes all ready campaign assets to social_posts rows and schedules them.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let scheduledAt: string | null = null
  try {
    const body = await request.json() as { scheduledAt?: string }
    scheduledAt = body.scheduledAt ?? null
  } catch {
    // scheduledAt is optional — publish immediately if not provided
  }

  const supabase = createServiceClient()

  // Load ready assets
  const { data: assets, error: assetsError } = await supabase
    .from('campaign_assets')
    .select('*')
    .eq('campaign_id', id)
    .eq('founder_id', user.id)
    .eq('status', 'ready')

  if (assetsError) {
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 })
  }

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: 'No ready assets to publish' }, { status: 400 })
  }

  // Load campaign for businessKey
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('brand_profile_id, brand_profiles(business_key, client_name)')
    .eq('id', id)
    .single()

  const brandProfileRaw = campaign?.['brand_profiles'] as unknown
  const brandProfile = Array.isArray(brandProfileRaw)
    ? (brandProfileRaw[0] as Record<string, unknown> | undefined) ?? null
    : (brandProfileRaw as Record<string, unknown> | null)
  const businessKey = (brandProfile?.['business_key'] as string | null) ?? 'synthex'

  // Group assets by platform — create one social_post per platform with all assets as variants
  const byPlatform = new Map<string, typeof assets>()
  for (const asset of assets) {
    const platform = asset['platform'] as string
    if (!byPlatform.has(platform)) byPlatform.set(platform, [])
    byPlatform.get(platform)!.push(asset)
  }

  let postsCreated = 0
  const postIds: string[] = []

  for (const [platform, platformAssets] of byPlatform.entries()) {
    // Use the first variant's copy as the primary content
    const primary = platformAssets[0]
    const mediaUrls = platformAssets
      .map(a => a['image_url'] as string | null)
      .filter((u): u is string => u !== null)

    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        founder_id: user.id,
        business_key: businessKey,
        title: null,
        content: primary['copy'] as string,
        media_urls: mediaUrls,
        platforms: [platform],
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt,
      })
      .select('id')
      .single()

    if (postError || !post) {
      console.error(`[Publish] Failed to create social post for ${platform}:`, postError?.message)
      continue
    }

    postIds.push(post.id)
    postsCreated++

    // Link assets to the social post
    await supabase
      .from('campaign_assets')
      .update({ social_post_id: post.id, status: 'published' })
      .in('id', platformAssets.map(a => a['id'] as string))
  }

  // Update campaign status
  if (postsCreated > 0) {
    await supabase
      .from('campaigns')
      .update({ status: 'published' })
      .eq('id', id)
  }

  return NextResponse.json({ postsCreated, postIds })
}
