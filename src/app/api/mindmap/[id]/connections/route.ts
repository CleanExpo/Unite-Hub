/**
 * Mindmap Connections API
 * Endpoint: /api/mindmap/[id]/connections
 *
 * GET - List all connections
 * POST - Create new connection
 * DELETE - Delete connection
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
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId } = await params;
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify mindmap access
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("id", mindmapId)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Fetch connections
    const { data: connections, error: connectionsError } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .order("created_at", { ascending: true });

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: connections || [],
    });
  } catch (error) {
    console.error("GET /api/mindmap/[id]/connections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId } = await params;
    const body = await request.json();
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify mindmap access
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("id", mindmapId)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.source_node_id || !body.target_node_id) {
      return NextResponse.json(
        { error: "Missing required fields: source_node_id, target_node_id" },
        { status: 400 }
      );
    }

    // Verify both nodes exist and belong to this mindmap
    const { count: sourceCount } = await supabase
      .from("mindmap_nodes")
      .select("*", { count: "exact", head: true })
      .eq("id", body.source_node_id)
      .eq("mindmap_id", mindmapId);

    const { count: targetCount } = await supabase
      .from("mindmap_nodes")
      .select("*", { count: "exact", head: true })
      .eq("id", body.target_node_id)
      .eq("mindmap_id", mindmapId);

    if (sourceCount === 0 || targetCount === 0) {
      return NextResponse.json(
        { error: "One or both nodes do not exist in this mindmap" },
        { status: 400 }
      );
    }

    // Create connection
    const { data: newConnection, error: createError } = await supabase
      .from("mindmap_connections")
      .insert({
        mindmap_id: mindmapId,
        source_node_id: body.source_node_id,
        target_node_id: body.target_node_id,
        connection_type: body.connection_type || "relates_to",
        label: body.label || null,
        strength: body.strength || 5,
      })
      .select()
      .single();

    if (createError) {
      // Check if it's a unique constraint violation
      if (createError.code === "23505") {
        return NextResponse.json(
          { error: "Connection already exists" },
          { status: 409 }
        );
      }

      console.error("Connection creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_connection_created",
      details: {
        mindmap_id: mindmapId,
        connection_id: newConnection.id,
        source_node_id: body.source_node_id,
        target_node_id: body.target_node_id,
        connection_type: newConnection.connection_type,
        created_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newConnection,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mindmap/[id]/connections error:", error);
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

    const { id: mindmapId } = await params;
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json(
        { error: "Missing connectionId parameter" },
        { status: 400 }
      );
    }

    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify connection exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from("mindmap_connections")
      .select(`
        id,
        mindmap:project_mindmaps!inner(id, workspace_id)
      `)
      .eq("id", connectionId)
      .eq("mindmap_id", mindmapId)
      .eq("mindmap.workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Delete connection
    const { error: deleteError } = await supabase
      .from("mindmap_connections")
      .delete()
      .eq("id", connectionId);

    if (deleteError) {
      console.error("Connection deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete connection" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_connection_deleted",
      details: {
        mindmap_id: mindmapId,
        connection_id: connectionId,
        deleted_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Connection deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/mindmap/[id]/connections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
