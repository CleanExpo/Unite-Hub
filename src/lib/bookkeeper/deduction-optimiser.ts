// src/lib/bookkeeper/deduction-optimiser.ts
// ATO deduction category optimisation engine.
// Takes reconciliation results and enriches deduction categorisation
// with ATO-aligned suggestions and instant asset write-off detection.

import type { XeroBankTransaction } from '@/lib/integrations/xero/types'
import type { ReconciliationMatch } from '@/lib/bookkeeper/reconciliation'
import { DEDUCTION_CATEGORIES } from '@/lib/bookkeeper/au-tax-codes'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Instant asset write-off threshold in cents ($20,000 AUD) — S.328-180 */
const INSTANT_ASSET_WRITEOFF_THRESHOLD_CENTS = 2_000_000

/** Minimum amount for instant asset write-off consideration ($300 AUD) */
const INSTANT_ASSET_WRITEOFF_MINIMUM_CENTS = 30_000

/** Corporate tax rate for small businesses (base rate entity) */
const CORPORATE_TAX_RATE = 0.25

/** Fixed-rate home office deduction per hour (from 01/07/2022) */
const HOME_OFFICE_RATE_PER_HOUR = 0.67

// ---------------------------------------------------------------------------
// Keyword patterns for deduction rule detection
// ---------------------------------------------------------------------------

const ASSET_KEYWORDS = [
  /\bequipment\b/,
  /\bcomputer\b/,
  /\blaptop\b/,
  /\bmachinery\b/,
  /\bfurniture\b/,
  /\bvehicle\b/,
  /\btools?\b/,
  /\bprinter\b/,
  /\bmonitor\b/,
  /\bserver\b/,
  /\bphone\b/,
  /\bipad\b/,
  /\btablet\b/,
  /\bappliance\b/,
]

const HOME_OFFICE_KEYWORDS = [
  /\belectricity\b/,
  /\binternet\b/,
  /\bhome office\b/,
  /\butility\b/,
  /\butilities\b/,
  /\bgas bill\b/,
  /\bwater bill\b/,
]

const FUEL_KEYWORDS = [
  /\bfuel\b/,
  /\bpetrol\b/,
  /\bdiesel\b/,
  /\bbp\b/,
  /\bcaltex\b/,
  /\bshell\b/,
  /\bampol\b/,
  /\bpuma energy\b/,
  /\bunited petroleum\b/,
]

