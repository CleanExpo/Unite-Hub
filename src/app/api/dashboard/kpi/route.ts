// src/app/api/dashboard/kpi/route.ts
// GET /api/dashboard/kpi
// Batch endpoint — fetches Xero revenue + Linear issues for ALL businesses in one request.
// Replaces 16 individual API calls (8 Xero + 8 Linear) with a single round-trip.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchRevenueMTD } from '@/lib/integrations/xero'
import { fetchIssueCountByBusiness } from '@/lib/integrations/linear'

export const dynamic = 'force-dynamic'

/** Business keys that have Xero connections */
const XERO_KEYS = ['dr', 'dr_qld', 'nrpg', 'carsi', 'restore', 'synthex', 'ccw'] as const
/** All business keys tracked in Linear */
const LINEAR_KEYS = ['dr', 'dr_qld', 'nrpg', 'carsi', 'restore', 'synthex', 'ato', 'ccw'] as const

export interface BatchKPIEntry {
  revenueCents?: number
  growth?: number
  invoiceCount?: number
  activeIssues?: number
  source?: 'xero' | 'mock'
}

export interface BatchKPIResponse {
  kpis: Record<string, BatchKPIEntry>
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch Xero revenue for all businesses + Linear counts in parallel
  const [xeroResults, linearCounts] = await Promise.all([
    Promise.allSettled(
      XERO_KEYS.map(async (key) => {
        const result = await fetchRevenueMTD(user.id, key)
        return { key, ...result }
      })
    ),
    fetchIssueCountByBusiness().catch(() => ({} as Record<string, number>)),
  ])

  const kpis: Record<string, BatchKPIEntry> = {}

  // Initialise all Linear keys with empty entries
  for (const key of LINEAR_KEYS) {
    kpis[key] = {}
  }

  // Merge Xero results (partial success — fulfilled entries only)
  for (const result of xeroResults) {
    if (result.status === 'fulfilled') {
      const { key, data, source } = result.value
      kpis[key] = {
        ...kpis[key],
        revenueCents: data.revenueCents,
        growth: data.growth,
        invoiceCount: data.invoiceCount,
        source,
      }
    }
  }

  // Merge Linear issue counts
  for (const key of LINEAR_KEYS) {
    const count = linearCounts[key]
    if (count !== undefined) {
      kpis[key] = { ...kpis[key], activeIssues: count }
    }
  }

  return NextResponse.json({ kpis } satisfies BatchKPIResponse)
}
