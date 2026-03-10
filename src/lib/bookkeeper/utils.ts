// src/lib/bookkeeper/utils.ts
// Shared utility helpers for the bookkeeper pipeline.
// Extracted from reconciliation.ts, deduction-optimiser.ts, and bas-calculator.ts
// to eliminate DRY violations across the bookkeeper module.

import type { XeroBankTransaction } from '@/lib/integrations/xero/types'

// ---------------------------------------------------------------------------
// Currency conversion
// ---------------------------------------------------------------------------

/**
 * Convert a dollar amount to cents (rounded to avoid floating-point drift).
 * All monetary values in the bookkeeper pipeline are stored in cents
 * to avoid floating-point precision issues.
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

// ---------------------------------------------------------------------------
// Xero date parser
// ---------------------------------------------------------------------------

/**
 * Parse a Xero date string into a JS Date.
 * Handles both ISO format ("2026-03-01T00:00:00") and the legacy
 * /Date(...)/ format that Xero sometimes returns.
 */
export function parseXeroDate(dateStr: string): Date {
  // Handle /Date(1234567890000+0000)/ format
  const msMatch = dateStr.match(/\/Date\((\d+)([+-]\d{4})?\)\//)
  if (msMatch) {
    return new Date(parseInt(msMatch[1], 10))
  }
  return new Date(dateStr)
}

// ---------------------------------------------------------------------------
// Bank transaction description builder
// ---------------------------------------------------------------------------

/**
 * Build a combined description string from a bank transaction.
 * Concatenates the reference, contact name, and all line item descriptions
 * into a single searchable string for matching and classification.
 */
export function getBankTransactionDescription(txn: XeroBankTransaction): string {
  const parts: string[] = []
  if (txn.Reference) parts.push(txn.Reference)
  if (txn.Contact?.Name) parts.push(txn.Contact.Name)
  for (const li of txn.LineItems) {
    if (li.Description) parts.push(li.Description)
  }
  return parts.join(' ')
}
