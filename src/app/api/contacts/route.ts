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
 * GET /api/contacts
 * List all contacts for a workspace with pagination, filtering, and sorting
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - status: Filter by status (eq)
 * - email: Filter by email (ilike - case insensitive partial match)
 * - ai_score: Filter by minimum AI score (gte)
 * - sortBy: Sort field (name|email|created_at|ai_score, default: created_at)
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
      allowedFields: ["name", "email", "created_at", "ai_score", "status", "company"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    // Parse filter parameters
    const filterConfig = {
      status: "eq" as const,
      email: "ilike" as const,
      ai_score: "gte" as const,
      company: "ilike" as const,
      job_title: "ilike" as const,
    };
    const filters = parseQueryFilters(req.nextUrl.searchParams, filterConfig);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Build query with selective field loading (30-50% response size reduction)
    let query = supabase
      .from("contacts")
      .select(
        "id, name, email, company, job_title, phone, status, ai_score, tags, created_at, updated_at",
        { count: "exact" }
      )
      .eq("workspace_id", workspaceId);

    // Apply filters
    query = applyQueryFilters(query, filters);

    // Apply sorting and pagination
    const { data: contacts, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching contacts:", error);
      return errorResponse("Failed to fetch contacts", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(
      contacts?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse(
      { contacts: contacts || [] },
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
    console.error("Unexpected error in /api/contacts:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/contacts
 * Create a new contact with comprehensive validation
 *
 * Required fields: workspaceId, name, email
 * Optional fields: company, job_title, phone, status, tags
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      name,
      email,
      company,
      job_title,
      phone,
      status = "new",
      tags = [],
    } = body;

    // Comprehensive validation using helpers
    const requiredErrors = {
      ...((!workspaceId || workspaceId.trim() === "") && { workspaceId: "workspaceId is required" }),
      ...((!name || name.trim() === "") && { name: "name is required" }),
      ...((!email || email.trim() === "") && { email: "email is required" }),
    };

    if (Object.keys(requiredErrors).length > 0) {
      return validationError(requiredErrors);
    }

    // Validate email format (basic validation - use validateEmail from helpers for comprehensive)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationError({ email: "Invalid email format" });
    }

    // Validate user authentication and workspace access
    const user = await validateUserAndWorkspace(req, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Check if contact with this email already exists in this workspace (indexed query)
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return errorResponse("Contact with this email already exists", 409);
    }

    // Create contact with normalized email
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        job_title: job_title?.trim() || null,
        phone: phone?.trim() || null,
        status,
        tags,
        ai_score: 0, // Initial score
        created_by: user.userId, // Track creator
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating contact:", error);
      return errorResponse("Failed to create contact", 500, error.message);
    }

    return successResponse({ contact }, undefined, "Contact created successfully", 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Access denied", 403);
      }
    }
    console.error("Unexpected error in POST /api/contacts:", error);
    return errorResponse("Internal server error", 500);
  }
}
