import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} from "@/lib/api-helpers";
import { sanitizeObject } from "@/lib/sanitize";

/**
 * GET /api/deals/[id]/activities
 * Get activity timeline for a deal
 *
 * Query Parameters:
 * - page, pageSize: Pagination
 * - activity_type: Filter by type (note, email, call, meeting, task, stage_change, value_change, status_change)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await validateUserAuth(req);
    const supabase = await getSupabaseServer();

    // Verify deal exists and belongs to workspace
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (dealError || !deal) {
      return notFoundError("Deal");
    }

    const { limit, offset, page, pageSize } = parsePagination(req.nextUrl.searchParams, {
      pageSize: 50,
      maxPageSize: 100,
    });

    let query = supabase
      .from("deal_activities")
      .select("*", { count: "exact" })
      .eq("deal_id", id)
      .eq("workspace_id", user.orgId);

    // Filter by activity type if provided
    const activityType = req.nextUrl.searchParams.get("activity_type");
    if (activityType) {
      query = query.eq("activity_type", activityType);
    }

    const { data: activities, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[deal-activities] Error fetching activities:", error);
      return errorResponse("Failed to fetch activities", 500, error.message);
    }

    const meta = createPaginationMeta(
      activities?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse({ activities: activities || [] }, meta);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deal-activities] Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/deals/[id]/activities
 * Add an activity to a deal (note, call, meeting, email, task)
 *
 * Required: activity_type, title
 * Optional: description, metadata
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await validateUserAuth(req);
    const supabase = await getSupabaseServer();

    // Verify deal exists and belongs to workspace
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (dealError || !deal) {
      return notFoundError("Deal");
    }

    const rawBody = await req.json();
    const body = sanitizeObject(rawBody, ["title", "description"], 5000);

    const { activity_type, title, description, metadata = {} } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!activity_type) errors.activity_type = "activity_type is required";
    if (!title || title.trim() === "") errors.title = "title is required";

    const validTypes = ["note", "email", "call", "meeting", "task", "stage_change", "value_change", "status_change"];
    if (activity_type && !validTypes.includes(activity_type)) {
      errors.activity_type = `activity_type must be one of: ${validTypes.join(", ")}`;
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const { data: activity, error } = await supabase
      .from("deal_activities")
      .insert({
        deal_id: id,
        workspace_id: user.orgId,
        user_id: user.userId,
        activity_type,
        title: title.trim(),
        description: description || null,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("[deal-activities] Error creating activity:", error);
      return errorResponse("Failed to create activity", 500, error.message);
    }

    // Update deal's updated_at timestamp
    await supabase
      .from("deals")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", user.orgId);

    return successResponse({ activity }, undefined, "Activity added successfully", 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deal-activities] Unexpected error creating activity:", error);
    return errorResponse("Internal server error", 500);
  }
}
