/**
 * H04: GET/PATCH /api/guardian/ai/incidents/triage/[incidentId]
 * Get triage state or update triage metadata
 * PATCH is admin-only
 */

import { NextRequest, NextResponse } from "next/server";
import { requireExecutionContext } from "@/lib/execution-context";
import { getTriageState, updateTriageState } from "@/lib/guardian/ai/incidentScoringOrchestrator";
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
    const { data: incident } = await supabase
      .from("incidents")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("id", incidentId)
      .single();

    if (!incident) {
      return errorResponse("Incident not found", 404);
    }

    const triage = await getTriageState(workspace.id, incidentId);

    return successResponse({
      incidentId,
      triageState: triage || {
        triageStatus: "untriaged",
        priorityOverride: null,
        owner: null,
        tags: [],
        notes: null,
      },
    });
  } catch (error: any) {
    console.error("[API] /guardian/ai/incidents/triage/[id] GET error:", error);
    return errorResponse(error.message || "Failed to fetch triage state", 500);
  }
}

export async function PATCH(
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

    const { user, workspace } = ctxResult.ctx;

    // Check admin role
    if (workspace.role !== "owner" && workspace.role !== "admin") {
      return errorResponse("Permission denied: admin only", 403);
    }

    const { incidentId } = await context.params;

    if (!incidentId) {
      return errorResponse("incidentId is required", 400);
    }

    // Verify incident belongs to workspace
    const supabase = getSupabaseServer();
    const { data: incident } = await supabase
      .from("incidents")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("id", incidentId)
      .single();

    if (!incident) {
      return errorResponse("Incident not found", 404);
    }

    const body = await req.json();
    const { triageStatus, priorityOverride, owner, notes, tags } = body;

    // Validate inputs
    const validStatuses = [
      "untriaged",
      "in_review",
      "actioned",
      "watch",
      "closed_out",
    ];
    if (triageStatus && !validStatuses.includes(triageStatus)) {
      return errorResponse(
        `Invalid triageStatus: ${triageStatus}`,
        400
      );
    }

    if (priorityOverride !== undefined && priorityOverride !== null) {
      if (
        typeof priorityOverride !== "number" ||
        priorityOverride < 1 ||
        priorityOverride > 5
      ) {
        return errorResponse("priorityOverride must be 1-5 or null", 400);
      }
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return errorResponse("tags must be an array of strings", 400);
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (triageStatus !== undefined) {
updates.triage_status = triageStatus;
}
    if (priorityOverride !== undefined) {
updates.priority_override = priorityOverride;
}
    if (owner !== undefined) {
updates.owner = owner;
}
    if (notes !== undefined) {
updates.notes = notes;
}
    if (tags !== undefined) {
updates.tags = tags;
}

    if (Object.keys(updates).length === 0) {
      return errorResponse("No updates provided", 400);
    }

    // Update and return
    const triage = await updateTriageState(
      workspace.id,
      incidentId,
      updates,
      user.email || user.id
    );

    return successResponse({
      incidentId,
      triageState: triage,
      updated: true,
    });
  } catch (error: any) {
    console.error("[API] /guardian/ai/incidents/triage/[id] PATCH error:", error);
    return errorResponse(error.message || "Failed to update triage state", 500);
  }
}
