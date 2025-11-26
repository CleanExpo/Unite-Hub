/**
 * Offer Management APIs
 *
 * GET /api/synthex/offer - Get current available offers
 * GET /api/synthex/offer/:tier - Get specific offer details
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// GET /api/synthex/offer - Get all available offers
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const tier = req.nextUrl.searchParams.get('tier');

    if (tier) {
      // Get specific offer
      const { data: counter, error } = await supabaseAdmin
        .from('synthex_offer_counters')
        .select('*')
        .eq('tier', tier)
        .single();

      if (error || !counter) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      const isAvailable = counter.limit_count === -1 || counter.consumed < counter.limit_count;
      const slotsRemaining =
        counter.limit_count === -1 ? -1 : counter.limit_count - counter.consumed;

      return NextResponse.json({
        tier,
        counter,
        isAvailable,
        slotsRemaining,
      });
    } else {
      // Get all offers
      const { data: counters, error } = await supabaseAdmin
        .from('synthex_offer_counters')
        .select('*')
        .order('tier', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Transform to include availability
      const offers = (counters || []).map((counter) => {
        const isAvailable = counter.limit_count === -1 || counter.consumed < counter.limit_count;
        const slotsRemaining =
          counter.limit_count === -1 ? -1 : counter.limit_count - counter.consumed;

        return {
          ...counter,
          isAvailable,
          slotsRemaining,
          tierLabel: getTierLabel(counter.tier),
          discountPercentage: getDiscountPercentage(counter.tier),
        };
      });

      // Sort by: available first, then by discount (best first)
      offers.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        // Sort by discount percentage descending
        const discountA = getDiscountPercentage(a.tier);
        const discountB = getDiscountPercentage(b.tier);
        return discountB - discountA;
      });

      return NextResponse.json({ offers });
    }
  } catch (error) {
    console.error('GET /api/synthex/offer error:', error);
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
