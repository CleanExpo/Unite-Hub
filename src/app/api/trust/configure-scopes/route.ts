/**
 * Configure Scopes API - Phase 9
 *
 * POST /api/trust/configure-scopes
 * Configure autonomy domains and intensities for a client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";
import { ConfigureScopesRequestSchema } from "@/lib/validation/trustSchemas";

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
    const parsed = ConfigureScopesRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, ...scopeConfig } = parsed.data;

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

    // Verify Trusted Mode is active
    const { data: trustRequest } = await supabase
      .from("trusted_mode_requests")
      .select("status")
      .eq("client_id", client_id)
      .single();

    if (!trustRequest || trustRequest.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Trusted Mode not active",
          message: "Complete Trusted Mode onboarding before configuring scopes",
        },
        { status: 400 }
      );
    }

    // Configure scopes
    const trustService = new TrustModeService();
    const scopes = await trustService.configureScopes(client_id, scopeConfig);

    // Count enabled domains
    const enabledDomains: string[] = [];
    if (scopes.seo_scope_json?.enabled) {
enabledDomains.push("SEO");
}
    if (scopes.content_scope_json?.enabled) {
enabledDomains.push("CONTENT");
}
    if (scopes.ads_scope_json?.enabled) {
enabledDomains.push("ADS");
}
    if (scopes.cro_scope_json?.enabled) {
enabledDomains.push("CRO");
}

    return NextResponse.json({
      scopes,
      enabled_domains: enabledDomains,
      message: `Scopes configured: ${enabledDomains.length} domains enabled`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Configure scopes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
