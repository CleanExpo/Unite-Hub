/**
 * Project-Mindmap Integration API
 * Path: /api/projects/[projectId]/mindmap
 *
 * Purpose: Get or create a mindmap for a specific project
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, description, workspace_id, org_id, client_name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if mindmap already exists for this project
    const { data: existingMindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("id, version, created_at, updated_at")
      .eq("project_id", projectId)
      .single();

    // If mindmap exists, return it with all related data
    if (existingMindmap && !mindmapError) {
      // Get nodes
      const { data: nodes, error: nodesError } = await supabase
        .from("mindmap_nodes")
        .select("*")
        .eq("mindmap_id", existingMindmap.id)
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
        .eq("mindmap_id", existingMindmap.id);

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
        .eq("mindmap_id", existingMindmap.id)
        .eq("status", "pending")
        .order("confidence_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (suggestionsError) {
        return NextResponse.json(
          { error: "Failed to fetch suggestions" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        exists: true,
        mindmap: existingMindmap,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          client_name: project.client_name,
        },
        nodes: nodes || [],
        connections: connections || [],
        suggestions: suggestions || [],
      });
    }

    // Mindmap doesn't exist, return project info for client to create one
    return NextResponse.json({
      exists: false,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        client_name: project.client_name,
        workspace_id: project.workspace_id,
        org_id: project.org_id,
      },
      message: "No mindmap exists for this project yet. Use POST to create one.",
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

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, description, workspace_id, org_id, client_name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if mindmap already exists
    const { data: existingMindmap } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existingMindmap) {
      return NextResponse.json(
        {
          error: "Mindmap already exists for this project",
          mindmap_id: existingMindmap.id,
        },
        { status: 409 }
      );
    }

    // Create new mindmap
    const { data: newMindmap, error: createError } = await supabase
      .from("project_mindmaps")
      .insert({
        project_id: projectId,
        workspace_id: project.workspace_id,
        org_id: project.org_id,
        version: 1,
        created_by: user.id,
        last_updated_by: user.id,
      })
      .select()
      .single();

    if (createError || !newMindmap) {
      return NextResponse.json(
        { error: "Failed to create mindmap", details: createError?.message },
        { status: 500 }
      );
    }

    // Create root node automatically
    const rootNodeLabel = project.title || "Project Root";
    const rootNodeDescription =
      project.description ||
      `Interactive mindmap for ${project.client_name}'s project`;

    const { data: rootNode, error: rootNodeError } = await supabase
      .from("mindmap_nodes")
      .insert({
        mindmap_id: newMindmap.id,
        parent_id: null,
        node_type: "project_root",
        label: rootNodeLabel,
        description: rootNodeDescription,
        position_x: 400,
        position_y: 250,
        status: "in_progress",
        priority: 10,
        ai_generated: false,
      })
      .select()
      .single();

    if (rootNodeError || !rootNode) {
      console.error("Failed to create root node:", rootNodeError);
    }

    // Log creation to audit logs
    await supabase.from("auditLogs").insert({
      action: "mindmap_created",
      details: {
        mindmap_id: newMindmap.id,
        project_id: projectId,
        project_title: project.title,
        created_by: user.id,
        root_node_id: rootNode?.id,
      },
    });

    return NextResponse.json(
      {
        message: "Mindmap created successfully",
        mindmap: newMindmap,
        rootNode: rootNode || null,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          client_name: project.client_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/[projectId]/mindmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
