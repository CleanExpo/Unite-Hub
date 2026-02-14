import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import {
  successResponse,
  errorResponse,
  validationError,
} from "@/lib/api-helpers";
import { sanitizeObject } from "@/lib/sanitize";

/**
 * GET /api/pipeline/stages
 * Get all pipeline stages for a workspace, ordered by position
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - includeDealCounts: If "true", includes count of deals per stage
 */
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return validationError({ workspaceId: "workspaceId parameter is required" });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const supabase = await getSupabaseServer();

    const includeDealCounts = req.nextUrl.searchParams.get("includeDealCounts") === "true";

    if (includeDealCounts) {
      // Fetch stages with deal counts and total values
      const { data: stages, error } = await supabase
        .from("pipeline_stages")
        .select(
          `id, name, position, color, is_won, is_lost, created_at, updated_at,
           deals(id, value, status)`
        )
        .eq("workspace_id", workspaceId)
        .order("position", { ascending: true });

      if (error) {
        console.error("[pipeline-stages] Error fetching stages:", error);
        return errorResponse("Failed to fetch pipeline stages", 500, error.message);
      }

      // Transform to include computed counts
      const stagesWithCounts = (stages || []).map((stage: any) => {
        const openDeals = stage.deals?.filter((d: any) => d.status === "open") || [];
        return {
          id: stage.id,
          name: stage.name,
          position: stage.position,
          color: stage.color,
          is_won: stage.is_won,
          is_lost: stage.is_lost,
          created_at: stage.created_at,
          updated_at: stage.updated_at,
          deal_count: openDeals.length,
          total_value: openDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.value) || 0), 0),
        };
      });

      return successResponse({ stages: stagesWithCounts });
    }

    // Simple fetch without deal counts
    const { data: stages, error } = await supabase
      .from("pipeline_stages")
      .select("id, name, position, color, is_won, is_lost, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true });

    if (error) {
      console.error("[pipeline-stages] Error fetching stages:", error);
      return errorResponse("Failed to fetch pipeline stages", 500, error.message);
    }

    return successResponse({ stages: stages || [] });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[pipeline-stages] Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/pipeline/stages
 * Create a new pipeline stage
 *
 * Required: workspaceId, name
 * Optional: color, is_won, is_lost, position (auto-calculated if omitted)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody, ["name", "color"], 200);

    const { workspaceId, name, color = "#3B82F6", is_won = false, is_lost = false, position } = body;

    const errors: Record<string, string> = {};
    if (!workspaceId) errors.workspaceId = "workspaceId is required";
    if (!name || name.trim() === "") errors.name = "name is required";
    if (is_won && is_lost) errors.is_won = "a stage cannot be both won and lost";

    if (Object.keys(errors).length > 0) return validationError(errors);

    await validateUserAndWorkspace(req, workspaceId);
    const supabase = await getSupabaseServer();

    // If position not provided, place at the end
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const { data: maxStage } = await supabase
        .from("pipeline_stages")
        .select("position")
        .eq("workspace_id", workspaceId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      finalPosition = (maxStage?.position ?? -1) + 1;
    }

    const { data: stage, error } = await supabase
      .from("pipeline_stages")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        position: finalPosition,
        color,
        is_won,
        is_lost,
      })
      .select()
      .single();

    if (error) {
      console.error("[pipeline-stages] Error creating stage:", error);
      return errorResponse("Failed to create pipeline stage", 500, error.message);
    }

    return successResponse({ stage }, undefined, "Pipeline stage created successfully", 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[pipeline-stages] Unexpected error creating stage:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/pipeline/stages
 * Update stage order, names, or colors (bulk update)
 *
 * Body: { workspaceId, stages: [{ id, name?, position?, color?, is_won?, is_lost? }] }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, stages } = body;

    if (!workspaceId) return validationError({ workspaceId: "workspaceId is required" });
    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return validationError({ stages: "stages array is required" });
    }

    await validateUserAndWorkspace(req, workspaceId);
    const supabase = await getSupabaseServer();

    // Validate all stages belong to this workspace
    const stageIds = stages.map((s: any) => s.id);
    const { data: existingStages, error: fetchError } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("workspace_id", workspaceId)
      .in("id", stageIds);

    if (fetchError) {
      return errorResponse("Failed to validate stages", 500);
    }

    const existingIds = new Set(existingStages?.map((s: any) => s.id) || []);
    const invalidIds = stageIds.filter((id: string) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return errorResponse(`Stages not found in workspace: ${invalidIds.join(", ")}`, 404);
    }

    // Update each stage
    const updatePromises = stages.map(async (stage: any) => {
      const updateFields: Record<string, any> = {};

      if (stage.name !== undefined) updateFields.name = sanitizeObject({ name: stage.name }, ["name"], 200).name;
      if (stage.position !== undefined) updateFields.position = stage.position;
      if (stage.color !== undefined) updateFields.color = stage.color;
      if (stage.is_won !== undefined) updateFields.is_won = stage.is_won;
      if (stage.is_lost !== undefined) updateFields.is_lost = stage.is_lost;
      updateFields.updated_at = new Date().toISOString();

      return supabase
        .from("pipeline_stages")
        .update(updateFields)
        .eq("id", stage.id)
        .eq("workspace_id", workspaceId);
    });

    const results = await Promise.all(updatePromises);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("[pipeline-stages] Errors updating stages:", errors);
      return errorResponse("Some stages failed to update", 500);
    }

    // Return updated stages
    const { data: updatedStages } = await supabase
      .from("pipeline_stages")
      .select("id, name, position, color, is_won, is_lost, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true });

    return successResponse({ stages: updatedStages || [] }, undefined, "Pipeline stages updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[pipeline-stages] Unexpected error updating stages:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/pipeline/stages
 * Delete a pipeline stage (only if no deals are in it)
 *
 * Query Parameters:
 * - workspaceId (required)
 * - stageId (required): Stage to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const stageId = req.nextUrl.searchParams.get("stageId");

    if (!workspaceId) return validationError({ workspaceId: "workspaceId parameter is required" });
    if (!stageId) return validationError({ stageId: "stageId parameter is required" });

    await validateUserAndWorkspace(req, workspaceId);
    const supabase = await getSupabaseServer();

    // Check if any deals are in this stage
    const { count } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("stage_id", stageId)
      .eq("workspace_id", workspaceId);

    if (count && count > 0) {
      return errorResponse(
        `Cannot delete stage: ${count} deal(s) are still in this stage. Move or delete them first.`,
        409
      );
    }

    const { error } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", stageId)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("[pipeline-stages] Error deleting stage:", error);
      return errorResponse("Failed to delete pipeline stage", 500, error.message);
    }

    return successResponse(null, undefined, "Pipeline stage deleted successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[pipeline-stages] Unexpected error deleting stage:", error);
    return errorResponse("Internal server error", 500);
  }
}
