// src/app/api/cron/coaches/build/route.ts
// GET /api/cron/coaches/build
// Daily Build Coach CRON — runs at 07:45 AEST (21:45 UTC previous day)

import { NextResponse } from 'next/server'
import { runCoach } from '@/lib/coaches/runner'
import { fetchBuildData } from '@/lib/coaches/build'
import { BUILD_COACH_SYSTEM_PROMPT, buildBuildUserMessage } from '@/lib/coaches/prompts/build'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Build Coach CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    console.log(`[Build Coach CRON] Starting daily run for founder ${founderId}`)

    const result = await runCoach({
      coachType: 'build',
      founderId,
      systemPrompt: BUILD_COACH_SYSTEM_PROMPT,
      buildUserMessage: (ctx) =>
        buildBuildUserMessage({
          issues: ctx.data.issues as Array<{
            identifier: string
            title: string
            priority: number
            teamKey: string
            teamName: string
            stateName: string
            stateType: string
          }>,
          todayDate: ctx.reportDate,
        }),
      fetchData: fetchBuildData,
    })

    const durationMs = Date.now() - startTime
    console.log(`[Build Coach CRON] Completed in ${durationMs}ms — status: ${result.status}`)

    notify({
      type: 'cron_complete',
      title: 'Build Coach Complete',
      body: `Status: ${result.status}. Tokens: ${result.inputTokens} in / ${result.outputTokens} out. Duration: ${durationMs}ms.`,
      severity: result.status === 'completed' ? 'info' : 'warning',
      metadata: { reportId: result.reportId, durationMs },
    }).catch(() => {})

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
    console.error('[Build Coach CRON] Fatal error:', error)

    notify({
      type: 'cron_complete',
      title: 'Build Coach FAILED',
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
