/**
 * Mindmap AI Analysis API
 * Endpoint: /api/mindmap/[id]/analyze
 *
 * POST - Trigger AI analysis and generate suggestions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { analyzeMindmap, type MindmapStructure } from "@/lib/agents/mindmap-analysis";

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

    // Fetch mindmap with project info
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select(`
        *,
        project:projects(id, title, description)
      `)
      .eq("id", mindmapId)
      .eq("workspace_id", user.workspaceId)
      .single();

    if (mindmapError || !mindmap) {
      return NextResponse.json(
        { error: "Mindmap not found" },
        { status: 404 }
      );
    }

    // Fetch all nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmapId);

    if (nodesError) {
      return NextResponse.json(
        { error: "Failed to fetch nodes" },
        { status: 500 }
      );
    }

    // Fetch all connections
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

    // Prepare mindmap structure for AI analysis
    const mindmapStructure: MindmapStructure = {
      mindmap_id: mindmapId,
      project_id: mindmap.project_id,
      project_title: (mindmap.project as any)?.title || "Untitled Project",
      nodes: nodes || [],
      connections: connections || [],
    };

    // Determine analysis type
    const analysisType = body.type || "full"; // full | quick | focused
    const focusNodeId = body.focus_node_id || undefined;

    // Run AI analysis
    console.log(`🤖 Starting ${analysisType} mindmap analysis for ${mindmapId}...`);

    const analysisResult = await analyzeMindmap(
      mindmapStructure,
      analysisType,
      focusNodeId
    );

    // Store suggestions in database (using service role for bypass RLS)
    const suggestionInserts = analysisResult.suggestions.map((suggestion) => ({
      mindmap_id: mindmapId,
      node_id: suggestion.node_id || null,
      suggestion_type: suggestion.suggestion_type,
      suggestion_text: suggestion.suggestion_text,
      reasoning: suggestion.reasoning,
      confidence_score: suggestion.confidence_score,
      status: "pending",
      created_at: new Date().toISOString(),
    }));

    if (suggestionInserts.length > 0) {
      // Use service role to insert suggestions
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error: insertError } = await supabaseAdmin
        .from("ai_suggestions")
        .insert(suggestionInserts);

      if (insertError) {
        console.error("Failed to store suggestions:", insertError);
        // Continue anyway - return suggestions to client
      }
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: "mindmap_ai_analysis",
      details: {
        mindmap_id: mindmapId,
        analysis_type: analysisType,
        suggestions_count: analysisResult.suggestions.length,
        cache_hit: analysisResult.cache_stats.cache_hit,
        requested_by: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions: analysisResult.suggestions,
        insights: analysisResult.insights,
        cache_stats: analysisResult.cache_stats,
      },
    });
  } catch (error) {
    console.error("POST /api/mindmap/[id]/analyze error:", error);

    return NextResponse.json(
      {
        error: "AI analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
