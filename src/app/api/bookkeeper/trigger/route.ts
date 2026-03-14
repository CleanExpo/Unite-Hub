// src/app/api/bookkeeper/trigger/route.ts
// POST /api/bookkeeper/trigger
// Manual trigger for the bookkeeper pipeline — authenticates via user session.
// Use this when you need to run reconciliation on-demand (e.g. first run,
// or after connecting new Xero accounts) instead of waiting for the nightly CRON.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { runBookkeeperForAllBusinesses } from '@/lib/bookkeeper/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — same as CRON route

export async function POST() {
  const startTime = Date.now()

  // Authenticate via Supabase session (same as other founder routes)
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    console.log(`[Bookkeeper] Manual trigger by ${user.id}`)
    const result = await runBookkeeperForAllBusinesses(user.id)

    const durationMs = Date.now() - startTime
    console.log(
      `[Bookkeeper] Manual run completed in ${durationMs}ms — ` +
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
        businessName: b.businessName,
        status: b.status,
        transactionCount: b.transactionCount,
        autoReconciled: b.autoReconciled,
        flaggedForReview: b.flaggedForReview,
        totalFetched: b.totalFetched,
        alreadyReconciledInXero: b.alreadyReconciledInXero,
        invoicesFetched: b.invoicesFetched,
        error: b.error,
      })),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Bookkeeper] Manual trigger fatal error:', error)

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
