/**
 * Subscription Management API
 * Phase 31: Stripe Live Billing Activation
 *
 * Get subscription details, update, cancel
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import {
  getBillingModeForUser,
  getStripeClientForUser,
  getBillingModeInfo,
  isInSandboxMode,
} from "@/lib/billing/stripe-router";
import { getAllUsageSummaries } from "@/lib/billing/usage-metering";
import { PRICING_PLANS, formatPrice } from "@/lib/billing/pricing-config";

// Get subscription details
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let userEmail: string;
    let userRole: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    }

    const supabase = await getSupabaseServer();

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    userRole = profile?.role;

    // Get billing mode info
    const mode = getBillingModeForUser(userEmail, userRole);
    const modeInfo = getBillingModeInfo(mode);
    const isSandbox = isInSandboxMode(userEmail, userRole);

    // Get subscription from database
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("mode", mode)
      .in("status", ["active", "trialing", "past_due"])
      .single();

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        mode,
        modeInfo,
        isSandbox,
        plans: Object.values(PRICING_PLANS).map((plan) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          priceFormatted: formatPrice(plan.price),
          features: plan.features,
        })),
      });
    }

    // Get workspace ID for usage
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    // Get usage summaries if workspace provided
    let usage = null;
    if (workspaceId) {
      usage = await getAllUsageSummaries(userId, workspaceId);
    }

    // Get plan details
    const planId = getPlanFromPriceId(subscription.price_id);
    const plan = PRICING_PLANS[planId];

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.stripe_subscription_id,
        status: subscription.status,
        planId,
        planName: plan?.name || "Unknown",
        price: plan?.price || 0,
        priceFormatted: plan ? formatPrice(plan.price) : "$0",
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
        canceledAt: subscription.canceled_at,
      },
      usage,
      mode,
      modeInfo,
      isSandbox,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get subscription: ${message}` },
      { status: 500 }
    );
  }
}

// Update subscription (change plan)
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let userEmail: string;
    let userRole: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    }

    const supabase = await getSupabaseServer();

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    userRole = profile?.role;

    const { newPlanId } = await req.json();

    if (!newPlanId) {
      return NextResponse.json(
        { error: "New plan ID is required" },
        { status: 400 }
      );
    }

    // Get billing mode
    const mode = getBillingModeForUser(userEmail, userRole);

    // Get current subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("mode", mode)
      .in("status", ["active", "trialing"])
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Get new price ID
    const stripe = getStripeClientForUser(userEmail, userRole);
    const newPriceId = getNewPriceId(mode, newPlanId);

    if (!newPriceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${newPlanId}` },
        { status: 400 }
      );
    }

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    // Log audit event
    await supabase.from("auditLogs").insert({
      action: "subscription.plan_changed",
      userId,
      metadata: {
        subscription_id: subscription.stripe_subscription_id,
        old_price_id: stripeSubscription.items.data[0].price.id,
        new_price_id: newPriceId,
        new_plan_id: newPlanId,
        mode,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update subscription: ${message}` },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let userEmail: string;
    let userRole: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email || "";
    }

    const supabase = await getSupabaseServer();

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    userRole = profile?.role;

    // Get billing mode
    const mode = getBillingModeForUser(userEmail, userRole);

    // Get current subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("mode", mode)
      .in("status", ["active", "trialing"])
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Cancel at period end
    const stripe = getStripeClientForUser(userEmail, userRole);
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Log audit event
    await supabase.from("auditLogs").insert({
      action: "subscription.cancel_scheduled",
      userId,
      metadata: {
        subscription_id: subscription.stripe_subscription_id,
        cancel_at: canceledSubscription.cancel_at,
        mode,
      },
    });

    return NextResponse.json({
      success: true,
      cancelAt: canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to cancel subscription: ${message}` },
      { status: 500 }
    );
  }
}

// Helper functions

function getPlanFromPriceId(priceId: string): string {
  if (priceId.includes("starter")) return "starter";
  if (priceId.includes("pro")) return "pro";
  if (priceId.includes("elite")) return "elite";

  if (
    priceId === process.env.STRIPE_TEST_PRICE_STARTER ||
    priceId === process.env.STRIPE_LIVE_PRICE_STARTER
  ) {
    return "starter";
  }
  if (
    priceId === process.env.STRIPE_TEST_PRICE_PRO ||
    priceId === process.env.STRIPE_LIVE_PRICE_PRO
  ) {
    return "pro";
  }
  if (
    priceId === process.env.STRIPE_TEST_PRICE_ELITE ||
    priceId === process.env.STRIPE_LIVE_PRICE_ELITE
  ) {
    return "elite";
  }

  return "starter";
}

function getNewPriceId(
  mode: "test" | "live",
  planId: string
): string | undefined {
  const envPrefix = mode === "test" ? "STRIPE_TEST_PRICE_" : "STRIPE_LIVE_PRICE_";
  const envKey = `${envPrefix}${planId.toUpperCase()}`;
  return process.env[envKey];
}
