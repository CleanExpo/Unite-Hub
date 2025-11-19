/**
 * Google Search Console OAuth - Callback Handler
 * GET /api/seo/gsc/callback
 *
 * Handles OAuth callback from Google, exchanges auth code for tokens,
 * and links credential to SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  exchangeAuthCodeForTokens,
  listGscProperties,
} from "@/lib/seo/integrations/gscClient";
import { linkGscCredentialToSeoProfile } from "@/lib/services/seo/credentialService";
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
      console.error("OAuth error from Google:", error);
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
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/seo/gsc/callback`;
    const tokenResponse = await exchangeAuthCodeForTokens(code, callbackUrl);

    // List GSC properties to get primary property URL
    const properties = await listGscProperties(tokenResponse.access_token);
    const primaryProperty = properties[0]?.siteUrl || null;

    // Build user context
    const userContext: UserContext = {
      user_id: user.id,
      organization_id: stateData.organization_id,
      role: orgAccess.role as "owner" | "admin" | "member",
    };

    // Link credential to SEO profile
    const result = await linkGscCredentialToSeoProfile(
      {
        seo_profile_id: stateData.seo_profile_id,
        token_response: tokenResponse,
        property_url: primaryProperty,
      },
      userContext
    );

    if (!result.success) {
      console.error("Failed to link GSC credential:", result.error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/seo?error=link_failed`
      );
    }

    // Update SEO profile with GSC property ID
    if (primaryProperty) {
      await supabase
        .from("seo_profiles")
        .update({
          gsc_property_id: primaryProperty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stateData.seo_profile_id);
    }

    // Success - redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/seo?profile_id=${stateData.seo_profile_id}&gsc_connected=true`
    );
  } catch (error) {
    console.error("Error in GSC OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/seo?error=callback_failed`
    );
  }
}
