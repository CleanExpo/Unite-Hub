// POST /api/video/generate — Generate a talking-head video via HeyGen
// Returns immediately with video_asset ID; video renders asynchronously.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateContent } from '@/lib/content/generator'
import { createTalkingHeadVideo } from '@/lib/integrations/heygen'
import { PLATFORM_CONSTRAINTS } from '@/lib/content/types'
import type { BrandIdentity, CharacterPersona } from '@/lib/content/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface VideoGenerateBody {
  businessKey: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook'
  topic?: string
  characterPreference: 'male' | 'female'
}

export async function POST(request: Request) {
  // 1. Auth check
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // 2. Parse body
  let body: VideoGenerateBody
  try {
    body = (await request.json()) as VideoGenerateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.businessKey || !body.platform || !body.characterPreference) {
    return NextResponse.json(
      { error: 'Missing required fields: businessKey, platform, characterPreference' },
      { status: 422 }
    )
  }

  const supabase = createServiceClient()

  // 3. Load brand identity from DB
  const { data: brand, error: brandError } = await supabase
    .from('brand_identities')
    .select('*')
    .eq('business_key', body.businessKey)
    .single()

  if (brandError || !brand) {
    return NextResponse.json(
      { error: `No brand identity found for business: ${body.businessKey}. Seed brand identities first.` },
      { status: 404 }
    )
  }

  // Map DB snake_case to TypeScript camelCase
  const brandIdentity: BrandIdentity = {
    id: brand.id as string,
    founderId: brand.founder_id as string,
    businessKey: brand.business_key as string,
    toneOfVoice: brand.tone_of_voice as string,
    targetAudience: brand.target_audience as string,
    industryKeywords: brand.industry_keywords as string[],
    uniqueSellingPoints: brand.unique_selling_points as string[],
    characterMale: brand.character_male as CharacterPersona,
    characterFemale: brand.character_female as CharacterPersona,
    colourPrimary: brand.colour_primary as string | null,
    colourSecondary: brand.colour_secondary as string | null,
    doList: brand.do_list as string[],
    dontList: brand.dont_list as string[],
    sampleContent: brand.sample_content as Record<string, unknown>,
    createdAt: brand.created_at as string,
    updatedAt: brand.updated_at as string,
  }

  // 4. Resolve avatar and voice from brand identity character
  const character: CharacterPersona =
    body.characterPreference === 'male'
      ? brandIdentity.characterMale
      : brandIdentity.characterFemale

  const avatarId = character.heygenAvatarId
  if (!avatarId) {
    return NextResponse.json(
      {
        error: `No HeyGen avatar ID configured for ${body.characterPreference} character on business "${body.businessKey}". ` +
          'Update the brand identity character_male or character_female JSONB with a heygenAvatarId field.',
      },
      { status: 422 }
    )
  }
  const voiceId = character.heygenVoiceId

  // 5. Generate video script via content generator
  // The generator currently handles social_post; we use it with a modified topic for video scripts.
  const scriptTopic = `VIDEO SCRIPT for ${body.platform}: ${body.topic ?? 'general brand content'}`
  let scriptBody: string

  try {
    const results = await generateContent(
      {
        businessKey: body.businessKey,
        contentType: 'social_post',
        platform: body.platform,
        topic: scriptTopic,
        characterPreference: body.characterPreference,
        count: 1,
      },
      brandIdentity
    )

    if (!results.length) {
      return NextResponse.json({ error: 'Script generation returned no results' }, { status: 500 })
    }

    scriptBody = results[0].body
  } catch (error) {
    console.error('[VideoGenerate] Script generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Script generation failed' },
      { status: 500 }
    )
  }

  // 6. Determine aspect ratio from platform constraints
  const constraint = PLATFORM_CONSTRAINTS[body.platform]
  const aspectRatio = constraint.aspectRatio as '9:16' | '16:9' | '1:1'

  // 7. Insert video_assets row with status='pending'
  const { data: videoAsset, error: insertError } = await supabase
    .from('video_assets')
    .insert({
      founder_id: user.id,
      business_key: body.businessKey,
      status: 'pending',
      provider: 'heygen',
      script: scriptBody,
      aspect_ratio: aspectRatio,
      metadata: {
        platform: body.platform,
        characterPreference: body.characterPreference,
        avatarId,
        voiceId: voiceId ?? null,
        topic: body.topic ?? null,
      },
    })
    .select('id')
    .single()

  if (insertError || !videoAsset) {
    console.error('[VideoGenerate] Insert error:', insertError?.message)
    return NextResponse.json(
      { error: 'Failed to create video asset record' },
      { status: 500 }
    )
  }

  // 8. Call HeyGen to start video generation
  try {
    const heygenVideoId = await createTalkingHeadVideo({
      avatarId,
      script: scriptBody,
      voiceId,
      aspectRatio,
      title: body.topic,
    })

    // 9. Update video_assets: status='generating', external_job_id
    await supabase
      .from('video_assets')
      .update({
        status: 'generating',
        external_job_id: heygenVideoId,
      })
      .eq('id', videoAsset.id)

    // 10. Return immediately with IDs
    return NextResponse.json({
      videoAssetId: videoAsset.id,
      heygenVideoId,
      status: 'generating',
    })
  } catch (error) {
    // Update the record to reflect failure
    await supabase
      .from('video_assets')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'HeyGen API call failed',
      })
      .eq('id', videoAsset.id)

    console.error('[VideoGenerate] HeyGen call failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'HeyGen video creation failed' },
      { status: 500 }
    )
  }
}
