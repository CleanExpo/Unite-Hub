// src/app/api/xero/revenue/route.ts
// GET /api/xero/revenue?business=<key>
// Returns MTD revenue for a business from Xero, falls back to mock data

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchRevenueMTD } from '@/lib/integrations/xero'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'dr'

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const result = await fetchRevenueMTD(user.id, businessKey)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Xero revenue' }, { status: 500 })
  }
}
