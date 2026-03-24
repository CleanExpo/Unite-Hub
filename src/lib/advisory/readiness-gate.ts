/**
 * MACAS Readiness Gate
 *
 * Evaluates whether a bookkeeper run has produced data of sufficient quality
 * to auto-trigger a MACAS advisory case. Applies the following checks:
 *
 *   1. Business is 'owned' type (client businesses are excluded)
 *   2. Run status is 'success' (not skipped or errored)
 *   3. At least 1 transaction was processed
 *   4. Unreconciled ratio (flaggedForReview / totalTransactions) ≤ 20%
 *
 * Returns the list of businesses that pass all checks, along with a
 * human-readable period label derived from the run date.
 */

import { BUSINESSES } from '@/lib/businesses'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BusinessRunResult {
  businessKey: string
  businessName: string
  status: 'success' | 'skipped' | 'error'
  transactionCount: number
  autoReconciled: number
  flaggedForReview: number
  error?: string
}

export interface ReadyBusiness {
  businessKey: string
  businessName: string
  /** ISO 8601 date string — used to label the period in the MACAS case title */
  periodLabel: string
  /** 0–1 ratio of flagged/total transactions */
  unreconciledRatio: number
}

export interface GateResult {
  ready: ReadyBusiness[]
  skipped: Array<{ businessKey: string; reason: string }>
}

// ---------------------------------------------------------------------------
// Threshold
// ---------------------------------------------------------------------------

/** Maximum allowed unreconciled ratio. Default 20% per board decision (24/03/2026). */
const MAX_UNRECONCILED_RATIO = 0.2

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate which businesses from a bookkeeper run are ready for MACAS advisory.
 *
 * @param businessResults - Per-business results from the bookkeeper run
 * @param runCompletedAt  - ISO timestamp of when the run completed (used for period label)
 */
export function evaluateReadiness(
  businessResults: BusinessRunResult[],
  runCompletedAt: string = new Date().toISOString()
): GateResult {
  const periodLabel = buildPeriodLabel(runCompletedAt)
  const ready: ReadyBusiness[] = []
  const skipped: Array<{ businessKey: string; reason: string }> = []

  for (const result of businessResults) {
    const businessConfig = BUSINESSES.find(b => b.key === result.businessKey)

    // Only auto-trigger for owned businesses
    if (!businessConfig || businessConfig.type !== 'owned') {
      skipped.push({
        businessKey: result.businessKey,
        reason: 'Business is not an owned satellite (type: client)',
      })
      continue
    }

    // Run must have succeeded
    if (result.status !== 'success') {
      skipped.push({
        businessKey: result.businessKey,
        reason: `Run status was '${result.status}' — not 'success'`,
      })
      continue
    }

    // Need at least 1 transaction to provide meaningful financial context
    if (result.transactionCount < 1) {
      skipped.push({
        businessKey: result.businessKey,
        reason: 'No transactions processed in this run',
      })
      continue
    }

    // Unreconciled ratio check
    const unreconciledRatio = result.flaggedForReview / result.transactionCount
    if (unreconciledRatio > MAX_UNRECONCILED_RATIO) {
      skipped.push({
        businessKey: result.businessKey,
        reason: `Unreconciled ratio ${(unreconciledRatio * 100).toFixed(1)}% exceeds ${MAX_UNRECONCILED_RATIO * 100}% threshold — manual review required`,
      })
      continue
    }

    ready.push({
      businessKey: result.businessKey,
      businessName: result.businessName,
      periodLabel,
      unreconciledRatio,
    })
  }

  return { ready, skipped }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a human-readable period label from a timestamp.
 * e.g. "2026-03-24T11:00:00Z" → "March 2026"
 */
function buildPeriodLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}
