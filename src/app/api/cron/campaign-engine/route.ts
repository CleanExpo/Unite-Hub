// src/app/api/cron/campaign-engine/route.ts
// GET /api/cron/campaign-engine
// Weekly CRON — Sundays 20:00 UTC (06:00 AEST Monday)
// Auto-generates campaigns for brand profiles with status = 'ready'
// that have had no campaign created in the last 7 days.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateCampaign } from '@/lib/campaigns/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — generating images per brand profile

// ── Constants ────────────────────────────────────────────────────────────────

const ROTATING_THEMES = [
  'Monthly Highlights',
  'Product Spotlight',
  'Customer Stories',
  'Industry Insights',
  'Behind the Scenes',
  'Tips & Tricks',
  'Seasonal Campaign',
] as const

const DEFAULT_PLATFORMS = ['instagram', 'facebook', 'linkedin'] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO week number (1–53) for a given date. */
function getISOWeekNumber(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function pickTheme(weekNumber: number): string {
  return ROTATING_THEMES[weekNumber % ROTATING_THEMES.length]
}

// ── Result Tracking ───────────────────────────────────────────────────────────

interface ProfileResult {
  profileId: string
  clientName: string
  status: 'generated' | 'skipped' | 'error'
  campaignId?: string
  reason?: string
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
    console.error('[Campaign Engine CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()
  const weekNumber = getISOWeekNumber(new Date())
  const theme = pickTheme(weekNumber)

  console.log(
    `[Campaign Engine CRON] Starting weekly run — week ${weekNumber}, theme: "${theme}"`
  )

  try {
    // 2. Load all brand profiles with status = 'ready'
    const { data: profiles, error: profilesError } = await supabase
      .from('brand_profiles')
      .select('id, client_name, status')
      .eq('founder_id', founderId)
      .eq('status', 'ready')

    if (profilesError) {
      throw new Error(`Failed to load brand profiles: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      console.log('[Campaign Engine CRON] No ready brand profiles found — skipping')
      return NextResponse.json({
        success: true,
        message: 'No ready brand profiles found',
        processed: 0,
        generated: 0,
        skipped: 0,
        errors: 0,
        durationMs: Date.now() - startTime,
      })
    }

    console.log(`[Campaign Engine CRON] Found ${profiles.length} ready brand profile(s)`)

    // 3. For each profile, check if a campaign was created in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const recentCheckResults = await Promise.allSettled(
      profiles.map(async (profile) => {
        const { data: recentCampaigns, error: checkError } = await supabase
          .from('campaigns')
          .select('id')
          .eq('brand_profile_id', profile['id'] as string)
          .gte('created_at', sevenDaysAgo)
          .limit(1)

        if (checkError) {
          throw new Error(
            `Recent campaign check failed for ${profile['client_name'] as string}: ${checkError.message}`
          )
        }

        const hasRecentCampaign = (recentCampaigns?.length ?? 0) > 0

        return {
          profile: profile as { id: string; client_name: string; status: string },
          hasRecentCampaign,
        }
      })
    )

    // 4. Process profiles without a recent campaign
    const profileResults: ProfileResult[] = []

    const toGenerate: Array<{ id: string; client_name: string; status: string }> = []

    for (let i = 0; i < recentCheckResults.length; i++) {
      const checkResult = recentCheckResults[i]
      const profile = profiles[i] as { id: string; client_name: string; status: string }

      if (checkResult.status === 'rejected') {
        const reason =
          checkResult.reason instanceof Error
            ? checkResult.reason.message
            : String(checkResult.reason)

        console.warn(`[Campaign Engine CRON] Skipping ${profile.client_name} — check error: ${reason}`)
        profileResults.push({
          profileId: profile.id,
          clientName: profile.client_name,
          status: 'error',
          reason,
        })
        continue
      }

      if (checkResult.value.hasRecentCampaign) {
        console.log(
          `[Campaign Engine CRON] ${profile.client_name} — skipping (campaign in last 7 days)`
        )
        profileResults.push({
          profileId: profile.id,
          clientName: profile.client_name,
          status: 'skipped',
          reason: 'campaign created within last 7 days',
        })
        continue
      }

      toGenerate.push(profile)
    }

    // 5. Generate campaigns for eligible profiles (sequential to avoid rate limits)
    for (const profile of toGenerate) {
      const result = await generateCampaignForProfile(
        supabase,
        profile,
        founderId,
        theme
      )
      profileResults.push(result)
    }

    // 6. Tally summary
    const generated = profileResults.filter((r) => r.status === 'generated').length
    const skipped = profileResults.filter((r) => r.status === 'skipped').length
    const errors = profileResults.filter((r) => r.status === 'error').length
    const durationMs = Date.now() - startTime

    console.log(
      `[Campaign Engine CRON] Completed in ${durationMs}ms — ` +
        `processed: ${profiles.length}, generated: ${generated}, skipped: ${skipped}, errors: ${errors}`
    )

    return NextResponse.json({
      success: errors < profiles.length,
      processed: profiles.length,
      generated,
      skipped,
      errors,
      theme,
      weekNumber,
      profiles: profileResults,
      durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Campaign Engine CRON] Fatal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
      },
      { status: 500 }
    )
  }
}

// ── Per-Profile Generation ────────────────────────────────────────────────────

async function generateCampaignForProfile(
  supabase: ReturnType<typeof createServiceClient>,
  profile: { id: string; client_name: string; status: string },
  founderId: string,
  theme: string
): Promise<ProfileResult> {
  console.log(`[Campaign Engine CRON] Generating campaign for "${profile.client_name}"`)

  try {
    // Create the campaign brief
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        founder_id: founderId,
        brand_profile_id: profile.id,
        theme,
        objective: 'awareness',
        platforms: [...DEFAULT_PLATFORMS],
        post_count: 3,
        status: 'draft',
      })
      .select('id')
      .single()

    if (createError || !campaign) {
      const reason = createError?.message ?? 'Insert returned no data'
      console.error(
        `[Campaign Engine CRON] Failed to create campaign for ${profile.client_name}: ${reason}`
      )
      return {
        profileId: profile.id,
        clientName: profile.client_name,
        status: 'error',
        reason: `Campaign insert failed: ${reason}`,
      }
    }

    const campaignId = campaign['id'] as string

    // Trigger generation via orchestrator
    const orchestrationResult = await generateCampaign(campaignId, founderId)

    console.log(
      `[Campaign Engine CRON] "${profile.client_name}" complete — ` +
        `${orchestrationResult.assetsCreated} assets, ` +
        `${orchestrationResult.assetsWithImages} with images, ` +
        `${orchestrationResult.assetsFailed} failed`
    )

    return {
      profileId: profile.id,
      clientName: profile.client_name,
      status: 'generated',
      campaignId,
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error(
      `[Campaign Engine CRON] Generation failed for "${profile.client_name}": ${reason}`
    )
    return {
      profileId: profile.id,
      clientName: profile.client_name,
      status: 'error',
      reason,
    }
  }
}
