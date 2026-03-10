// src/lib/bookkeeper/bas-calculator.ts
// GST aggregation engine for BAS (Business Activity Statement) reporting.
// Calculates Label 1A, 1B, 7, 9, and 11 from reconciliation results.
// Aligned to Australian FY quarters (Jul-Jun).

import type { XeroBankTransaction } from '@/lib/integrations/xero/types'
import type { ReconciliationMatch } from '@/lib/bookkeeper/reconciliation'
import { AU_TAX_CODES } from '@/lib/bookkeeper/au-tax-codes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BASPeriod {
  startDate: Date
  endDate: Date
  label: string
}

export interface BASCalculation {
  period: BASPeriod
  // Core BAS labels
  label1A_totalSalesCents: number
  label1B_gstOnSalesCents: number
  label7_totalPurchasesCents: number
  label9_gstOnPurchasesCents: number
  label11_gstPayableCents: number
  // Supporting data
  transactionCount: number
  gstFreeIncomeCents: number
  gstFreeExpensesCents: number
  basExcludedCents: number
  inputTaxedCents: number
  // Breakdown by tax code
  breakdownByTaxCode: Record<string, { count: number; totalCents: number; gstCents: number }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a dollar amount to cents (rounded to avoid floating-point drift).
 */
function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Get the Australian financial year for a given date.
 * The Australian FY runs 1 July to 30 June.
 * FY2025-26 = 01/07/2025 to 30/06/2026.
 *
 * @returns The start year of the FY (e.g. 2025 for FY2025-26)
 */
function getFinancialYearStart(date: Date): number {
  const month = date.getMonth() // 0-indexed (0=Jan, 6=Jul)
  const year = date.getFullYear()
  // Jul-Dec belong to the FY that started this year
  // Jan-Jun belong to the FY that started last year
  return month >= 6 ? year : year - 1
}

/**
 * Get the BAS quarter number (1-4) for a given date.
 * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
 */
function getQuarterNumber(date: Date): number {
  const month = date.getMonth() // 0-indexed
  if (month >= 6 && month <= 8) return 1  // Jul-Sep
  if (month >= 9 && month <= 11) return 2 // Oct-Dec
  if (month >= 0 && month <= 2) return 3  // Jan-Mar
  return 4                                 // Apr-Jun
}

/**
 * Quarter label text mapping.
 */
const QUARTER_LABELS: Record<number, string> = {
  1: 'Jul-Sep',
  2: 'Oct-Dec',
  3: 'Jan-Mar',
  4: 'Apr-Jun',
}

/**
 * Get the start month (0-indexed) for a given quarter.
 */
function getQuarterStartMonth(quarter: number): number {
  switch (quarter) {
    case 1: return 6   // July
    case 2: return 9   // October
    case 3: return 0   // January
    case 4: return 3   // April
    default: return 0
  }
}

/**
 * Get the end month (0-indexed) for a given quarter.
 */
function getQuarterEndMonth(quarter: number): number {
  switch (quarter) {
    case 1: return 8   // September
    case 2: return 11  // December
    case 3: return 2   // March
    case 4: return 5   // June
    default: return 2
  }
}

// ---------------------------------------------------------------------------
// Public: getFinancialYearQuarter
// ---------------------------------------------------------------------------

/**
 * Get the BAS reporting period (quarterly) for a given date.
 *
 * Australian FY runs Jul-Jun:
 * - Q1: Jul-Sep
 * - Q2: Oct-Dec
 * - Q3: Jan-Mar
 * - Q4: Apr-Jun
 *
 * @param date - Any date within the desired quarter
 * @returns The BAS period covering that quarter
 */
export function getFinancialYearQuarter(date: Date): BASPeriod {
  const fyStart = getFinancialYearStart(date)
  const quarter = getQuarterNumber(date)
  const fyEnd = fyStart + 1

  const startMonth = getQuarterStartMonth(quarter)
  const endMonth = getQuarterEndMonth(quarter)

  // Determine the calendar year for start and end of the quarter
  const startYear = quarter <= 2 ? fyStart : fyEnd
  const endYear = quarter <= 2 ? fyStart : fyEnd

  const startDate = new Date(startYear, startMonth, 1)
  // End date is the last day of the end month
  const endDate = new Date(endYear, endMonth + 1, 0) // Day 0 of next month = last day of current month

  const label = `Q${quarter} FY${fyStart}-${String(fyEnd).slice(2)} (${QUARTER_LABELS[quarter]} ${endYear})`

  return { startDate, endDate, label }
}

// ---------------------------------------------------------------------------
// Public: generateBASPeriods
// ---------------------------------------------------------------------------

/**
 * Generate all quarterly BAS periods between two dates.
 * Returns periods that overlap with the given date range,
 * starting from the quarter containing startDate through
 * the quarter containing endDate.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of BAS periods covering the range
 */
export function generateBASPeriods(startDate: Date, endDate: Date): BASPeriod[] {
  if (endDate < startDate) return []

  const periods: BASPeriod[] = []
  const seen = new Set<string>()

  // Start from the quarter containing startDate
  let current = new Date(startDate)

  while (current <= endDate) {
    const period = getFinancialYearQuarter(current)
    const key = period.label

    if (!seen.has(key)) {
      seen.add(key)
      periods.push(period)
    }

    // Advance to the first day of the next quarter
    const quarter = getQuarterNumber(current)
    const nextQuarterStartMonth = getQuarterStartMonth(quarter === 4 ? 1 : quarter + 1)

    if (quarter === 2) {
      // After Q2 (Oct-Dec), next is Q3 (Jan of next calendar year)
      current = new Date(current.getFullYear() + 1, nextQuarterStartMonth, 1)
    } else if (quarter === 4) {
      // After Q4 (Apr-Jun), next is Q1 (Jul of same calendar year)
      current = new Date(current.getFullYear(), nextQuarterStartMonth, 1)
    } else {
      // Q1 -> Q2, Q3 -> Q4: same calendar year
      current = new Date(current.getFullYear(), nextQuarterStartMonth, 1)
    }
  }

  return periods
}

// ---------------------------------------------------------------------------
// Public: calculateBAS
// ---------------------------------------------------------------------------

/**
 * Calculate BAS (Business Activity Statement) labels from reconciliation
 * results for a given reporting period.
 *
 * BAS Label definitions:
 * - 1A: Total sales (GST-inclusive) — OUTPUT and EXEMPTOUTPUT transactions
 * - 1B: GST on sales — from OUTPUT transactions (GST collected)
 * - 7:  Total purchases (GST-inclusive) — INPUT, EXEMPTINPUT, INPUTTAXED transactions
 * - 9:  GST on purchases — from INPUT transactions (GST paid)
 * - 11: GST payable = 1B - 9 (positive = owe ATO, negative = refund)
 *
 * @param matches - Reconciliation matches from the 3-pass engine
 * @param transactions - Original bank transactions (for amounts/dates)
 * @param period - BAS reporting period to calculate for
 * @returns BAS calculation with all labels and breakdowns
 */
export function calculateBAS(
  matches: ReconciliationMatch[],
  transactions: XeroBankTransaction[],
  period: BASPeriod,
): BASCalculation {
  // Build transaction lookup
  const txnLookup = new Map<string, XeroBankTransaction>()
  for (const txn of transactions) {
    txnLookup.set(txn.BankTransactionID, txn)
  }

  // Initialise accumulators
  let label1A = 0
  let label1B = 0
  let label7 = 0
  let label9 = 0
  let transactionCount = 0
  let gstFreeIncomeCents = 0
  let gstFreeExpensesCents = 0
  let basExcludedCents = 0
  let inputTaxedCents = 0

  const breakdownByTaxCode: Record<string, { count: number; totalCents: number; gstCents: number }> = {}

  // Normalise period boundaries to midnight for comparison
  const periodStart = new Date(period.startDate)
  periodStart.setHours(0, 0, 0, 0)

  const periodEnd = new Date(period.endDate)
  periodEnd.setHours(23, 59, 59, 999)

  for (const match of matches) {
    const txn = txnLookup.get(match.bankTransactionId)
    if (!txn) continue

    // Parse and check date is within the BAS period
    const txnDate = parseTransactionDate(txn.Date)
    if (txnDate < periodStart || txnDate > periodEnd) continue

    const taxCode = match.taxCode || ''
    const taxCodeDef = AU_TAX_CODES[taxCode]

    // Skip non-BAS-reportable tax codes
    if (taxCodeDef && !taxCodeDef.basReportable) {
      const absAmount = Math.abs(toCents(txn.Total))
      basExcludedCents += absAmount
      // Still count in breakdown
      updateBreakdown(breakdownByTaxCode, taxCode, absAmount, 0)
      transactionCount++
      continue
    }

    const amountCents = toCents(txn.Total)
    const absAmountCents = Math.abs(amountCents)
    const gstCents = Math.abs(match.gstAmountCents)

    transactionCount++

    // Update tax code breakdown
    updateBreakdown(breakdownByTaxCode, taxCode, absAmountCents, gstCents)

    // Classify into BAS labels based on tax code
    switch (taxCode) {
      case 'OUTPUT':
        // Sales with GST — contributes to 1A (total sales) and 1B (GST on sales)
        label1A += absAmountCents
        label1B += gstCents
        break

      case 'EXEMPTOUTPUT':
      case 'EXEMPTEXPORT':
        // GST-free income — contributes to 1A (total sales) but no GST
        label1A += absAmountCents
        gstFreeIncomeCents += absAmountCents
        break

      case 'INPUT':
      case 'GSTONIMPORTS':
        // Purchases with GST — contributes to 7 (total purchases) and 9 (GST on purchases)
        label7 += absAmountCents
        label9 += gstCents
        break

      case 'EXEMPTINPUT':
        // GST-free expenses — contributes to 7 (total purchases) but no GST
        label7 += absAmountCents
        gstFreeExpensesCents += absAmountCents
        break

      case 'INPUTTAXED':
        // Input taxed — contributes to 7 (total purchases) but no GST claimable
        label7 += absAmountCents
        inputTaxedCents += absAmountCents
        break

      default:
        // Unknown tax code — do not include in BAS labels
        break
    }
  }

  // Label 11: Net GST payable = GST collected - GST paid
  // Positive = owe ATO, negative = refund due
  const label11 = label1B - label9

  return {
    period,
    label1A_totalSalesCents: label1A,
    label1B_gstOnSalesCents: label1B,
    label7_totalPurchasesCents: label7,
    label9_gstOnPurchasesCents: label9,
    label11_gstPayableCents: label11,
    transactionCount,
    gstFreeIncomeCents,
    gstFreeExpensesCents,
    basExcludedCents,
    inputTaxedCents,
    breakdownByTaxCode,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse a Xero date string into a JS Date.
 * Handles both ISO format and the legacy /Date(...)/ format.
 */
function parseTransactionDate(dateStr: string): Date {
  const msMatch = dateStr.match(/\/Date\((\d+)([+-]\d{4})?\)\//)
  if (msMatch) {
    return new Date(parseInt(msMatch[1], 10))
  }
  return new Date(dateStr)
}

/**
 * Update the breakdown-by-tax-code accumulator.
 */
function updateBreakdown(
  breakdown: Record<string, { count: number; totalCents: number; gstCents: number }>,
  taxCode: string,
  totalCents: number,
  gstCents: number,
): void {
  if (!breakdown[taxCode]) {
    breakdown[taxCode] = { count: 0, totalCents: 0, gstCents: 0 }
  }
  breakdown[taxCode].count++
  breakdown[taxCode].totalCents += totalCents
  breakdown[taxCode].gstCents += gstCents
}
