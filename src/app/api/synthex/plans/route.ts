/**
 * GET /api/synthex/plans
 * Get all available subscription plans
 * Phase B22: Synthex Billing Foundation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailablePlans } from '@/lib/synthex/billingService';

export async function GET(request: NextRequest) {
  try {
    const plans = await getAvailablePlans();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('[API] Error fetching plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch plans',
      },
      { status: 500 }
    );
  }
}
