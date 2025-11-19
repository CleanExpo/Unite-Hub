/**
 * Backlinks API Endpoint - Phase 8 Week 22
 *
 * GET /api/audit/backlinks?domain=example.com
 * Returns comprehensive backlink profile for a domain.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { BacklinkEngine } from "@/lib/seo/backlinkEngine";
import { GetBacklinkProfileRequestSchema } from "@/lib/validation/backlinkSchemas";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data: userData, error: authError } =
      await supabaseBrowser.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const domain = url.searchParams.get("domain");
    const includeHistory = url.searchParams.get("includeHistory") !== "false";
    const includeToxicAnalysis =
      url.searchParams.get("includeToxicAnalysis") === "true";

    // Validate request
    const validation = GetBacklinkProfileRequestSchema.safeParse({
      domain,
      includeHistory,
      includeToxicAnalysis,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check tier access (Pro/Enterprise only)
    const supabase = await getSupabaseServer();
    const { data: orgData } = await supabase
      .from("user_organizations")
      .select("org_id, organizations(subscription_tier)")
      .eq("user_id", userData.user.id)
      .single();

    const tier = (orgData?.organizations as any)?.subscription_tier || "free";

    if (!["pro", "enterprise"].includes(tier)) {
      return NextResponse.json(
        {
          error: "Feature not available",
          message: "Backlink analysis requires Pro or Enterprise tier",
        },
        { status: 403 }
      );
    }

    // Get DataForSEO credentials
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      return NextResponse.json(
        { error: "DataForSEO credentials not configured" },
        { status: 500 }
      );
    }

    // Build backlink profile
    const engine = new BacklinkEngine(login, password);
    const profile = await engine.buildProfile(validation.data.domain, {
      includeHistory,
      includeToxicAnalysis,
    });

    // Optionally get toxic analysis
    let toxicReport = null;
    if (includeToxicAnalysis) {
      toxicReport = await engine.analyzeToxicBacklinks(validation.data.domain);
    }

    return NextResponse.json({
      profile,
      toxicReport,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Backlinks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch backlink profile" },
      { status: 500 }
    );
  }
}
