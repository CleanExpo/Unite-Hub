import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { UUIDSchema, PaginationSchema } from "@/lib/validation/schemas";

/**
 * GET /api/clients/[id]/images
 * Get all generated images for a contact (client)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id: contactIdParam } = await params;

    if (!contactIdParam) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Support both contactId and clientId (legacy)
    const contactId = contactIdParam;

    // Validate contact ID
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    if (!contactIdValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact exists and get workspace
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, workspace_id")
      .eq("id", contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", contact.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const paginationValidation = PaginationSchema.safeParse({ page, limit });
    if (!paginationValidation.success) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    const startIndex = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");

    // Build query
    let query = supabase
      .from("generated_images")
      .select("*", { count: "exact" })
      .eq("contact_id", contactId);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (provider) {
      query = query.eq("provider", provider);
    }

    // Execute query with pagination
    const { data: images, error, count } = await query
      .order("created_at", { ascending: false })
      .range(startIndex, startIndex + limit - 1);

    if (error) {
      console.error("Failed to fetch images:", error);
      return NextResponse.json(
        { error: "Failed to fetch images" },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      images: images || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        status,
        provider,
      },
    });
  } catch (error: any) {
    console.error("Fetch client images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}
