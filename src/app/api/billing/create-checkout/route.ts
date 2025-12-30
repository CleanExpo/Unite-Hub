/**
 * Create Stripe Checkout Session
 * Handles subscription creation for all Synthex tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServer } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER!,
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
  elite: process.env.STRIPE_PRICE_ID_ELITE || process.env.STRIPE_PRICE_ID_PROFESSIONAL! // Fallback
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, tier, successUrl, cancelUrl } = body;

    // Validate inputs
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!tier || !['starter', 'professional', 'elite'].includes(tier)) {
      return NextResponse.json({ error: 'Valid tier is required' }, { status: 400 });
    }

    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json({ error: `Price ID not configured for tier: ${tier}` }, { status: 500 });
    }

    // Get user session
    const supabase = getSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/pricing`,
      client_reference_id: workspaceId,
      customer_email: session.user.email,
      metadata: {
        workspaceId,
        tier,
        userId: session.user.id
      },
      subscription_data: {
        metadata: {
          workspaceId,
          tier
        },
        trial_period_days: 14 // 14-day free trial
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create checkout session'
    }, { status: 500 });
  }
}
