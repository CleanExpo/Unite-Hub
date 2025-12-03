/**
 * Synthex Offers API
 *
 * GET /api/synthex/offers - Get current offer tier and pricing summary
 * Public endpoint (no auth required for pricing display)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOfferTier, getOfferBanner, getPricingSummary } from '@/lib/synthex/synthexOfferEngine.server';

export async function GET(req: NextRequest) {
  try {
    // Get current offer tier
    const currentOffer = await getCurrentOfferTier();

    // Get offer banner data
    const banner = await getOfferBanner();

    // Get pricing summary for all plans
    const pricing = await getPricingSummary();

    return NextResponse.json({
      currentOffer,
      banner,
      pricing,
    });
  } catch (error) {
    console.error('GET /api/synthex/offers error:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
