import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { plan, email, orgId } = await req.json();

    const priceId = process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}`];

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/overview?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      customer_email: email,
      metadata: {
        plan,
        orgId,
      },
    });

    // Update organization with Stripe customer ID
    if (session.customer && orgId) {
      await db.organizations.update(orgId, {
        stripe_customer_id: session.customer as string,
      });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
