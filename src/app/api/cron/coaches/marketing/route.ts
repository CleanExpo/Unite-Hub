// src/app/api/cron/coaches/marketing/route.ts
// GET /api/cron/coaches/marketing
// Daily Marketing Coach CRON — runs at 08:00 AEST (22:00 UTC previous day)

import { NextResponse } from 'next/server'
import { runCoach } from '@/lib/coaches/runner'
import { fetchMarketingData } from '@/lib/coaches/marketing'
import { MARKETING_COACH_SYSTEM_PROMPT, buildMarketingUserMessage } from '@/lib/coaches/prompts/marketing'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Marketing Coach CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    console.log(`[Marketing Coach CRON] Starting daily run for founder ${founderId}`)

    const result = await runCoach({
      coachType: 'marketing',
      founderId,
      systemPrompt: MARKETING_COACH_SYSTEM_PROMPT,
      buildUserMessage: (ctx) =>
        buildMarketingUserMessage({
          channels: ctx.data.channels as Array<{
            platform: string
            businessKey: string
            businessName: string
            channelName: string | null
            handle: string | null
            followerCount: number
            isConnected: boolean
            lastSyncedAt: string | null
          }>,
          todayDate: ctx.reportDate,
        }),
      fetchData: fetchMarketingData,
    })

    const durationMs = Date.now() - startTime
    console.log(`[Marketing Coach CRON] Completed in ${durationMs}ms — status: ${result.status}`)

    return NextResponse.json({
      success: result.status === 'completed',
      reportId: result.reportId,
      status: result.status,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
      error: result.error,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Marketing Coach CRON] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', durationMs },
      { status: 500 }
    )
  }
}
