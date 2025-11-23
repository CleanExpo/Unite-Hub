/**
 * Stripe Webhook Handler - Dual Mode (TEST/LIVE)
 * Phase 31: Stripe Live Billing Activation
 *
 * Routes: /api/webhooks/stripe/test and /api/webhooks/stripe/live
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  BillingMode,
  getStripeClient,
  getWebhookSecret,
} from "@/lib/billing/stripe-router";
import Stripe from "stripe";

// Disable body parsing for webhook signature verification
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mode: string }> }
) {
  const { mode: modeParam } = await params;
  const mode = modeParam as BillingMode;

  // Validate mode
  if (mode !== "test" && mode !== "live") {
    return NextResponse.json(
      { error: "Invalid webhook mode" },
      { status: 400 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = getWebhookSecret(mode);
  if (!webhookSecret) {
    console.error(`Webhook secret not configured for ${mode} mode`);
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient(mode);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed (${mode}):`, message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServer();

  try {
    // Log webhook event
    await supabase.from("billing_events").insert({
      event_id: event.id,
      event_type: event.type,
      mode,
      payload: event.data.object,
      created_at: new Date().toISOString(),
    });

    // Handle specific events
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, mode, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, mode, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, mode, supabase);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, mode, supabase);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, mode, supabase);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice, mode, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing webhook (${mode}):`, message);
    return NextResponse.json(
      { error: `Processing Error: ${message}` },
      { status: 500 }
    );
  }
}

// Event Handlers

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq(`stripe_customer_id_${mode}`, customerId)
    .single();

  if (profile) {
    await supabase
      .from("subscriptions")
      .upsert({
        user_id: profile.user_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status,
        price_id: priceId,
        mode,
        trial_end: trialEnd,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Log audit event
    await supabase.from("auditLogs").insert({
      action: "subscription.created",
      userId: profile.user_id,
      metadata: {
        subscription_id: subscription.id,
        status,
        price_id: priceId,
        mode,
      },
    });
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;

  await supabase
    .from("subscriptions")
    .update({
      status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Find user for audit
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    await supabase.from("auditLogs").insert({
      action: "subscription.canceled",
      userId: sub.user_id,
      metadata: {
        subscription_id: subscription.id,
        mode,
      },
    });
  }
}

async function handleTrialWillEnd(
  subscription: Stripe.Subscription,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  const customerId = subscription.customer as string;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  // Find user for notification
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, email")
    .eq(`stripe_customer_id_${mode}`, customerId)
    .single();

  if (profile) {
    // Log for notification system to pick up
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      type: "trial_ending",
      title: "Trial Ending Soon",
      message: `Your trial ends on ${trialEnd}. Add a payment method to continue.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    await supabase.from("auditLogs").insert({
      action: "subscription.trial_ending",
      userId: profile.user_id,
      metadata: {
        subscription_id: subscription.id,
        trial_end: trialEnd,
        mode,
      },
    });
  }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  const customerId = invoice.customer as string;
  const amountPaid = invoice.amount_paid;
  const currency = invoice.currency;

  // Find user
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq(`stripe_customer_id_${mode}`, customerId)
    .single();

  if (profile) {
    // Record payment
    await supabase.from("payments").insert({
      user_id: profile.user_id,
      stripe_invoice_id: invoice.id,
      amount: amountPaid,
      currency,
      status: "succeeded",
      mode,
      created_at: new Date().toISOString(),
    });

    await supabase.from("auditLogs").insert({
      action: "payment.succeeded",
      userId: profile.user_id,
      metadata: {
        invoice_id: invoice.id,
        amount: amountPaid,
        currency,
        mode,
      },
    });
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  mode: BillingMode,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
) {
  const customerId = invoice.customer as string;
  const amountDue = invoice.amount_due;

  // Find user
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, email")
    .eq(`stripe_customer_id_${mode}`, customerId)
    .single();

  if (profile) {
    // Record failed payment
    await supabase.from("payments").insert({
      user_id: profile.user_id,
      stripe_invoice_id: invoice.id,
      amount: amountDue,
      currency: invoice.currency,
      status: "failed",
      mode,
      created_at: new Date().toISOString(),
    });

    // Create notification
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      type: "payment_failed",
      title: "Payment Failed",
      message: "Your payment failed. Please update your payment method.",
      read: false,
      created_at: new Date().toISOString(),
    });

    await supabase.from("auditLogs").insert({
      action: "payment.failed",
      userId: profile.user_id,
      metadata: {
        invoice_id: invoice.id,
        amount: amountDue,
        mode,
      },
    });
  }
}
