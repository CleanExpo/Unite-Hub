/**
 * Brave Creator Console Stats API Route
 * Phase 4 Step 3: Real API Integration Layer
 *
 * Endpoint for querying Brave Creator channel statistics.
 * Requires active Brave Creator credential (OAuth or API key) for the SEO profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getCredentialByType } from "@/lib/services/seo/credentialService";
import { decryptCredentialObject } from "@/lib/services/seo/credentialService";
import type { BraveCredentialData } from "@/lib/seo/integrations/braveClient";
import { extractBraveCredential } from "@/lib/seo/integrations/braveClient";
import { BraveCreatorStatsRequestSchema } from "@/lib/validation/seoCredentialSchemas";
import { ZodError } from "zod";

const BRAVE_CREATOR_API_BASE = "https://creators.brave.com/api/v1";

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
    const validated = BraveCreatorStatsRequestSchema.parse(body);

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

    // Get Brave credential for this SEO profile
    const credentialResult = await getCredentialByType(
      validated.seo_profile_id,
      "brave_console",
      {
        user_id: user.id,
        organization_id: validated.organization_id,
        role: "member", // RLS will enforce proper role-based access
      }
    );

    if (!credentialResult.success || !credentialResult.data) {
      return NextResponse.json(
        {
          error: "No active Brave Creator credential found for this SEO profile",
        },
        { status: 404 }
      );
    }

    // Decrypt credential data and extract access token or API key
    const decryptedData = decryptCredentialObject(
      credentialResult.data.credential_data
    ) as BraveCredentialData;

    const credential = extractBraveCredential(credentialResult.data);

    if (!credential) {
      return NextResponse.json(
        { error: "Invalid Brave credential: Missing access token or API key" },
        { status: 500 }
      );
    }

    // TODO: Check if OAuth token is expired and refresh if needed
    // For now, we'll assume the token is valid

    // Build Brave Creator Stats API request
    const statsUrl = `${BRAVE_CREATOR_API_BASE}/channels/${validated.channel_id}/stats`;

    const params = new URLSearchParams({
      start_date: validated.start_date,
      end_date: validated.end_date,
    });

    // Call Brave Creator API
    const braveResponse = await fetch(`${statsUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credential}`,
        "Content-Type": "application/json",
      },
    });

    if (!braveResponse.ok) {
      const errorData = await braveResponse
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        {
          error: `Brave Creator API error: ${braveResponse.status} - ${errorData.error?.message || braveResponse.statusText}`,
        },
        { status: braveResponse.status }
      );
    }

    const braveData = await braveResponse.json();

    return NextResponse.json({
      success: true,
      data: braveData,
      meta: {
        seo_profile_id: validated.seo_profile_id,
        channel_id: validated.channel_id,
        date_range: {
          start: validated.start_date,
          end: validated.end_date,
        },
        auth_method: decryptedData.auth_method,
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
      console.error("Brave Creator stats API error:", error);
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
