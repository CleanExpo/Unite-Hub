import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  successResponse,
  errorResponse,
  notFoundError,
} from "@/lib/api-helpers";
import { sanitizeObject } from "@/lib/sanitize";

/**
 * GET /api/deals/[id]
 * Get deal details with contact info, stage info, and recent activities
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await validateUserAuth(req);
    const supabase = await getSupabaseServer();

    const { data: deal, error } = await supabase
      .from("deals")
      .select(
        `*, pipeline_stages!deals_stage_id_fkey(id, name, color, position, is_won, is_lost),
         contacts!deals_contact_id_fkey(id, name, email, company, phone, job_title, ai_score, tags)`
      )
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .single();

    if (error || !deal) {
      return notFoundError("Deal");
    }

    // Fetch recent activities for this deal
    const { data: activities } = await supabase
      .from("deal_activities")
      .select("*")
      .eq("deal_id", id)
      .eq("workspace_id", user.orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch all pipeline stages for the workspace (for stage progression display)
    const { data: stages } = await supabase
      .from("pipeline_stages")
      .select("id, name, color, position, is_won, is_lost")
      .eq("workspace_id", user.orgId)
      .order("position", { ascending: true });

    return successResponse({
      deal,
      activities: activities || [],
      stages: stages || [],
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deals] Error fetching deal:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/deals/[id]
 * Update a deal with automatic activity logging for stage/value/status changes
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await validateUserAuth(req);
    const supabase = await getSupabaseServer();

    const rawBody = await req.json();
    const body = sanitizeObject(rawBody, ["title", "notes", "source", "lost_reason", "currency"], 2000);

    // Fetch current deal to detect changes
    const { data: currentDeal, error: fetchError } = await supabase
      .from("deals")
      .select("*, pipeline_stages!deals_stage_id_fkey(id, name)")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .single();

    if (fetchError || !currentDeal) {
      return notFoundError("Deal");
    }

    // Build update object (only include provided fields)
    const updateFields: Record<string, any> = {};
    const allowedFields = [
      "title", "stage_id", "contact_id", "value", "currency", "probability",
      "expected_close_date", "actual_close_date", "status", "notes", "tags",
      "custom_fields", "assigned_to", "source", "lost_reason",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Validate probability if provided
    if (updateFields.probability !== undefined) {
      const prob = parseInt(updateFields.probability);
      if (isNaN(prob) || prob < 0 || prob > 100) {
        return errorResponse("probability must be between 0 and 100", 400);
      }
      updateFields.probability = prob;
    }

    // Validate value if provided
    if (updateFields.value !== undefined) {
      updateFields.value = parseFloat(updateFields.value) || 0;
    }

    // If stage is changing, validate the new stage belongs to this workspace
    if (updateFields.stage_id && updateFields.stage_id !== currentDeal.stage_id) {
      const { data: newStage, error: stageError } = await supabase
        .from("pipeline_stages")
        .select("id, name, is_won, is_lost")
        .eq("id", updateFields.stage_id)
        .eq("workspace_id", user.orgId)
        .maybeSingle();

      if (stageError || !newStage) {
        return errorResponse("Pipeline stage not found in this workspace", 404);
      }

      // Auto-set status based on stage
      if (newStage.is_won) {
        updateFields.status = "won";
        updateFields.actual_close_date = updateFields.actual_close_date || new Date().toISOString().split("T")[0];
        updateFields.probability = 100;
      } else if (newStage.is_lost) {
        updateFields.status = "lost";
        updateFields.actual_close_date = updateFields.actual_close_date || new Date().toISOString().split("T")[0];
        updateFields.probability = 0;
      }
    }

    updateFields.updated_at = new Date().toISOString();

    // Perform the update
    const { data: updatedDeal, error: updateError } = await supabase
      .from("deals")
      .update(updateFields)
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .select(
        `*, pipeline_stages!deals_stage_id_fkey(id, name, color, position, is_won, is_lost),
         contacts!deals_contact_id_fkey(id, name, email, company)`
      )
      .single();

    if (updateError) {
      console.error("[deals] Error updating deal:", updateError);
      return errorResponse("Failed to update deal", 500, updateError.message);
    }

    // Auto-log activities for key changes
    const activities: Array<{
      deal_id: string;
      workspace_id: string;
      user_id: string;
      activity_type: string;
      title: string;
      description: string;
      metadata: Record<string, any>;
    }> = [];

    // Stage change activity
    if (updateFields.stage_id && updateFields.stage_id !== currentDeal.stage_id) {
      const oldStageName = currentDeal.pipeline_stages?.name || "Unknown";
      const newStageName = updatedDeal.pipeline_stages?.name || "Unknown";
      activities.push({
        deal_id: id,
        workspace_id: user.orgId,
        user_id: user.userId,
        activity_type: "stage_change",
        title: `Stage changed: ${oldStageName} → ${newStageName}`,
        description: `Deal moved from "${oldStageName}" to "${newStageName}"`,
        metadata: { from_stage: currentDeal.stage_id, to_stage: updateFields.stage_id },
      });
    }

    // Value change activity
    if (updateFields.value !== undefined && updateFields.value !== currentDeal.value) {
      activities.push({
        deal_id: id,
        workspace_id: user.orgId,
        user_id: user.userId,
        activity_type: "value_change",
        title: `Value changed: $${currentDeal.value} → $${updateFields.value}`,
        description: `Deal value updated from $${currentDeal.value} to $${updateFields.value}`,
        metadata: { from_value: currentDeal.value, to_value: updateFields.value },
      });
    }

    // Status change activity
    if (updateFields.status && updateFields.status !== currentDeal.status) {
      activities.push({
        deal_id: id,
        workspace_id: user.orgId,
        user_id: user.userId,
        activity_type: "status_change",
        title: `Status changed: ${currentDeal.status} → ${updateFields.status}`,
        description: `Deal status updated from "${currentDeal.status}" to "${updateFields.status}"`,
        metadata: { from_status: currentDeal.status, to_status: updateFields.status },
      });
    }

    // Insert all activities
    if (activities.length > 0) {
      await supabase.from("deal_activities").insert(activities);
    }

    return successResponse({ deal: updatedDeal }, undefined, "Deal updated successfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deals] Unexpected error updating deal:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/deals/[id]
 * Delete a deal (and its activities cascade automatically)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await validateUserAuth(req);
    const supabase = await getSupabaseServer();

    // Verify deal exists and belongs to workspace
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, title")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (fetchError || !deal) {
      return notFoundError("Deal");
    }

    const { error: deleteError } = await supabase
      .from("deals")
      .delete()
      .eq("id", id)
      .eq("workspace_id", user.orgId);

    if (deleteError) {
      console.error("[deals] Error deleting deal:", deleteError);
      return errorResponse("Failed to delete deal", 500, deleteError.message);
    }

    return successResponse(null, undefined, `Deal "${deal.title}" deleted successfully`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deals] Unexpected error deleting deal:", error);
    return errorResponse("Internal server error", 500);
  }
}
