/**
 * Billing Plans API
 * GET /api/enterprise/billing/plans - Get available plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingEngine } from '@/lib/services/billing';

export async function GET(req: NextRequest) {
  try {
    const plans = await billingEngine.getPlans();

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
