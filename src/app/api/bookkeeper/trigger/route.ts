// src/app/api/bookkeeper/trigger/route.ts
// POST /api/bookkeeper/trigger
// Manual trigger for the bookkeeper pipeline — authenticates via user session.
// Supports optional { businessKey } body param to run for a single business.
// Use this when you need to run reconciliation on-demand instead of waiting
// for the nightly CRON.

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
    runBookkeeperForAllBusinesses,
    runBookkeeperForOneBusiness,
} from '@/lib/bookkeeper/orchestrator'
import { captureApiError } from '@/lib/error-reporting'
import { triggerMacasAdvisory } from '@/lib/advisory/auto-trigger'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — Vercel Pro limit

export async function POST(req: NextRequest) {
    const startTime = Date.now()

  // Authenticate via Supabase session (same as other founder routes)
  const user = await getUser()
    if (!user) {
          return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

  // Parse optional businessKey from body — if provided, run for that business only
  let businessKey: string | undefined
    try {
          const body = await req.json()
          businessKey = body?.businessKey ?? undefined
    } catch {
          // No body or invalid JSON — run for all businesses
      businessKey = undefined
    }

  try {
        if (businessKey) {
                // --- Single-business mode ---
          console.log(`[Bookkeeper] Manual trigger by ${user.id} for business: ${businessKey}`)
                const result = await runBookkeeperForOneBusiness(user.id, businessKey)

          const durationMs = Date.now() - startTime
                console.log(
                          `[Bookkeeper] Single-business run completed in ${durationMs}ms — ` +
                          `businessKey: ${businessKey}, status: ${result.status}`
                        )

          // Fire-and-forget: auto-create MACAS advisory case if data passes readiness gate
          if (result.status !== 'failed') {
            void triggerMacasAdvisory({
              founderId: user.id,
              runId: result.runId,
              runCompletedAt: new Date().toISOString(),
              businessResults: result.businessResults.map(b => ({
                businessKey: b.businessKey,
                businessName: b.businessName,
                status: b.status,
                transactionCount: b.transactionCount,
                autoReconciled: b.autoReconciled,
                flaggedForReview: b.flaggedForReview,
              })),
            }).catch(err =>
              captureApiError(err, { route: '/api/bookkeeper/trigger', method: 'POST', founderId: user.id, context: 'macas-auto-trigger' })
            )
          }

          return NextResponse.json({
                    success: result.status !== 'failed',
                    mode: 'single',
                    businessKey,
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
                                statementLinesFetched: b.statementLinesFetched,
                                error: b.error,
                    })),
          })
        } else {
                // --- All-businesses mode ---
          console.log(`[Bookkeeper] Manual trigger by ${user.id} — all businesses`)
                const result = await runBookkeeperForAllBusinesses(user.id)

          const durationMs = Date.now() - startTime
                console.log(
                          `[Bookkeeper] All-businesses run completed in ${durationMs}ms — ` +
                          `status: ${result.status}, ` +
                          `transactions: ${result.totalTransactions}, ` +
                          `auto-reconciled: ${result.autoReconciled}, ` +
                          `flagged: ${result.flaggedForReview}`
                        )

          // Fire-and-forget: auto-create MACAS advisory cases for qualifying businesses
          if (result.status !== 'failed') {
            void triggerMacasAdvisory({
              founderId: user.id,
              runId: result.runId,
              runCompletedAt: new Date().toISOString(),
              businessResults: result.businessResults.map(b => ({
                businessKey: b.businessKey,
                businessName: b.businessName,
                status: b.status,
                transactionCount: b.transactionCount,
                autoReconciled: b.autoReconciled,
                flaggedForReview: b.flaggedForReview,
              })),
            }).catch(err =>
              captureApiError(err, { route: '/api/bookkeeper/trigger', method: 'POST', founderId: user.id, context: 'macas-auto-trigger' })
            )
          }

          return NextResponse.json({
                    success: result.status !== 'failed',
                    mode: 'all',
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
                                statementLinesFetched: b.statementLinesFetched,
                                error: b.error,
                    })),
          })
        }
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error('[Bookkeeper] Manual trigger fatal error:', error)
    captureApiError(error, { route: '/api/bookkeeper/trigger', method: 'POST', founderId: user.id, durationMs })

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
