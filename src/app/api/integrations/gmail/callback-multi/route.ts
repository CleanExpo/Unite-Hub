import { NextRequest, NextResponse } from "next/server";
import { handleGmailCallback } from "@/lib/integrations/gmail-multi-account";
import { authenticateRequest } from "@/lib/auth";
import { strictRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/integrations/gmail/callback-multi
 * Handle OAuth callback for Gmail (multi-account support)
 */
export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await strictRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(req);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/auth/signin?error=unauthorized`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/integrations?error=missing_params`
      );
    }

    // Decode state to get orgId and workspaceId
    const { orgId, workspaceId } = JSON.parse(
      Buffer.from(state, "base64").toString()
    );

    if (!orgId || !workspaceId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/integrations?error=invalid_state`
      );
    }

    // Handle callback and create integration
    const integration = await handleGmailCallback(code, orgId, workspaceId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/integrations?gmail_connected=true&email=${encodeURIComponent(integration.email_address)}`
    );
  } catch (error: unknown) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings/integrations?error=${encodeURIComponent(error.message || "gmail_connection_failed")}`
    );
  }
}
