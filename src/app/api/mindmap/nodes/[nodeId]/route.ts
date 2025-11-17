/**
 * Individual Node API - Update/Delete specific node
 * Path: /api/mindmap/nodes/[nodeId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update object (only include provided fields)
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.label !== undefined) updates.label = body.label;
    if (body.description !== undefined) updates.description = body.description;
    if (body.position_x !== undefined) updates.position_x = body.position_x;
    if (body.position_y !== undefined) updates.position_y = body.position_y;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.node_type !== undefined) updates.node_type = body.node_type;

    // Update node
    const { data: node, error: updateError } = await supabase
      .from("mindmap_nodes")
      .update(updates)
      .eq("id", nodeId)
      .select()
      .single();

    if (updateError || !node) {
      return NextResponse.json(
        { error: "Failed to update node" },
        { status: 500 }
      );
    }

    // Update mindmap version
    const { data: mindmap } = await supabase
      .from("project_mindmaps")
      .select("version")
      .eq("id", node.mindmap_id)
      .single();

    if (mindmap) {
      await supabase
        .from("project_mindmaps")
        .update({
          version: (mindmap.version || 1) + 1,
          last_updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", node.mindmap_id);
    }

    return NextResponse.json({ node });
  } catch (error) {
    console.error("PUT /api/mindmap/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get node to find mindmap_id before deletion
    const { data: node } = await supabase
      .from("mindmap_nodes")
      .select("mindmap_id")
      .eq("id", nodeId)
      .single();

    // Delete node (cascade deletes children due to parent_id foreign key)
    const { error: deleteError } = await supabase
      .from("mindmap_nodes")
      .delete()
      .eq("id", nodeId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete node" },
        { status: 500 }
      );
    }

    // Update mindmap version
    if (node) {
      await supabase
        .from("project_mindmaps")
        .update({
          last_updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", node.mindmap_id);
    }

    return NextResponse.json({ message: "Node deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/mindmap/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
