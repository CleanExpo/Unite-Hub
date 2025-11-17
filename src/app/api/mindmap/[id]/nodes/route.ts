/**
 * Mindmap Nodes API
 * Endpoint: /api/mindmap/[id]/nodes
 *
 * GET - List all nodes
 * POST - Create new node
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { enrichNode } from "@/lib/agents/mindmap-analysis";

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

    // Fetch nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .order("created_at", { ascending: true });

    if (nodesError) {
      console.error("Error fetching nodes:", nodesError);
      return NextResponse.json(
        { error: "Failed to fetch nodes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: nodes || [],
    });
  } catch (error) {
    console.error("GET /api/mindmap/[id]/nodes error:", error);
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
      .select("id, project_id")
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
    if (!body.label || !body.node_type) {
      return NextResponse.json(
        { error: "Missing required fields: label, node_type" },
        { status: 400 }
      );
    }

    // Enrich node with AI if requested
    let description = body.description || null;
    let metadata = body.metadata || {};

    if (body.enrich && !body.description) {
      try {
        // Fetch project context
        const { data: project } = await supabase
          .from("projects")
          .select("title, description")
          .eq("id", mindmap.project_id)
          .single();

        const projectContext = project
          ? `${project.title}: ${project.description || ""}`
          : "";

        const enrichment = await enrichNode(
          body.label,
          body.description,
          projectContext
        );

        description = enrichment.expanded_description;
        metadata = {
          ...metadata,
          ...enrichment,
          ai_enriched: true,
        };
      } catch (enrichError) {
        console.error("Node enrichment failed:", enrichError);
        // Continue without enrichment
      }
    }

    // Create node
    const { data: newNode, error: createError } = await supabase
      .from("mindmap_nodes")
      .insert({
        mindmap_id: mindmapId,
        parent_id: body.parent_id || null,
        node_type: body.node_type,
        label: body.label,
        description,
        position_x: body.position_x || 0,
        position_y: body.position_y || 0,
        color: body.color || null,
        icon: body.icon || null,
        status: body.status || "pending",
        priority: body.priority || 0,
        metadata,
        ai_generated: body.ai_generated || false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Node creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create node" },
        { status: 500 }
      );
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_node_created",
      details: {
        mindmap_id: mindmapId,
        node_id: newNode.id,
        node_label: newNode.label,
        created_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newNode,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mindmap/[id]/nodes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
