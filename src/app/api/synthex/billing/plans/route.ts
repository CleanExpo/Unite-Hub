/**
 * Synthex Billing Plans API
 * Phase B33: Billing, Plans, and Usage Metering Engine
 *
 * GET - List available billing plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAvailablePlans,
  getPlanByCode,
  formatPrice,
  calculateYearlySavings,
} from '@/lib/synthex/billingPlanService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planCode = searchParams.get('code');

    // Get a specific plan by code
    if (planCode) {
      const plan = await getPlanByCode(planCode);
      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        plan,
        formatted: {
          monthly: formatPrice(plan.price_monthly),
          yearly: plan.price_yearly ? formatPrice(plan.price_yearly) : null,
          savings: plan.price_yearly
            ? calculateYearlySavings(plan.price_monthly, plan.price_yearly)
            : 0,
        },
      });
    }

    // List all available plans
    const plans = await getAvailablePlans();

    // Add formatted prices
    const plansWithFormatted = plans.map((plan) => ({
      ...plan,
      formatted: {
        monthly: formatPrice(plan.price_monthly),
        yearly: plan.price_yearly ? formatPrice(plan.price_yearly) : null,
        savings: plan.price_yearly
          ? calculateYearlySavings(plan.price_monthly, plan.price_yearly)
          : 0,
      },
    }));

    return NextResponse.json({
      plans: plansWithFormatted,
      count: plans.length,
    });
  } catch (error) {
    console.error('Error in billing/plans GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
