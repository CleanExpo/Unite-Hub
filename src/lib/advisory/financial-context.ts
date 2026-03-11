// src/lib/advisory/financial-context.ts
// Collects and summarises financial data from Xero + bookkeeper for agent prompts.
// Outputs a token-efficient FinancialContext (~2K tokens) with NO PII or raw bank details.

import type { FinancialContext } from './types'
import type { BusinessKey } from '@/lib/businesses'
import { BUSINESSES } from '@/lib/businesses'
import { isXeroConfigured } from '@/lib/integrations/xero/client'

/**
 * Build a financial context snapshot for a business.
 * Pulls live data from Xero + bookkeeper when available,
 * falls back to neutral placeholders when not connected.
 */
export async function collectFinancialContext(
  founderId: string,
  businessKey: BusinessKey
): Promise<FinancialContext> {
  const business = BUSINESSES.find(b => b.key === businessKey)
  const context: FinancialContext = {
    businessKey,
    businessName: business?.name ?? businessKey,
    snapshotDate: new Date().toISOString(),
  }

  if (!isXeroConfigured()) return context

  // Collect data in parallel — each source is non-fatal
  const [revenueResult, transactionsResult, deductionsResult] = await Promise.allSettled([
    collectRevenue(founderId, businessKey),
    collectRecentTransactions(founderId, businessKey),
    collectDeductions(founderId),
  ])

  if (revenueResult.status === 'fulfilled' && revenueResult.value) {
    context.revenue = revenueResult.value
  }

  if (transactionsResult.status === 'fulfilled' && transactionsResult.value) {
    context.recentTransactions = transactionsResult.value
  }

  if (deductionsResult.status === 'fulfilled' && deductionsResult.value) {
    context.deductions = deductionsResult.value
  }

  return context
}

// ── Revenue from Xero P&L ───────────────────────────────────────────────────

async function collectRevenue(
  founderId: string,
  businessKey: string
): Promise<FinancialContext['revenue'] | null> {
  try {
    const { fetchRevenueMTD } = await import('@/lib/integrations/xero/client')
    const { data, source } = await fetchRevenueMTD(founderId, businessKey)

    if (source === 'mock') return null

    return {
      mtdCents: data.revenueCents,
      expensesCents: data.expensesCents,
      growthPercent: data.growth,
      invoiceCount: data.invoiceCount,
    }
  } catch {
    return null
  }
}

// ── Recent transactions (summarised, no PII) ────────────────────────────────

async function collectRecentTransactions(
  founderId: string,
  businessKey: string
): Promise<FinancialContext['recentTransactions'] | null> {
  try {
    const { fetchBankTransactions } = await import('@/lib/integrations/xero/client')
    const result = await fetchBankTransactions(founderId, businessKey, {
      page: 1,
    })

    if (!result.items.length) return null

    // Summarise: take latest 20 transactions, strip PII
    return result.items.slice(0, 20).map(tx => ({
      date: tx.Date ?? '',
      description: sanitiseDescription(tx.Contact?.Name ?? '', tx.Reference ?? ''),
      amountCents: Math.round((tx.Total ?? 0) * 100),
      category: tx.LineItems?.[0]?.AccountCode ?? null,
    }))
  } catch {
    return null
  }
}

// ── Deduction summary from bookkeeper DB ────────────────────────────────────

async function collectDeductions(
  founderId: string
): Promise<FinancialContext['deductions'] | null> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/service')
    const supabase = createServiceClient()

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const cutoff = twelveMonthsAgo.toISOString().slice(0, 10)

    // Get deductible transactions grouped by category
    const { data, error } = await supabase
      .from('bookkeeper_transactions')
      .select('deduction_category, amount_cents')
      .eq('founder_id', founderId)
      .eq('is_deductible', true)
      .gte('transaction_date', cutoff)

    if (error || !data?.length) return null

    const categoryMap = new Map<string, { amountCents: number; count: number }>()
    let totalDeductibleCents = 0

    for (const row of data) {
      const cat = row.deduction_category ?? 'uncategorised'
      const amt = Math.abs(Number(row.amount_cents))
      totalDeductibleCents += amt

      const existing = categoryMap.get(cat) ?? { amountCents: 0, count: 0 }
      categoryMap.set(cat, {
        amountCents: existing.amountCents + amt,
        count: existing.count + 1,
      })
    }

    return {
      totalDeductibleCents,
      categories: Array.from(categoryMap.entries()).map(([category, { amountCents, count }]) => ({
        category,
        amountCents,
        count,
      })),
    }
  } catch {
    return null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sanitise transaction descriptions for agent consumption.
 * Remove potential PII (account numbers, phone numbers) while keeping useful context.
 */
function sanitiseDescription(contactName: string, reference: string): string {
  const raw = [contactName, reference].filter(Boolean).join(' — ')
  // Strip patterns that look like account/phone numbers
  return raw.replace(/\b\d{6,}\b/g, '[REDACTED]').trim() || 'Transaction'
}
