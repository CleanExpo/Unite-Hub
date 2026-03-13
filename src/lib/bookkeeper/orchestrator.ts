// src/lib/bookkeeper/orchestrator.ts
// Per-business pipeline orchestrator for the nightly bookkeeper CRON.
// Runs at 02:00 AEST daily, processing all active businesses sequentially
// to stay within Xero's 60 calls/minute rate limit.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { XeroBankTransaction, XeroInvoice, XeroContact } from '@/lib/integrations/xero/types'
import { BUSINESSES } from '@/lib/businesses'
import { createServiceClient } from '@/lib/supabase/service'
import {
  loadXeroTokens,
  getValidXeroToken,
  saveXeroTokens,
  fetchBankTransactions,
  fetchInvoices,
  fetchContacts,
} from '@/lib/integrations/xero/client'
import { reconcileTransactions } from '@/lib/bookkeeper/reconciliation'
import type { ReconciliationMatch } from '@/lib/bookkeeper/reconciliation'
import { optimiseDeductions } from '@/lib/bookkeeper/deduction-optimiser'
import { calculateBAS, getFinancialYearQuarter } from '@/lib/bookkeeper/bas-calculator'
import { toCents, parseXeroDate, getBankTransactionDescription } from '@/lib/bookkeeper/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookkeeperRunResult {
  runId: string
  status: 'completed' | 'partial' | 'failed'
  startedAt: Date
  completedAt: Date
  businessResults: BusinessResult[]
  totalTransactions: number
  autoReconciled: number
  flaggedForReview: number
  failedCount: number
  gstCollectedCents: number
  gstPaidCents: number
  netGstCents: number
}

