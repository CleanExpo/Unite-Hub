/**
 * H04: POST /api/guardian/ai/incidents/score/run
 * Trigger batch scoring of recent incidents
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";
import { scoreRecentIncidents } from "@/lib/guardian/ai/incidentScoringOrchestrator";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const ctxResult = await requireExecutionContext(req, undefined, {
      requireWorkspace: true,
      allowWorkspaceFromHeader: true,
    });

    if (!ctxResult.ok) {
      return ctxResult.response;
    }

    const { user, workspace } = ctxResult.ctx;

    // Check admin role (owner or admin)
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      return errorResponse("Permission denied: admin only", 403);
    }

    const { maxIncidents, lookbackHours } = await req.json();

    const result = await scoreRecentIncidents(workspace.id, {
      maxIncidents: maxIncidents || 100,
      lookbackHours: lookbackHours || 24,
    });

    return successResponse({
      scored: result.scored,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: any) {
    console.error("[API] /guardian/ai/incidents/score/run POST error:", error);
    return errorResponse(error.message || "Failed to score incidents", 500);
  }
}
