import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  errorResponse,
  validationError,
  parseQueryFilters,
  applyQueryFilters,
  parseSorting,
} from "@/lib/api-helpers";
import { sanitizeObject } from "@/lib/sanitize";

/**
 * GET /api/deals
 * List all deals for a workspace with pagination, filtering, and sorting
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - status: Filter by status (open, won, lost, abandoned)
 * - stage_id: Filter by pipeline stage
 * - contact_id: Filter by contact
 * - source: Filter by deal source
 * - minValue: Minimum deal value
 * - maxValue: Maximum deal value
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: Sort direction (default: desc)
 */
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return validationError({ workspaceId: "workspaceId parameter is required" });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const { limit, offset, page, pageSize } = parsePagination(req.nextUrl.searchParams, {
      pageSize: 20,
      maxPageSize: 100,
    });

    const { sortBy, sortOrder } = parseSorting(req.nextUrl.searchParams, {
      allowedFields: ["title", "value", "probability", "created_at", "updated_at", "expected_close_date", "status"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    const filterConfig = {
      status: "eq" as const,
      stage_id: "eq" as const,
      contact_id: "eq" as const,
      source: "eq" as const,
    };
    const filters = parseQueryFilters(req.nextUrl.searchParams, filterConfig);

    const supabase = await getSupabaseServer();

    // Build query with joins for contact name and stage info
    let query = supabase
      .from("deals")
      .select(
        `id, title, value, currency, probability, expected_close_date, actual_close_date,
         status, notes, tags, custom_fields, assigned_to, source, lost_reason,
         created_at, updated_at, stage_id, contact_id,
         pipeline_stages!deals_stage_id_fkey(id, name, color, position, is_won, is_lost),
         contacts!deals_contact_id_fkey(id, name, email, company)`,
        { count: "exact" }
      )
      .eq("workspace_id", workspaceId);

    // Apply standard filters
    query = applyQueryFilters(query, filters);

    // Apply value range filters manually
    const minValue = req.nextUrl.searchParams.get("minValue");
    const maxValue = req.nextUrl.searchParams.get("maxValue");
    if (minValue) query = query.gte("value", parseFloat(minValue));
    if (maxValue) query = query.lte("value", parseFloat(maxValue));

    // Search by title
    const search = req.nextUrl.searchParams.get("search");
    if (search) query = query.ilike("title", `%${search}%`);

    const { data: deals, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[deals] Error fetching deals:", error);
      return errorResponse("Failed to fetch deals", 500, error.message);
    }

    const meta = createPaginationMeta(
      deals?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse({ deals: deals || [] }, meta);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deals] Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/deals
 * Create a new deal with automatic activity logging
 *
 * Required: workspaceId, title, stage_id
 * Optional: contact_id, value, currency, probability, expected_close_date, notes, tags, source, assigned_to
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody, ["title", "notes", "source", "lost_reason", "currency"], 2000);

    const {
      workspaceId,
      title,
      stage_id,
      contact_id,
      value = 0,
      currency = "AUD",
      probability = 50,
      expected_close_date,
      notes,
      tags = [],
      custom_fields = {},
      source,
      assigned_to,
    } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!workspaceId) errors.workspaceId = "workspaceId is required";
    if (!title || title.trim() === "") errors.title = "title is required";
    if (!stage_id) errors.stage_id = "stage_id is required";
    if (probability !== undefined && (probability < 0 || probability > 100)) {
      errors.probability = "probability must be between 0 and 100";
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const user = await validateUserAndWorkspace(req, workspaceId);
    const supabase = await getSupabaseServer();

    // Verify stage belongs to this workspace
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .select("id, name")
      .eq("id", stage_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (stageError || !stage) {
      return errorResponse("Pipeline stage not found in this workspace", 404);
    }

    // Create the deal
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        stage_id,
        contact_id: contact_id || null,
        value: parseFloat(value) || 0,
        currency,
        probability: parseInt(probability) || 50,
        expected_close_date: expected_close_date || null,
        notes: notes || null,
        tags,
        custom_fields,
        source: source || null,
        assigned_to: assigned_to || null,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `*, pipeline_stages!deals_stage_id_fkey(id, name, color, position),
         contacts!deals_contact_id_fkey(id, name, email, company)`
      )
      .single();

    if (dealError) {
      console.error("[deals] Error creating deal:", dealError);
      return errorResponse("Failed to create deal", 500, dealError.message);
    }

    // Auto-log creation activity
    await supabase.from("deal_activities").insert({
      deal_id: deal.id,
      workspace_id: workspaceId,
      user_id: user.userId,
      activity_type: "note",
      title: "Deal created",
      description: `Deal "${title}" created in ${stage.name} stage`,
      metadata: { initial_value: value, initial_stage: stage.name },
    });

    return successResponse({ deal }, undefined, "Deal created successfully", 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Access denied", 403);
    }
    console.error("[deals] Unexpected error creating deal:", error);
    return errorResponse("Internal server error", 500);
  }
}
