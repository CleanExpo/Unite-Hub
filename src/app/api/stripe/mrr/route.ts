// src/app/api/stripe/mrr/route.ts
// GET /api/stripe/mrr?business=<key>
// Returns MRR data for a business from Stripe, falls back to mock data

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchMRR, isStripeConfigured } from '@/lib/integrations/stripe'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'synthex'

  try {
    const data = await fetchMRR(businessKey)
    return NextResponse.json({
      data,
      configured: isStripeConfigured(businessKey),
      source: isStripeConfigured(businessKey) ? 'stripe' : 'mock',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MRR data' }, { status: 500 })
  }
}
