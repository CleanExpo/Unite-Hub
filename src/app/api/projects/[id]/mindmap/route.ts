/**
 * Project Mindmap Initialization API
 * Endpoint: /api/projects/[id]/mindmap
 *
 * GET - Get or create mindmap for a project
 * POST - Create initial mindmap with template
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

    const { id: projectId } = await params;
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, workspace:workspaces(id, org_id)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    const projectWorkspaceId = (project.workspace as any)?.id || project.workspace_id;
    if (projectWorkspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if mindmap exists
    const { data: existingMindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (mindmapError && mindmapError.code !== "PGRST116") {
      // Error other than "not found"
      console.error("Error fetching mindmap:", mindmapError);
      return NextResponse.json(
        { error: "Failed to fetch mindmap" },
        { status: 500 }
      );
    }

    if (existingMindmap) {
      // Mindmap exists, return it with nodes and connections
      const { data: nodes } = await supabase
        .from("mindmap_nodes")
        .select("*")
        .eq("mindmap_id", existingMindmap.id);

      const { data: connections } = await supabase
        .from("mindmap_connections")
        .select("*")
        .eq("mindmap_id", existingMindmap.id);

      const { data: suggestions } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("mindmap_id", existingMindmap.id)
        .eq("status", "pending");

      return NextResponse.json({
        success: true,
        data: {
          mindmap: existingMindmap,
          nodes: nodes || [],
          connections: connections || [],
          suggestions: suggestions || [],
        },
      });
    }

    // Mindmap doesn't exist, create one with default template
    const { data: newMindmap, error: createError } = await supabase
      .from("project_mindmaps")
      .insert({
        project_id: projectId,
        workspace_id: projectWorkspaceId,
        org_id: (project.workspace as any)?.org_id || project.org_id,
        version: 1,
        created_by: user.userId,
        last_updated_by: user.userId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating mindmap:", createError);
      return NextResponse.json(
        { error: "Failed to create mindmap" },
        { status: 500 }
      );
    }

    // Create default root node
    const { data: rootNode } = await supabase
      .from("mindmap_nodes")
      .insert({
        mindmap_id: newMindmap.id,
        parent_id: null,
        node_type: "project_root",
        label: project.title || "Project Root",
        description: project.description || null,
        position_x: 0,
        position_y: 0,
        color: "#4A90E2",
        status: project.status === "completed" ? "completed" : "in_progress",
        priority: 10,
        metadata: {
          project_id: projectId,
          auto_generated: true,
        },
      })
      .select()
      .single();

    // Create default child nodes (template)
    if (rootNode) {
      const defaultNodes = [
        {
          parent_id: rootNode.id,
          node_type: "milestone",
          label: "Project Setup",
          position_x: -200,
          position_y: 150,
          color: "#5AC8FA",
          status: "completed",
          priority: 8,
        },
        {
          parent_id: rootNode.id,
          node_type: "feature",
          label: "Core Features",
          position_x: 0,
          position_y: 150,
          color: "#4CD964",
          status: "in_progress",
          priority: 9,
        },
        {
          parent_id: rootNode.id,
          node_type: "requirement",
          label: "Requirements",
          position_x: 200,
          position_y: 150,
          color: "#FFCC00",
          status: "pending",
          priority: 7,
        },
      ];

      await supabase.from("mindmap_nodes").insert(
        defaultNodes.map((node) => ({
          ...node,
          mindmap_id: newMindmap.id,
          metadata: { auto_generated: true },
        }))
      );
    }

    // Fetch all created nodes
    const { data: allNodes } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", newMindmap.id);

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_initialized",
      details: {
        mindmap_id: newMindmap.id,
        project_id: projectId,
        created_by: user.userId,
        template: "default",
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        mindmap: newMindmap,
        nodes: allNodes || [],
        connections: [],
        suggestions: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("GET /api/projects/[id]/mindmap error:", error);
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

    const { id: projectId } = await params;
    const body = await request.json();
    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, workspace:workspaces(id, org_id)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectWorkspaceId = (project.workspace as any)?.id || project.workspace_id;
    if (projectWorkspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if mindmap already exists
    const { data: existing } = await supabase
      .from("project_mindmaps")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Mindmap already exists for this project" },
        { status: 409 }
      );
    }

    // Create custom mindmap based on body.template
    const template = body.template || "default";

    // Implementation would create nodes based on template type
    // For now, redirect to GET which creates default template
    return GET(request, { params: Promise.resolve({ id: projectId }) });
  } catch (error) {
    console.error("POST /api/projects/[id]/mindmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
