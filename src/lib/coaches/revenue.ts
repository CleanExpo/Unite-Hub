// src/lib/coaches/revenue.ts
// Revenue Coach data fetcher — Xero MTD data per business

import type { CoachContext, CoachDataFetcher } from './types'
import { BUSINESSES } from '@/lib/businesses'
import { fetchRevenueMTD, getMockRevenueMTD } from '@/lib/integrations/xero/client'

export const fetchRevenueData: CoachDataFetcher = async (founderId: string): Promise<CoachContext> => {
  const reportDate = new Date().toISOString().split('T')[0]

  // Fetch MTD revenue for each active business.
  // fetchRevenueMTD() handles token loading, P&L API call, and mock fallback
  // — so a missing/expired token for one business won't fail the entire run.
  const businessData = await Promise.all(
    BUSINESSES.map(async (biz) => {
      try {
        const { data } = await fetchRevenueMTD(founderId, biz.key)
        return { ...data, name: biz.name }
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
