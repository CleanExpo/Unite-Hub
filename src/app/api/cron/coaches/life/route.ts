// src/app/api/cron/coaches/life/route.ts
// GET /api/cron/coaches/life
// Daily Life Coach CRON — runs at 07:15 AEST (21:15 UTC previous day)

import { NextResponse } from 'next/server'
import { runCoach } from '@/lib/coaches/runner'
import { fetchLifeData } from '@/lib/coaches/life'
import { LIFE_COACH_SYSTEM_PROMPT, buildLifeUserMessage } from '@/lib/coaches/prompts/life'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()

  // 1. Authenticate
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Get founder ID
  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Life Coach CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    console.log(`[Life Coach CRON] Starting daily run for founder ${founderId}`)

    const result = await runCoach({
      coachType: 'life',
      founderId,
      systemPrompt: LIFE_COACH_SYSTEM_PROMPT,
      buildUserMessage: (ctx) =>
        buildLifeUserMessage({
          events: ctx.data.events as Array<{ title: string; start: string; end: string; businessKey: string }>,
          threads: ctx.data.threads as Array<{ subject: string; from: string; snippet: string; unread: boolean; businessKey: string }>,
          todayDate: ctx.reportDate,
        }),
      fetchData: fetchLifeData,
    })

    const durationMs = Date.now() - startTime
    console.log(`[Life Coach CRON] Completed in ${durationMs}ms — status: ${result.status}`)

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
    console.error('[Life Coach CRON] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', durationMs },
      { status: 500 }
    )
  }
}
