// src/lib/advisory/xero-bridge.ts
// Maps MACAS advisory Strategy actions to Xero ManualJournal line items
// and posts them when Xero is connected for the given business.
//
// Design contract:
//   - Never throws — all errors are caught and returned as advisory_only
//   - "Xero not connected" is NOT an error — it returns advisory_only with a message
//   - Auth: caller must supply a valid founderId (server-side, post-auth)

import type { Strategy } from '@/lib/advisory/types'
import {
  loadXeroTokens,
  getValidXeroToken,
  saveXeroTokens,
  xeroApiFetch,
} from '@/lib/integrations/xero/client'
import { DEDUCTION_CATEGORIES } from '@/lib/bookkeeper/au-tax-codes'

// ── Result type ──────────────────────────────────────────────────────────────

export interface XeroBridgeResult {
  xeroEntryId: string | null
  status: 'xero_posted' | 'advisory_only'
  message: string
}

// ── Xero ManualJournal types (not in xero/types.ts — local to this module) ──

interface XeroManualJournalLine {
  LineAmount: number          // positive = debit, negative = credit
  AccountCode: string
  Description: string
  TaxType?: string            // Xero tax type code (e.g. 'INPUT', 'BASEXCLUDED')
}

interface XeroManualJournalPayload {
  Narration: string
  JournalLines: XeroManualJournalLine[]
  Date?: string               // ISO date YYYY-MM-DD
  Status?: 'DRAFT' | 'POSTED'
  ShowOnCashBasisReports?: boolean
}

interface XeroManualJournalResponse {
  ManualJournals?: Array<{ ManualJournalID: string }>
}

// ── Account code mapping ─────────────────────────────────────────────────────
// Maps MACAS strategy risk levels and deduction categories to standard
// Xero AU chart of accounts codes. These are the default codes Xero assigns
// when creating a new AU organisation (Xero COA 2024).

const RISK_LEVEL_ACCOUNT_CODES: Record<string, string> = {
  low:      '200',   // Sales / Revenue
  medium:   '400',   // Operating Expenses (catch-all)
  high:     '404',   // Consultant & Contractors
  critical: '404',   // Consultant & Contractors (flag for review)
}

const DEDUCTION_CATEGORY_ACCOUNT_CODES: Record<string, string> = {
  motor_vehicle:         '489',   // Motor Vehicle Expenses
  travel:                '493',   // Travel — National
  professional_services: '404',   // Consultant & Contractors
  insurance:             '485',   // Insurance
  office_supplies:       '460',   // Office Expenses
  phone_internet:        '461',   // Telephone & Internet
  repairs_maintenance:   '481',   // Repairs and Maintenance
  instant_asset_writeoff:'720',   // Capital Expenditure (IAWO)
  super_contributions:   '820',   // Superannuation
  wages_salaries:        '477',   // Wages and Salaries
  contractors:           '404',   // Consultant & Contractors
  advertising_marketing: '400',   // Advertising & Marketing
  training_education:    '494',   // Training
  subscriptions:         '460',   // Office Expenses (subscriptions)
  interest_charges:      '504',   // Interest Expense
  bank_fees:             '404',   // Bank Charges (mapped to expenses)
}

/** Default suspense / clearing account when no mapping can be determined */
const SUSPENSE_ACCOUNT_CODE = '877'   // Suspense Account

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Derive a Xero account code from a strategy's title and risk level. */
function resolveAccountCode(strategy: Strategy): string {
  const titleNormalised = strategy.title.toLowerCase()

  // Walk DEDUCTION_CATEGORIES keys — match against strategy title keywords
  for (const [catKey, catMeta] of Object.entries(DEDUCTION_CATEGORIES)) {
    const keywords = catMeta.name.toLowerCase().split(/\s+/)
    if (keywords.some(kw => kw.length > 3 && titleNormalised.includes(kw))) {
      const code = DEDUCTION_CATEGORY_ACCOUNT_CODES[catKey]
      if (code) return code
    }
  }

  return RISK_LEVEL_ACCOUNT_CODES[strategy.riskLevel] ?? SUSPENSE_ACCOUNT_CODE
}

/** Convert cents to dollars (Xero API uses dollars, not cents). */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100
}

/**
 * Build a balanced ManualJournal from strategies:
 *   - Debit the appropriate expense/asset account for each strategy
 *   - Credit the same amount to the suspense/advisory clearing account
 *
 * A ManualJournal in Xero MUST balance to zero
 * (sum of all LineAmounts = 0).
 */
