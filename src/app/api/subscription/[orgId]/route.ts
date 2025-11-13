import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getSubscription,
  getCustomerInvoices,
  PLAN_TIERS,
} from "@/lib/stripe/client";

/**
 * GET /api/subscription/[orgId]
 * Get subscription details for an organization
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId: orgIdString } = await params;
    const orgId = orgIdString as Id<"organizations">;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByOrganization, {
      orgId,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found", hasSubscription: false },
        { status: 404 }
      );
    }

    // Get full Stripe subscription details
    const stripeSubscription = await getSubscription(
      subscription.stripeSubscriptionId
    );

    if (!stripeSubscription) {
      return NextResponse.json(
        { error: "Stripe subscription not found" },
        { status: 404 }
      );
    }

    // Get plan details
    const planDetails = PLAN_TIERS[subscription.planTier];

    // Calculate days until renewal
    const now = Date.now();
    const daysUntilRenewal = Math.ceil(
      (subscription.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
    );

    // Response data
    const response = {
      subscription: {
        id: subscription._id,
        orgId: subscription.orgId,
        planTier: subscription.planTier,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysUntilRenewal,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId,
      },
      plan: {
        name: planDetails.name,
        price: planDetails.price,
        currency: planDetails.currency,
        interval: planDetails.interval,
        features: planDetails.features,
      },
      stripe: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at,
        trialEnd: stripeSubscription.trial_end,
        defaultPaymentMethod: stripeSubscription.default_payment_method,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription", message: error.message },
      { status: 500 }
    );
  }
}
