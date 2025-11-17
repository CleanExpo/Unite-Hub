/**
 * Project Mindmap API - Get or create mindmap for a project
 * Path: /api/projects/[projectId]/mindmap
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create mindmap
    let { data: mindmap } = await supabase
      .from("project_mindmaps")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (!mindmap) {
      // Get project to verify it exists and get workspace/org info
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("workspace_id, org_id, title, description")
        .eq("id", projectId)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Create new mindmap
      const { data: newMindmap, error: createError } = await supabase
        .from("project_mindmaps")
        .insert({
          project_id: projectId,
          workspace_id: project.workspace_id,
          org_id: project.org_id,
          created_by: user.id,
          last_updated_by: user.id,
        })
        .select()
        .single();

      if (createError || !newMindmap) {
        return NextResponse.json(
          { error: "Failed to create mindmap" },
          { status: 500 }
        );
      }

      mindmap = newMindmap;

      // Create root node automatically
      const { error: rootNodeError } = await supabase
        .from("mindmap_nodes")
        .insert({
          mindmap_id: mindmap.id,
          parent_id: null,
          node_type: "project_root",
          label: project.title || "Project Root",
          description: project.description || "Main project node",
          position_x: 0,
          position_y: 0,
          status: "in_progress",
          priority: 10,
          metadata: {
            auto_generated: true,
            project_id: projectId,
          },
        });

      if (rootNodeError) {
        console.error("Failed to create root node:", rootNodeError);
      }
    }

    // Get nodes
    const { data: nodes } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmap.id)
      .order("created_at", { ascending: true });

    // Get connections
    const { data: connections } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmap.id);

    // Get pending suggestions
    const { data: suggestions } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", mindmap.id)
      .eq("status", "pending")
      .order("confidence_score", { ascending: false })
      .limit(10);

    return NextResponse.json({
      mindmap,
      nodes: nodes || [],
      connections: connections || [],
      suggestions: suggestions || [],
    });
  } catch (error) {
    console.error("GET /api/projects/[projectId]/mindmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing mindmap
    const { data: mindmap } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (!mindmap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Batch update nodes and connections if provided
    if (body.nodes && Array.isArray(body.nodes)) {
      for (const node of body.nodes) {
        if (node.id) {
          // Update existing node
          await supabase
            .from("mindmap_nodes")
            .update({
              position_x: node.position_x,
              position_y: node.position_y,
              label: node.label,
              description: node.description,
              status: node.status,
              priority: node.priority,
            })
            .eq("id", node.id);
        } else {
          // Create new node
          await supabase.from("mindmap_nodes").insert({
            mindmap_id: mindmap.id,
            ...node,
          });
        }
      }
    }

    // Update mindmap version
    await supabase
      .from("project_mindmaps")
      .update({
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mindmap.id);

    return NextResponse.json({
      message: "Mindmap updated successfully",
      mindmap_id: mindmap.id,
    });
  } catch (error) {
    console.error("POST /api/projects/[projectId]/mindmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
