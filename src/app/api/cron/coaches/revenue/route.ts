// src/app/api/cron/coaches/revenue/route.ts
// GET /api/cron/coaches/revenue
// Daily Revenue Coach CRON — runs at 07:30 AEST (21:30 UTC previous day)

import { NextResponse } from 'next/server'
import { runCoach } from '@/lib/coaches/runner'
import { fetchRevenueData } from '@/lib/coaches/revenue'
import { REVENUE_COACH_SYSTEM_PROMPT, buildRevenueUserMessage } from '@/lib/coaches/prompts/revenue'
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
    console.error('[Revenue Coach CRON] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    console.log(`[Revenue Coach CRON] Starting daily run for founder ${founderId}`)

    const result = await runCoach({
      coachType: 'revenue',
      founderId,
      systemPrompt: REVENUE_COACH_SYSTEM_PROMPT,
      buildUserMessage: (ctx) =>
        buildRevenueUserMessage({
          businesses: ctx.data.businesses as Array<{
            key: string
            name: string
            revenueCents: number
            expensesCents: number
            growth: number
            invoiceCount: number
          }>,
          todayDate: ctx.reportDate,
        }),
      fetchData: fetchRevenueData,
    })

    const durationMs = Date.now() - startTime
    console.log(`[Revenue Coach CRON] Completed in ${durationMs}ms — status: ${result.status}`)

    notify({
      type: 'cron_complete',
      title: 'Revenue Coach Complete',
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
    console.error('[Revenue Coach CRON] Fatal error:', error)

    notify({
      type: 'cron_complete',
      title: 'Revenue Coach FAILED',
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
