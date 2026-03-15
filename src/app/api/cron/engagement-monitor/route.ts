// src/app/api/cron/engagement-monitor/route.ts
// GET /api/cron/engagement-monitor
// Runs every 30 minutes — fetches new social comments, generates AI replies,
// auto-posts positive/neutral replies and flags negative ones for review.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchNewComments, replyToFacebookComment, replyToInstagramComment } from '@/lib/integrations/social/engagement'
import { decodeToken } from '@/lib/integrations/social/channels'
import { generateReply } from '@/lib/content/reply-generator'
import { notify } from '@/lib/notifications'
import type { BrandIdentity } from '@/lib/content/types'
import type { SocialComment } from '@/lib/integrations/social/engagement'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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

// ── Content Hash ─────────────────────────────────────────────────────────────

function contentHash(platform: string, authorId: string, content: string): string {
  return crypto
    .createHash('sha256')
    .update(`${platform}:${authorId}:${content}`)
    .digest('hex')
    .slice(0, 32)
}

// ── Business Result Tracking ─────────────────────────────────────────────────

interface BusinessResult {
  businessKey: string
  newComments: number
  autoReplied: number
  flagged: number
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
    console.error('[Engagement CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()

  try {
    console.log(`[Engagement CRON] Starting engagement monitor for founder ${founderId}`)

    // 2. Load all brand identities
    const { data: brandRows, error: brandError } = await supabase
      .from('brand_identities')
      .select('*')

    if (brandError) {
      throw new Error(`Failed to load brand identities: ${brandError.message}`)
    }

    if (!brandRows || brandRows.length === 0) {
      console.log('[Engagement CRON] No brand identities found — skipping')
      return NextResponse.json({ success: true, message: 'No brand identities configured', processed: 0 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brands = brandRows.map((row: any) => mapBrandRow(row))

    // 3. Process each business in parallel with error isolation
    const results = await Promise.allSettled(
      brands.map((brand) => processBusinessEngagement(supabase, brand, founderId))
    )

    // 4. Aggregate results
    let totalNewComments = 0
    let totalAutoReplied = 0
    let totalFlagged = 0
    const businessResults: BusinessResult[] = []
    const failures: string[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const businessKey = brands[i].businessKey

      if (result.status === 'fulfilled') {
        totalNewComments += result.value.newComments
        totalAutoReplied += result.value.autoReplied
        totalFlagged += result.value.flagged
        businessResults.push(result.value)
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason)
        console.error(`[Engagement CRON] Business ${businessKey} failed:`, errorMsg)
        failures.push(`${businessKey}: ${errorMsg}`)
        businessResults.push({
          businessKey,
          newComments: 0,
          autoReplied: 0,
          flagged: 0,
          errors: [errorMsg],
        })
      }
    }

    const durationMs = Date.now() - startTime
    const hasFailures = failures.length > 0
    const allFailed = failures.length === brands.length

    console.log(
      `[Engagement CRON] Completed in ${durationMs}ms — ` +
        `${totalNewComments} new comments, ${totalAutoReplied} auto-replied, ${totalFlagged} flagged, ${failures.length} failures`
    )

    // 5. Send notification summary
    notify({
      type: 'cron_complete',
      title: allFailed ? 'Engagement Monitor FAILED' : 'Engagement Monitor Complete',
      body:
        `${totalNewComments} new comments, ${totalAutoReplied} auto-replied, ${totalFlagged} flagged. ` +
        `Duration: ${durationMs}ms.` +
        (hasFailures ? ` Failures: ${failures.join('; ')}` : ''),
      severity: allFailed ? 'critical' : hasFailures ? 'warning' : 'info',
      metadata: { totalNewComments, totalAutoReplied, totalFlagged, durationMs, failures },
    }).catch(() => {})

    return NextResponse.json({
      success: !allFailed,
      totalNewComments,
      totalAutoReplied,
      totalFlagged,
      businesses: businessResults,
      failures,
      durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Engagement CRON] Fatal error:', error)

    notify({
      type: 'cron_complete',
      title: 'Engagement Monitor FAILED',
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

async function processBusinessEngagement(
  supabase: ReturnType<typeof createServiceClient>,
  brand: BrandIdentity,
  founderId: string
): Promise<BusinessResult> {
  const result: BusinessResult = {
    businessKey: brand.businessKey,
    newComments: 0,
    autoReplied: 0,
    flagged: 0,
    errors: [],
  }

  // a. Fetch new comments across all connected platforms
  const comments = await fetchNewComments(founderId, brand.businessKey)

  if (comments.length === 0) {
    console.log(`[Engagement CRON] ${brand.businessKey}: no new comments`)
    return result
  }

  // b. Dedup against social_engagements table
  const newComments: SocialComment[] = []
  for (const comment of comments) {
    const hash = contentHash(comment.platform, comment.authorId, comment.content)

    const { data: existing } = await supabase
      .from('social_engagements')
      .select('id')
      .eq('founder_id', founderId)
      .eq('platform', comment.platform)
      .eq('content_hash', hash)
      .limit(1)

    if (!existing || existing.length === 0) {
      newComments.push(comment)
    }
  }

  if (newComments.length === 0) {
    console.log(`[Engagement CRON] ${brand.businessKey}: all comments already processed`)
    return result
  }

  result.newComments = newComments.length

  // c. Process each new comment
  for (const comment of newComments) {
    const hash = contentHash(comment.platform, comment.authorId, comment.content)

    try {
      // Insert engagement record as pending
      const { data: engagement, error: insertError } = await supabase
        .from('social_engagements')
        .insert({
          founder_id: founderId,
          business_key: brand.businessKey,
          platform: comment.platform,
          engagement_type: 'comment',
          external_id: comment.externalId,
          post_external_id: comment.postExternalId,
          author_name: comment.authorName,
          author_id: comment.authorId,
          content: comment.content,
          content_hash: hash,
          reply_status: 'pending',
          created_at: comment.createdAt,
        })
        .select('id')
        .single()

      if (insertError) {
        result.errors.push(`Insert failed for ${comment.externalId}: ${insertError.message}`)
        continue
      }

      // Generate AI reply
      const replyResult = await generateReply(
        {
          comment: comment.content,
          platform: comment.platform,
          authorName: comment.authorName,
        },
        brand
      )

      // Update engagement with AI reply and sentiment
      await supabase
        .from('social_engagements')
        .update({
          ai_reply: replyResult.reply,
          sentiment: replyResult.sentiment,
          reply_status: replyResult.shouldAutoReply ? 'pending' : 'flagged',
          updated_at: new Date().toISOString(),
        })
        .eq('id', engagement.id)

      // Auto-reply for positive/neutral comments
      if (replyResult.shouldAutoReply) {
        try {
          await postReply(supabase, founderId, brand.businessKey, comment, replyResult.reply)

          await supabase
            .from('social_engagements')
            .update({
              reply_status: 'auto_replied',
              replied_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', engagement.id)

          result.autoReplied++
        } catch (replyErr) {
          const msg = replyErr instanceof Error ? replyErr.message : String(replyErr)
          result.errors.push(`Reply failed for ${comment.externalId}: ${msg}`)
          console.error(`[Engagement CRON] Reply post failed:`, msg)
        }
      } else {
        // Negative sentiment — flagged for human review
        result.flagged++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      result.errors.push(`${comment.platform}/${comment.externalId}: ${errorMsg}`)
      console.error(`[Engagement CRON] Comment processing failed:`, errorMsg)
    }
  }

  // d. Update last_synced_at on social channels for this business
  await supabase
    .from('social_channels')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('founder_id', founderId)
    .eq('business_key', brand.businessKey)
    .eq('is_connected', true)

  console.log(
    `[Engagement CRON] ${brand.businessKey}: ${result.newComments} new, ` +
      `${result.autoReplied} auto-replied, ${result.flagged} flagged` +
      (result.errors.length ? `, ${result.errors.length} errors` : '')
  )

  return result
}

// ── Post Reply to Platform ───────────────────────────────────────────────────

async function postReply(
  supabase: ReturnType<typeof createServiceClient>,
  founderId: string,
  businessKey: string,
  comment: SocialComment,
  replyMessage: string
): Promise<void> {
  // Load the channel to get access token
  const { data: channel, error } = await supabase
    .from('social_channels')
    .select('access_token_encrypted')
    .eq('founder_id', founderId)
    .eq('business_key', businessKey)
    .eq('platform', comment.platform)
    .eq('is_connected', true)
    .single()

  if (error || !channel) {
    throw new Error(`No connected ${comment.platform} channel for ${businessKey}`)
  }

  const accessToken = decodeToken(channel.access_token_encrypted)

  switch (comment.platform) {
    case 'facebook':
      await replyToFacebookComment(accessToken, comment.externalId, replyMessage)
      break
    case 'instagram':
      await replyToInstagramComment(accessToken, comment.externalId, replyMessage)
      break
    default:
      throw new Error(`Reply not supported for platform: ${comment.platform}`)
  }
}
