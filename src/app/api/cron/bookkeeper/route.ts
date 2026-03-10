// src/app/api/cron/bookkeeper/route.ts
// GET /api/cron/bookkeeper
// Nightly bookkeeper CRON — runs at 02:00 AEST (16:00 UTC)
// Authenticates via CRON_SECRET, then triggers the bookkeeper orchestrator.

import { NextResponse } from 'next/server'
import { runBookkeeperForAllBusinesses } from '@/lib/bookkeeper/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — processing 8 businesses sequentially

export async function GET(request: Request) {
  const startTime = Date.now()

  // 1. Authenticate — Vercel CRON sets Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Get founder ID — single-tenant system
  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Bookkeeper CRON] FOUNDER_USER_ID environment variable not set')
    return NextResponse.json(
      { error: 'FOUNDER_USER_ID not configured' },
      { status: 500 }
    )
  }

  try {
    // 3. Run the bookkeeper pipeline
    console.log(`[Bookkeeper CRON] Starting nightly run for founder ${founderId}`)
    const result = await runBookkeeperForAllBusinesses(founderId)

    const durationMs = Date.now() - startTime
    console.log(
      `[Bookkeeper CRON] Completed in ${durationMs}ms — ` +
        `status: ${result.status}, ` +
        `transactions: ${result.totalTransactions}, ` +
        `auto-reconciled: ${result.autoReconciled}, ` +
        `flagged: ${result.flaggedForReview}`
    )

    return NextResponse.json({
      success: result.status !== 'failed',
      runId: result.runId,
      status: result.status,
      totalTransactions: result.totalTransactions,
      autoReconciled: result.autoReconciled,
      flaggedForReview: result.flaggedForReview,
      gstCollectedCents: result.gstCollectedCents,
      gstPaidCents: result.gstPaidCents,
      netGstCents: result.netGstCents,
      durationMs,
      businessResults: result.businessResults.map((b) => ({
        businessKey: b.businessKey,
        status: b.status,
        transactionCount: b.transactionCount,
        error: b.error,
      })),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Bookkeeper CRON] Fatal error:', error)

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
