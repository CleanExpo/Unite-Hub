 
import type { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  parseQueryFilters,
  applyQueryFilters,
  parseSorting,
} from "@/lib/api-helpers";
import { withErrorBoundary, ValidationError, DatabaseError } from "@/lib/errors/boundaries";

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
export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Get workspace ID from query params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    throw new ValidationError("workspaceId parameter is required");
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
    throw new DatabaseError("Failed to fetch campaigns");
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
});

/**
 * POST /api/campaigns
 * Create a new campaign with validation
 *
 * Required fields: workspaceId, name, subject
 * Optional fields: content, status, scheduled_at
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
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
  const requiredErrors: Record<string, string> = {};
  if (!workspaceId || workspaceId.trim() === "") {
    requiredErrors.workspaceId = "workspaceId is required";
  }
  if (!name || name.trim() === "") {
    requiredErrors.name = "name is required";
  }
  if (!subject || subject.trim() === "") {
    requiredErrors.subject = "subject is required";
  }

  if (Object.keys(requiredErrors).length > 0) {
    throw new ValidationError("Missing required fields", requiredErrors);
  }

  // Validate status enum
  const validStatuses = ["draft", "scheduled", "active", "completed", "paused"];
  if (status && !validStatuses.includes(status)) {
    throw new ValidationError("Invalid campaign status", {
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
    throw new DatabaseError("Failed to create campaign");
  }

  return successResponse({ campaign }, undefined, "Campaign created successfully", 201);
});
