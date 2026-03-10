// src/lib/bookkeeper/reconciliation.ts
// Three-pass reconciliation engine for matching bank transactions to invoices/bills.
// Pass 1: Exact match | Pass 2: Fuzzy match | Pass 3: Rule-based classification.

import type {
  XeroBankTransaction,
  XeroInvoice,
  XeroContact,
} from '@/lib/integrations/xero/types'
import { classifyTransaction, calculateGstAmount } from '@/lib/bookkeeper/au-tax-codes'
import { toCents, parseXeroDate, getBankTransactionDescription } from '@/lib/bookkeeper/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReconciliationMatch {
  bankTransactionId: string
  matchedInvoiceId: string | null
  matchedBillId: string | null
  reconciliationStatus: 'auto_matched' | 'suggested_match' | 'unmatched' | 'manual_review'
  confidence: number
  taxCode: string | null
  taxCategory: string | null
  isDeductible: boolean
  gstAmountCents: number
  deductionCategory: string | null
  deductionNotes: string | null
  reasoning: string
}

export interface ReconciliationResult {
  matches: ReconciliationMatch[]
  summary: {
    total: number
    autoMatched: number
    suggestedMatch: number
    unmatched: number
    manualReview: number
  }
}

// ---------------------------------------------------------------------------
// Helper: Business day calculation
// ---------------------------------------------------------------------------

/**
 * Check if two dates are within N business days (Mon-Fri only).
 * Counts business days between the two dates (exclusive of endpoints),
 * then checks if the count is <= maxDays.
 */
export function isWithinBusinessDays(
  date1: Date,
  date2: Date,
  maxDays: number,
): boolean {
  const start = date1 < date2 ? new Date(date1) : new Date(date2)
  const end = date1 < date2 ? new Date(date2) : new Date(date1)

  // Normalise to midnight to avoid partial-day issues
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  let businessDays = 0
  const current = new Date(start)

  while (current < end) {
    current.setDate(current.getDate() + 1)
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }

  return businessDays <= maxDays
}

// ---------------------------------------------------------------------------
// Helper: Description similarity
// ---------------------------------------------------------------------------

/**
 * Simple word-overlap similarity between a bank description and a contact name.
 * Returns 0.0-1.0 based on what fraction of contact name words appear in
 * the description (case-insensitive).
 *
 * Words shorter than 2 characters are ignored to avoid false positives
 * on common prepositions ("a", "of", etc.)
 */
export function descriptionSimilarity(
  description: string,
  contactName: string,
): number {
  const descWords = new Set(
    description.toLowerCase().split(/\s+/).filter((w) => w.length > 0),
  )
  const contactWords = contactName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2)

  if (contactWords.length === 0) return 0

  let matches = 0
  for (const word of contactWords) {
    if (descWords.has(word)) {
      matches++
    }
  }

  return matches / contactWords.length
}

// ---------------------------------------------------------------------------
// Helper: Duplicate detection
// ---------------------------------------------------------------------------

interface TransactionFingerprint {
  amount: number
  dateStr: string
  description: string
}

/**
 * Check if a transaction appears to be a duplicate of another in the same batch.
 * Two transactions are considered duplicates if they share:
 * - Same absolute amount
 * - Same date
 * - Similar description (similarity >= 0.5)
 */
