// src/app/api/stripe/mrr/route.ts
import { NextResponse } from 'next/server'
import { fetchMRR, isStripeConfigured } from '@/lib/integrations/stripe'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'synthex'

  try {
    const data = await fetchMRR(businessKey)
    return NextResponse.json({
      data,
      configured: isStripeConfigured(),
      source: isStripeConfigured() ? 'stripe' : 'mock',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MRR data' }, { status: 500 })
  }
}
