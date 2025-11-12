import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cancelSubscription as cancelStripeSubscription } from "@/lib/stripe/client";

/**
 * POST /api/subscription/cancel
 * Cancel subscription (at period end or immediately)
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, cancelImmediately = false, reason } = body;

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
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if already canceled
    if (subscription.status === "canceled") {
      return NextResponse.json(
        { error: "Subscription is already canceled" },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const canceledStripeSubscription = await cancelStripeSubscription(
      subscription.stripeSubscriptionId,
      cancelImmediately
    );

    // Update subscription in Convex
    await convex.mutation(api.subscriptions.cancelSubscription, {
      subscriptionId: subscription._id,
      cancelImmediately,
    });

    const response: any = {
      success: true,
      message: cancelImmediately
        ? "Subscription canceled immediately"
        : "Subscription will be canceled at the end of the billing period",
      subscription: {
        status: cancelImmediately ? "canceled" : subscription.status,
        cancelAtPeriodEnd: !cancelImmediately,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };

    if (!cancelImmediately) {
      const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24)
      );
      response.daysRemaining = daysRemaining;
      response.accessUntil = new Date(
        subscription.currentPeriodEnd
      ).toISOString();
    }

    // Log cancellation reason if provided
    if (reason) {
      console.log("Subscription cancellation reason:", {
        orgId,
        subscriptionId: subscription.stripeSubscriptionId,
        reason,
        cancelImmediately,
      });
      // TODO: Store cancellation feedback in database
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