const SUBSCRIPTION_ANNUAL_KEYWORDS = [
  /\bannual\b/,
  /\byearly\b/,
  /\b12.month\b/,
  /\bprepaid\b/,
  /\bsubscription\b/,
  /\bmembership\b/,
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeductionSuggestion {
  bankTransactionId: string
  suggestion: string
  atoReference: string
  potentialSavingsCents: number
}

export interface DeductionOptimisationResult {
  matches: ReconciliationMatch[]
  suggestions: DeductionSuggestion[]
  totalDeductibleCents: number
  totalNonDeductibleCents: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Test whether any of the given patterns match the description string.
 */
function matchesAnyPattern(description: string, patterns: RegExp[]): boolean {
  const normalised = description.toLowerCase()
  return patterns.some((p) => p.test(normalised))
}

/**
 * Build a combined description string from a bank transaction.
 * Mirrors the approach used in reconciliation.ts.
 */
function getTransactionDescription(txn: XeroBankTransaction): string {
  const parts: string[] = []
  if (txn.Reference) parts.push(txn.Reference)
  if (txn.Contact?.Name) parts.push(txn.Contact.Name)
  for (const li of txn.LineItems) {
    if (li.Description) parts.push(li.Description)
  }
  return parts.join(' ')
}

/**
 * Convert a dollar amount to cents (rounded to avoid floating-point drift).
 */
function toCents(amount: number): number {
  return Math.round(amount * 100)
}

// ---------------------------------------------------------------------------
// Deduction Rules
// ---------------------------------------------------------------------------

/**
 * Rule 1: Instant Asset Write-Off Detection (S.328-180)
 * Flag single purchases > $300 and < $20,000 as potential instant asset write-offs.
 * Must contain a capital purchase keyword (not recurring).
 */
function checkInstantAssetWriteOff(
  match: ReconciliationMatch,
  description: string,
  amountCents: number,
): { enrichedMatch: Partial<ReconciliationMatch>; suggestion: DeductionSuggestion | null } {
  const absAmount = Math.abs(amountCents)

  if (
    absAmount >= INSTANT_ASSET_WRITEOFF_MINIMUM_CENTS &&
    absAmount < INSTANT_ASSET_WRITEOFF_THRESHOLD_CENTS &&
    match.isDeductible &&
    matchesAnyPattern(description, ASSET_KEYWORDS)
  ) {
    const category = DEDUCTION_CATEGORIES['instant_asset_writeoff']
    const savingsCents = Math.trunc(absAmount * CORPORATE_TAX_RATE)

    return {
      enrichedMatch: {
        deductionCategory: category.key,
        deductionNotes: `Potential instant asset write-off under S.328-180 (assets under $20,000 for small business entities). Amount: $${(absAmount / 100).toFixed(2)} AUD.`,
      },
      suggestion: {
        bankTransactionId: match.bankTransactionId,
        suggestion: `This purchase may qualify for instant asset write-off under S.328-180. Ensure the asset is used for business purposes and the business qualifies as a small business entity (aggregated turnover < $10M).`,
        atoReference: 'S.328-180',
        potentialSavingsCents: savingsCents,
      },
    }
  }

  return { enrichedMatch: {}, suggestion: null }
}

/**
 * Rule 2: Home Office Deduction (TR 93/30)
 * Flag transactions mentioning home-related expenses with note about
 * the fixed-rate method ($0.67/hour from 01/07/2022).
 */
function checkHomeOfficeDeduction(
  match: ReconciliationMatch,
  description: string,
): { enrichedMatch: Partial<ReconciliationMatch>; suggestion: DeductionSuggestion | null } {
  if (match.isDeductible && matchesAnyPattern(description, HOME_OFFICE_KEYWORDS)) {
    return {
      enrichedMatch: {
        deductionNotes: `Home office expense — consider fixed-rate method at $${HOME_OFFICE_RATE_PER_HOUR}/hour (from 01/07/2022). Refer to TR 93/30 and PCG 2023/1 for revised working-from-home deduction methods.`,
      },
      suggestion: {
        bankTransactionId: match.bankTransactionId,
        suggestion: `Home office expense detected. The ATO revised fixed-rate method allows $${HOME_OFFICE_RATE_PER_HOUR}/hour deduction. Ensure you maintain a record of hours worked from home.`,
        atoReference: 'TR 93/30',
        potentialSavingsCents: 0, // Cannot estimate without hours
      },
    }
  }

  return { enrichedMatch: {}, suggestion: null }
}

/**
 * Rule 3: Motor Vehicle Log Book (Div 28)
 * For fuel purchases, add note about log book method requirements.
 */
function checkMotorVehicleLogBook(
  match: ReconciliationMatch,
  description: string,
): { enrichedMatch: Partial<ReconciliationMatch>; suggestion: DeductionSuggestion | null } {
  if (match.isDeductible && matchesAnyPattern(description, FUEL_KEYWORDS)) {
    const existingNotes = match.deductionNotes || ''
    const logBookNote = `Motor vehicle expense — log book method (Div 28) requires a valid 12-week log book period. Retain fuel receipts for substantiation.`

    return {
      enrichedMatch: {
        deductionCategory: match.deductionCategory || 'motor_vehicle',
        deductionNotes: existingNotes ? `${existingNotes} | ${logBookNote}` : logBookNote,
      },
      suggestion: {
        bankTransactionId: match.bankTransactionId,
        suggestion: `Fuel purchase detected. To maximise deductions, ensure you maintain a valid log book (12-week period) under Division 28. The log book method typically yields higher deductions than the cents-per-km method for high-mileage business use.`,
        atoReference: 'Div 28',
        potentialSavingsCents: 0, // Cannot estimate without km/usage data
      },
    }
  }

  return { enrichedMatch: {}, suggestion: null }
}

/**
 * Rule 4: Prepaid Expenses (S.8-1)
 * Flag subscriptions paid annually as potentially claimable in current FY.
 */
function checkPrepaidExpenses(
  match: ReconciliationMatch,
  description: string,
  amountCents: number,
): { enrichedMatch: Partial<ReconciliationMatch>; suggestion: DeductionSuggestion | null } {
  const absAmount = Math.abs(amountCents)

  if (match.isDeductible && matchesAnyPattern(description, SUBSCRIPTION_ANNUAL_KEYWORDS)) {
    const savingsCents = Math.trunc(absAmount * CORPORATE_TAX_RATE)

    return {
      enrichedMatch: {
        deductionCategory: match.deductionCategory || 'subscriptions',
        deductionNotes: `Prepaid expense — annual subscriptions may be fully deductible in the current FY under S.8-1 if the service period does not exceed 12 months and ends before the end of the following income year.`,
      },
      suggestion: {
        bankTransactionId: match.bankTransactionId,
        suggestion: `Annual/prepaid subscription detected. Under S.8-1, prepaid expenses for services not exceeding 12 months and ending before the next FY may be fully deductible in the current financial year.`,
        atoReference: 'S.8-1',
        potentialSavingsCents: savingsCents,
      },
    }
  }

  return { enrichedMatch: {}, suggestion: null }
}

// ---------------------------------------------------------------------------
// Main: optimiseDeductions
// ---------------------------------------------------------------------------

/**
 * Optimise deduction categorisation for reconciliation matches.
 *
 * Takes the reconciliation engine output and enriches each match with
 * ATO-aligned deduction notes and suggestions. Does NOT mutate the
 * original matches — returns enriched copies.
 *
 * @param matches - Reconciliation matches from the 3-pass engine
 * @param transactions - Original bank transactions (for amounts/descriptions)
 * @returns Enriched matches with deduction suggestions
 */
export function optimiseDeductions(
  matches: ReconciliationMatch[],
  transactions: XeroBankTransaction[],
): DeductionOptimisationResult {
  // Build a lookup from bank transaction ID to the original transaction
  const txnLookup = new Map<string, XeroBankTransaction>()
  for (const txn of transactions) {
    txnLookup.set(txn.BankTransactionID, txn)
  }

  const enrichedMatches: ReconciliationMatch[] = []
  const suggestions: DeductionSuggestion[] = []
  let totalDeductibleCents = 0
  let totalNonDeductibleCents = 0

  for (const match of matches) {
    // Create a shallow copy — never mutate the original
    const enriched: ReconciliationMatch = { ...match }

    const txn = txnLookup.get(match.bankTransactionId)
    if (!txn) {
      // No matching transaction found — keep the match as-is
      enrichedMatches.push(enriched)
      if (match.isDeductible) {
        totalDeductibleCents += 0 // Unknown amount
      }
      continue
    }

    const description = getTransactionDescription(txn)
    const amountCents = toCents(txn.Total)
    const absAmountCents = Math.abs(amountCents)

    // Accumulate totals
    if (enriched.isDeductible) {
      totalDeductibleCents += absAmountCents
    } else {
      totalNonDeductibleCents += absAmountCents
    }

    // Only apply deduction rules to expenses (negative amounts / deductible items)
    if (!enriched.isDeductible) {
      enrichedMatches.push(enriched)
      continue
    }

    // Apply deduction rules in priority order (first applicable rule wins for category,
    // but all applicable suggestions are collected)
    let categoryAssigned = false

    // Rule 1: Instant Asset Write-Off
    const assetResult = checkInstantAssetWriteOff(enriched, description, amountCents)
    if (assetResult.suggestion) {
      suggestions.push(assetResult.suggestion)
      if (!categoryAssigned && assetResult.enrichedMatch.deductionCategory) {
        enriched.deductionCategory = assetResult.enrichedMatch.deductionCategory
        enriched.deductionNotes = assetResult.enrichedMatch.deductionNotes ?? enriched.deductionNotes
        categoryAssigned = true
      }
    }

    // Rule 2: Home Office
    const homeResult = checkHomeOfficeDeduction(enriched, description)
    if (homeResult.suggestion) {
      suggestions.push(homeResult.suggestion)
      if (!categoryAssigned) {
        enriched.deductionNotes = homeResult.enrichedMatch.deductionNotes ?? enriched.deductionNotes
      }
    }

    // Rule 3: Motor Vehicle Log Book
    const vehicleResult = checkMotorVehicleLogBook(enriched, description)
    if (vehicleResult.suggestion) {
      suggestions.push(vehicleResult.suggestion)
      if (!categoryAssigned && vehicleResult.enrichedMatch.deductionCategory) {
        enriched.deductionCategory = vehicleResult.enrichedMatch.deductionCategory ?? enriched.deductionCategory
        enriched.deductionNotes = vehicleResult.enrichedMatch.deductionNotes ?? enriched.deductionNotes
        categoryAssigned = true
      }
    }

    // Rule 4: Prepaid Expenses
    const prepaidResult = checkPrepaidExpenses(enriched, description, amountCents)
    if (prepaidResult.suggestion) {
      suggestions.push(prepaidResult.suggestion)
      if (!categoryAssigned && prepaidResult.enrichedMatch.deductionCategory) {
        enriched.deductionCategory = prepaidResult.enrichedMatch.deductionCategory ?? enriched.deductionCategory
        enriched.deductionNotes = prepaidResult.enrichedMatch.deductionNotes ?? enriched.deductionNotes
        categoryAssigned = true
      }
    }

    enrichedMatches.push(enriched)
  }

  return {
    matches: enrichedMatches,
    suggestions,
    totalDeductibleCents,
    totalNonDeductibleCents,
  }
}
