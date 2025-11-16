import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer } from "@/lib/supabase";
import { getPlanTierFromPriceId } from "@/lib/stripe/client";

/**
 * Stripe Webhook Handler for Unite-Hub CRM
 *
 * Processes all Stripe webhook events and syncs with Supabase database
 *
 * Handled Events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - invoice.payment_action_required
 * - customer.created
 * - customer.updated
 * - payment_intent.succeeded
 * - payment_intent.failed
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Disable body parsing, need raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature header found");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Received webhook event: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle the event
    try {
      switch (event.type) {
        case "customer.subscription.created":
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case "invoice.paid":
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_action_required":
          await handleInvoicePaymentActionRequired(
            event.data.object as Stripe.Invoice
          );
          break;

        case "customer.created":
          await handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        case "customer.updated":
          await handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;

        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ received: true, eventType: event.type });
    } catch (handlerError: any) {
      console.error(`Error handling ${event.type}:`, handlerError);
      return NextResponse.json(
        {
          error: "Event handler failed",
          eventType: event.type,
          message: handlerError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Processing subscription.created:", subscription.id);

  const supabase = await getSupabaseServer();
  const customerId = subscription.customer as string;
  const metadata = subscription.metadata;
  const orgId = metadata.organizationId;

  if (!orgId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0].price.id);

  if (!planTier) {
    console.error("Unknown price ID:", subscription.items.data[0].price.id);
    return;
  }

  // Upsert subscription in Supabase
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      org_id: orgId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      stripe_product_id: subscription.items.data[0].price.product as string,
      plan: planTier,
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      amount: subscription.items.data[0].price.unit_amount || 0,
      currency: subscription.items.data[0].price.currency || "aud",
      interval: subscription.items.data[0].price.recurring?.interval || "month",
      metadata: metadata || {},
    }, {
      onConflict: "stripe_subscription_id"
    });

  if (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }

  console.log("Subscription created successfully:", subscription.id);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Processing subscription.updated:", subscription.id);

  const supabase = await getSupabaseServer();
  const customerId = subscription.customer as string;
  const metadata = subscription.metadata;
  const orgId = metadata.organizationId;

  if (!orgId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0].price.id);

  if (!planTier) {
    console.error("Unknown price ID:", subscription.items.data[0].price.id);
    return;
  }

  // Update subscription in Supabase
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: planTier,
      status: mapStripeStatus(subscription.status),
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      amount: subscription.items.data[0].price.unit_amount || 0,
      metadata: metadata || {},
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }

  console.log("Subscription updated successfully:", subscription.id);
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription.deleted:", subscription.id);

  const supabase = await getSupabaseServer();

  // Update subscription status to canceled
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to mark subscription as canceled:", error);
    throw error;
  }

  console.log("Subscription canceled successfully:", subscription.id);
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Processing invoice.paid:", invoice.id);

  const supabase = await getSupabaseServer();
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("No subscription associated with invoice:", invoice.id);
    return;
  }

  // Get subscription from database
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, org_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) {
    console.warn("Subscription not found for invoice:", invoice.id);
    return;
  }

  // Update subscription to active if it was past_due
  if (subscription.status === "past_due") {
    await supabase
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", subscription.id);
  }

  // Update period if invoice has period information
  if (invoice.period_start && invoice.period_end) {
    await supabase
      .from("subscriptions")
      .update({
        current_period_start: new Date(invoice.period_start * 1000).toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      })
      .eq("id", subscription.id);
  }

  // Store invoice record
  await supabase
    .from("invoices")
    .upsert({
      subscription_id: subscription.id,
      org_id: subscription.org_id,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      number: invoice.number,
      status: invoice.status as any,
      amount_due: (invoice.amount_due || 0) / 100,
      amount_paid: (invoice.amount_paid || 0) / 100,
      amount_remaining: (invoice.amount_remaining || 0) / 100,
      subtotal: (invoice.subtotal || 0) / 100,
      total: (invoice.total || 0) / 100,
      tax: (invoice.tax || 0) / 100,
      currency: invoice.currency,
      invoice_date: invoice.created
        ? new Date(invoice.created * 1000).toISOString()
        : null,
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : null,
      paid_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      description: invoice.description,
      metadata: invoice.metadata || {},
    }, {
      onConflict: "stripe_invoice_id"
    });

  console.log("Invoice payment processed successfully:", invoice.id);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed:", invoice.id);

  const supabase = await getSupabaseServer();
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("No subscription associated with invoice:", invoice.id);
    return;
  }

  // Get subscription from database
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) {
    console.warn("Subscription not found for invoice:", invoice.id);
    return;
  }

  // Update subscription to past_due
  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("id", subscription.id);

  console.error("Invoice payment failed:", invoice.id, {
    amount: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
  });

  // TODO: Send email notification to customer
}

/**
 * Handle invoice.payment_action_required event
 */
async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_action_required:", invoice.id);

  // TODO: Send email notification to customer to complete payment
  console.log("Payment action required for invoice:", invoice.id);
}

/**
 * Handle customer.created event
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("Processing customer.created:", customer.id);

  const supabase = await getSupabaseServer();
  const metadata = customer.metadata;
  const orgId = metadata.organizationId;

  if (!orgId) {
    console.log("No organizationId in customer metadata:", customer.id);
    return;
  }

  // Update organization with Stripe customer ID
  await supabase
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", orgId);

  console.log("Customer created and linked:", customer.id);
}

/**
 * Handle customer.updated event
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log("Processing customer.updated:", customer.id);

  const supabase = await getSupabaseServer();

  // Get subscription by customer ID
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_id", customer.id)
    .single();

  if (!subscription) {
    console.log("No subscription found for customer:", customer.id);
    return;
  }

  console.log("Customer updated:", customer.id);
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);

  const customerId = paymentIntent.customer as string;

  if (!customerId) {
    console.log("No customer associated with payment intent:", paymentIntent.id);
    return;
  }

  console.log("Payment succeeded:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error("Processing payment_intent.payment_failed:", paymentIntent.id);

  const customerId = paymentIntent.customer as string;

  if (!customerId) {
    console.log("No customer associated with payment intent:", paymentIntent.id);
    return;
  }

  console.error("Payment failed:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastError: paymentIntent.last_payment_error,
  });

  // TODO: Send email notification to customer
}

/**
 * Map Stripe subscription status to Supabase status
 */
function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}
