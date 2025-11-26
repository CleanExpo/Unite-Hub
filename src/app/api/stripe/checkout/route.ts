import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  PLAN_TIERS,
} from "@/lib/stripe/client";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for subscription purchase
 *
 * SECURITY: Requires authentication and owner/admin role
 */

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // ✅ SECURITY FIX: Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    const { userId, user } = authResult;

    const body = await req.json();
    const { plan, orgId } = body;

    // Validation
    if (!plan || !orgId) {
      return NextResponse.json(
        { error: "Plan and orgId are required" },
        { status: 400 }
      );
    }

    // Validate plan tier
    if (plan !== "starter" && plan !== "professional") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'starter' or 'professional'" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // ✅ SECURITY FIX: Verify user is owner or admin of this organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.userId)
      .eq("org_id", orgId)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 }
      );
    }

    if (!["owner", "admin"].includes(userOrg.role)) {
      return NextResponse.json(
        { error: "Only organization owners and admins can create subscriptions" },
        { status: 403 }
      );
    }

    // ✅ SECURITY FIX: Get authenticated user's email (don't trust client)
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", user.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get plan details
    const planDetails = PLAN_TIERS[plan];
    if (!planDetails.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan} plan` },
        { status: 500 }
      );
    }

    // ✅ SECURITY FIX: Use authenticated data only (not client-provided)
    const customer = await getOrCreateCustomer({
      email: profile.email,
      name: profile.full_name || profile.email.split('@')[0],
      organizationId: orgId,
      metadata: {
        plan,
        created_by: user.userId,
        created_at: new Date().toISOString(),
      },
    });

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId: planDetails.priceId,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard/overview?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      trialDays: 0, // No trial period
      metadata: {
        organizationId: orgId,
        plan,
      },
    });

    // ✅ SECURITY FIX: Audit log the subscription creation attempt
    const supabase2 = await getSupabaseServer();
    await supabase2.from("auditLogs").insert({
      org_id: orgId,
      user_id: user.userId,
      action: "subscription_checkout_initiated",
      entity_type: "subscription",
      metadata: {
        plan,
        stripe_session_id: session.id,
        stripe_customer_id: customer.id,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
