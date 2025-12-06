/**
 * Synthex Billing - Subscription API
 * GET /api/synthex/billing/subscription - Get subscription and usage summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantSubscription, getUsageSummary } from '@/lib/synthex/billingService';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenantId from query params
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    // Verify user has access to tenant
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get subscription
    const subscription = await getTenantSubscription(tenantId);

    // Get usage summary
    const usage = await getUsageSummary(tenantId);

    return NextResponse.json({ subscription, usage });
  } catch (error: any) {
    console.error('[Synthex Subscription] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
