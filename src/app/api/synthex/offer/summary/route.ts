/**
 * Offer Summary API
 * 
 * GET /api/synthex/offer/summary - Get aggregated summary of all offers
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Get all offer counters
    const { data: counters, error } = await supabaseAdmin
      .from('synthex_offer_counters')
      .select('*')
      .order('tier', { ascending: true });

    if (error) {
      console.error('Error fetching offer counters:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary statistics
    const totalOffers = counters?.length || 0;
    const activeOffers = counters?.filter(
      (c) => c.limit_count === -1 || c.consumed < c.limit_count
    ).length || 0;

    const totalConsumed = counters?.reduce((sum, c) => sum + (c.consumed || 0), 0) || 0;
    const totalLimit = counters?.reduce((sum, c) => {
      if (c.limit_count === -1) {
        return sum;
      }
      return sum + (c.limit_count || 0);
    }, 0) || 0;

    // Get best available offer
    const bestOffer = counters
      ?.filter((c) => c.limit_count === -1 || c.consumed < c.limit_count)
      .sort((a, b) => {
        const discountA = getDiscountPercentage(a.tier);
        const discountB = getDiscountPercentage(b.tier);
        return discountB - discountA;
      })[0];

    return NextResponse.json({
      summary: {
        totalOffers,
        activeOffers,
        totalConsumed,
        totalLimit: totalLimit === 0 ? -1 : totalLimit,
        availabilityRate:
          totalLimit === 0 ? 100 : Math.round(((totalLimit - totalConsumed) / totalLimit) * 100),
      },
      bestOffer: bestOffer
        ? {
            tier: bestOffer.tier,
            tierLabel: getTierLabel(bestOffer.tier),
            discountPercentage: getDiscountPercentage(bestOffer.tier),
            slotsRemaining:
              bestOffer.limit_count === -1
                ? -1
                : bestOffer.limit_count - bestOffer.consumed,
          }
        : null,
      offers: counters?.map((counter) => ({
        tier: counter.tier,
        consumed: counter.consumed,
        limit: counter.limit_count,
        isAvailable: counter.limit_count === -1 || counter.consumed < counter.limit_count,
        discount: getDiscountPercentage(counter.tier),
      })),
    });
  } catch (error) {
    console.error('GET /api/synthex/offer/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    early_founders: 'Early Founders 50% Off',
    growth_wave: 'Growth Wave 25% Off',
    standard: 'Standard Pricing',
  };
  return labels[tier] || tier;
}

function getDiscountPercentage(tier: string): number {
  const discounts: Record<string, number> = {
    early_founders: 50,
    growth_wave: 25,
    standard: 0,
  };
  return discounts[tier] || 0;
}