function buildJournalLines(
  strategies: Strategy[],
  narration: string
): XeroManualJournalLine[] {
  const lines: XeroManualJournalLine[] = []
  let totalDollars = 0

  for (const strategy of strategies) {
    if (!strategy.estimatedSavingsAud || strategy.estimatedSavingsAud <= 0) continue

    const accountCode = resolveAccountCode(strategy)
    const amount = strategy.estimatedSavingsAud  // already in AUD dollars from the type
    totalDollars += amount

    // Debit expense/asset account
    lines.push({
      LineAmount: amount,
      AccountCode: accountCode,
      Description: `Advisory: ${strategy.title}`.slice(0, 255),
      TaxType: strategy.riskLevel === 'critical' ? 'BASEXCLUDED' : 'INPUT',
    })
  }

  if (lines.length === 0) return []

  // Credit the advisory clearing / suspense account to balance the journal
  lines.push({
    LineAmount: -totalDollars,
    AccountCode: SUSPENSE_ACCOUNT_CODE,
    Description: `Advisory clearing — ${narration}`.slice(0, 255),
    TaxType: 'BASEXCLUDED',
  })

  return lines
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Execute an advisory verdict by posting a ManualJournal to Xero.
 *
 * @param verdictId   - advisory_cases.id (used in narration)
 * @param strategies  - Winning firm's strategies from FirmProposalData
 * @param businessKey - Business key (maps to vault credentials)
 * @param founderId   - Authenticated founder's user ID
 */
export async function executeAdvisoryAction(
  verdictId: string,
  strategies: Strategy[],
  businessKey: string,
  founderId: string
): Promise<XeroBridgeResult> {
  // ── Gate 1: Xero env credentials present ──────────────────────────────────
  const hasXeroEnv = Boolean(
    process.env.XERO_CLIENT_ID || process.env.DR_CLIENT_ID
  )
  if (!hasXeroEnv) {
    return {
      xeroEntryId: null,
      status: 'advisory_only',
      message: 'Xero not configured — advisory verdict logged only',
    }
  }

  // ── Gate 2: Vault token for this business ─────────────────────────────────
  let tokens
  try {
    const stored = await loadXeroTokens(founderId, businessKey)
    if (!stored) {
      return {
        xeroEntryId: null,
        status: 'advisory_only',
        message: `Xero not connected for "${businessKey}" — advisory verdict logged only`,
      }
    }
    tokens = await getValidXeroToken(stored, businessKey)
    // Persist refreshed token if it changed (rotating refresh tokens)
    if (tokens.access_token !== stored.access_token) {
      await saveXeroTokens(founderId, businessKey, tokens)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      xeroEntryId: null,
      status: 'advisory_only',
      message: `Xero token load failed — ${message}`,
    }
  }

  // ── Gate 3: Build journal lines ───────────────────────────────────────────
  const narration = `MACAS Advisory — Verdict ${verdictId.slice(0, 8)}`
  const journalLines = buildJournalLines(strategies, narration)

  if (journalLines.length === 0) {
    return {
      xeroEntryId: null,
      status: 'advisory_only',
      message: 'No strategies with positive estimated savings — journal entry skipped',
    }
  }

  // ── Gate 4: Post to Xero ──────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const payload: { ManualJournals: XeroManualJournalPayload[] } = {
    ManualJournals: [
      {
        Narration: narration,
        JournalLines: journalLines,
        Date: today,
        Status: 'DRAFT',             // DRAFT so accountant can review before posting
        ShowOnCashBasisReports: false,
      },
    ],
  }

  try {
    const response = await xeroApiFetch<XeroManualJournalResponse>(
      tokens,
      '/ManualJournals',
      { method: 'PUT', body: payload }
    )

    const entryId = response.ManualJournals?.[0]?.ManualJournalID ?? null
    if (!entryId) {
      return {
        xeroEntryId: null,
        status: 'advisory_only',
        message: 'Xero responded OK but returned no ManualJournalID — advisory_only fallback',
      }
    }

    return {
      xeroEntryId: entryId,
      status: 'xero_posted',
      message: `Xero manual journal created (DRAFT) — ID: ${entryId}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      xeroEntryId: null,
      status: 'advisory_only',
      message: `Xero journal post failed — ${message}`,
    }
  }
}
