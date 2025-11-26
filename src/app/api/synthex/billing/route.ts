/**
 * Billing & Subscription APIs
 *
 * GET /api/synthex/billing - Get billing info for tenant
 * PATCH /api/synthex/billing - Update plan or offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// GET /api/synthex/billing - Get billing information
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Verify user owns tenant
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('synthex_plan_subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is ok for first-time users
      console.error('Subscription fetch error:', subError);
    }

    // Get plan limits
    const planLimits: Record<string, { brands: number; jobsPerMonth: number; price: number }> = {
      launch: { brands: 2, jobsPerMonth: 8, price: 49 },
      growth: { brands: 5, jobsPerMonth: 25, price: 129 },
      scale: { brands: 999, jobsPerMonth: 999, price: 299 },
    };

    const planCode = subscription?.plan_code || 'launch';
    const limits = planLimits[planCode];

    // Calculate current usage
    const { data: brandsData } = await supabase
      .from('synthex_brands')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    const { data: jobsData } = await supabase
      .from('synthex_project_jobs')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    return NextResponse.json({
      subscription: subscription || null,
      plan: {
        code: planCode,
        label: planCode.charAt(0).toUpperCase() + planCode.slice(1),
        ...limits,
      },
      usage: {
        brands: brandsData?.length || 0,
        brandsLimit: limits.brands,
        jobsThisMonth: jobsData?.length || 0,
        jobsLimit: limits.jobsPerMonth,
      },
      billing: {
        status: subscription?.billing_status || 'none',
        cycle: subscription?.billing_cycle || 'monthly',
        price: subscription?.effective_price_aud || limits.price,
        basePrice: subscription?.base_price_aud || limits.price,
        discountPercentage: subscription?.discount_percentage || 0,
        renewsAt: subscription?.renews_at || null,
      },
    });
  } catch (error) {
    console.error('GET /api/synthex/billing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/synthex/billing - Update plan (manual for MVP)
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, action, newPlan } = body;

    if (!tenantId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user owns tenant
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_user_id', user.id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (action === 'upgrade' && newPlan) {
      // Update plan (for MVP, this is manual - in production would trigger Stripe billing)
      const planPrices: Record<string, number> = {
        launch: 49,
        growth: 129,
        scale: 299,
      };

      const newPrice = planPrices[newPlan];
      if (!newPrice) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      // Get current subscription
      const { data: currentSub } = await supabase
        .from('synthex_plan_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!currentSub) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      // Create new subscription record
      const renewsAt = new Date();
      renewsAt.setMonth(renewsAt.getMonth() + 1);

      const { data: newSub, error: subError } = await supabaseAdmin
        .from('synthex_plan_subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_code: newPlan,
          offer_tier: currentSub.offer_tier, // Keep existing offer
          effective_price_aud: newPrice,
          base_price_aud: newPrice,
          discount_percentage: currentSub.discount_percentage,
          billing_cycle: 'monthly',
          billing_status: 'active',
          started_at: new Date().toISOString(),
          renews_at: renewsAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (subError) {
        return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 });
      }

      // Update tenant subscription_id
      await supabaseAdmin
        .from('synthex_tenants')
        .update({ subscription_id: newSub.id })
        .eq('id', tenantId);

      // Log event
      await supabaseAdmin.from('synthex_usage_logs').insert({
        tenant_id: tenantId,
        event_type: 'plan_upgraded',
        feature: 'billing',
        metadata_json: { from: currentSub.plan_code, to: newPlan },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, subscription: newSub });
    } else if (action === 'cancel') {
      // Cancel subscription
      const { data: currentSub } = await supabase
        .from('synthex_plan_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!currentSub) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('synthex_plan_subscriptions')
        .update({
          billing_status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
      }

      // Update tenant status
      await supabaseAdmin
        .from('synthex_tenants')
        .update({ status: 'churned' })
        .eq('id', tenantId);

      // Log event
      await supabaseAdmin.from('synthex_usage_logs').insert({
        tenant_id: tenantId,
        event_type: 'subscription_cancelled',
        feature: 'billing',
        metadata_json: { plan: currentSub.plan_code },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/synthex/billing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
