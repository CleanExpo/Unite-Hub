/**
 * Checkout Session API
 * Phase 31: Stripe Live Billing Activation
 *
 * Creates Stripe checkout sessions with proper mode routing
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import {
  getBillingModeForUser,
  getStripeClientForUser,
  getPriceIds,
  isInSandboxMode,
} from "@/lib/billing/stripe-router";

const TRIAL_DAYS = 14;

export async function POST(req: NextRequest) {
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

    // Get user profile for role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    userRole = profile?.role;

    // Parse request body
    const { planId, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Determine billing mode
    const mode = getBillingModeForUser(userEmail, userRole);
    const isSandbox = isInSandboxMode(userEmail, userRole);

    // Get Stripe client and price IDs for this mode
    const stripe = getStripeClientForUser(userEmail, userRole);
    const prices = getPriceIds(mode);

    // Get price ID for selected plan
    const priceId = prices[planId as keyof typeof prices];
    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${planId}` },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const customerIdField = `stripe_customer_id_${mode}`;

    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select(customerIdField)
      .eq("user_id", userId)
      .single();

    if (existingProfile?.[customerIdField]) {
      customerId = existingProfile[customerIdField];
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
          mode,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("user_profiles")
        .update({ [customerIdField]: customerId })
        .eq("user_id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          user_id: userId,
          plan_id: planId,
          mode,
        },
      },
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        mode,
      },
    });

    // Log audit event
    await supabase.from("auditLogs").insert({
      action: "checkout.session_created",
      userId,
      metadata: {
        session_id: session.id,
        plan_id: planId,
        mode,
        is_sandbox: isSandbox,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      mode,
      isSandbox,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}

// Get checkout session status
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userEmail: string;
    let userRole: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userEmail = data.user.email || "";
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userEmail = data.user.email || "";
    }

    const stripe = getStripeClientForUser(userEmail, userRole);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    console.error("Get checkout session error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get checkout session: ${message}` },
      { status: 500 }
    );
  }
}
