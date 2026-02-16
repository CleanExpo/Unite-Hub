import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";
import { getSubscription, PLAN_TIERS, PlanTier } from "@/lib/stripe/client";

/**
 * GET /api/subscription/[orgId]
 * Get subscription details for an organization
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Validate organization ID
    const orgIdValidation = UUIDSchema.safeParse(orgId);
    if (!orgIdValidation.success) {
      return NextResponse.json({ error: "Invalid organization ID format" }, { status: 400 });
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Verify user has access to organization
    if (orgId !== user.orgId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const supabase = await getSupabaseServer();

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No subscription found", hasSubscription: false },
        { status: 404 }
      );
    }

    // Get full Stripe subscription details
    const stripeSubscription = subscription.stripe_subscription_id
      ? await getSubscription(subscription.stripe_subscription_id)
      : null;

    if (!stripeSubscription) {
      return NextResponse.json(
        { error: "Stripe subscription not found" },
        { status: 404 }
      );
    }

    // Get plan details
    const planTier = subscription.plan as PlanTier;
    const planDetails = PLAN_TIERS[planTier];

    // Calculate days until renewal
    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    const daysUntilRenewal = periodEnd
      ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Response data
    const response = {
      subscription: {
        id: subscription.id,
        orgId: subscription.org_id,
        planTier: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        daysUntilRenewal,
        trialStart: subscription.trial_start,
        trialEnd: subscription.trial_end,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        seats: subscription.seats,
        usageLimits: subscription.usage_limits,
      },
      plan: planDetails ? {
        name: planDetails.name,
        price: planDetails.price,
        currency: planDetails.currency,
        interval: planDetails.interval,
        features: planDetails.features,
      } : null,
      stripe: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at,
        trialEnd: stripeSubscription.trial_end,
        defaultPaymentMethod: stripeSubscription.default_payment_method,
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription", message: error.message },
      { status: 500 }
    );
  }
}
