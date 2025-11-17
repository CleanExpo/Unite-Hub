/**
 * Mindmap Nodes API - Create nodes
 * Path: /api/mindmap/[mindmapId]/nodes
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { enrichNode } from "@/lib/agents/mindmap-analysis";

export async function POST(
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

    // Validate required fields
    if (!body.node_type || !body.label) {
      return NextResponse.json(
        { error: "node_type and label are required" },
        { status: 400 }
      );
    }

    // Get mindmap to verify access and get project context
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("*, projects(title, description)")
      .eq("id", mindmapId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Enrich node if description is minimal and AI enrichment is requested
    let enrichedData = null;
    if (body.ai_enrich && (!body.description || body.description.length < 20)) {
      try {
        const projectContext = (mindmap as any).projects?.description || "";
        enrichedData = await enrichNode(
          body.label,
          body.description || null,
          projectContext
        );
      } catch (error) {
        console.warn("AI enrichment failed:", error);
        // Continue without enrichment
      }
    }

    // Create node
    const { data: node, error: nodeError } = await supabase
      .from("mindmap_nodes")
      .insert({
        mindmap_id: mindmapId,
        parent_id: body.parent_id || null,
        node_type: body.node_type,
        label: body.label,
        description: enrichedData?.expanded_description || body.description || null,
        position_x: body.position_x || 0,
        position_y: body.position_y || 0,
        color: body.color || null,
        icon: body.icon || null,
        status: body.status || "pending",
        priority: body.priority || 0,
        metadata: {
          ...body.metadata,
          ...(enrichedData
            ? {
                ai_enriched: true,
                technical_requirements: enrichedData.technical_requirements,
                estimated_complexity: enrichedData.estimated_complexity,
                dependencies: enrichedData.dependencies,
              }
            : {}),
        },
        ai_generated: body.ai_generated || false,
      })
      .select()
      .single();

    if (nodeError || !node) {
      return NextResponse.json(
        { error: "Failed to create node" },
        { status: 500 }
      );
    }

    // Update mindmap version
    await supabase
      .from("project_mindmaps")
      .update({
        version: (mindmap.version || 1) + 1,
        last_updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mindmapId);

    return NextResponse.json({
      node,
      enrichment: enrichedData,
      message: "Node created successfully",
    });
  } catch (error) {
    console.error("POST /api/mindmap/[mindmapId]/nodes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
