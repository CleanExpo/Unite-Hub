/**
 * GET /api/audit/delta - Phase 8 Week 21
 *
 * Returns full DeltaResult for a specific audit.
 * Compares with previous audit automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { DeltaEngine } from "@/lib/seo/deltaEngine";
import { ClientDataManager } from "@/lib/clientDataManager";

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

    // Get audit ID from query
    const auditId = req.nextUrl.searchParams.get("auditId");

    if (!auditId) {
      return NextResponse.json(
        { error: "Missing auditId parameter" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get current audit
    const { data: currentAudit, error: currentError } = await supabase
      .from("seo_audit_history")
      .select(`
        audit_id,
        client_id,
        created_at,
        health_score,
        previous_audit_id,
        delta_summary,
        report_paths
      `)
      .eq("audit_id", auditId)
      .single();

    if (currentError || !currentAudit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this client
    const { data: clientProfile, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, organization_id, domain")
      .eq("client_id", currentAudit.client_id)
      .single();

    if (clientError || !clientProfile) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify user belongs to organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", clientProfile.organization_id)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied to this client" },
        { status: 403 }
      );
    }

    // Check if we already have a cached delta summary
    if (currentAudit.delta_summary && Object.keys(currentAudit.delta_summary).length > 0) {
      // Try to load full delta from file
      try {
        const deltaPath = `reports/deltas/delta-${auditId}.json`;
        const deltaContent = await ClientDataManager.readFile(
          currentAudit.client_id,
          deltaPath
        );

        if (deltaContent) {
          return NextResponse.json({
            delta: JSON.parse(deltaContent),
            cached: true,
          });
        }
      } catch (err) {
        // Delta file not found, will compute below
      }
    }

    // Check if there's a previous audit to compare
    if (!currentAudit.previous_audit_id) {
      return NextResponse.json({
        delta: null,
        message: "No previous audit to compare (this is the first audit)",
        audit_id: auditId,
      });
    }

    // Get previous audit
    const { data: previousAudit, error: prevError } = await supabase
      .from("seo_audit_history")
      .select(`
        audit_id,
        client_id,
        created_at,
        health_score,
        report_paths
      `)
      .eq("audit_id", currentAudit.previous_audit_id)
      .single();

    if (prevError || !previousAudit) {
      return NextResponse.json(
        { error: "Previous audit not found" },
        { status: 404 }
      );
    }

    // Load audit JSON files for full comparison
    const currentJsonPath = currentAudit.report_paths?.json;
    const previousJsonPath = previousAudit.report_paths?.json;

    if (!currentJsonPath || !previousJsonPath) {
      return NextResponse.json(
        { error: "Audit report files not found" },
        { status: 404 }
      );
    }

    // Read audit data from Docker volumes
    let currentData, previousData;

    try {
      const currentContent = await ClientDataManager.readFile(
        currentAudit.client_id,
        currentJsonPath
      );
      const previousContent = await ClientDataManager.readFile(
        previousAudit.client_id,
        previousJsonPath
      );

      currentData = JSON.parse(currentContent || "{}");
      previousData = JSON.parse(previousContent || "{}");
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to read audit files" },
        { status: 500 }
      );
    }

    // Compute delta
    const deltaResult = await DeltaEngine.computeDelta(
      {
        audit_id: previousAudit.audit_id,
        client_id: previousAudit.client_id,
        timestamp: previousAudit.created_at,
        health_score: previousAudit.health_score || 0,
        data_sources: previousData.dataforseo_intelligence || {},
      },
      {
        audit_id: currentAudit.audit_id,
        client_id: currentAudit.client_id,
        timestamp: currentAudit.created_at,
        health_score: currentAudit.health_score || 0,
        data_sources: currentData.dataforseo_intelligence || {},
      }
    );

    // Save delta to file for caching
    try {
      await ClientDataManager.writeReport({
        clientId: currentAudit.client_id,
        fileName: `delta-${auditId}.json`,
        content: JSON.stringify(deltaResult, null, 2),
        format: "json",
        subFolder: "deltas",
      });
    } catch (err) {
      console.error("Failed to cache delta file:", err);
      // Non-fatal, continue
    }

    // Update delta summary in database
    const deltaSummary = {
      overall_trend: deltaResult.overall_trend,
      health_score_delta: deltaResult.health_score_delta.absolute_change,
      keywords_improved: deltaResult.keyword_movements.filter(k => k.movement_type === "IMPROVED").length,
      keywords_declined: deltaResult.keyword_movements.filter(k => k.movement_type === "DECLINED").length,
      keywords_new: deltaResult.keyword_movements.filter(k => k.movement_type === "NEW").length,
      keywords_lost: deltaResult.keyword_movements.filter(k => k.movement_type === "LOST").length,
      top_wins: deltaResult.top_wins,
      top_losses: deltaResult.top_losses,
    };

    await supabase
      .from("seo_audit_history")
      .update({ delta_summary: deltaSummary })
      .eq("audit_id", auditId);

    return NextResponse.json({
      delta: deltaResult,
      cached: false,
    });

  } catch (error) {
    console.error("[API] /api/audit/delta error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
