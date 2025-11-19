/**
 * Bing IndexNow API Route
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Endpoint for submitting URLs to Bing IndexNow for instant indexing.
 * Requires active Bing Webmaster credential for the SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getCredentialByType } from "@/lib/services/seo/credentialService";
import { decryptCredentialObject } from "@/lib/services/seo/credentialService";
import type { BingCredentialData } from "@/lib/seo/integrations/bingClient";
import { BingIndexNowSubmitRequestSchema } from "@/lib/validation/seoCredentialSchemas";
import { ZodError } from "zod";

const BING_INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = BingIndexNowSubmitRequestSchema.parse(body);

    // Get user's organization_id from user_organizations table
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", validated.organization_id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied: Invalid organization" },
        { status: 403 }
      );
    }

    // Get Bing credential for this SEO profile
    const credentialResult = await getCredentialByType(
      validated.seo_profile_id,
      "bing_webmaster",
      {
        user_id: user.id,
        organization_id: validated.organization_id,
        role: "member", // RLS will enforce proper role-based access
      }
    );

    if (!credentialResult.success || !credentialResult.data) {
      return NextResponse.json(
        {
          error: "No active Bing Webmaster credential found for this SEO profile",
        },
        { status: 404 }
      );
    }

    // Decrypt credential data
    const decryptedData = decryptCredentialObject(
      credentialResult.data.credential_data
    ) as BingCredentialData;

    if (!decryptedData.api_key) {
      return NextResponse.json(
        { error: "Invalid Bing credential: Missing API key" },
        { status: 500 }
      );
    }

    // Extract host from first URL for keyLocation
    const firstUrl = new URL(validated.urls[0]);
    const host = firstUrl.origin;
    const keyLocation = validated.key_location || `${host}/${decryptedData.api_key}.txt`;

    // Build IndexNow request
    const indexNowRequest = {
      host: firstUrl.hostname,
      key: decryptedData.api_key,
      keyLocation: keyLocation,
      urlList: validated.urls,
    };

    // Submit to Bing IndexNow
    const indexNowResponse = await fetch(BING_INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(indexNowRequest),
    });

    // IndexNow returns 200 for success, 202 for accepted
    if (!indexNowResponse.ok && indexNowResponse.status !== 202) {
      const errorText = await indexNowResponse
        .text()
        .catch(() => "Unknown error");
      return NextResponse.json(
        {
          error: `IndexNow submission failed: ${indexNowResponse.status} - ${errorText}`,
        },
        { status: indexNowResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "URLs submitted to Bing IndexNow successfully",
      status_code: indexNowResponse.status,
      meta: {
        seo_profile_id: validated.seo_profile_id,
        url_count: validated.urls.length,
        host: firstUrl.hostname,
        key_location: keyLocation,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("Bing IndexNow API error:", error);
      return NextResponse.json(
        { error: `Internal server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown internal server error" },
      { status: 500 }
    );
  }
}
