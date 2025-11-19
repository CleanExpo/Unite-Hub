/**
 * Strategy Signoff API - Phase 8 Week 24
 *
 * Handles strategy recommendation signoff workflow.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { SubmitSignoffRequestSchema, GetDashboardDataRequestSchema } from "@/lib/validation/strategySchemas";
import { StrategySignoffService } from "@/lib/seo/strategySignoff";

/**
 * POST /api/strategy/signoff
 * Submit a signoff decision for a recommendation
 */
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

    // Parse and validate request body
    const body = await req.json();
    const parsed = SubmitSignoffRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, audit_id, recommendation_id, decision, notes, actions } = parsed.data;

    // Verify user has access to this client
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user belongs to org
    const { data: membership, error: membershipError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Submit signoff
    const signoffService = new StrategySignoffService();
    const signoff = await signoffService.submitSignoff({
      client_id,
      audit_id,
      recommendation_id: recommendation_id || undefined,
      decision,
      notes,
      decided_by: userId,
      action_json: actions || {},
    });

    return NextResponse.json({
      signoff,
      message: `Recommendation ${decision.toLowerCase()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Strategy signoff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/strategy/signoff
 * Get strategy snapshot and signoff history for a client
 */
export async function GET(req: NextRequest) {
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

    // Get query params
    const clientId = req.nextUrl.searchParams.get("client_id");
    const auditId = req.nextUrl.searchParams.get("audit_id");

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this client
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user belongs to org
    const { data: membership, error: membershipError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get strategy snapshot
    const signoffService = new StrategySignoffService();

    if (auditId) {
      // Get specific snapshot
      const snapshot = await signoffService.getSnapshot(clientId, auditId);
      const signoffs = await signoffService.getSignoffHistory(clientId, auditId);

      return NextResponse.json({
        snapshot,
        signoffs,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get latest snapshot
      const { data: latestAudit } = await supabase
        .from("seo_audits")
        .select("audit_id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latestAudit) {
        return NextResponse.json({
          snapshot: null,
          signoffs: [],
          message: "No audits found for this client",
          timestamp: new Date().toISOString(),
        });
      }

      const snapshot = await signoffService.getSnapshot(clientId, latestAudit.audit_id);
      const signoffs = await signoffService.getSignoffHistory(clientId, latestAudit.audit_id);

      return NextResponse.json({
        snapshot,
        signoffs,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Strategy signoff GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