function isDuplicate(
  txn: TransactionFingerprint,
  others: TransactionFingerprint[],
): boolean {
  for (const other of others) {
    if (
      Math.abs(txn.amount) === Math.abs(other.amount) &&
      txn.dateStr === other.dateStr &&
      txn.description !== other.description &&
      descriptionSimilarity(txn.description, other.description) >= 0.5
    ) {
      return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// Helper: Build contact name lookup
// ---------------------------------------------------------------------------

function buildContactLookup(contacts: XeroContact[]): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const contact of contacts) {
    lookup.set(contact.ContactID, contact.Name)
  }
  return lookup
}

// ---------------------------------------------------------------------------
// Main: reconcileTransactions
// ---------------------------------------------------------------------------

export function reconcileTransactions(
  bankTransactions: XeroBankTransaction[],
  invoices: XeroInvoice[],
  contacts: XeroContact[],
): ReconciliationResult {
  const contactLookup = buildContactLookup(contacts)

  // Filter bank transactions: skip already reconciled ones
  const eligibleTxns = bankTransactions.filter(
    (txn) => !txn.IsReconciled && txn.Status === 'AUTHORISED',
  )

  // Filter invoices: skip paid or zero-balance invoices
  const eligibleInvoices = invoices.filter(
    (inv) => inv.Status !== 'PAID' && inv.Status !== 'VOIDED' && inv.Status !== 'DELETED' && inv.AmountDue !== 0,
  )

  // Build mutable candidate pool (one-to-one matching)
  const invoicePool = new Set(eligibleInvoices.map((inv) => inv.InvoiceID))
  const invoiceById = new Map<string, XeroInvoice>()
  for (const inv of eligibleInvoices) {
    invoiceById.set(inv.InvoiceID, inv)
  }

  const matches: ReconciliationMatch[] = []
  const unmatchedTxnIds = new Set(eligibleTxns.map((t) => t.BankTransactionID))

  // Build fingerprints for duplicate detection
  const fingerprints: TransactionFingerprint[] = eligibleTxns.map((txn) => ({
    amount: txn.Total,
    dateStr: parseXeroDate(txn.Date).toISOString().slice(0, 10),
    description: getBankTransactionDescription(txn).toLowerCase(),
  }))

  // ── Pass 1: Exact Match (confidence 0.95 - 1.00) ──────────────────────

  for (const txn of eligibleTxns) {
    if (!unmatchedTxnIds.has(txn.BankTransactionID)) continue

    const txnAmountCents = toCents(txn.Total)
    const txnDate = parseXeroDate(txn.Date)
    const txnDesc = getBankTransactionDescription(txn).toLowerCase()
    const isCredit = txn.Total > 0

    // Find candidate invoices with exact amount match
    const candidates: XeroInvoice[] = []

    for (const invId of invoicePool) {
      const inv = invoiceById.get(invId)!
      const invAmountCents = toCents(inv.AmountDue)

      // Sign convention:
      // Credits (RECEIVE) match ACCREC invoices (sales)
      // Debits (SPEND) match ACCPAY invoices (bills)
      if (isCredit && inv.Type !== 'ACCREC') continue
      if (!isCredit && inv.Type !== 'ACCPAY') continue

      // Exact amount match (compare absolute cents)
      if (Math.abs(txnAmountCents) !== invAmountCents) continue

      // Date within 5 business days
      const invDate = parseXeroDate(inv.DueDate || inv.Date)
      if (!isWithinBusinessDays(txnDate, invDate, 5)) continue

      candidates.push(inv)
    }

    if (candidates.length === 0) continue

    // Check description match against each candidate
    let bestCandidate: XeroInvoice | null = null
    let bestConfidence = 0
    let bestDateDiff = Infinity

    for (const inv of candidates) {
      const contactName = contactLookup.get(inv.Contact.ContactID) || inv.Contact.Name
      const invNumber = inv.InvoiceNumber || ''
      const invDate = parseXeroDate(inv.DueDate || inv.Date)
      const dateDiff = Math.abs(txnDate.getTime() - invDate.getTime())

      const descContainsContact = contactName.length > 0 &&
        txnDesc.includes(contactName.toLowerCase())
      const descContainsInvoice = invNumber.length > 0 &&
        txnDesc.includes(invNumber.toLowerCase())

      const confidence = (descContainsContact || descContainsInvoice) ? 1.00 : 0.95

      // Pick best: highest confidence first, then closest date
      if (
        confidence > bestConfidence ||
        (confidence === bestConfidence && dateDiff < bestDateDiff)
      ) {
        bestCandidate = inv
        bestConfidence = confidence
        bestDateDiff = dateDiff
      }
    }

    if (bestCandidate) {
      const taxCode = isCredit ? 'OUTPUT' : 'INPUT'
      const gstAmountCents = calculateGstAmount(Math.abs(txnAmountCents), taxCode)

      matches.push({
        bankTransactionId: txn.BankTransactionID,
        matchedInvoiceId: bestCandidate.Type === 'ACCREC' ? bestCandidate.InvoiceID : null,
        matchedBillId: bestCandidate.Type === 'ACCPAY' ? bestCandidate.InvoiceID : null,
        reconciliationStatus: 'auto_matched',
        confidence: bestConfidence,
        taxCode,
        taxCategory: null,
        isDeductible: !isCredit,
        gstAmountCents,
        deductionCategory: null,
        deductionNotes: null,
        reasoning: bestConfidence === 1.00
          ? `Exact amount, date, and description match with ${bestCandidate.Type === 'ACCREC' ? 'invoice' : 'bill'} ${bestCandidate.InvoiceNumber || bestCandidate.InvoiceID}`
          : `Exact amount and date match with ${bestCandidate.Type === 'ACCREC' ? 'invoice' : 'bill'} ${bestCandidate.InvoiceNumber || bestCandidate.InvoiceID} (description did not match contact name)`,
      })

      unmatchedTxnIds.delete(txn.BankTransactionID)
      invoicePool.delete(bestCandidate.InvoiceID)
    }
  }

  // ── Pass 2: Fuzzy Match (confidence 0.70 - 0.94) ──────────────────────

  for (const txn of eligibleTxns) {
    if (!unmatchedTxnIds.has(txn.BankTransactionID)) continue

    const txnAmountCents = toCents(txn.Total)
    const txnDate = parseXeroDate(txn.Date)
    const txnDesc = getBankTransactionDescription(txn).toLowerCase()
    const isCredit = txn.Total > 0

    let bestCandidate: XeroInvoice | null = null
    let bestConfidence = 0
    let bestDateDiff = Infinity
    let bestAmountDiff = Infinity

    for (const invId of invoicePool) {
      const inv = invoiceById.get(invId)!
      const invAmountCents = toCents(inv.AmountDue)

      // Sign convention
      if (isCredit && inv.Type !== 'ACCREC') continue
      if (!isCredit && inv.Type !== 'ACCPAY') continue

      // Amount within 2% tolerance
      const absTxnCents = Math.abs(txnAmountCents)
      const tolerance = Math.abs(invAmountCents) * 0.02
      const amountDiff = Math.abs(absTxnCents - invAmountCents)
      if (amountDiff > tolerance) continue

      // Date within 15 business days
      const invDate = parseXeroDate(inv.DueDate || inv.Date)
      if (!isWithinBusinessDays(txnDate, invDate, 15)) continue

      // Check fuzzy description match
      const contactName = contactLookup.get(inv.Contact.ContactID) || inv.Contact.Name
      const similarity = descriptionSimilarity(txnDesc, contactName)
      const hasDescMatch = similarity > 0

      const confidence = hasDescMatch ? 0.85 : 0.70
      const dateDiff = Math.abs(txnDate.getTime() - invDate.getTime())

      // Pick best: highest confidence, then closest amount, then closest date
      if (
        confidence > bestConfidence ||
        (confidence === bestConfidence && amountDiff < bestAmountDiff) ||
        (confidence === bestConfidence && amountDiff === bestAmountDiff && dateDiff < bestDateDiff)
      ) {
        bestCandidate = inv
        bestConfidence = confidence
        bestDateDiff = dateDiff
        bestAmountDiff = amountDiff
      }
    }

    if (bestCandidate) {
      const taxCode = isCredit ? 'OUTPUT' : 'INPUT'
      const gstAmountCents = calculateGstAmount(Math.abs(txnAmountCents), taxCode)

      matches.push({
        bankTransactionId: txn.BankTransactionID,
        matchedInvoiceId: bestCandidate.Type === 'ACCREC' ? bestCandidate.InvoiceID : null,
        matchedBillId: bestCandidate.Type === 'ACCPAY' ? bestCandidate.InvoiceID : null,
        reconciliationStatus: 'suggested_match',
        confidence: bestConfidence,
        taxCode,
        taxCategory: null,
        isDeductible: !isCredit,
        gstAmountCents,
        deductionCategory: null,
        deductionNotes: null,
        reasoning: bestConfidence === 0.85
          ? `Fuzzy match: amount within 2% tolerance, date within 15 business days, description partially matches contact "${bestCandidate.Contact.Name}"`
          : `Fuzzy match: amount within 2% tolerance and date within 15 business days for ${bestCandidate.Type === 'ACCREC' ? 'invoice' : 'bill'} ${bestCandidate.InvoiceNumber || bestCandidate.InvoiceID} (no description match)`,
      })

      unmatchedTxnIds.delete(txn.BankTransactionID)
      invoicePool.delete(bestCandidate.InvoiceID)
    }
  }

  // ── Pass 3: Rule-Based Classification (confidence 0.50 - 0.69) ─────────

  for (const txn of eligibleTxns) {
    if (!unmatchedTxnIds.has(txn.BankTransactionID)) continue

    const txnAmountCents = toCents(txn.Total)
    const description = getBankTransactionDescription(txn)
    const classification = classifyTransaction(description, txnAmountCents)
    const gstAmountCents = calculateGstAmount(Math.abs(txnAmountCents), classification.taxCode)

    matches.push({
      bankTransactionId: txn.BankTransactionID,
      matchedInvoiceId: null,
      matchedBillId: null,
      reconciliationStatus: 'unmatched',
      confidence: classification.confidence,
      taxCode: classification.taxCode,
      taxCategory: classification.taxCategory,
      isDeductible: classification.isDeductible,
      gstAmountCents,
      deductionCategory: classification.taxCategory,
      deductionNotes: classification.reasoning,
      reasoning: `No invoice match found. Rule-based classification: ${classification.reasoning}`,
    })

    unmatchedTxnIds.delete(txn.BankTransactionID)
  }

  // ── Manual Review Flagging ─────────────────────────────────────────────

  const fingerprintByTxnId = new Map<string, number>()
  for (let i = 0; i < eligibleTxns.length; i++) {
    fingerprintByTxnId.set(eligibleTxns[i].BankTransactionID, i)
  }

  for (const match of matches) {
    const txnIdx = fingerprintByTxnId.get(match.bankTransactionId)
    if (txnIdx === undefined) continue

    const txn = eligibleTxns[txnIdx]
    const fp = fingerprints[txnIdx]
    const absAmountCents = Math.abs(toCents(txn.Total))

    let needsManualReview = false

    // Rule 1: Large transactions (> $5,000 AUD = 500000 cents)
    if (absAmountCents > 500000) {
      needsManualReview = true
    }

    // Rule 2: Low confidence with no classification
    if (match.confidence < 0.70 && !match.taxCategory) {
      needsManualReview = true
    }

    // Rule 3: Duplicate detection
    const otherFingerprints = fingerprints.filter((_, i) => i !== txnIdx)
    if (isDuplicate(fp, otherFingerprints)) {
      needsManualReview = true
    }

    if (needsManualReview) {
      match.reconciliationStatus = 'manual_review'
      if (absAmountCents > 500000) {
        match.reasoning += ' | Flagged for manual review: transaction exceeds $5,000 AUD'
      }
    }
  }

  // ── Build summary ──────────────────────────────────────────────────────

  const summary = {
    total: matches.length,
    autoMatched: matches.filter((m) => m.reconciliationStatus === 'auto_matched').length,
    suggestedMatch: matches.filter((m) => m.reconciliationStatus === 'suggested_match').length,
    unmatched: matches.filter((m) => m.reconciliationStatus === 'unmatched').length,
    manualReview: matches.filter((m) => m.reconciliationStatus === 'manual_review').length,
  }

  return { matches, summary }
}
