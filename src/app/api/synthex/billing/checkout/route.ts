/**
 * Synthex Billing - Stripe Checkout Session
 * POST /api/synthex/billing/checkout
 * Creates a Stripe checkout session for plan subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getTenantSubscription } from '@/lib/synthex/billingService';
import { recordBillingEvent } from '@/lib/synthex/invoicingService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { tenantId, planCode, billingPeriod, successUrl, cancelUrl } = body;

    if (!tenantId || !planCode || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, planCode, billingPeriod' },
        { status: 400 }
      );
    }

    // Verify user has access to tenant
    const { data: tenantUser } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Get current subscription
    const subscription = await getTenantSubscription(tenantId);
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Get Stripe customer ID or create customer
    const stripe = getStripe();
    let customerId = subscription.external_customer_id;

    if (!customerId) {
      // Get tenant details
      const { data: tenant } = await supabase
        .from('synthex_tenants')
        .select('name, settings')
        .eq('id', tenantId)
        .single();

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: tenant?.name || undefined,
        metadata: {
          tenant_id: tenantId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update subscription with customer ID
      await supabase
        .from('synthex_subscriptions')
        .update({
          external_customer_id: customerId,
        })
        .eq('tenant_id', tenantId);
    }

    // Get plan price ID based on plan code and billing period
    const priceId = getPriceId(planCode, billingPeriod);
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3008'}/synthex/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3008'}/synthex/billing?cancelled=true`,
      metadata: {
        tenant_id: tenantId,
        plan_code: planCode,
        billing_period: billingPeriod,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_code: planCode,
        },
      },
    });

    // Record billing event
    await recordBillingEvent(tenantId, 'checkout.session_created', {
      session_id: session.id,
      plan_code: planCode,
      billing_period: billingPeriod,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Synthex Billing Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * Get Stripe price ID for plan and billing period
 */
function getPriceId(planCode: string, billingPeriod: string): string | null {
  // Map plan codes to Stripe price IDs
  // These should be set in environment variables
  const priceMap: Record<string, Record<string, string>> = {
    FREE: {
      monthly: '', // Free plan doesn't have a price
      yearly: '',
    },
    PRO: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
    },
    AGENCY: {
      monthly: process.env.STRIPE_PRICE_ID_AGENCY_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ID_AGENCY_YEARLY || '',
    },
  };

  return priceMap[planCode]?.[billingPeriod] || null;
}
