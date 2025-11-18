import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { TeamMember, TablesInsert } from "@/types/database";
import { apiRateLimit } from "@/lib/rate-limit";
import {
  parsePagination,
  createPaginationMeta,
  successResponse,
  errorResponse,
  validationError,
  parseSorting,
} from "@/lib/api-helpers";

/**
 * GET /api/team
 * Get all team members for an organization with pagination and sorting
 *
 * Query Parameters:
 * - orgId (required): Organization ID
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 * - sortBy: Sort field (name|role|join_date, default: name)
 * - sortOrder: Sort direction (asc|desc, default: asc)
 *
 * Performance: Uses indexed queries, selective field loading
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

    // Parse pagination parameters (higher default for team members)
    const { limit, offset, page, pageSize } = parsePagination(searchParams, {
      pageSize: 50,
      maxPageSize: 100,
    });

    // Parse sorting parameters
    const { sortBy, sortOrder } = parseSorting(searchParams, {
      allowedFields: ["name", "role", "join_date", "email"],
      defaultField: "name",
      defaultOrder: "asc",
    });

    const supabase = await getSupabaseServer();

    // Build query with selective field loading
    const { data: teamMembers, count, error } = await supabase
      .from("team_members")
      .select(
        "id, name, role, email, phone, avatar_url, initials, capacity_hours, hours_allocated, current_projects, skills, join_date, is_active",
        { count: "exact" }
      )
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching team members:", error);
      return errorResponse("Failed to fetch team members", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(
      teamMembers?.length || 0,
      count || 0,
      page,
      pageSize
    );

    return successResponse({ teamMembers: teamMembers || [] }, meta);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/team
 * Create a new team member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, role, email, phone, avatar_url, initials, capacity_hours, skills, join_date } = body;

    if (!orgId || !name || !role || !email || !initials) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name, role, email, initials" },
        { status: 400 }
      );
    }

    const newMember: TablesInsert<"team_members"> = {
      org_id: orgId,
      name,
      role,
      email,
      phone: phone || null,
      avatar_url: avatar_url || null,
      initials,
      capacity_hours: capacity_hours || 40,
      hours_allocated: 0,
      current_projects: 0,
      skills: skills || [],
      join_date: join_date || new Date().toISOString().split("T")[0],
      is_active: true,
    };

    const supabase = await getSupabaseServer();
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .insert(newMember)
      .select()
      .single();

    if (error) {
      console.error("Error creating team member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
