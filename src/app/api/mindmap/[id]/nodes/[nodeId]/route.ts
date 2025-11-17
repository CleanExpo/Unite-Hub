/**
 * Individual Mindmap Node API
 * Endpoint: /api/mindmap/[id]/nodes/[nodeId]
 *
 * GET - Get single node
 * PUT - Update node
 * DELETE - Delete node
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId, nodeId } = await params;
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Fetch node with mindmap verification
    const { data: node, error } = await supabase
      .from("mindmap_nodes")
      .select(`
        *,
        mindmap:project_mindmaps!inner(id, workspace_id)
      `)
      .eq("id", nodeId)
      .eq("mindmap_id", mindmapId)
      .eq("mindmap.workspace_id", user.workspaceId)
      .single();

    if (error || !node) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error("GET /api/mindmap/[id]/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId, nodeId } = await params;
    const body = await request.json();
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify node exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from("mindmap_nodes")
      .select(`
        id,
        mindmap:project_mindmaps!inner(id, workspace_id)
      `)
      .eq("id", nodeId)
      .eq("mindmap_id", mindmapId)
      .eq("mindmap.workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.label !== undefined) updates.label = body.label;
    if (body.description !== undefined) updates.description = body.description;
    if (body.position_x !== undefined) updates.position_x = body.position_x;
    if (body.position_y !== undefined) updates.position_y = body.position_y;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.parent_id !== undefined) updates.parent_id = body.parent_id;

    // Update node
    const { data: updated, error: updateError } = await supabase
      .from("mindmap_nodes")
      .update(updates)
      .eq("id", nodeId)
      .select()
      .single();

    if (updateError) {
      console.error("Node update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update node" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_node_updated",
      details: {
        mindmap_id: mindmapId,
        node_id: nodeId,
        changes: Object.keys(updates),
        updated_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/mindmap/[id]/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId, nodeId } = await params;
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify node exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from("mindmap_nodes")
      .select(`
        id,
        label,
        mindmap:project_mindmaps!inner(id, workspace_id)
      `)
      .eq("id", nodeId)
      .eq("mindmap_id", mindmapId)
      .eq("mindmap.workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    // Delete node (cascade will handle child nodes and connections)
    const { error: deleteError } = await supabase
      .from("mindmap_nodes")
      .delete()
      .eq("id", nodeId);

    if (deleteError) {
      console.error("Node deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete node" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_node_deleted",
      details: {
        mindmap_id: mindmapId,
        node_id: nodeId,
        node_label: (existing as any).label,
        deleted_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Node deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/mindmap/[id]/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
