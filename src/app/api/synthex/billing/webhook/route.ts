/**
 * Synthex Billing - Stripe Webhook Handler
 * POST /api/synthex/billing/webhook
 * Handles Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  markInvoicePaid,
  markInvoiceFailed,
  recordBillingEvent,
  addPaymentMethod,
} from '@/lib/synthex/invoicingService';
import Stripe from 'stripe';

const stripe = getStripe();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const tenantId = invoice.metadata?.tenant_id;
  if (!tenantId) {
    console.warn('[Stripe Webhook] No tenant_id in invoice metadata');
    return;
  }

  // Find invoice in our database by Stripe invoice ID
  const { data: existingInvoice } = await supabaseAdmin
    .from('synthex_invoices')
    .select('invoice_id')
    .eq('stripe_invoice_id', invoice.id)
    .single();

  if (existingInvoice) {
    // Mark existing invoice as paid
    await markInvoicePaid(existingInvoice.invoice_id, invoice.id, invoice.hosted_invoice_url || undefined);
  } else {
    // Create new invoice record from Stripe invoice
    const { error } = await supabaseAdmin.from('synthex_invoices').insert({
      tenant_id: tenantId,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      stripe_invoice_id: invoice.id,
      stripe_invoice_url: invoice.hosted_invoice_url || null,
      period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
      due_date: new Date(invoice.due_date ? invoice.due_date * 1000 : Date.now()).toISOString().split('T')[0],
      paid_at: new Date(invoice.status_transitions.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()).toISOString(),
      line_items: invoice.lines.data.map((line) => ({
        description: line.description || '',
        quantity: line.quantity || 1,
        unit_price_cents: line.price?.unit_amount || 0,
        amount_cents: line.amount,
      })),
    });

    if (error) {
      console.error('[Stripe Webhook] Error creating invoice record:', error);
    }
  }

  await recordBillingEvent(tenantId, 'stripe.invoice.paid', {
    stripe_invoice_id: invoice.id,
    amount_paid: invoice.amount_paid,
  });
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const tenantId = invoice.metadata?.tenant_id;
  if (!tenantId) {
    console.warn('[Stripe Webhook] No tenant_id in invoice metadata');
    return;
  }

  // Find invoice in our database
  const { data: existingInvoice } = await supabaseAdmin
    .from('synthex_invoices')
    .select('invoice_id')
    .eq('stripe_invoice_id', invoice.id)
    .single();

  if (existingInvoice) {
    await markInvoiceFailed(existingInvoice.invoice_id);
  }

  await recordBillingEvent(tenantId, 'stripe.invoice.payment_failed', {
    stripe_invoice_id: invoice.id,
    amount_due: invoice.amount_due,
  });
}

/**
 * Handle subscription created/updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenant_id;
  if (!tenantId) {
    console.warn('[Stripe Webhook] No tenant_id in subscription metadata');
    return;
  }

  const planCode = subscription.metadata?.plan_code || 'PRO';
  const billingPeriod = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  // Get plan ID
  const { data: plan } = await supabaseAdmin
    .from('synthex_plans')
    .select('id')
    .eq('code', planCode)
    .single();

  if (!plan) {
    console.error(`[Stripe Webhook] Plan not found: ${planCode}`);
    return;
  }

  // Update subscription in database
  const { error } = await supabaseAdmin
    .from('synthex_subscriptions')
    .update({
      plan_id: plan.id,
      status: mapStripeStatus(subscription.status),
      billing_period: billingPeriod,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      external_customer_id: subscription.customer as string,
      external_subscription_id: subscription.id,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  }

  await recordBillingEvent(tenantId, 'stripe.subscription.updated', {
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    plan_code: planCode,
  });
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenant_id;
  if (!tenantId) {
    console.warn('[Stripe Webhook] No tenant_id in subscription metadata');
    return;
  }

  // Get FREE plan
  const { data: freePlan } = await supabaseAdmin
    .from('synthex_plans')
    .select('id')
    .eq('code', 'FREE')
    .single();

  if (!freePlan) {
    console.error('[Stripe Webhook] FREE plan not found');
    return;
  }

  // Downgrade to FREE plan
  const { error } = await supabaseAdmin
    .from('synthex_subscriptions')
    .update({
      plan_id: freePlan.id,
      status: 'canceled',
      external_subscription_id: null,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Stripe Webhook] Error downgrading subscription:', error);
  }

  await recordBillingEvent(tenantId, 'stripe.subscription.deleted', {
    stripe_subscription_id: subscription.id,
  });
}

/**
 * Handle payment method attached event
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;
  if (!customerId) {
    return;
  }

  // Find tenant by customer ID
  const { data: subscription } = await supabaseAdmin
    .from('synthex_subscriptions')
    .select('tenant_id')
    .eq('external_customer_id', customerId)
    .single();

  if (!subscription) {
    console.warn('[Stripe Webhook] No subscription found for customer:', customerId);
    return;
  }

  // Add payment method to database
  if (paymentMethod.type === 'card' && paymentMethod.card) {
    await addPaymentMethod({
      tenantId: subscription.tenant_id,
      type: 'card',
      lastFour: paymentMethod.card.last4,
      brand: paymentMethod.card.brand,
      stripePaymentMethodId: paymentMethod.id,
      isDefault: false,
    });
  }
}

/**
 * Handle checkout session completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenant_id;
  if (!tenantId) {
    console.warn('[Stripe Webhook] No tenant_id in checkout session metadata');
    return;
  }

  await recordBillingEvent(tenantId, 'stripe.checkout.completed', {
    session_id: session.id,
    subscription_id: session.subscription,
  });
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'trial' | 'active' | 'past_due' | 'canceled' | 'paused' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'paused':
      return 'paused';
    default:
      return 'active';
  }
}
