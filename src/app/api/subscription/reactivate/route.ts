import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { reactivateSubscription as reactivateStripeSubscription } from "@/lib/stripe/client";

/**
 * POST /api/subscription/reactivate
 * Reactivate a canceled subscription (before period end)
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get current subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByOrganization, {
      orgId: orgId as Id<"organizations">,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Check if subscription is set to cancel at period end
    if (!subscription.cancelAtPeriodEnd && subscription.status !== "canceled") {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Check if subscription has already ended
    if (subscription.status === "canceled" && Date.now() > subscription.currentPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription has already ended. Please create a new subscription." },
        { status: 400 }
      );
    }

    // Reactivate subscription in Stripe
    const reactivatedStripeSubscription = await reactivateStripeSubscription(
      subscription.stripeSubscriptionId
    );

    // Update subscription in Convex
    await convex.mutation(api.subscriptions.reactivateSubscription, {
      subscriptionId: subscription._id,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
      subscription: {
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: subscription.currentPeriodEnd,
        planTier: subscription.planTier,
      },
    });
  } catch (error: any) {
    console.error("Error reactivating subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to reactivate subscription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
