/**
 * Billing Portal API
 * Phase 31: Stripe Live Billing Activation
 *
 * Creates Stripe billing portal sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import {
  getBillingModeForUser,
  getStripeClientForUser,
} from "@/lib/billing/stripe-router";

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

    // Get user profile for role and customer ID
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, stripe_customer_id_test, stripe_customer_id_live")
      .eq("user_id", userId)
      .single();

    userRole = profile?.role;

    // Determine billing mode
    const mode = getBillingModeForUser(userEmail, userRole);
    const customerIdField = `stripe_customer_id_${mode}`;
    const customerId = profile?.[customerIdField];

    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Get Stripe client for this mode
    const stripe = getStripeClientForUser(userEmail, userRole);

    // Parse request for return URL
    const { returnUrl } = await req.json().catch(() => ({}));

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        returnUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    // Log audit event
    await supabase.from("auditLogs").insert({
      action: "billing_portal.session_created",
      userId,
      metadata: {
        session_id: session.id,
        mode,
      },
    });

    return NextResponse.json({
      url: session.url,
      mode,
    });
  } catch (error) {
    console.error("Billing portal error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create billing portal session: ${message}` },
      { status: 500 }
    );
  }
}
