/**
 * MACAS Auto-Trigger
 *
 * Called fire-and-forget after a bookkeeper run completes.
 * Evaluates each business result through the readiness gate and creates
 * draft advisory cases for businesses that pass.
 *
 * Cases created here are flagged with source: 'auto-bookkeeper' and display
 * a verification badge in the UI to remind Phill to review inputs before acting.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { collectFinancialContext } from './financial-context'
import { evaluateReadiness, type BusinessRunResult } from './readiness-gate'
import type { BusinessKey } from '@/lib/businesses'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoTriggerInput {
  founderId: string
  runId: string
  runCompletedAt: string
  businessResults: BusinessRunResult[]
}

export interface AutoTriggerResult {
  casesCreated: number
  businessesSkipped: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate readiness and create MACAS advisory cases for qualifying businesses.
 * Designed to run fire-and-forget — all errors are caught and logged, not thrown.
 */
export async function triggerMacasAdvisory(
  input: AutoTriggerInput
): Promise<AutoTriggerResult> {
  const { founderId, runId, runCompletedAt, businessResults } = input
  const supabase = createServiceClient()
  const result: AutoTriggerResult = { casesCreated: 0, businessesSkipped: 0, errors: [] }

  // --- Readiness gate ---
  const { ready, skipped } = evaluateReadiness(businessResults, runCompletedAt)
  result.businessesSkipped = skipped.length

  if (skipped.length > 0) {
    console.log(
      `[MACAS Auto-Trigger] Skipped ${skipped.length} businesses:`,
      skipped.map(s => `${s.businessKey} (${s.reason})`).join(', ')
    )
  }

  if (ready.length === 0) {
    console.log('[MACAS Auto-Trigger] No businesses passed the readiness gate — no cases created')
    return result
  }

  // --- Look up business UUIDs from the businesses table (best-effort) ---
  const { data: businessRows } = await supabase
    .from('businesses')
    .select('id, key')
    .eq('founder_id', founderId)
    .in('key', ready.map(b => b.businessKey))

  const businessIdMap = new Map<string, string>(
    (businessRows ?? []).map(row => [row.key as string, row.id as string])
  )

  // --- Create one advisory case per ready business ---
  for (const business of ready) {
    try {
      const financialContext = await collectFinancialContext(
        founderId,
        business.businessKey as BusinessKey
      )

      const businessId = businessIdMap.get(business.businessKey) ?? null

      const { error } = await supabase.from('advisory_cases').insert({
        founder_id: founderId,
        business_id: businessId,
        title: `Auto-Advisory — ${business.businessName} — ${business.periodLabel}`,
        scenario: buildScenario(business.businessName, business.periodLabel, business.unreconciledRatio),
        financial_context: financialContext,
        source: 'auto-bookkeeper',
        status: 'draft',
        current_round: 0,
        total_rounds: 5,
      })

      if (error) {
        const msg = `Failed to create case for ${business.businessKey}: ${error.message}`
        console.error(`[MACAS Auto-Trigger] ${msg}`)
        result.errors.push(msg)
        continue
      }

      console.log(
        `[MACAS Auto-Trigger] Created advisory case for ${business.businessKey} ` +
        `(period: ${business.periodLabel}, unreconciled: ${(business.unreconciledRatio * 100).toFixed(1)}%)`
      )
      result.casesCreated++
    } catch (err) {
      const msg = `Unexpected error for ${business.businessKey}: ${err instanceof Error ? err.message : 'unknown'}`
      console.error(`[MACAS Auto-Trigger] ${msg}`)
      result.errors.push(msg)
    }
  }

  console.log(
    `[MACAS Auto-Trigger] Run ${runId} complete: ${result.casesCreated} cases created, ` +
    `${result.businessesSkipped} skipped, ${result.errors.length} errors`
  )

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildScenario(
  businessName: string,
  periodLabel: string,
  unreconciledRatio: number
): string {
  const reconciledPercent = ((1 - unreconciledRatio) * 100).toFixed(0)
  return (
    `Automated financial review for ${businessName} — ${periodLabel}. ` +
    `Bookkeeper run completed with ${reconciledPercent}% of transactions auto-reconciled. ` +
    `Review the current financial position, identify tax optimisation opportunities, ` +
    `flag any ATO compliance concerns, and recommend priority actions for the period ahead.`
  )
}
