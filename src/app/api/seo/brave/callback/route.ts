/**
 * Brave Creator Console OAuth - Callback Handler
 * GET /api/seo/brave/callback
 *
 * Handles OAuth callback from Brave, exchanges auth code for tokens,
 * and links credential to SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  exchangeBraveAuthCode,
  braveListChannels,
} from "@/lib/seo/integrations/braveClient";
import { linkBraveOAuthCredentialToSeoProfile } from "@/lib/services/seo/credentialService";
import type { UserContext } from "@/lib/seo/seoTypes";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=unauthorized`
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error from Brave:", error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=missing_params`
      );
    }

    // Decode state to get SEO profile ID and organization ID
    let stateData: {
      seo_profile_id: string;
      organization_id: string;
      timestamp: number;
    };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=invalid_state`
      );
    }

    // Verify state timestamp (prevent replay attacks - max 10 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=state_expired`
      );
    }

    // Verify user has access to this organization
    const { data: orgAccess } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", stateData.organization_id)
      .single();

    if (!orgAccess) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=access_denied`
      );
    }

    // Exchange authorization code for tokens
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/seo/brave/callback`;
    const tokenResponse = await exchangeBraveAuthCode(code, callbackUrl);

    // List Brave channels to get primary channel
    const channels = await braveListChannels(tokenResponse.access_token);
    const primaryChannel = channels.find((ch) => ch.verified)?.channelId || null;

    // Build user context
    const userContext: UserContext = {
      user_id: user.id,
      organization_id: stateData.organization_id,
      role: orgAccess.role as "owner" | "admin" | "member",
    };

    // Link credential to SEO profile
    const result = await linkBraveOAuthCredentialToSeoProfile(
      {
        seo_profile_id: stateData.seo_profile_id,
        token_response: tokenResponse,
        channel_id: primaryChannel || undefined,
      },
      userContext
    );

    if (!result.success) {
      console.error("Failed to link Brave credential:", result.error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=link_failed`
      );
    }

    // Update SEO profile with Brave channel ID
    if (primaryChannel) {
      await supabase
        .from("seo_profiles")
        .update({
          brave_channel_id: primaryChannel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stateData.seo_profile_id);
    }

    // Success - redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/seo?profile_id=${stateData.seo_profile_id}&brave_connected=true`
    );
  } catch (error) {
    console.error("Error in Brave OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/seo?error=callback_failed`
    );
  }
}
