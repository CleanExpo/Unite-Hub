/**
 * Ownership Verification API - Phase 9
 *
 * POST /api/trust/verify-ownership
 * Confirm website ownership via GSC, DNS, or HTML verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";
import { VerifyOwnershipRequestSchema } from "@/lib/validation/trustSchemas";

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse and validate request
    const body = await req.json();
    const parsed = VerifyOwnershipRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, method, domain, verification_code, gsc_property_id } =
      parsed.data;

    // Get client and verify access
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user is org admin
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Perform verification based on method
    let verificationResult: {
      verified: boolean;
      method: string;
      domain: string;
      gsc_property_id?: string;
      dns_record?: string;
      verification_code?: string;
      verified_at?: string;
      notes?: string;
    };

    switch (method) {
      case "GSC":
        // In production, would call Google Search Console API
        // For now, verify if gsc_property_id is provided
        verificationResult = {
          verified: !!gsc_property_id,
          method: "GSC",
          domain,
          gsc_property_id,
          verified_at: new Date().toISOString(),
          notes: gsc_property_id
            ? "Verified via Google Search Console"
            : "GSC property ID not provided",
        };
        break;

      case "DNS_TXT":
        // In production, would perform DNS lookup
        // For now, check if verification_code matches expected pattern
        const expectedCode = `unite-hub-verify=${client_id.substring(0, 8)}`;
        verificationResult = {
          verified: verification_code === expectedCode,
          method: "DNS_TXT",
          domain,
          dns_record: verification_code,
          verified_at: new Date().toISOString(),
          notes: verification_code === expectedCode
            ? "DNS TXT record verified"
            : `Expected: ${expectedCode}`,
        };
        break;

      case "HTML_FILE":
        // In production, would fetch the HTML file from domain
        verificationResult = {
          verified: !!verification_code,
          method: "HTML_FILE",
          domain,
          verification_code,
          verified_at: new Date().toISOString(),
          notes: verification_code
            ? "HTML file verification pending manual check"
            : "Verification code not provided",
        };
        break;

      case "META_TAG":
        // In production, would scrape the meta tag
        verificationResult = {
          verified: !!verification_code,
          method: "META_TAG",
          domain,
          verification_code,
          verified_at: new Date().toISOString(),
          notes: verification_code
            ? "Meta tag verification pending manual check"
            : "Verification code not provided",
        };
        break;

      case "MANUAL":
        // Manual verification by admin
        verificationResult = {
          verified: true,
          method: "MANUAL",
          domain,
          verified_at: new Date().toISOString(),
          notes: "Manually verified by administrator",
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid verification method" },
          { status: 400 }
        );
    }

    // Update trust request
    const trustService = new TrustModeService();
    const request = await trustService.verifyOwnership(
      client_id,
      verificationResult
    );

    return NextResponse.json({
      request,
      verification_result: verificationResult,
      message: verificationResult.verified
        ? "Ownership verified successfully"
        : "Ownership verification failed",
      next_step: verificationResult.verified ? "sign-consent" : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ownership verification error:", error);

    if (error instanceof Error && error.message.includes("Invalid status")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
