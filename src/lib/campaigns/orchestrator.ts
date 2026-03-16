// src/lib/campaigns/orchestrator.ts
// Orchestrates the full campaign generation pipeline:
// 1. Load Brand DNA from brand_profiles
// 2. Generate copy variants via Claude Sonnet (copy-generator)
// 3. Generate branded images via Gemini (image-generator)
// 4. Upload images to Supabase Storage
// 5. Insert all assets into campaign_assets
// 6. Update campaign status to 'ready'

import { createServiceClient } from '@/lib/supabase/service'
import { generateCampaignCopy } from './copy-generator'
import { generateCampaignImage } from './image-generator'
import type {
  BrandDNA,
  BrandColours,
  BrandFonts,
  CampaignObjective,
  VisualType,
} from './types'
import { PLATFORM_DIMENSIONS as DIMS } from './types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

// ─── Image Upload ─────────────────────────────────────────────────────────────

/**
 * Uploads a base64-encoded image to Supabase Storage and returns the public URL.
 * Stores under: campaign-assets/{founderId}/{campaignId}/{assetId}.{ext}
 */
async function uploadImageToStorage(
  imageBase64: string,
  mimeType: string,
  founderId: string,
  campaignId: string,
  assetId: string
): Promise<string | null> {
  try {
    const supabase = createServiceClient()
    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png'
    const path = `campaign-assets/${founderId}/${campaignId}/${assetId}.${ext}`

    // Convert base64 to Buffer
    const buffer = Buffer.from(imageBase64, 'base64')

    const { error } = await supabase.storage
      .from('campaign-assets')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.warn('[Orchestrator] Storage upload failed (non-fatal):', error.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('campaign-assets')
      .getPublicUrl(path)

    return urlData.publicUrl
  } catch (err) {
    console.warn('[Orchestrator] Upload error (non-fatal):', err instanceof Error ? err.message : String(err))
    return null
  }
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

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

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export interface OrchestrationResult {
  campaignId: string
  assetsCreated: number
  assetsWithImages: number
  assetsFailed: number
  assetsForReview: number
}

/**
 * Generates a complete campaign: copy + images for all platforms × variants.
 * Uses Promise.allSettled for image generation — partial results on quota/rate errors.
 */
export async function generateCampaign(
  campaignId: string,
  founderId: string
): Promise<OrchestrationResult> {
  const supabase = createServiceClient()

  // 1. Load campaign + brand profile
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*, brand_profiles(*)')
    .eq('id', campaignId)
    .eq('founder_id', founderId)
    .single()

  if (campaignError || !campaign) {
    throw new Error(`Campaign not found: ${campaignError?.message ?? 'unknown error'}`)
  }

  const brandRow = campaign['brand_profiles'] as Record<string, unknown> | null
  if (!brandRow) throw new Error('Brand profile not found for campaign')

  const brandDNA = mapBrandProfileRow(brandRow)
  const platforms = (campaign['platforms'] as SocialPlatform[]) ?? []
  const postCount = (campaign['post_count'] as number) ?? 3
  const theme = (campaign['theme'] as string) ?? ''
  const objective = (campaign['objective'] as CampaignObjective) ?? 'awareness'

  // 2. Update campaign status to 'generating'
  await supabase
    .from('campaigns')
    .update({ status: 'generating' })
    .eq('id', campaignId)

  // 3. Generate copy for all platforms × variants
  let copyResults
  try {
    copyResults = await generateCampaignCopy(brandDNA, {
      theme,
      objective,
      platforms,
      postCount,
    })
  } catch (err) {
    await supabase
      .from('campaigns')
      .update({ status: 'draft', metadata: { error: err instanceof Error ? err.message : String(err) } })
      .eq('id', campaignId)
    throw err
  }

  // 4. Insert asset rows (status: 'generating_image'), then generate images in parallel
  const assetInserts = copyResults.map(copy => ({
    campaign_id: campaignId,
    founder_id: founderId,
    platform: copy.platform,
    copy: copy.copy,
    headline: copy.headline,
    cta: copy.cta,
    hashtags: copy.hashtags,
    image_prompt: copy.imagePrompt,
    width: DIMS[copy.platform].width,
    height: DIMS[copy.platform].height,
    variant: copy.variant,
    visual_type: copy.visualType ?? 'photo',
    status: 'generating_image' as const,
  }))

  const { data: insertedAssets, error: insertError } = await supabase
    .from('campaign_assets')
    .insert(assetInserts)
    .select('id, platform, variant, headline, cta, image_prompt, visual_type')

  if (insertError || !insertedAssets) {
    throw new Error(`Failed to insert campaign assets: ${insertError?.message}`)
  }

  // 5. Generate images in parallel via dual-engine router (non-fatal failures)
  let reviewCount = 0
  const imageResults = await Promise.allSettled(
    insertedAssets.map(async (asset) => {
      const visualType = (asset['visual_type'] as VisualType) ?? 'photo'

      const result = await generateCampaignImage(
        asset['image_prompt'] as string,
        brandDNA,
        asset['platform'] as SocialPlatform,
        asset['headline'] as string | null,
        asset['cta'] as string | null,
        visualType
      )

      let imageUrl: string | null = null
      if (result.imageBase64 && !result.error) {
        imageUrl = await uploadImageToStorage(
          result.imageBase64,
          result.mimeType,
          founderId,
          campaignId,
          asset['id'] as string
        )
      }

      // Determine asset status based on quality gate
      let assetStatus: string
      if (!imageUrl) {
        assetStatus = 'pending_image'
      } else if (result.qualityStatus === 'review') {
        assetStatus = 'review'
        reviewCount++
      } else {
        assetStatus = 'ready'
      }

      // Update asset with image result + dual-engine metadata
      await supabase
        .from('campaign_assets')
        .update({
          image_url: imageUrl,
          status: assetStatus,
          image_engine: result.imageEngine,
          quality_score: result.qualityScore,
          quality_status: result.qualityStatus,
        })
        .eq('id', asset['id'])

      return { assetId: asset['id'], imageUrl, error: result.error }
    })
  )

  // 6. Tally results
  const assetsWithImages = imageResults.filter(
    r => r.status === 'fulfilled' && r.value.imageUrl !== null
  ).length
  const assetsFailed = imageResults.filter(r => r.status === 'rejected').length

  // 7. Update campaign to 'ready'
  await supabase
    .from('campaigns')
    .update({ status: 'ready' })
    .eq('id', campaignId)

  return {
    campaignId,
    assetsCreated: insertedAssets.length,
    assetsWithImages,
    assetsFailed,
    assetsForReview: reviewCount,
  }
}
