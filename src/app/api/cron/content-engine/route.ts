// src/app/api/cron/content-engine/route.ts
// GET /api/cron/content-engine
// Daily Content Engine CRON — runs at 06:00 AEST (20:00 UTC previous day)
// Auto-generates social content to fill calendar gaps for all businesses.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateContent } from '@/lib/content/generator'
import { getContentGapsForWeek, getNextScheduledSlot } from '@/lib/content/calendar'
import { notify } from '@/lib/notifications'
import type { ContentGenerationRequest, BrandIdentity } from '@/lib/content/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — generating for multiple businesses

// ── Brand Identity Mapper ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBrandRow(row: Record<string, any>): BrandIdentity {
  return {
    id: row.id,
    founderId: row.founder_id,
    businessKey: row.business_key,
    toneOfVoice: row.tone_of_voice,
    targetAudience: row.target_audience,
    industryKeywords: row.industry_keywords ?? [],
    uniqueSellingPoints: row.unique_selling_points ?? [],
    characterMale: row.character_male ?? {},
    characterFemale: row.character_female ?? {},
    colourPrimary: row.colour_primary,
    colourSecondary: row.colour_secondary,
    doList: row.do_list ?? [],
    dontList: row.dont_list ?? [],
    sampleContent: row.sample_content ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Business Result Tracking ─────────────────────────────────────────────────

interface BusinessResult {
  businessKey: string
  generated: number
  scheduled: number
  errors: string[]
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const startTime = Date.now()

  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Content Engine CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()

  try {
    console.log(`[Content Engine CRON] Starting daily run for founder ${founderId}`)

    // 2. Load all brand identities from DB
    const { data: brandRows, error: brandError } = await supabase
      .from('brand_identities')
      .select('*')

    if (brandError) {
      throw new Error(`Failed to load brand identities: ${brandError.message}`)
    }

    if (!brandRows || brandRows.length === 0) {
      console.log('[Content Engine CRON] No brand identities found — skipping')
      return NextResponse.json({ success: true, message: 'No brand identities configured', generated: 0 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brands = brandRows.map((row: any) => mapBrandRow(row))

    // 3. Process each business in parallel with error isolation
    const results = await Promise.allSettled(
      brands.map((brand) => processBusinessContent(supabase, brand, founderId))
    )

    // 4. Aggregate results
    let totalGenerated = 0
    let totalScheduled = 0
    const businessResults: BusinessResult[] = []
    const failures: string[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const businessKey = brands[i].businessKey

      if (result.status === 'fulfilled') {
        totalGenerated += result.value.generated
        totalScheduled += result.value.scheduled
        businessResults.push(result.value)
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason)
        console.error(`[Content Engine CRON] Business ${businessKey} failed:`, errorMsg)
        failures.push(`${businessKey}: ${errorMsg}`)
        businessResults.push({
          businessKey,
          generated: 0,
          scheduled: 0,
          errors: [errorMsg],
        })
      }
    }

    const durationMs = Date.now() - startTime
    const hasFailures = failures.length > 0
    const allFailed = failures.length === brands.length

    console.log(
      `[Content Engine CRON] Completed in ${durationMs}ms — ` +
        `${totalGenerated} generated, ${totalScheduled} scheduled, ${failures.length} failures`
    )

    // 5. Send notification with summary
    notify({
      type: 'cron_complete',
      title: allFailed ? 'Content Engine FAILED' : 'Content Engine Complete',
      body:
        `Generated ${totalGenerated} pieces, scheduled ${totalScheduled}. ` +
        `Duration: ${durationMs}ms.` +
        (hasFailures ? ` Failures: ${failures.join('; ')}` : ''),
      severity: allFailed ? 'critical' : hasFailures ? 'warning' : 'info',
      metadata: { totalGenerated, totalScheduled, durationMs, failures },
    }).catch(() => {})

    return NextResponse.json({
      success: !allFailed,
      totalGenerated,
      totalScheduled,
      businesses: businessResults,
      failures,
      durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Content Engine CRON] Fatal error:', error)

    notify({
      type: 'cron_complete',
      title: 'Content Engine FAILED',
      body: `Fatal error after ${durationMs}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'critical',
      metadata: { durationMs },
    }).catch(() => {})

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', durationMs },
      { status: 500 }
    )
  }
}

// ── Per-Business Processing ──────────────────────────────────────────────────

async function processBusinessContent(
  supabase: ReturnType<typeof createServiceClient>,
  brand: BrandIdentity,
  founderId: string
): Promise<BusinessResult> {
  const result: BusinessResult = {
    businessKey: brand.businessKey,
    generated: 0,
    scheduled: 0,
    errors: [],
  }

  // a. Find gaps for this business
  const gaps = await getContentGapsForWeek(brand.businessKey)

  if (gaps.length === 0 || gaps.every((g) => g.gapCount === 0)) {
    console.log(`[Content Engine CRON] ${brand.businessKey}: no gaps found — skipping`)
    return result
  }

  // b. Character alternation counter — alternate male/female for variety
  let characterCounter = 0

  for (const gap of gaps) {
    if (gap.gapCount <= 0) continue

    const platform: SocialPlatform = gap.platform
    const characterPreference = characterCounter % 2 === 0 ? 'male' : 'female'
    characterCounter++

    try {
      // Generate content for this platform's gaps
      const request: ContentGenerationRequest = {
        businessKey: brand.businessKey,
        contentType: 'social_post',
        platform,
        count: gap.gapCount,
        characterPreference,
      }

      const generated = await generateContent(request, brand)

      // Insert each generated piece into generated_content + social_posts
      for (const item of generated) {
        // Insert into generated_content table
        const { error: contentError } = await supabase.from('generated_content').insert({
          founder_id: founderId,
          business_key: brand.businessKey,
          content_type: 'social_post',
          platform,
          title: item.title,
          body: item.body,
          hashtags: item.hashtags,
          cta: item.cta,
          media_prompt: item.mediaPrompt,
          character_used: item.characterUsed,
          ai_model: 'claude-sonnet-4-5-20250929',
          generation_source: 'cron_auto',
          status: 'generated',
        })

        if (contentError) {
          result.errors.push(`generated_content insert: ${contentError.message}`)
          console.error(
            `[Content Engine CRON] ${brand.businessKey}/${platform} content insert failed:`,
            contentError.message
          )
          continue
        }

        result.generated++

        // Get next available scheduled slot for this platform
        const nextSlot = await getNextScheduledSlot(brand.businessKey, platform)

        // Create social_posts row with scheduled status
        const postContent =
          item.body +
          (item.hashtags.length
            ? '\n\n' +
              item.hashtags
                .map((h: string) => '#' + h)
                .join(' ')
            : '')

        const { error: postError } = await supabase.from('social_posts').insert({
          founder_id: brand.founderId,
          business_key: brand.businessKey,
          title: item.title,
          content: postContent,
          media_urls: [],
          platforms: [platform],
          status: 'scheduled',
          scheduled_at: nextSlot.toISOString(),
        })

        if (postError) {
          result.errors.push(`social_posts insert: ${postError.message}`)
          console.error(
            `[Content Engine CRON] ${brand.businessKey}/${platform} post insert failed:`,
            postError.message
          )
          continue
        }

        result.scheduled++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      result.errors.push(`${platform}: ${errorMsg}`)
      console.error(`[Content Engine CRON] ${brand.businessKey}/${platform} generation failed:`, errorMsg)
    }
  }

  console.log(
    `[Content Engine CRON] ${brand.businessKey}: ${result.generated} generated, ${result.scheduled} scheduled` +
      (result.errors.length ? `, ${result.errors.length} errors` : '')
  )

  return result
}
