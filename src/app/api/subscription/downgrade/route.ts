import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  updateSubscription,
  calculateProration,
  PLAN_TIERS,
} from "@/lib/stripe/client";

/**
 * POST /api/subscription/downgrade
 * Downgrade subscription to Starter tier
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, targetPlan = "starter" } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Validate target plan
    if (targetPlan !== "starter" && targetPlan !== "professional") {
      return NextResponse.json(
        { error: "Invalid target plan. Must be 'starter' or 'professional'" },
        { status: 400 }
      );
    }

    // Get current subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByOrganization, {
      orgId: orgId as Id<"organizations">,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if already on target plan
    if (subscription.planTier === targetPlan) {
      return NextResponse.json(
        { error: `Already on ${targetPlan} plan` },
        { status: 400 }
      );
    }

    // Get target price ID
    const newPriceId = PLAN_TIERS[targetPlan].priceId;

    if (!newPriceId) {
      return NextResponse.json(
        { error: "Target plan price ID not configured" },
        { status: 500 }
      );
    }

    // For downgrades, we typically apply changes at the end of the billing period
    // to avoid refunds and make it cleaner for the customer

    // Calculate proration amount (will typically be negative/credit)
    const prorationInfo = await calculateProration({
      subscriptionId: subscription.stripeSubscriptionId,
      newPriceId,
    });

    // Update subscription in Stripe (proration_behavior: create_prorations)
    // Stripe will handle credits automatically
    const updatedStripeSubscription = await updateSubscription({
      subscriptionId: subscription.stripeSubscriptionId,
      newPriceId,
      prorationBehavior: "create_prorations",
    });

    // Update subscription in Convex
    await convex.mutation(api.subscriptions.updatePlanTier, {
      subscriptionId: subscription._id,
      planTier: targetPlan,
      stripePriceId: newPriceId,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully downgraded to ${PLAN_TIERS[targetPlan].name} plan`,
      subscription: {
        planTier: targetPlan,
        status: updatedStripeSubscription.status,
        currentPeriodEnd: updatedStripeSubscription.current_period_end * 1000,
      },
      proration: {
        amount: prorationInfo.prorationAmount,
        currency: prorationInfo.currency,
        note:
          prorationInfo.prorationAmount < 0
            ? "Credit will be applied to your next invoice"
            : "Proration charge will be applied immediately",
      },
    });
  } catch (error: any) {
    console.error("Error downgrading subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to downgrade subscription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
