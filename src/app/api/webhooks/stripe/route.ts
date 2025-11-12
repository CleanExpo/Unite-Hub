import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const orgId = subscription.metadata.orgId;

        if (orgId) {
          // Update organization plan based on subscription
          const plan = subscription.items.data[0]?.price.metadata.plan || "starter";
          await db.organizations.update(orgId, {
            plan: plan as "starter" | "professional" | "enterprise",
            status: subscription.status === "active" ? "active" : "trial",
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata.orgId;

        if (orgId) {
          // Mark organization as cancelled
          await db.organizations.update(orgId, {
            status: "cancelled",
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find organization and log successful payment
        const org = await db.organizations.getByStripeCustomerId(customerId);
        if (org) {
          await db.auditLogs.create({
            org_id: org.id,
            action: "payment.success",
            resource: "invoice",
            resource_id: invoice.id,
            agent: "stripe",
            status: "success",
            details: {
              amount: invoice.amount_paid,
              currency: invoice.currency,
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    );
  }
}
