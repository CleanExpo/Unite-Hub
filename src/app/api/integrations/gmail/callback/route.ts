import { NextRequest, NextResponse } from "next/server";
import { handleGmailCallback } from "@/lib/integrations/gmail";
import { strictRateLimit } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/integrations/gmail/callback
 * Handles Gmail OAuth callback with CSRF protection
 *
 * SECURITY: Validates state parameter against database to prevent CSRF attacks
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await strictRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=missing_params`
      );
    }

    const supabase = await getSupabaseServer();

    // ✅ SECURITY FIX: Validate state parameter from database (CSRF protection)
    const { data: oauthState, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("provider", "google")
      .single();

    if (stateError || !oauthState) {
      console.error("Invalid OAuth state:", stateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=invalid_state`
      );
    }

    // ✅ SECURITY FIX: Check state expiration
    const now = new Date();
    const expiresAt = new Date(oauthState.expires_at);
    if (now > expiresAt) {
      // Clean up expired state
      await supabase
        .from("oauth_states")
        .delete()
        .eq("state", state);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=state_expired`
      );
    }

    // ✅ SECURITY FIX: Delete state after successful validation (prevent replay attacks)
    await supabase
      .from("oauth_states")
      .delete()
      .eq("state", state);

    // Handle callback with validated orgId
    const orgId = oauthState.org_id;
    const integration = await handleGmailCallback(code, orgId);

    // ✅ SECURITY FIX: Audit log successful connection
    await supabase.from("auditLogs").insert({
      org_id: orgId,
      user_id: oauthState.user_id,
      action: "gmail_oauth_completed",
      entity_type: "integration",
      metadata: {
        provider: "google",
        integration_id: integration.id,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?gmail_connected=true&integration=${integration.id}`
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=gmail_connection_failed`
    );
  }
}
