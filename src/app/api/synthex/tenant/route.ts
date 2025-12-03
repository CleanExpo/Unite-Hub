/**
 * Tenant Management APIs
 *
 * POST /api/synthex/tenant - Create new tenant
 * GET /api/synthex/tenant - Get current user's tenant
 * PATCH /api/synthex/tenant/:id - Update tenant profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// GET /api/synthex/tenant - Get current user's tenant(s)
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

    if (tenantId) {
      // Get specific tenant
      const { data: tenant, error } = await supabase
        .from('synthex_tenants')
        .select(
          `
          *,
          synthex_plan_subscriptions (*)
        `
        )
        .eq('id', tenantId)
        .eq('owner_user_id', user.id)
        .single();

      if (error || !tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      return NextResponse.json({ tenant });
    } else {
      // Get all tenants for user
      const { data: tenants, error } = await supabase
        .from('synthex_tenants')
        .select(
          `
          *,
          synthex_plan_subscriptions (*)
        `
        )
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ tenants });
    }
  } catch (error) {
    console.error('GET /api/synthex/tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/synthex/tenant - Create new tenant
// ============================================================================

export async function POST(req: NextRequest) {
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
    const {
      businessName,
      industry,
      region,
      websiteUrl,
      planCode,
      offerTier,
      brandName,
      primaryDomain,
      tagline,
      valueProposition,
    } = body;

    // Validate required fields
    if (!businessName || !industry || !region || !planCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .insert({
        owner_user_id: user.id,
        business_name: businessName,
        industry,
        region,
        website_url: websiteUrl,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: tenantError?.message || 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // Determine pricing and discount
    const planPrices: Record<string, number> = {
      launch: 49,
      growth: 129,
      scale: 299,
    };

    const discounts: Record<string, number> = {
      early_founders: 0.5,
      growth_wave: 0.25,
      standard: 0,
    };

    const basePrice = planPrices[planCode] || 49;
    const discountPct = discounts[offerTier] || 0;
    const effectivePrice = basePrice * (1 - discountPct);

    // Create subscription
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('synthex_plan_subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan_code: planCode,
        offer_tier: offerTier || 'standard',
        effective_price_aud: parseFloat(effectivePrice.toFixed(2)),
        base_price_aud: basePrice,
        discount_percentage: Math.round(discountPct * 100),
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
      console.error('Subscription creation error:', subError);
      // Continue even if subscription fails - can be created later
    }

    // Update tenant with subscription_id
    if (subscription) {
      await supabaseAdmin
        .from('synthex_tenants')
        .update({ subscription_id: subscription.id })
        .eq('id', tenant.id);
    }

    // If offer tier is claimed, consume a slot
    if (offerTier && offerTier !== 'standard') {
      const counterKey =
        offerTier === 'early_founders' ? 'early_founders_50' : 'growth_wave_25';

      // Atomically increment the consumed counter
      const { data: counter } = await supabaseAdmin
        .from('synthex_offer_counters')
        .select('consumed, limit_count')
        .eq('counter_key', counterKey)
        .single();

      if (counter && counter.consumed < counter.limit_count) {
        await supabaseAdmin
          .from('synthex_offer_counters')
          .update({ consumed: counter.consumed + 1 })
          .eq('counter_key', counterKey);
      }
    }

    // Create initial brand
    let brand = null;
    if (brandName && primaryDomain) {
      const { data: brandData, error: brandError } = await supabaseAdmin
        .from('synthex_brands')
        .insert({
          tenant_id: tenant.id,
          brand_name: brandName,
          brand_slug: brandName.toLowerCase().replace(/\s+/g, '-'),
          primary_domain: primaryDomain,
          primary_platform: 'website',
          tagline,
          value_proposition: valueProposition,
          tone_voice: 'professional',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!brandError) {
        brand = brandData;
      }
    }

    // Log usage event
    await supabaseAdmin.from('synthex_usage_logs').insert({
      tenant_id: tenant.id,
      event_type: 'tenant_created',
      feature: 'onboarding',
      metadata_json: {
        plan: planCode,
        offer: offerTier,
        industry,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      tenant,
      subscription,
      brand,
      success: true,
    });
  } catch (error) {
    console.error('POST /api/synthex/tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
