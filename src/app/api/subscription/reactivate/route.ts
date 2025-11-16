import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { reactivateSubscription as reactivateStripeSubscription } from "@/lib/stripe/client";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";

/**
 * POST /api/subscription/reactivate
 * Reactivate a canceled subscription (before period end)
 */

const ReactivateSubscriptionSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Parse and validate request body
    const body = await req.json();
    const validation = ReactivateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orgId } = validation.data;

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
        { error: "Only organization owners and admins can reactivate subscriptions" },
        { status: 403 }
      );
    }

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(
        "id, stripe_subscription_id, status, cancel_at_period_end, current_period_end, plan"
      )
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Check if subscription is scheduled for cancellation
    if (!subscription.cancel_at_period_end && subscription.status !== "canceled") {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Check if subscription has already ended
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : 0;

    if (subscription.status === "canceled" && Date.now() > currentPeriodEnd) {
      return NextResponse.json(
        { error: "Subscription has already ended. Please create a new subscription." },
        { status: 400 }
      );
    }

    // Reactivate subscription in Stripe
    const reactivatedStripeSubscription = await reactivateStripeSubscription(
      subscription.stripe_subscription_id
    );

    // Update subscription in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        cancel_at_period_end: false,
        cancel_at: null,
        canceled_at: null,
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Failed to update subscription in Supabase:", updateError);
      // Continue - Stripe is source of truth, webhook will sync
    }

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
      subscription: {
        id: subscription.id,
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: reactivatedStripeSubscription.current_period_end * 1000,
        plan: subscription.plan,
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
