import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/content
 *
 * Fetch generated content for a workspace
 *
 * Query parameters:
 * - workspace: UUID (required) - Workspace ID to filter by
 * - status: string (optional) - Filter by status (draft, approved, sent)
 * - type: string (optional) - Filter by content_type (followup, proposal, case_study)
 * - contactId: UUID (optional) - Filter by contact ID
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    // Get authenticated user (supports both bearer token and session)
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

    // Get query parameters
    const workspaceId = req.nextUrl.searchParams.get("workspace");
    const status = req.nextUrl.searchParams.get("status");
    const contentType = req.nextUrl.searchParams.get("type");
    const contactId = req.nextUrl.searchParams.get("contactId");

    // Validate required parameters
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing required parameter: workspace" },
        { status: 400 }
      );
    }

    // Build query
    const supabase = await getSupabaseServer();
    let query = supabase
      .from("generated_content")
      .select(`
        id,
        workspace_id,
        contact_id,
        title,
        content_type,
        generated_text,
        ai_model,
        status,
        created_at,
        updated_at,
        contacts (
          id,
          name,
          email,
          company
        )
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

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

    const { data: content, error } = await query;

    if (error) {
      console.error("[api/content] Error fetching content:", error);
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: content || [],
      count: content?.length || 0,
    });
  } catch (error: any) {
    console.error("[api/content] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch content" },
      { status: 500 }
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
 * - title: string (required)
 * - contentType: "followup" | "proposal" | "case_study" (required)
 * - generatedText: string (required)
 * - aiModel: string (required) - e.g., "claude-opus-4"
 * - status: "draft" | "approved" | "sent" (optional, defaults to "draft")
 */
export async function POST(req: NextRequest) {
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
    if (!workspaceId || !contactId || !title || !contentType || !generatedText || !aiModel) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: workspaceId, contactId, title, contentType, generatedText, aiModel",
        },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ["followup", "proposal", "case_study"];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["draft", "approved", "sent"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify contact exists and belongs to workspace
    const supabase = await getSupabaseServer();
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Failed to create content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: newContent,
      message: "Content created successfully",
    }, { status: 201 });
  } catch (error: any) {
    console.error("[api/content] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content" },
      { status: 500 }
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
