import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  PLAN_TIERS,
} from "@/lib/stripe/client";

/**
 * POST /api/stripe/checkout
 * Create a Stripe Checkout session for subscription purchase
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, email, name, orgId } = body;

    // Validation
    if (!plan || !email || !orgId) {
      return NextResponse.json(
        { error: "Plan, email, and orgId are required" },
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

    // Get plan details
    const planDetails = PLAN_TIERS[plan];
    if (!planDetails.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan} plan` },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email,
      name,
      organizationId: orgId,
      metadata: {
        plan,
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

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
