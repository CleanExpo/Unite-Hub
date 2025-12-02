/**
 * Synthex Offer Engine - Server-Only Functions
 *
 * Database operations that require supabaseAdmin.
 * Must only be imported in server components/API routes.
 */

import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { OFFER_TIERS, type OfferTier } from './synthexOfferEngine';

// ============================================================================
// OFFER TIER AVAILABILITY (DATABASE OPERATIONS)
// ============================================================================

/**
 * Get current available offer tier based on usage
 * Returns the best available tier (early_founders > growth_wave > standard)
 */
export async function getCurrentOfferTier(): Promise<{
  tier: string;
  label: string;
  available: boolean;
  remaining: number; // Slots remaining (-1 if unlimited)
}> {
  const { data: counters, error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('counter_key, label, tier, limit_count, consumed')
    .order('tier', { ascending: false }); // Order: early_founders, growth_wave, standard

  if (error || !counters) {
    console.error('Error fetching offer counters:', error);
    return {
      tier: 'standard',
      label: 'Standard Pricing',
      available: true,
      remaining: -1,
    };
  }

  // Find best available tier
  for (const counter of counters) {
    const available = counter.limit_count === -1 || counter.consumed < counter.limit_count;
    if (available) {
      return {
        tier: counter.tier,
        label: counter.label,
        available: true,
        remaining: counter.limit_count === -1 ? -1 : counter.limit_count - counter.consumed,
      };
    }
  }

  // Fallback to standard
  return {
    tier: 'standard',
    label: 'Standard Pricing',
    available: true,
    remaining: -1,
  };
}

/**
 * Check if a specific offer tier is still available
 */
export async function isOfferAvailable(offerTier: string): Promise<boolean> {
  const offer = OFFER_TIERS[offerTier];
  if (!offer) return false;

  if (offer.limit === -1) return true; // Unlimited

  const { data: counter, error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('limit_count, consumed')
    .eq('counter_key', offer.counterKey)
    .single();

  if (error || !counter) return false;

  return counter.consumed < counter.limit_count;
}

/**
 * Consume an offer slot (increment counter)
 */
export async function consumeOfferSlot(offerTier: string): Promise<boolean> {
  const offer = OFFER_TIERS[offerTier];
  if (!offer) return false;

  if (offer.limit === -1) return true; // Unlimited, no need to increment

  const { data: currentCounter } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('consumed, limit_count')
    .eq('counter_key', offer.counterKey)
    .single();

  if (!currentCounter || currentCounter.consumed >= currentCounter.limit_count) {
    return false; // No slots remaining
  }

  const { error } = await supabaseAdmin
    .from('synthex_offer_counters')
    .update({
      consumed: currentCounter.consumed + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('counter_key', offer.counterKey);

  return !error;
}

/**
 * Get offer stats for analytics
 */
export async function getOfferStats(): Promise<{
  earlyFoundersConsumed: number;
  earlyFoundersRemaining: number;
  growthWaveConsumed: number;
  growthWaveRemaining: number;
  standardConsumed: number;
}> {
  const { data: counters } = await supabaseAdmin
    .from('synthex_offer_counters')
    .select('tier, consumed, limit_count');

  const stats = {
    earlyFoundersConsumed: 0,
    earlyFoundersRemaining: 0,
    growthWaveConsumed: 0,
    growthWaveRemaining: 0,
    standardConsumed: 0,
  };

  if (counters) {
    for (const counter of counters) {
      if (counter.tier === 'early_founders') {
        stats.earlyFoundersConsumed = counter.consumed;
        stats.earlyFoundersRemaining = counter.limit_count - counter.consumed;
      } else if (counter.tier === 'growth_wave') {
        stats.growthWaveConsumed = counter.consumed;
        stats.growthWaveRemaining = counter.limit_count - counter.consumed;
      } else if (counter.tier === 'standard') {
        stats.standardConsumed = counter.consumed;
      }
    }
  }

  return stats;
}

/**
 * Get offer banner data for UI display (server-only)
 */
export async function getOfferBanner(): Promise<{
  show: boolean;
  tier: string;
  label: string;
  discountPercentage: number;
  remaining: number;
  message: string;
} | null> {
  const current = await getCurrentOfferTier();

  if (current.tier === 'standard') {
    return null; // No special offer to show
  }

  const offer = OFFER_TIERS[current.tier];
  let message = '';

  if (current.tier === 'early_founders') {
    message = `Limited to first 50 founders - Only ${current.remaining} slots remaining!`;
  } else if (current.tier === 'growth_wave') {
    message = `Early growth wave offer - ${current.remaining} slots available`;
  }

  return {
    show: true,
    tier: current.tier,
    label: offer.label,
    discountPercentage: offer.discountPercentage,
    remaining: current.remaining,
    message,
  };
}

/**
 * Get pricing summary for all plans with current best offer (server-only)
 */
export async function getPricingSummary(): Promise<
  Array<{
    planCode: string;
    planName: string;
    basePrice: number;
    bestOfferPrice: number;
    bestOfferDiscount: number;
    bestOfferLabel: string;
  }>
> {
  // Import dynamically to avoid circular dependency
  const { PLANS, calculateEffectivePrice } = await import('./synthexOfferEngine');

  const { tier: bestOfferTier } = await getCurrentOfferTier();

  const summary = [];
  for (const [code, plan] of Object.entries(PLANS)) {
    const pricing = await calculateEffectivePrice(code, bestOfferTier);
    summary.push({
      planCode: code,
      planName: plan.name,
      basePrice: pricing.basePrice,
      bestOfferPrice: pricing.effectivePrice,
      bestOfferDiscount: pricing.discountPercentage,
      bestOfferLabel: pricing.offerLabel,
    });
  }

  return summary;
}
