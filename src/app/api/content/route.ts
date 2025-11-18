import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import {
  successResponse,
  errorResponse,
  validateUUID,
  validateEnum,
  parsePagination,
  createPaginationMeta,
  parseSorting
} from "@/lib/api-helpers";

/**
 * GET /api/content
 *
 * Fetch generated content for a workspace with pagination, filtering, and sorting
 *
 * Query parameters:
 * - workspace: UUID (required) - Workspace ID to filter by
 * - status: string (optional) - Filter by status (draft, approved, sent)
 * - type: string (optional) - Filter by content_type (followup, proposal, case_study)
 * - contactId: UUID (optional) - Filter by contact ID
 * - page: number (optional) - Page number (default: 1)
 * - pageSize: number (optional) - Items per page (default: 20, max: 100)
 * - sortBy: string (optional) - Sort field (default: created_at)
 * - sortOrder: asc|desc (optional) - Sort direction (default: desc)
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Get query parameters
    const workspaceId = req.nextUrl.searchParams.get("workspace");
    const status = req.nextUrl.searchParams.get("status");
    const contentType = req.nextUrl.searchParams.get("type");
    const contactId = req.nextUrl.searchParams.get("contactId");

    // Validate required parameters
    if (!workspaceId) {
      return errorResponse("Missing required parameter: workspace", 400);
    }

    if (!validateUUID(workspaceId)) {
      return errorResponse("Invalid workspace ID format", 400);
    }

    // Validate optional UUID parameters
    if (contactId && !validateUUID(contactId)) {
      return errorResponse("Invalid contactId format", 400);
    }

    // Validate enum values
    if (status) {
      const statusError = validateEnum({ status }, { status: ["draft", "approved", "sent"] });
      if (statusError) {
        return errorResponse(statusError.status, 400);
      }
    }

    if (contentType) {
      const typeError = validateEnum({ contentType }, { contentType: ["followup", "proposal", "case_study"] });
      if (typeError) {
        return errorResponse(typeError.contentType, 400);
      }
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
      allowedFields: ["created_at", "updated_at", "title", "status"],
      defaultField: "created_at",
      defaultOrder: "desc",
    });

    // Build query with optimized select
    const supabase = await getSupabaseServer();
    let query = supabase
      .from("generated_content")
      .select(`
        id,
        contact_id,
        title,
        content_type,
        generated_text,
        ai_model,
        status,
        created_at,
        updated_at,
        contacts!inner (
          id,
          name,
          email,
          company
        )
      `, { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (status) {
      query = query.eq("status", status);
    }
    if (contentType) {
      query = query.eq("content_type", contentType);
    }
    if (contactId) {
      query = query.eq("contact_id", contactId);
    }

    const { data: content, error, count } = await query;

    if (error) {
      console.error("[api/content] Error fetching content:", error);
      return errorResponse("Failed to fetch content", 500, error.message);
    }

    // Create pagination metadata
    const meta = createPaginationMeta(content?.length || 0, count || 0, page, pageSize);

    return successResponse(content || [], meta);
  } catch (error: any) {
    console.error("[api/content] Error:", error);

    if (error.message?.includes("Unauthorized")) {
      return errorResponse("Unauthorized", 401);
    }
    if (error.message?.includes("Forbidden")) {
      return errorResponse("Access denied", 403);
    }

    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch content",
      500
    );
  }
}

/**
 * POST /api/content
 *
 * Create new generated content
 *
 * Body:
 * - workspaceId: UUID (required)
 * - contactId: UUID (required)
 * - title: string (required, 1-500 chars)
 * - contentType: "followup" | "proposal" | "case_study" (required)
 * - generatedText: string (required)
 * - aiModel: string (required) - e.g., "claude-opus-4"
 * - status: "draft" | "approved" | "sent" (optional, defaults to "draft")
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const {
      workspaceId,
      contactId,
      title,
      contentType,
      generatedText,
      aiModel,
      status = "draft",
    } = body;

    // Validate required fields
    const requiredErrors = validateRequired(body, [
      "workspaceId",
      "contactId",
      "title",
      "contentType",
      "generatedText",
      "aiModel",
    ]);

    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    // Validate UUID formats
    if (!validateUUID(workspaceId)) {
      return validationError({ workspaceId: "Invalid workspace ID format" });
    }
    if (!validateUUID(contactId)) {
      return validationError({ contactId: "Invalid contact ID format" });
    }

    // Validate enum values
    const enumErrors = combineValidationErrors(
      validateEnum({ contentType }, { contentType: ["followup", "proposal", "case_study"] }),
      validateEnum({ status }, { status: ["draft", "approved", "sent"] })
    );

    if (enumErrors) {
      return validationError(enumErrors);
    }

    // Validate length constraints
    const lengthErrors = validateLength(body, {
      title: { min: 1, max: 500 },
      generatedText: { min: 10, max: 50000 },
    });

    if (lengthErrors) {
      return validationError(lengthErrors);
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, workspaceId);

    // Verify contact exists and belongs to workspace
    const supabase = await getSupabaseServer();
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    if (contactError || !contact) {
      return notFoundError("Contact");
    }

    // Insert content
    const { data: newContent, error: insertError } = await supabase
      .from("generated_content")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        title,
        content_type: contentType,
        generated_text: generatedText,
        ai_model: aiModel,
        status,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[api/content] Error creating content:", insertError);
      return errorResponse("Failed to create content", 500, insertError.message);
    }

    return successResponse(newContent, undefined, "Content created successfully", 201);
  } catch (error: any) {
    console.error("[api/content] Error:", error);

    if (error.message?.includes("Unauthorized")) {
      return errorResponse("Unauthorized", 401);
    }
    if (error.message?.includes("Forbidden")) {
      return errorResponse("Access denied", 403);
    }

    return errorResponse(
      error instanceof Error ? error.message : "Failed to create content",
      500
    );
  }
}

/**
 * PATCH /api/content
 *
 * Update existing generated content
 *
 * Body:
 * - contentId: UUID (required)
 * - workspaceId: UUID (required) - For verification
 * - title: string (optional)
 * - generatedText: string (optional)
 * - status: "draft" | "approved" | "sent" (optional)
 */
export async function PATCH(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { contentId, workspaceId, title, generatedText, status } = body;

    // Validate required fields
    if (!contentId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: contentId, workspaceId" },
        { status: 400 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (generatedText !== undefined) updates.generated_text = generatedText;
    if (status !== undefined) {
      const validStatuses = ["draft", "approved", "sent"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update content (workspace_id filter ensures user can only update their own content)
    const supabase = await getSupabaseServer();
    const { data: updatedContent, error: updateError } = await supabase
      .from("generated_content")
      .update(updates)
      .eq("id", contentId)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error("[api/content] Error updating content:", updateError);
      return NextResponse.json(
        { error: "Failed to update content or content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      content: updatedContent,
      message: "Content updated successfully",
    });
  } catch (error: any) {
    console.error("[api/content] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content
 *
 * Delete generated content
 *
 * Query parameters:
 * - contentId: UUID (required)
 * - workspaceId: UUID (required) - For verification
 */
export async function DELETE(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const contentId = req.nextUrl.searchParams.get("contentId");
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    // Validate required parameters
    if (!contentId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required parameters: contentId, workspaceId" },
        { status: 400 }
      );
    }

    // Delete content (workspace_id filter ensures user can only delete their own content)
    const supabase = await getSupabaseServer();
    const { error: deleteError } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", contentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      console.error("[api/content] Error deleting content:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete content or content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Content deleted successfully",
    });
  } catch (error: any) {
    console.error("[api/content] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content" },
      { status: 500 }
    );
  }
}
