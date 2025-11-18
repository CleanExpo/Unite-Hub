import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { Approval, TablesInsert } from "@/types/database";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
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
 * GET /api/approvals
 * Get all approvals for an organization with pagination, filtering, and sorting
 *
 * Query Parameters:
 * - orgId (required): Organization ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - status: Filter by status (eq) - pending, approved, declined
 * - priority: Filter by priority (eq) - low, medium, high
 * - type: Filter by type (eq) - document, video, image, etc.
 * - sortBy: Sort field (created_at|priority|status, default: created_at)
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

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return validationError({ orgId: "Organization ID is required" });
    }

    // Verify org access
    if (orgId !== user.orgId) {
      return errorResponse("Access denied", 403);
    }

    // Parse pagination parameters
    const { limit, offset, page, pageSize } = parsePagination(searchParams, {
      pageSize: 20,
      maxPageSize: 100,
    });

    // Parse sorting parameters
    const { sortBy, sortOrder } = parseSorting(searchParams, {
      allowedFields: ["created_at", "priority", "status", "type", "title"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    // Parse filter parameters
    const filterConfig = {
      status: "eq" as const,
      priority: "eq" as const,
      type: "eq" as const,
      title: "ilike" as const,
    };
    const filters = parseQueryFilters(searchParams, filterConfig);

    const supabase = await getSupabaseServer();

    // Build query with selective field loading
    let query = supabase
      .from("approvals")
      .select("*", { count: "exact" })
      .eq("org_id", orgId);

    // Apply filters
    query = applyQueryFilters(query, filters);

    // Apply sorting and pagination
    const { data: approvals, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching approvals:", error);
      return errorResponse("Failed to fetch approvals", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(
      approvals?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse({ approvals: approvals || [] }, meta);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Access denied", 403);
      }
    }
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/approvals
 * Create a new approval request
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const body = await request.json();
    const {
      orgId,
      projectId,
      title,
      description,
      clientName,
      type,
      priority,
      assetUrl,
      submittedById,
      submittedByName,
    } = body;

    if (!orgId || !title || !submittedByName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, title, submittedByName" },
        { status: 400 }
      );
    }

    // Verify org access
    if (orgId !== user.orgId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const newApproval: TablesInsert<"approvals"> = {
      org_id: orgId,
      project_id: projectId || null,
      title,
      description: description || null,
      client_name: clientName || null,
      type: type || "document",
      priority: priority || "medium",
      status: "pending",
      asset_url: assetUrl || null,
      submitted_by_id: submittedById || null,
      submitted_by_name: submittedByName,
      reviewed_by_id: null,
      reviewed_at: null,
      decline_reason: null,
    };

    const supabase = await getSupabaseServer();
    const { data: approval, error } = await supabase
      .from("approvals")
      .insert(newApproval)
      .select()
      .single();

    if (error) {
      console.error("Error creating approval:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
