// src/lib/coaches/revenue.ts
// Revenue Coach data fetcher — Xero MTD data per business

import type { CoachContext, CoachDataFetcher } from './types'
import { BUSINESSES } from '@/lib/businesses'
import { isXeroConfigured, getMockRevenueMTD } from '@/lib/integrations/xero/client'

export const fetchRevenueData: CoachDataFetcher = async (_founderId: string): Promise<CoachContext> => {
  const reportDate = new Date().toISOString().split('T')[0]

  // Fetch MTD revenue for each active business
  // Note: Real Xero data requires tenant IDs from stored OAuth tokens.
  // When Xero is not configured, we use mock data for development.
  const businessData = await Promise.all(
    BUSINESSES.map(async (biz) => {
      try {
        if (isXeroConfigured()) {
          // TODO: Fetch real Xero data when tenant IDs are available in vault
          // const tokens = await loadXeroTokens(founderId, biz.key)
          // const data = await fetchRevenueMTD(biz.key, tokens.tenantId)
          // For now, fall back to mock data
          return { ...getMockRevenueMTD(biz.key), name: biz.name }
        }
        return { ...getMockRevenueMTD(biz.key), name: biz.name }
      } catch (err) {
        console.warn(`[Revenue Coach] Failed to fetch data for ${biz.key}:`, err)
        return { ...getMockRevenueMTD(biz.key), name: biz.name }
      }
    })
  )

  const totalRevenueCents = businessData.reduce((sum, b) => sum + b.revenueCents, 0)
  const totalExpensesCents = businessData.reduce((sum, b) => sum + b.expensesCents, 0)

  return {
    coachType: 'revenue',
    reportDate,
    data: {
      businesses: businessData.map((b) => ({
        key: b.businessKey,
        name: b.name,
        revenueCents: b.revenueCents,
        expensesCents: b.expensesCents,
        growth: b.growth,
        invoiceCount: b.invoiceCount,
      })),
      totalRevenueCents,
      totalExpensesCents,
      netPositionCents: totalRevenueCents - totalExpensesCents,
      businessCount: businessData.length,
    },
  }
}
