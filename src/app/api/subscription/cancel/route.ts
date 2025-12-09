import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { cancelSubscription } from "@/lib/stripe/client";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { z } from "zod";

/**
 * POST /api/subscription/cancel
 * Cancel a subscription (immediately or at period end)
 */

const CancelSubscriptionSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  cancelImmediately: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}

    // Parse and validate request body
    const body = await req.json();
    const validation = CancelSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orgId, cancelImmediately } = validation.data;

    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has permission (owner or admin only)
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 }
      );
    }

    if (userOrg.role !== "owner" && userOrg.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization owners and admins can cancel subscriptions" },
        { status: 403 }
      );
    }

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, status, plan")
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if subscription is already canceled
    if (subscription.status === "canceled") {
      return NextResponse.json(
        { error: "Subscription is already canceled" },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const updatedStripeSubscription = await cancelSubscription(
      subscription.stripe_subscription_id,
      cancelImmediately
    );

    // Update subscription in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: cancelImmediately ? "canceled" : subscription.status,
        cancel_at_period_end: !cancelImmediately,
        cancel_at: updatedStripeSubscription.cancel_at
          ? new Date(updatedStripeSubscription.cancel_at * 1000).toISOString()
          : null,
        canceled_at: updatedStripeSubscription.canceled_at
          ? new Date(updatedStripeSubscription.canceled_at * 1000).toISOString()
          : null,
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Failed to update subscription in Supabase:", updateError);
      // Continue - Stripe is source of truth, webhook will sync
    }

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? "Subscription canceled immediately"
        : "Subscription will be canceled at the end of the billing period",
      subscription: {
        id: subscription.id,
        status: cancelImmediately ? "canceled" : subscription.status,
        cancelAtPeriodEnd: !cancelImmediately,
        currentPeriodEnd: updatedStripeSubscription.current_period_end * 1000,
        plan: subscription.plan,
      },
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
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
