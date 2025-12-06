/**
 * Synthex Subscription API
 * GET: Get current subscription
 * POST: Change subscription plan
 * Phase B22: Synthex Billing Foundation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTenantSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
} from '@/lib/synthex/billingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const { data: membership } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subscription = await getTenantSubscription(tenantId);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('[API] Error fetching subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId, planCode, billingPeriod, action } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Handle cancel action
    if (action === 'cancel') {
      await cancelSubscription(tenantId);
      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of the current period',
      });
    }

    // Handle plan change
    if (!planCode || !billingPeriod) {
      return NextResponse.json(
        { success: false, error: 'planCode and billingPeriod are required' },
        { status: 400 }
      );
    }

    if (!['FREE', 'PRO', 'AGENCY'].includes(planCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan code' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing period' },
        { status: 400 }
      );
    }

    const subscription = await updateSubscriptionPlan(
      tenantId,
      planCode as 'FREE' | 'PRO' | 'AGENCY',
      billingPeriod as 'monthly' | 'yearly'
    );

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('[API] Error updating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update subscription',
      },
      { status: 500 }
    );
  }
}
