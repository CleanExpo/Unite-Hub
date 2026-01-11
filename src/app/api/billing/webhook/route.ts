/**
 * Stripe Webhook Handler
 * Processes subscription events (created, updated, cancelled)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: error.message || 'Webhook handler failed'
    }, { status: 400 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { client_reference_id: workspaceId, customer, subscription } = session;

  if (!workspaceId || !customer || !subscription) {
    console.error('Missing required fields in checkout session');
    return;
  }

  const tier = session.metadata?.tier || 'starter';

  // Create subscription record
  const { error } = await supabase
    .from('subscriptions')
    .insert({
      workspace_id: workspaceId,
      tier,
      status: 'active',
      stripe_customer_id: customer as string,
      stripe_subscription_id: subscription as string,
      trial_ends_at: session.subscription_data?.trial_end
        ? new Date(session.subscription_data.trial_end * 1000).toISOString()
        : null
    });

  if (error) {
    console.error('Failed to create subscription:', error);
  } else {
    console.log(`Subscription created for workspace ${workspaceId}, tier: ${tier}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId;

  if (!workspaceId) {
    console.error('Missing workspaceId in subscription metadata');
    return;
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  } else {
    console.log(`Subscription updated: ${subscription.id}`);
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  } else {
    console.log(`Subscription cancelled: ${subscription.id}`);
  }
}
