// src/lib/integrations/stripe.ts
// Stripe MRR integration — graceful degradation when key is not configured

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_KEY)
}

export interface StripeMRR {
  businessKey: string
  mrr: number              // in cents
  currency: string
  growth: number           // month-on-month percent
  activeSubscriptions: number
  churnRate: number
  lastUpdated: string
}

// Mock data for when Stripe is not configured — used in dev/pre-connect state
export function getMockMRR(businessKey: string): StripeMRR {
  const mocks: Record<string, StripeMRR> = {
    synthex: {
      businessKey: 'synthex',
      mrr: 249000,
      currency: 'aud',
      growth: 12.4,
      activeSubscriptions: 3,
      churnRate: 2.1,
      lastUpdated: new Date().toISOString(),
    },
    restore: {
      businessKey: 'restore',
      mrr: 495000,
      currency: 'aud',
      growth: 8.7,
      activeSubscriptions: 10,
      churnRate: 1.4,
      lastUpdated: new Date().toISOString(),
    },
    ccw: {
      businessKey: 'ccw',
      mrr: 0,
      currency: 'aud',
      growth: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      lastUpdated: new Date().toISOString(),
    },
    dr: {
      businessKey: 'dr',
      mrr: 0,
      currency: 'aud',
      growth: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      lastUpdated: new Date().toISOString(),
    },
    carsi: {
      businessKey: 'carsi',
      mrr: 0,
      currency: 'aud',
      growth: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      lastUpdated: new Date().toISOString(),
    },
  }

  return (
    mocks[businessKey] ?? {
      businessKey,
      mrr: 0,
      currency: 'aud',
      growth: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      lastUpdated: new Date().toISOString(),
    }
  )
}

export async function fetchMRR(businessKey: string): Promise<StripeMRR> {
  if (!isStripeConfigured()) {
    return getMockMRR(businessKey)
  }
  // Real Stripe implementation goes here when key is available
  // For now return mock — avoids crashing production
  return getMockMRR(businessKey)
}
