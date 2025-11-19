/**
 * Brave Creator Console OAuth - Authorization URL Generator
 * GET /api/seo/brave/auth-url
 *
 * Generates OAuth 2.0 authorization URL for Brave Creator Console.
 * Client redirects user to this URL to grant permissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { buildBraveAuthUrl } from "@/lib/seo/integrations/braveClient";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const seoProfileId = searchParams.get("seo_profile_id");
    const organizationId = searchParams.get("organization_id");

    if (!seoProfileId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: seo_profile_id, organization_id",
        },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: orgAccess } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", organizationId)
      .single();

    if (!orgAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied to organization" },
        { status: 403 }
      );
    }

    // Verify SEO profile exists and belongs to organization
    const { data: profile, error: profileError } = await supabase
      .from("seo_profiles")
      .select("id, organization_id")
      .eq("id", seoProfileId)
      .eq("organization_id", organizationId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "SEO profile not found or access denied" },
        { status: 404 }
      );
    }

    // Generate CSRF state token (encode profile ID for callback)
    const state = Buffer.from(
      JSON.stringify({
        seo_profile_id: seoProfileId,
        organization_id: organizationId,
        timestamp: Date.now(),
      })
    ).toString("base64url");

    // Build OAuth URL
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/seo/brave/callback`;
    const authUrl = buildBraveAuthUrl({
      redirect_uri: callbackUrl,
      state,
      organization_id: organizationId,
    });

    return NextResponse.json({
      success: true,
      data: {
        auth_url: authUrl,
        state,
      },
      message: "Brave authorization URL generated successfully",
    });
  } catch (error) {
    console.error("Error generating Brave auth URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
