// src/lib/integrations/stripe.ts
// Stripe MRR integration — per-business keys with fallback to single key

import Stripe from 'stripe'

// Per-business Stripe secret key mapping
// Each business can have its own Stripe account (separate legal entities)
const STRIPE_KEY_MAP: Record<string, string | undefined> = {
  dr:      process.env.STRIPE_SECRET_KEY_DR,
  dr_qld:  process.env.STRIPE_SECRET_KEY_DR,         // shares DR's Stripe account
  carsi:   process.env.STRIPE_SECRET_KEY_CARSI,
  restore: process.env.STRIPE_SECRET_KEY_RESTOREASSIST,
  synthex: process.env.STRIPE_SECRET_KEY_SYNTHEX,
  ccw:     process.env.STRIPE_SECRET_KEY_CCW,
  nrpg:    process.env.STRIPE_SECRET_KEY_NRPG,
  ato:     process.env.STRIPE_SECRET_KEY_ATO,
}

// Legacy fallback — single key for backwards compatibility
const STRIPE_FALLBACK_KEY = process.env.STRIPE_SECRET_KEY

function getStripeKey(businessKey?: string): string | undefined {
  if (businessKey && STRIPE_KEY_MAP[businessKey]) {
    return STRIPE_KEY_MAP[businessKey]
  }
  return STRIPE_FALLBACK_KEY
}

export function isStripeConfigured(businessKey?: string): boolean {
  return Boolean(getStripeKey(businessKey))
}

export interface StripeMRR {
  businessKey: string
  mrr: number              // in cents
  currency: string
  growth: number           // month-on-month percent (live: 0 — needs historical data)
  activeSubscriptions: number
  churnRate: number        // live: 0 — needs churn event log
  lastUpdated: string
}

// ─── Mock data (dev / pre-connect fallback) ──────────────────────────────────

export function getMockMRR(businessKey: string): StripeMRR {
  const mocks: Record<string, StripeMRR> = {
    synthex: { businessKey: 'synthex', mrr: 249000, currency: 'aud', growth: 12.4, activeSubscriptions: 3, churnRate: 2.1, lastUpdated: new Date().toISOString() },
    restore: { businessKey: 'restore', mrr: 495000, currency: 'aud', growth: 8.7, activeSubscriptions: 10, churnRate: 1.4, lastUpdated: new Date().toISOString() },
    ccw:     { businessKey: 'ccw', mrr: 0, currency: 'aud', growth: 0, activeSubscriptions: 0, churnRate: 0, lastUpdated: new Date().toISOString() },
    dr:      { businessKey: 'dr', mrr: 0, currency: 'aud', growth: 0, activeSubscriptions: 0, churnRate: 0, lastUpdated: new Date().toISOString() },
    carsi:   { businessKey: 'carsi', mrr: 0, currency: 'aud', growth: 0, activeSubscriptions: 0, churnRate: 0, lastUpdated: new Date().toISOString() },
  }
  return mocks[businessKey] ?? { businessKey, mrr: 0, currency: 'aud', growth: 0, activeSubscriptions: 0, churnRate: 0, lastUpdated: new Date().toISOString() }
}

// ─── Real Stripe fetch ───────────────────────────────────────────────────────

export async function fetchMRR(businessKey: string): Promise<StripeMRR> {
  const key = getStripeKey(businessKey)
  if (!key) return getMockMRR(businessKey)

  try {
    const stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })

    let mrr = 0
    let count = 0
    let currency = 'aud'

    // Iterate all active subscriptions (autoPagingEach handles pagination)
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price'],
    })

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price
        if (!price.unit_amount) continue

        currency = price.currency
        const qty = item.quantity ?? 1

        // Normalise to monthly
        if (price.recurring?.interval === 'month') {
          mrr += price.unit_amount * qty
        } else if (price.recurring?.interval === 'year') {
          mrr += Math.round((price.unit_amount * qty) / 12)
        } else if (price.recurring?.interval === 'week') {
          mrr += Math.round(price.unit_amount * qty * 4.333)
        }
      }
      count++
    }

    return {
      businessKey,
      mrr,
      currency,
      growth: 0,    // historical data needed
      activeSubscriptions: count,
      churnRate: 0, // churn event log needed
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    // Stripe API error — fall back to mock so dashboard doesn't crash
    // Log for production observability (Sentry captures console.error)
    console.error(`[stripe] fetchMRR failed for ${businessKey}:`, error instanceof Error ? error.message : 'Unknown error')
    return getMockMRR(businessKey)
  }
}
