/**
 * Mindmap API - Get/Update/Delete specific mindmap
 * Path: /api/mindmap/[mindmapId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { mindmapId: string } }
) {
  try {
    const { mindmapId } = params;

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get mindmap with all related data
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("*")
      .eq("id", mindmapId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Get nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .order("created_at", { ascending: true });

    if (nodesError) {
      return NextResponse.json(
        { error: "Failed to fetch nodes" },
        { status: 500 }
      );
    }

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmapId);

    if (connectionsError) {
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    // Get pending suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mindmap,
      nodes: nodes || [],
      connections: connections || [],
      suggestions: suggestions || [],
    });
  } catch (error) {
    console.error("GET /api/mindmap/[mindmapId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { mindmapId: string } }
) {
  try {
    const { mindmapId } = params;
    const body = await req.json();

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update mindmap version and last_updated_by
    const { data: updatedMindmap, error: updateError } = await supabase
      .from("project_mindmaps")
      .update({
        version: (body.version || 1) + 1,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mindmapId)
      .select()
      .single();

    if (updateError || !updatedMindmap) {
      return NextResponse.json(
        { error: "Failed to update mindmap" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mindmap: updatedMindmap,
      message: "Mindmap updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/mindmap/[mindmapId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { mindmapId: string } }
) {
  try {
    const { mindmapId } = params;

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete mindmap (cascade will handle nodes, connections, suggestions)
    const { error: deleteError } = await supabase
      .from("project_mindmaps")
      .delete()
      .eq("id", mindmapId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete mindmap" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Mindmap deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/mindmap/[mindmapId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
