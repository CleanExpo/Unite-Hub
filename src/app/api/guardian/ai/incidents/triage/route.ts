/**
 * H04: GET /api/guardian/ai/incidents/triage
 * List triage queue with filters and pagination
 * Returns incident basics + latest score + triage state
 */

import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const ctxResult = await requireExecutionContext(req, undefined, {
      requireWorkspace: true,
      allowWorkspaceFromHeader: true,
    });

    if (!ctxResult.ok) {
      return ctxResult.response;
    }

    const { workspace } = ctxResult.ctx;

    // Query parameters
    const searchParams = req.nextUrl.searchParams;
    const triageStatus = searchParams.get("triageStatus") || undefined;
    const band = searchParams.get("band") || undefined;
    const minScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined;
    const maxScore = searchParams.get("maxScore")
      ? parseInt(searchParams.get("maxScore")!)
      : undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();

    // Build query: triage joined with latest scores
    let query = supabase
      .from("guardian_incident_triage")
      .select(
        `
        id,
        incident_id,
        triage_status,
        priority_override,
        owner,
        tags,
        updated_at,
        last_score,
        last_scored_at
      `
      )
      .eq("tenant_id", workspace.id);

    // Apply filters
    if (triageStatus) {
      query = query.eq("triage_status", triageStatus);
    }

    // Sort by: priority_override DESC NULLS LAST, then by band/score
    query = query
      .order("priority_override", { ascending: false, nullsFirst: false })
      .order("last_scored_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: triageRows, error: triageError } = await query;

    if (triageError) {
      console.error("[API] Triage query error:", triageError);
      return errorResponse("Failed to fetch triage queue", 500);
    }

    if (!triageRows || triageRows.length === 0) {
      return successResponse({
        items: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Fetch incident details for each triage row
    const incidentIds = triageRows.map((t) => t.incident_id);
    const { data: incidents } = await supabase
      .from("incidents")
      .select("id, created_at, status")
      .eq("workspace_id", workspace.id)
      .in("id", incidentIds);

    const incidentMap = new Map(incidents?.map((i) => [i.id, i]) || []);

    // Fetch latest scores
    const { data: scores } = await supabase
      .from("guardian_incident_scores")
      .select(
        "incident_id, score, severity_band, computed_at, rationale, model_key"
      )
      .eq("tenant_id", workspace.id)
      .in("incident_id", incidentIds)
      .order("computed_at", { ascending: false });

    // Group scores by incident (latest only)
    const scoreMap = new Map<string, any>();
    scores?.forEach((s) => {
      if (!scoreMap.has(s.incident_id)) {
        scoreMap.set(s.incident_id, s);
      }
    });

    // Apply band and score filters after fetching
    const items = triageRows
      .filter((t) => {
        const score = scoreMap.get(t.incident_id);
        if (band && score?.severity_band !== band) {
return false;
}
        if (
          minScore !== undefined &&
          (!score || score.score < minScore)
        ) {
return false;
}
        if (
          maxScore !== undefined &&
          (!score || score.score > maxScore)
        ) {
return false;
}
        return true;
      })
      .map((t) => {
        const incident = incidentMap.get(t.incident_id);
        const score = scoreMap.get(t.incident_id);

        return {
          incidentId: t.incident_id,
          triageId: t.id,
          incidentAge: incident
            ? Math.floor(
                (Date.now() - new Date(incident.created_at).getTime()) /
                  1000 /
                  60
              )
            : null,
          currentStatus: incident?.status || null,
          triageStatus: t.triage_status,
          score: score?.score || null,
          band: score?.severity_band || null,
          lastScoredAt: score?.computed_at || null,
          priorityOverride: t.priority_override,
          owner: t.owner,
          tags: t.tags || [],
          updatedAt: t.updated_at,
        };
      });

    return successResponse({
      items,
      total: items.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[API] /guardian/ai/incidents/triage GET error:", error);
    return errorResponse(error.message || "Failed to fetch triage queue", 500);
  }
}
