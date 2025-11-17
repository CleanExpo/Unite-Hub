import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { strictRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";
import crypto from "crypto";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
);

/**
 * GET /api/integrations/gmail/authorize
 * Initiates Gmail OAuth flow with CSRF protection
 *
 * SECURITY: Requires authentication and organization access
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // ✅ SECURITY FIX: Authenticate user
    const user = await validateUserAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // ✅ SECURITY FIX: Verify user has access to this organization
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

    // ✅ SECURITY FIX: Generate secure state parameter for CSRF protection
    const state = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiration

    // Store state in database
    const { error: stateError } = await supabase
      .from("oauth_states")
      .insert({
        state,
        org_id: orgId,
        user_id: user.userId,
        provider: "google",
        expires_at: expiresAt.toISOString(),
      });

    if (stateError) {
      console.error("Failed to store OAuth state:", stateError);
      return NextResponse.json(
        { error: "Failed to initialize authorization" },
        { status: 500 }
      );
    }

    // Generate the authorization URL with state parameter
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      prompt: "consent",
      state, // CSRF protection
    });

    // ✅ SECURITY FIX: Audit log the authorization attempt
    await supabase.from("auditLogs").insert({
      org_id: orgId,
      user_id: user.userId,
      action: "gmail_oauth_initiated",
      entity_type: "integration",
      metadata: {
        provider: "google",
        state,
      },
    });

    return NextResponse.json({
      authUrl,
    });
  } catch (error: any) {
    console.error("Gmail authorization error:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