export interface BusinessResult {
  businessKey: string
  businessName: string
  status: 'success' | 'skipped' | 'error'
  error?: string
  transactionCount: number
  autoReconciled: number
  flaggedForReview: number
  gstCollectedCents: number
  gstPaidCents: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default lookback window for bank transactions (days) */
const BANK_TXN_LOOKBACK_DAYS = 30

/** Default lookback window for invoices (days) — invoices may take longer to pay */
const INVOICE_LOOKBACK_DAYS = 90

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate an ISO date string N days ago from today.
 */
function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * Build transaction records for batch insertion into bookkeeper_transactions.
 */
function buildTransactionRecords(
  runId: string,
  founderId: string,
  businessKey: string,
  tenantId: string,
  matches: ReconciliationMatch[],
  txnLookup: Map<string, XeroBankTransaction>,
): Record<string, unknown>[] {
  return matches.map((match) => {
    const txn = txnLookup.get(match.bankTransactionId)
    return {
      run_id: runId,
      founder_id: founderId,
      business_key: businessKey,
      xero_tenant_id: tenantId,
      xero_transaction_id: match.bankTransactionId,
      transaction_date: txn ? parseXeroDate(txn.Date).toISOString().slice(0, 10) : null,
      description: txn ? getBankTransactionDescription(txn) : null,
      amount_cents: txn ? toCents(txn.Total) : 0,
      currency: 'AUD',
      reconciliation_status: match.reconciliationStatus,
      confidence_score: match.confidence,
      matched_invoice_id: match.matchedInvoiceId,
      matched_bill_id: match.matchedBillId,
      tax_code: match.taxCode,
      gst_amount_cents: match.gstAmountCents,
      tax_category: match.taxCategory,
      is_deductible: match.isDeductible,
      deduction_category: match.deductionCategory,
      deduction_notes: match.deductionNotes,
      raw_xero_data: txn ?? null,
    }
  })
}

// ---------------------------------------------------------------------------
// Per-business pipeline
// ---------------------------------------------------------------------------

/**
 * Process a single business through the full bookkeeper pipeline.
 *
 * Steps:
 * 1. Load and validate Xero tokens (skip if not connected)
 * 2. Fetch bank transactions (last 30 days)
 * 3. Fetch invoices (last 90 days)
 * 4. Fetch contacts
 * 5. Reconcile transactions against invoices
 * 6. Optimise deduction categorisation
 * 7. Calculate BAS for the current quarter
 * 8. Insert transaction records into the database
 */
export async function processOneBusiness(
  founderId: string,
  businessKey: string,
  businessName: string,
  runId: string,
  supabase: SupabaseClient,
): Promise<BusinessResult> {
  // Step 1: Load Xero tokens — skip if not connected
  const storedTokens = await loadXeroTokens(founderId, businessKey)
  if (!storedTokens) {
    return {
      businessKey,
      businessName,
      status: 'skipped',
      error: 'No Xero tokens found — business not connected',
      transactionCount: 0,
      autoReconciled: 0,
      flaggedForReview: 0,
      gstCollectedCents: 0,
      gstPaidCents: 0,
    }
  }

  // Step 2: Validate/refresh token — persist if refreshed
  const validTokens = await getValidXeroToken(storedTokens, businessKey)
  if (validTokens.access_token !== storedTokens.access_token) {
    await saveXeroTokens(founderId, businessKey, validTokens)
  }
  const tenantId = validTokens.tenant_id

  // Step 3: Fetch bank transactions (last 30 days)
  const bankTxnFromDate = daysAgoISO(BANK_TXN_LOOKBACK_DAYS)
  const bankTxnResponse = await fetchBankTransactions(founderId, businessKey, {
    fromDate: bankTxnFromDate,
  })
  const bankTransactions: XeroBankTransaction[] = bankTxnResponse.items

  // Step 4: Fetch invoices (last 90 days)
  const invoiceFromDate = daysAgoISO(INVOICE_LOOKBACK_DAYS)
  const invoiceResponse = await fetchInvoices(founderId, businessKey, {
    fromDate: invoiceFromDate,
  })
  const invoices: XeroInvoice[] = invoiceResponse.items

  // Step 5: Fetch contacts
  const contacts: XeroContact[] = await fetchContacts(founderId, businessKey)

  // Step 6: Reconcile
  const reconciliationResult = reconcileTransactions(bankTransactions, invoices, contacts)

  // Step 7: Optimise deductions
  const deductionResult = optimiseDeductions(reconciliationResult.matches, bankTransactions)

  // Step 8: Calculate BAS for the current quarter
  const currentQuarter = getFinancialYearQuarter(new Date())
  const basResult = calculateBAS(deductionResult.matches, bankTransactions, currentQuarter)

  // Step 9: Build and insert transaction records
  const txnLookup = new Map<string, XeroBankTransaction>()
  for (const txn of bankTransactions) {
    txnLookup.set(txn.BankTransactionID, txn)
  }

  const records = buildTransactionRecords(
    runId,
    founderId,
    businessKey,
    tenantId,
    deductionResult.matches,
    txnLookup,
  )

  if (records.length > 0) {
    const { error: insertError } = await supabase
      .from('bookkeeper_transactions')
      .insert(records)

    if (insertError) {
      throw new Error(`Failed to insert transaction records: ${insertError.message}`)
    }
  }

  // Build per-business summary
  const autoReconciled = deductionResult.matches.filter(
    (m) => m.reconciliationStatus === 'auto_matched',
  ).length
  const flaggedForReview = deductionResult.matches.filter(
    (m) => m.reconciliationStatus === 'manual_review',
  ).length

  return {
    businessKey,
    businessName,
    status: 'success',
    transactionCount: deductionResult.matches.length,
    autoReconciled,
    flaggedForReview,
    gstCollectedCents: basResult.label1B_gstOnSalesCents,
    gstPaidCents: basResult.label9_gstOnPurchasesCents,
  }
}

// ---------------------------------------------------------------------------
// Main: run bookkeeper for all businesses
// ---------------------------------------------------------------------------

/**
 * Top-level entry point for the nightly bookkeeper CRON.
 * Creates a run record, processes each active business sequentially,
 * and updates the run record with final statistics.
 *
 * Error isolation: each business runs in its own try/catch so one failure
 * does not prevent the others from processing.
 *
 * @param founderId - The authenticated founder's user ID
 * @returns Summary of the entire bookkeeper run
 */
export async function runBookkeeperForAllBusinesses(
  founderId: string,
): Promise<BookkeeperRunResult> {
  const startedAt = new Date()
  const supabase = createServiceClient()

  // Create run record
  const { data: run, error: runError } = await supabase
    .from('bookkeeper_runs')
    .insert({
      founder_id: founderId,
      started_at: startedAt.toISOString(),
      status: 'running',
      businesses_processed: [],
    })
    .select('id')
    .single()

  if (runError || !run) {
    throw new Error(`Failed to create bookkeeper run record: ${runError?.message ?? 'Unknown error'}`)
  }

  const runId: string = run.id

  // Filter to active businesses only (skip 'planning' status)
  const activeBusinesses = BUSINESSES.filter((b) => b.status === 'active')

  const businessResults: BusinessResult[] = []
  const errorLog: Array<{ businessKey: string; error: string }> = []

  // Process each business sequentially for Xero rate-limit compliance
  for (const business of activeBusinesses) {
    try {
      const result = await processOneBusiness(
        founderId,
        business.key,
        business.name,
        runId,
        supabase,
      )
      businessResults.push(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      businessResults.push({
        businessKey: business.key,
        businessName: business.name,
        status: 'error',
        error: errorMessage,
        transactionCount: 0,
        autoReconciled: 0,
        flaggedForReview: 0,
        gstCollectedCents: 0,
        gstPaidCents: 0,
      })
      errorLog.push({ businessKey: business.key, error: errorMessage })
    }
  }

  // Calculate aggregate statistics
  const completedAt = new Date()
  const successCount = businessResults.filter((r) => r.status === 'success').length
  const errorCount = businessResults.filter((r) => r.status === 'error').length
  const totalTransactions = businessResults.reduce((sum, r) => sum + r.transactionCount, 0)
  const autoReconciled = businessResults.reduce((sum, r) => sum + r.autoReconciled, 0)
  const flaggedForReview = businessResults.reduce((sum, r) => sum + r.flaggedForReview, 0)
  const gstCollectedCents = businessResults.reduce((sum, r) => sum + r.gstCollectedCents, 0)
  const gstPaidCents = businessResults.reduce((sum, r) => sum + r.gstPaidCents, 0)
  const netGstCents = gstCollectedCents - gstPaidCents

  // Determine overall status
  let overallStatus: 'completed' | 'partial' | 'failed'
  if (errorCount === 0) {
    overallStatus = 'completed'
  } else if (successCount > 0) {
    overallStatus = 'partial'
  } else {
    overallStatus = 'failed'
  }

  // Update run record with final results
  const { error: updateError } = await supabase
    .from('bookkeeper_runs')
    .update({
      completed_at: completedAt.toISOString(),
      status: overallStatus,
      businesses_processed: businessResults,
      total_transactions: totalTransactions,
      auto_reconciled: autoReconciled,
      flagged_for_review: flaggedForReview,
      failed_count: errorCount,
      gst_collected_cents: gstCollectedCents,
      gst_paid_cents: gstPaidCents,
      net_gst_cents: netGstCents,
      error_log: errorLog.length > 0 ? errorLog : null,
    })
    .eq('id', runId)

  if (updateError) {
    console.error(`[Bookkeeper] Failed to update run record ${runId}:`, updateError)
  }

  return {
    runId,
    status: overallStatus,
    startedAt,
    completedAt,
    businessResults,
    totalTransactions,
    autoReconciled,
    flaggedForReview,
    failedCount: errorCount,
    gstCollectedCents,
    gstPaidCents,
    netGstCents,
  }
}
