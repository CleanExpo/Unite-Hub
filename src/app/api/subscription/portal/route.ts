import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";
import { createBillingPortalSession } from "@/lib/stripe/client";

/**
 * POST /api/subscription/portal
 * Create a Stripe billing portal session for customer self-service
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Verify user has access to organization
    if (orgId !== user.orgId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user role for additional checks
    const supabase = await getSupabaseServer();
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.userId)
      .eq("org_id", orgId)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow owners and admins to access billing portal
    if (userOrg.role !== "owner" && userOrg.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization owners and admins can access billing" },
        { status: 403 }
      );
    }

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer ID found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      {
        error: "Failed to create billing portal session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
