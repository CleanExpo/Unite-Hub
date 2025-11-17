/**
 * Connections API - Create connections between nodes
 * Path: /api/mindmap/[mindmapId]/connections
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mindmapId: string }> }
) {
  try {
    const { mindmapId } = await params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!body.source_node_id || !body.target_node_id) {
      return NextResponse.json(
        { error: "source_node_id and target_node_id are required" },
        { status: 400 }
      );
    }

    // Verify both nodes exist and belong to this mindmap
    const { data: sourceNode } = await supabase
      .from("mindmap_nodes")
      .select("mindmap_id")
      .eq("id", body.source_node_id)
      .single();

    const { data: targetNode } = await supabase
      .from("mindmap_nodes")
      .select("mindmap_id")
      .eq("id", body.target_node_id)
      .single();

    if (
      !sourceNode ||
      !targetNode ||
      sourceNode.mindmap_id !== mindmapId ||
      targetNode.mindmap_id !== mindmapId
    ) {
      return NextResponse.json(
        { error: "Invalid node IDs or nodes not in this mindmap" },
        { status: 400 }
      );
    }

    // Create connection
    const { data: connection, error: connectionError } = await supabase
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

    if (connectionError) {
      // Check if it's a duplicate connection error
      if (connectionError.code === "23505") {
        return NextResponse.json(
          { error: "Connection already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    // Update mindmap version
    await supabase
      .from("project_mindmaps")
      .update({
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mindmapId);

    return NextResponse.json({
      connection,
      message: "Connection created successfully",
    });
  } catch (error) {
    console.error("POST /api/mindmap/[mindmapId]/connections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ mindmapId: string }> }
) {
  try {
    const { mindmapId } = await params;
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId query parameter required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete connection
    const { error: deleteError } = await supabase
      .from("mindmap_connections")
      .delete()
      .eq("id", connectionId)
      .eq("mindmap_id", mindmapId); // Ensure it belongs to this mindmap

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete connection" },
        { status: 500 }
      );
    }

    // Update mindmap version
    await supabase
      .from("project_mindmaps")
      .update({
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mindmapId);

    return NextResponse.json({ message: "Connection deleted successfully" });
  } catch (error) {
    console.error(
      "DELETE /api/mindmap/[mindmapId]/connections error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
