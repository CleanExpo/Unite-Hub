import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createBillingPortalSession } from "@/lib/stripe/client";

/**
 * POST /api/subscription/portal
 * Create a Stripe billing portal session for customer self-service
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, returnUrl } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!returnUrl) {
      return NextResponse.json(
        { error: "Return URL is required" },
        { status: 400 }
      );
    }

    // Get subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByOrganization, {
      orgId: orgId as Id<"organizations">,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
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
