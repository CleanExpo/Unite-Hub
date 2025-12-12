/**
 * H04: GET /api/guardian/ai/incidents/score/[incidentId]
 * Fetch latest incident score + aggregate features
 * Safe endpoint: returns aggregate-only data
 */

import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";
import { getLatestIncidentScore } from "@/lib/guardian/ai/incidentScoringOrchestrator";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getSupabaseServer } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const ctxResult = await requireExecutionContext(req, undefined, {
      requireWorkspace: true,
      allowWorkspaceFromHeader: true,
    });

    if (!ctxResult.ok) {
      return ctxResult.response;
    }

    const { workspace } = ctxResult.ctx;
    const { incidentId } = await context.params;

    if (!incidentId) {
      return errorResponse("incidentId is required", 400);
    }

    // Verify incident belongs to workspace
    const supabase = getSupabaseServer();
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("id", incidentId)
      .single();

    if (incidentError || !incident) {
      return errorResponse("Incident not found", 404);
    }

    // Get latest score
    const score = await getLatestIncidentScore(workspace.id, incidentId);

    if (!score) {
      return successResponse({
        incidentId,
        scored: false,
        message: "No score available yet",
      });
    }

    return successResponse({
      incidentId,
      scored: true,
      score: score.score,
      band: score.severity_band,
      computedAt: score.computed_at,
      features: score.features,
      rationale: score.rationale,
      confidence: score.confidence || null,
      model: score.model_key,
    });
  } catch (error: any) {
    console.error("[API] /guardian/ai/incidents/score/[id] GET error:", error);
    return errorResponse(error.message || "Failed to fetch score", 500);
  }
}
