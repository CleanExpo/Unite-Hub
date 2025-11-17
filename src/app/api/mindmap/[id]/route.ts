/**
 * Mindmap API - GET/PUT/DELETE operations
 * Endpoint: /api/mindmap/[id]
 *
 * GET - Fetch complete mindmap structure
 * PUT - Update mindmap metadata
 * DELETE - Delete mindmap
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate authentication
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Fetch mindmap with workspace validation
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Fetch all nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", id)
      .order("created_at", { ascending: true });

    if (nodesError) {
      console.error("Error fetching nodes:", nodesError);
      return NextResponse.json(
        { error: "Failed to fetch nodes" },
        { status: 500 }
      );
    }

    // Fetch all connections
    const { data: connections, error: connectionsError } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", id);

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    // Fetch pending AI suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        mindmap,
        nodes: nodes || [],
        connections: connections || [],
        suggestions: suggestions || [],
      },
    });
  } catch (error) {
    console.error("GET /api/mindmap/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;
    const body = await request.json();

    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify mindmap exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Update mindmap metadata
    const { data: updated, error: updateError } = await supabase
      .from("project_mindmaps")
      .update({
        version: body.version,
        last_updated_by: user.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update mindmap" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_updated",
      details: {
        mindmap_id: id,
        updated_by: user.userId,
        changes: body,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/mindmap/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("project_mindmaps")
      .select("id, project_id")
      .eq("id", id)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Delete mindmap (cascade will delete nodes, connections, suggestions)
    const { error: deleteError } = await supabase
      .from("project_mindmaps")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete mindmap" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_deleted",
      details: {
        mindmap_id: id,
        project_id: existing.project_id,
        deleted_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Mindmap deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/mindmap/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
