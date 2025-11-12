import { NextRequest, NextResponse } from "next/server";
import { gmailClient } from "@/lib/gmail";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

/**
 * GET /api/email/oauth/callback
 * Gmail OAuth callback handler
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=${error}`
      );
    }

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    // Exchange code for tokens
    const credentials = await gmailClient.getTokensFromCode(code);

    // Get user's Gmail profile
    const profile = await gmailClient.getUserProfile(credentials);

    // Parse state (contains orgId or other metadata)
    const stateData = state ? JSON.parse(decodeURIComponent(state)) : {};
    const orgId = stateData.orgId || process.env.DEFAULT_ORG_ID;

    // Store credentials in environment or secure storage
    // For production, store in database or secure vault
    console.log("Gmail OAuth successful:", {
      email: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
    });

    // TODO: Store credentials securely
    // For now, log them for manual setup
    console.log("Access Token:", credentials.accessToken);
    console.log("Refresh Token:", credentials.refreshToken);
    console.log("Expiry Date:", credentials.expiryDate);

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?success=true&email=${profile.emailAddress}`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=oauth_failed`
    );
  }
}
