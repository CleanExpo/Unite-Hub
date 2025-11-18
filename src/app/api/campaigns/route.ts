import { NextRequest, NextResponse } from "next/server";
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

/**
 * GET /api/campaigns
 * List all campaigns for a workspace with pagination, filtering, and sorting
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - status: Filter by status (eq) - draft, scheduled, active, completed, paused
 * - sortBy: Sort field (name|created_at|scheduled_at|status, default: created_at)
 * - sortOrder: Sort direction (asc|desc, default: desc)
 *
 * Performance: Uses indexed queries, selective field loading, pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Get workspace ID from query params
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return validationError({ workspaceId: "workspaceId parameter is required" });
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, workspaceId);

    // Parse pagination parameters
    const { limit, offset, page, pageSize } = parsePagination(req.nextUrl.searchParams, {
      pageSize: 20,
      maxPageSize: 100,
    });

    // Parse sorting parameters
    const { sortBy, sortOrder } = parseSorting(req.nextUrl.searchParams, {
      allowedFields: ["name", "created_at", "scheduled_at", "status", "subject"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    // Parse filter parameters
    const filterConfig = {
      status: "eq" as const,
      name: "ilike" as const,
    };
    const filters = parseQueryFilters(req.nextUrl.searchParams, filterConfig);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Build query with selective field loading (reduces response size)
    let query = supabase
      .from("campaigns")
      .select(
        "id, name, subject, status, scheduled_at, created_at, updated_at, created_by",
        { count: "exact" }
      )
      .eq("workspace_id", workspaceId);

    // Apply filters
    query = applyQueryFilters(query, filters);

    // Apply sorting and pagination
    const { data: campaigns, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching campaigns:", error);
      return errorResponse("Failed to fetch campaigns", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(
      campaigns?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse(
      { campaigns: campaigns || [] },
      meta,
      undefined,
      200
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Access denied", 403);
      }
    }
    console.error("Unexpected error in /api/campaigns:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign with validation
 *
 * Required fields: workspaceId, name, subject
 * Optional fields: content, status, scheduled_at
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      name,
      subject,
      content,
      status = "draft",
      scheduled_at,
    } = body;

    // Comprehensive validation
    const requiredErrors = {
      ...((!workspaceId || workspaceId.trim() === "") && { workspaceId: "workspaceId is required" }),
      ...((!name || name.trim() === "") && { name: "name is required" }),
      ...((!subject || subject.trim() === "") && { subject: "subject is required" }),
    };

    if (Object.keys(requiredErrors).length > 0) {
      return validationError(requiredErrors);
    }

    // Validate status enum
    const validStatuses = ["draft", "scheduled", "active", "completed", "paused"];
    if (status && !validStatuses.includes(status)) {
      return validationError({
        status: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Validate user authentication and workspace access
    const user = await validateUserAndWorkspace(req, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Create campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        subject: subject.trim(),
        content: content?.trim() || "",
        status,
        scheduled_at,
        created_by: user.userId, // Track creator
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return errorResponse("Failed to create campaign", 500, error.message);
    }

    return successResponse({ campaign }, undefined, "Campaign created successfully", 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Access denied", 403);
      }
    }
    console.error("Unexpected error in POST /api/campaigns:", error);
    return errorResponse("Internal server error", 500);
  }
}
