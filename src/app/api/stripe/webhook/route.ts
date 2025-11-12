import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: NextRequest) {
  try {
    // Load webhook secret inside the function to ensure fresh env variable read
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature header found");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

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

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", failedPayment.id);
        await handlePaymentIntentFailed(failedPayment);
        break;

      case "customer.subscription.created":
        const subscriptionCreated = event.data.object as Stripe.Subscription;
        console.log("Subscription created:", subscriptionCreated.id);
        await handleSubscriptionCreated(subscriptionCreated);
        break;

      case "customer.subscription.updated":
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscriptionUpdated.id);
        await handleSubscriptionUpdated(subscriptionUpdated);
        break;

      case "customer.subscription.deleted":
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscriptionDeleted.id);
        await handleSubscriptionDeleted(subscriptionDeleted);
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment succeeded:", invoice.id);
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", failedInvoice.id);
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update organization with successful payment
  const customerId = paymentIntent.customer as string;

  if (!customerId) return;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      // Log payment in audit logs
      await db.auditLogs.create({
        org_id: organization.id,
        action: "payment_succeeded",
        resource: "stripe_payment",
        details: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      });

      console.log(`Payment succeeded for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const customerId = paymentIntent.customer as string;

  if (!customerId) return;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.auditLogs.create({
        org_id: organization.id,
        action: "payment_failed",
        resource: "stripe_payment",
        status: "error",
        details: {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          last_payment_error: paymentIntent.last_payment_error,
        },
        error_message: paymentIntent.last_payment_error?.message,
      });

      console.error(`Payment failed for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.organizations.update(organization.id, {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_tier: getPlanFromPriceId(subscription.items.data[0].price.id),
      });

      await db.auditLogs.create({
        org_id: organization.id,
        action: "subscription_created",
        resource: "stripe_subscription",
        details: {
          subscription_id: subscription.id,
          status: subscription.status,
          plan: subscription.items.data[0].price.id,
        },
      });

      console.log(`Subscription created for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.organizations.update(organization.id, {
        subscription_status: subscription.status,
        subscription_tier: getPlanFromPriceId(subscription.items.data[0].price.id),
      });

      await db.auditLogs.create({
        org_id: organization.id,
        action: "subscription_updated",
        resource: "stripe_subscription",
        details: {
          subscription_id: subscription.id,
          status: subscription.status,
          plan: subscription.items.data[0].price.id,
        },
      });

      console.log(`Subscription updated for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.organizations.update(organization.id, {
        subscription_status: "canceled",
        subscription_tier: "free",
      });

      await db.auditLogs.create({
        org_id: organization.id,
        action: "subscription_canceled",
        resource: "stripe_subscription",
        details: {
          subscription_id: subscription.id,
          canceled_at: subscription.canceled_at,
        },
      });

      console.log(`Subscription canceled for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.auditLogs.create({
        org_id: organization.id,
        action: "invoice_paid",
        resource: "stripe_invoice",
        details: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
        },
      });

      console.log(`Invoice paid for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  try {
    const organization = await db.organizations.getByStripeCustomerId(customerId);

    if (organization) {
      await db.auditLogs.create({
        org_id: organization.id,
        action: "invoice_payment_failed",
        resource: "stripe_invoice",
        status: "error",
        details: {
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
        },
        error_message: "Invoice payment failed",
      });

      console.error(`Invoice payment failed for organization ${organization.id}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

function getPlanFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan names
  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL) return "professional";
  return "free";
}
