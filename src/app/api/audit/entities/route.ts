/**
 * Entities API Endpoint - Phase 8 Week 22
 *
 * GET /api/audit/entities?domain=example.com
 * Returns comprehensive entity profile for a domain.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { EntityEngine } from "@/lib/seo/entityEngine";
import { GetEntityProfileRequestSchema } from "@/lib/validation/backlinkSchemas";

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
    const analyzeIntent = url.searchParams.get("analyzeIntent") !== "false";
    const urlsParam = url.searchParams.get("urls");
    const urls = urlsParam ? urlsParam.split(",") : undefined;

    // Validate request
    const validation = GetEntityProfileRequestSchema.safeParse({
      domain,
      urls,
      analyzeIntent,
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
          message: "Entity analysis requires Pro or Enterprise tier",
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

    // Build entity profile
    const engine = new EntityEngine(login, password);
    const profile = await engine.buildProfile(validation.data.domain, {
      urls: validation.data.urls,
      analyzeIntent,
    });

    return NextResponse.json({
      profile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Entities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entity profile" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/entities/gap
 * Analyze topical gaps for a domain
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { domain, targetTopic } = body;

    if (!domain || !targetTopic) {
      return NextResponse.json(
        { error: "domain and targetTopic are required" },
        { status: 400 }
      );
    }

    // Check tier access
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
          message: "Topical gap analysis requires Pro or Enterprise tier",
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

    // Analyze topical gaps
    const engine = new EntityEngine(login, password);
    const analysis = await engine.analyzeTopicalGaps(domain, targetTopic);

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Topical gap analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze topical gaps" },
      { status: 500 }
    );
  }
}
