import { NextRequest, NextResponse } from "next/server";
import { gmailClient } from "@/lib/gmail";

/**
 * GET /api/email/oauth/authorize
 * Initiate Gmail OAuth flow
 */

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("orgId");

    // Generate state with metadata
    const state = JSON.stringify({
      orgId: orgId || process.env.DEFAULT_ORG_ID,
      timestamp: Date.now(),
    });

    // Get authorization URL
    const authUrl = gmailClient.getAuthUrl(encodeURIComponent(state));

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth authorization error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
