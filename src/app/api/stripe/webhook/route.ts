import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Stripe Webhook Handler for Unite-Hub CRM
 *
 * Processes all Stripe webhook events and syncs with Convex database
 *
 * Handled Events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - customer.created
 * - customer.updated
 * - payment_intent.succeeded
 * - payment_intent.failed
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

  const customerId = subscription.customer as string;
  const metadata = subscription.metadata;
  const orgId = metadata.organizationId as Id<"organizations">;

  if (!orgId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0].price.id);

  if (!planTier) {
    console.error("Unknown price ID:", subscription.items.data[0].price.id);
    return;
  }

  // Create subscription in Convex
  await convex.mutation(api.subscriptions.upsertSubscription, {
    orgId,
    planTier,
    status: mapStripeStatus(subscription.status),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  });

  console.log("Subscription created successfully:", subscription.id);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Processing subscription.updated:", subscription.id);

  const customerId = subscription.customer as string;
  const metadata = subscription.metadata;
  const orgId = metadata.organizationId as Id<"organizations">;

  if (!orgId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0].price.id);

  if (!planTier) {
    console.error("Unknown price ID:", subscription.items.data[0].price.id);
    return;
  }

  // Update subscription in Convex
  await convex.mutation(api.subscriptions.upsertSubscription, {
    orgId,
    planTier,
    status: mapStripeStatus(subscription.status),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  });

  console.log("Subscription updated successfully:", subscription.id);
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription.deleted:", subscription.id);

  const existingSubscription = await convex.query(
    api.subscriptions.getByStripeSubscriptionId,
    {
      stripeSubscriptionId: subscription.id,
    }
  );

  if (!existingSubscription) {
    console.warn("Subscription not found in database:", subscription.id);
    return;
  }

  // Update subscription status to canceled
  await convex.mutation(api.subscriptions.updateStatus, {
    subscriptionId: existingSubscription._id,
    status: "canceled",
    cancelAtPeriodEnd: false,
  });

  console.log("Subscription canceled successfully:", subscription.id);
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Processing invoice.paid:", invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("No subscription associated with invoice:", invoice.id);
    return;
  }

  // Get subscription from database
  const subscription = await convex.query(
    api.subscriptions.getByStripeSubscriptionId,
    {
      stripeSubscriptionId: subscriptionId,
    }
  );

  if (!subscription) {
    console.warn("Subscription not found for invoice:", invoice.id);
    return;
  }

  // Update subscription to active if it was past_due
  if (subscription.status === "past_due") {
    await convex.mutation(api.subscriptions.updateStatus, {
      subscriptionId: subscription._id,
      status: "active",
    });
  }

  // Update period if invoice has period information
  if (invoice.period_start && invoice.period_end) {
    await convex.mutation(api.subscriptions.updatePeriod, {
      subscriptionId: subscription._id,
      currentPeriodStart: invoice.period_start * 1000,
      currentPeriodEnd: invoice.period_end * 1000,
    });
  }

  console.log("Invoice payment processed successfully:", invoice.id);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed:", invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("No subscription associated with invoice:", invoice.id);
    return;
  }

  // Get subscription from database
  const subscription = await convex.query(
    api.subscriptions.getByStripeSubscriptionId,
    {
      stripeSubscriptionId: subscriptionId,
    }
  );

  if (!subscription) {
    console.warn("Subscription not found for invoice:", invoice.id);
    return;
  }

  // Update subscription to past_due
  await convex.mutation(api.subscriptions.updateStatus, {
    subscriptionId: subscription._id,
    status: "past_due",
  });

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

  const metadata = customer.metadata;
  const orgId = metadata.organizationId as Id<"organizations">;

  if (!orgId) {
    console.log("No organizationId in customer metadata:", customer.id);
    return;
  }

  // Update organization with Stripe customer ID
  await convex.mutation(api.subscriptions.updateOrganizationStripeCustomer, {
    orgId,
    stripeCustomerId: customer.id,
  });

  console.log("Customer created and linked:", customer.id);
}

/**
 * Handle customer.updated event
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log("Processing customer.updated:", customer.id);

  // Get subscription by customer ID
  const subscription = await convex.query(
    api.subscriptions.getByStripeCustomerId,
    {
      stripeCustomerId: customer.id,
    }
  );

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
 * Map Stripe subscription status to Convex status
 */
function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    case "incomplete":
      return "trialing"; // Treat incomplete as trialing
    default:
      return "active";
  }
}

/**
 * Get plan tier from Stripe price ID
 */
function getPlanTierFromPriceId(
  priceId: string
): "starter" | "professional" | null {
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL) return "professional";
  return null;
}
