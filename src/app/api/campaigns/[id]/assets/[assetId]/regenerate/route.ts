// POST /api/campaigns/[id]/assets/[assetId]/regenerate
// Re-generates the image for a single campaign asset using the dual-engine router.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateCampaignImage } from '@/lib/campaigns/image-generator'
import type { BrandDNA, BrandColours, BrandFonts, VisualType } from '@/lib/campaigns/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function mapBrandProfileRow(row: Record<string, unknown>): BrandDNA {
  const colours = (row['colours'] as BrandColours | null) ?? {
    primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', neutrals: [],
  }
  const fonts = (row['fonts'] as BrandFonts | null) ?? {
    heading: 'sans-serif', body: 'sans-serif', accent: null,
  }
  return {
    clientName: (row['client_name'] as string) ?? '',
    websiteUrl: (row['website_url'] as string) ?? '',
    logoUrl: (row['logo_url'] as string | null) ?? null,
    colours,
    fonts,
    toneOfVoice: (row['tone_of_voice'] as string) ?? 'Professional and approachable.',
    brandValues: (row['brand_values'] as string[]) ?? [],
    tagline: (row['tagline'] as string | null) ?? null,
    targetAudience: (row['target_audience'] as string) ?? 'General audience',
    industry: (row['industry'] as string) ?? 'General',
    imageryStyle: (row['imagery_style'] as string) ?? 'professional marketing photography',
    referenceImages: (row['reference_images'] as string[]) ?? [],
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, assetId } = await params
  const supabase = createServiceClient()

  // Load asset + campaign + brand profile
  const { data: asset, error: assetError } = await supabase
    .from('campaign_assets')
    .select('*, campaigns(*, brand_profiles(*))')
    .eq('id', assetId)
    .eq('campaign_id', id)
    .eq('founder_id', user.id)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const campaign = asset['campaigns'] as Record<string, unknown> | null
  const brandRow = campaign?.['brand_profiles'] as Record<string, unknown> | null
  if (!brandRow) {
    return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 })
  }

  const brandDNA = mapBrandProfileRow(brandRow)
  const visualType = (asset['visual_type'] as VisualType) ?? 'photo'

  // Update status to generating
  await supabase
    .from('campaign_assets')
    .update({ status: 'generating_image' })
    .eq('id', assetId)

  // Generate new image via dual-engine router
  const result = await generateCampaignImage(
    asset['image_prompt'] as string,
    brandDNA,
    asset['platform'] as SocialPlatform,
    asset['headline'] as string | null,
    asset['cta'] as string | null,
    visualType
  )

  // Upload to storage if successful
  let imageUrl: string | null = null
  if (result.imageBase64 && !result.error) {
    const ext = result.mimeType.includes('jpeg') ? 'jpg' : 'png'
    const path = `campaign-assets/${user.id}/${id}/${assetId}.${ext}`
    const buffer = Buffer.from(result.imageBase64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('campaign-assets')
      .upload(path, buffer, { contentType: result.mimeType, upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }
  }

  // Determine new status
  let newStatus: string
  if (!imageUrl) {
    newStatus = 'pending_image'
  } else if (result.qualityStatus === 'review') {
    newStatus = 'review'
  } else {
    newStatus = 'ready'
  }

  // Update asset
  await supabase
    .from('campaign_assets')
    .update({
      image_url: imageUrl,
      status: newStatus,
      image_engine: result.imageEngine,
      quality_score: result.qualityScore,
      quality_status: result.qualityStatus,
    })
    .eq('id', assetId)

  return NextResponse.json({
    success: true,
    imageUrl,
    status: newStatus,
    imageEngine: result.imageEngine,
    qualityScore: result.qualityScore,
    qualityStatus: result.qualityStatus,
  })
}
