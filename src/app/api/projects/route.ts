import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { Project, TablesInsert } from "@/types/database";
import { apiRateLimit } from "@/lib/rate-limit";
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
 * GET /api/projects
 * Get all projects for an organization with pagination, filtering, and sorting
 *
 * Query Parameters:
 * - orgId (required): Organization ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - status: Filter by status (eq)
 * - category: Filter by category (eq)
 * - priority: Filter by priority (eq)
 * - sortBy: Sort field (created_at|due_date|priority, default: created_at)
 * - sortOrder: Sort direction (asc|desc, default: desc)
 *
 * Performance: Uses indexed queries, selective field loading, pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return validationError({ orgId: "Organization ID is required" });
    }

    // Parse pagination parameters
    const { limit, offset, page, pageSize } = parsePagination(searchParams, {
      pageSize: 20,
      maxPageSize: 100,
    });

    // Parse sorting parameters
    const { sortBy, sortOrder } = parseSorting(searchParams, {
      allowedFields: ["created_at", "due_date", "priority", "status", "title"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    // Parse filter parameters
    const filterConfig = {
      status: "eq" as const,
      category: "eq" as const,
      priority: "eq" as const,
      title: "ilike" as const,
    };
    const filters = parseQueryFilters(searchParams, filterConfig);

    const supabase = await getSupabaseServer();

    // Build query with selective field loading and pagination
    let query = supabase
      .from("projects")
      .select(`
        id,
        org_id,
        workspace_id,
        title,
        client_name,
        status,
        priority,
        progress,
        due_date,
        start_date,
        created_at,
        assignees:project_assignees(
          team_member:team_members(id, name, avatar_url, role)
        )
      `, { count: "exact" })
      .eq("org_id", orgId);

    // Apply filters
    query = applyQueryFilters(query, filters);

    // Apply sorting and pagination
    const { data: projects, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching projects:", error);
      return errorResponse("Failed to fetch projects", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(
      projects?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse({ projects: projects || [] }, meta);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgId,
      workspaceId,
      title,
      clientName,
      description,
      status,
      priority,
      dueDate,
      startDate,
      budgetAmount,
      assigneeIds,
    } = body;

    if (!orgId || !title || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, title, clientName" },
        { status: 400 }
      );
    }

    const newProject: TablesInsert<"projects"> = {
      org_id: orgId,
      workspace_id: workspaceId || null,
      title,
      client_name: clientName,
      description: description || null,
      status: status || "on-track",
      priority: priority || "medium",
      progress: 0,
      due_date: dueDate || null,
      start_date: startDate || null,
      completed_date: null,
      budget_amount: budgetAmount || null,
      budget_currency: "USD",
    };

    const supabase = await getSupabaseServer();
    const { data: project, error } = await supabase
      .from("projects")
      .insert(newProject)
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Assign team members if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const assignments = assigneeIds.map((teamMemberId: string) => ({
        project_id: project.id,
        team_member_id: teamMemberId,
      }));

      const { error: assignError } = await supabase
        .from("project_assignees")
        .insert(assignments);

      if (assignError) {
        console.error("Error assigning team members:", assignError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
