/**
 * Bing Webmaster API - Save API Key
 * POST /api/seo/bing/save-key
 *
 * Validates and saves Bing Webmaster API key to SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  validateBingApiKey,
  bingListSites,
} from "@/lib/seo/integrations/bingClient";
import { linkBingCredentialToSeoProfile } from "@/lib/services/seo/credentialService";
import type { UserContext } from "@/lib/seo/seoTypes";

interface SaveBingKeyRequestBody {
  seo_profile_id: string;
  organization_id: string;
  api_key: string;
}

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body: SaveBingKeyRequestBody = await req.json();
    const { seo_profile_id, organization_id, api_key } = body;

    // Validate input
    if (!seo_profile_id || !organization_id || !api_key) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: seo_profile_id, organization_id, api_key",
        },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: orgAccess } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", organization_id)
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
      .select("id, organization_id, domain")
      .eq("id", seo_profile_id)
      .eq("organization_id", organization_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "SEO profile not found or access denied" },
        { status: 404 }
      );
    }

    // Validate API key with Bing API
    const validation = await validateBingApiKey(api_key);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.message || "Invalid Bing API key",
        },
        { status: 400 }
      );
    }

    // List sites to get verified sites
    const sites = await bingListSites(api_key);
    const verifiedSites = sites.filter((s) => s.verified).map((s) => s.url);

    // Build user context
    const userContext: UserContext = {
      user_id: user.id,
      organization_id,
      role: orgAccess.role as "owner" | "admin" | "member",
    };

    // Link credential to SEO profile
    const result = await linkBingCredentialToSeoProfile(
      {
        seo_profile_id,
        api_key,
        verified_sites: verifiedSites,
      },
      userContext
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to save Bing API key",
        },
        { status: 500 }
      );
    }

    // Update SEO profile with Bing site ID (if domain is verified)
    const matchingSite = sites.find(
      (s) => s.verified && s.url.includes(profile.domain)
    );
    if (matchingSite) {
      await supabase
        .from("seo_profiles")
        .update({
          bing_site_id: matchingSite.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seo_profile_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        credential: result.data,
        sites_count: validation.sites_count,
        verified_sites: verifiedSites,
        domain_verified: !!matchingSite,
      },
      message: "Bing API key saved successfully",
    });
  } catch (error) {
    console.error("Error saving Bing API key:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
