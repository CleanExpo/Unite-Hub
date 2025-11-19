/**
 * Google Search Console Query API Route
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Endpoint for querying GSC Search Analytics data.
 * Requires active GSC credential for the SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getCredentialByType } from "@/lib/services/seo/credentialService";
import { decryptCredentialObject } from "@/lib/services/seo/credentialService";
import type { GscCredentialData } from "@/lib/seo/integrations/gscClient";
import { GscSearchAnalyticsRequestSchema } from "@/lib/validation/seoCredentialSchemas";
import { ZodError } from "zod";

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
    const validated = GscSearchAnalyticsRequestSchema.parse(body);

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

    // Get GSC credential for this SEO profile
    const credentialResult = await getCredentialByType(
      validated.seo_profile_id,
      "gsc",
      {
        user_id: user.id,
        organization_id: validated.organization_id,
        role: "member", // RLS will enforce proper role-based access
      }
    );

    if (!credentialResult.success || !credentialResult.data) {
      return NextResponse.json(
        {
          error: "No active GSC credential found for this SEO profile",
        },
        { status: 404 }
      );
    }

    // Decrypt credential data
    const decryptedData = decryptCredentialObject(
      credentialResult.data.credential_data
    ) as GscCredentialData;

    if (!decryptedData.access_token) {
      return NextResponse.json(
        { error: "Invalid GSC credential: Missing access token" },
        { status: 500 }
      );
    }

    // TODO: Check if token is expired and refresh if needed
    // For now, we'll assume the token is valid

    // Build GSC Search Analytics API request
    const gscApiUrl = "https://www.googleapis.com/webmasters/v3/sites/" +
      encodeURIComponent(decryptedData.property_url || "") +
      "/searchAnalytics/query";

    const gscRequestBody = {
      startDate: validated.start_date,
      endDate: validated.end_date,
      dimensions: validated.dimensions || ["query"],
      rowLimit: validated.row_limit,
    };

    // Call GSC API
    const gscResponse = await fetch(gscApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gscRequestBody),
    });

    if (!gscResponse.ok) {
      const errorData = await gscResponse
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        {
          error: `GSC API error: ${gscResponse.status} - ${errorData.error?.message || gscResponse.statusText}`,
        },
        { status: gscResponse.status }
      );
    }

    const gscData = await gscResponse.json();

    return NextResponse.json({
      success: true,
      data: gscData,
      meta: {
        seo_profile_id: validated.seo_profile_id,
        property_url: decryptedData.property_url,
        date_range: {
          start: validated.start_date,
          end: validated.end_date,
        },
        dimensions: validated.dimensions || ["query"],
        row_limit: validated.row_limit,
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
      console.error("GSC query API error:", error);
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
