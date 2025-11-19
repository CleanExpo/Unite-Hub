/**
 * SEO Credentials - List All Credentials for Profile
 * GET /api/seo/credentials/list
 *
 * Returns all active credentials linked to an SEO profile.
 * Supports filtering by credential type.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  getCredentialsForSeoProfile,
  getCredentialByType,
} from "@/lib/services/seo/credentialService";
import type { UserContext, SeoCredentialType } from "@/lib/seo/seoTypes";
import { maskBingApiKey } from "@/lib/seo/integrations/bingClient";
import { maskBraveCredential } from "@/lib/seo/integrations/braveClient";

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
    const credentialType = searchParams.get(
      "credential_type"
    ) as SeoCredentialType | null;

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

    // Build user context
    const userContext: UserContext = {
      user_id: user.id,
      organization_id: organizationId,
      role: orgAccess.role as "owner" | "admin" | "member",
    };

    // Get credentials (filtered by type if specified)
    let result;
    if (credentialType) {
      result = await getCredentialByType(
        seoProfileId,
        credentialType,
        userContext
      );
      if (!result.success) {
        return NextResponse.json(result, { status: 500 });
      }
      // Return single credential in array format for consistency
      return NextResponse.json({
        success: true,
        data: result.data ? [result.data] : [],
        count: result.data ? 1 : 0,
      });
    } else {
      result = await getCredentialsForSeoProfile(seoProfileId, userContext);
      if (!result.success) {
        return NextResponse.json(result, { status: 500 });
      }
    }

    // Mask sensitive data in credential_data before returning to client
    const maskedCredentials = (result.data || []).map((cred) => {
      const maskedData = { ...cred.credential_data };

      // Mask access tokens
      if (maskedData.access_token && typeof maskedData.access_token === "string") {
        maskedData.access_token = maskToken(maskedData.access_token as string);
      }

      // Mask refresh tokens
      if (maskedData.refresh_token && typeof maskedData.refresh_token === "string") {
        maskedData.refresh_token = maskToken(maskedData.refresh_token as string);
      }

      // Mask API keys
      if (maskedData.api_key && typeof maskedData.api_key === "string") {
        if (cred.credential_type === "bing_webmaster") {
          maskedData.api_key = maskBingApiKey(maskedData.api_key as string);
        } else if (cred.credential_type === "brave_console") {
          maskedData.api_key = maskBraveCredential(maskedData.api_key as string);
        } else {
          maskedData.api_key = maskToken(maskedData.api_key as string);
        }
      }

      return {
        ...cred,
        credential_data: maskedData,
      };
    });

    return NextResponse.json({
      success: true,
      data: maskedCredentials,
      count: maskedCredentials.length,
    });
  } catch (error) {
    console.error("Error listing credentials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generic token masking helper (show first 8 and last 4 characters).
 */
function maskToken(token: string): string {
  if (!token || token.length < 12) {
    return "***INVALID***";
  }
  const first8 = token.substring(0, 8);
  const last4 = token.substring(token.length - 4);
  return `${first8}${"*".repeat(token.length - 12)}${last4}`;
}
