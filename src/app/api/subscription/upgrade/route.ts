import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  updateSubscription,
  calculateProration,
  PLAN_TIERS,
  getPlanTierFromPriceId,
} from "@/lib/stripe/client";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { z } from "zod";

/**
 * POST /api/subscription/upgrade
 * Upgrade subscription to a higher tier (or change plan)
 */

const UpgradeSubscriptionSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  targetPlan: z.enum(["starter", "professional", "enterprise"]),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Parse and validate request body
    const body = await req.json();
    const validation = UpgradeSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orgId, targetPlan } = validation.data;

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
        { error: "Only organization owners and admins can upgrade subscriptions" },
        { status: 403 }
      );
    }

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, stripe_price_id, plan, status")
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Check if already on target plan
    if (subscription.plan === targetPlan) {
      return NextResponse.json(
        { error: `Already on ${targetPlan} plan` },
        { status: 400 }
      );
    }

    // Get target price ID
    const targetPlanDetails = PLAN_TIERS[targetPlan];
    const newPriceId = targetPlanDetails.priceId;

    if (!newPriceId) {
      return NextResponse.json(
        { error: "Target plan price ID not configured" },
        { status: 500 }
      );
    }

    // Calculate proration
    const prorationInfo = await calculateProration({
      subscriptionId: subscription.stripe_subscription_id,
      newPriceId,
    });

    // Update subscription in Stripe (with immediate proration for upgrades)
    const updatedStripeSubscription = await updateSubscription({
      subscriptionId: subscription.stripe_subscription_id,
      newPriceId,
      prorationBehavior: "always_invoice", // Immediate charge for upgrades
    });

    // Update subscription in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: targetPlan,
        stripe_price_id: newPriceId,
        stripe_product_id: updatedStripeSubscription.items.data[0].price.product as string,
        status: updatedStripeSubscription.status === "active" ? "active" : subscription.status,
        amount: (updatedStripeSubscription.items.data[0].price.unit_amount || 0) / 100,
        currency: updatedStripeSubscription.items.data[0].price.currency || "usd",
        interval:
          updatedStripeSubscription.items.data[0].price.recurring?.interval || "month",
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Failed to update subscription in Supabase:", updateError);
      // Continue - Stripe is source of truth, webhook will sync
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${targetPlanDetails.name} plan`,
      subscription: {
        id: subscription.id,
        plan: targetPlan,
        status: updatedStripeSubscription.status,
        currentPeriodEnd: updatedStripeSubscription.current_period_end * 1000,
        amount: (updatedStripeSubscription.items.data[0].price.unit_amount || 0) / 100,
        currency: updatedStripeSubscription.items.data[0].price.currency,
      },
      proration: {
        amount: prorationInfo.prorationAmount / 100, // Convert cents to dollars
        currency: prorationInfo.currency,
        note:
          prorationInfo.prorationAmount > 0
            ? "Proration charge will be applied immediately"
            : "Credit applied for unused time",
      },
      features: targetPlanDetails.features,
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
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to upgrade subscription",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
