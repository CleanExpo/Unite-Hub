/**
 * AI Analysis API - Trigger AI analysis of mindmap
 * Path: /api/mindmap/[mindmapId]/ai-analyze
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { analyzeMindmap } from "@/lib/agents/mindmap-analysis";

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

    // Get mindmap structure
    const { data: mindmap, error: mindmapError } = await supabase
      .from("project_mindmaps")
      .select("*, projects(title, description)")
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

    if (nodesError || !nodes) {
      return NextResponse.json(
        { error: "Failed to fetch nodes" },
        { status: 500 }
      );
    }

    // Get connections
    const { data: connections } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmapId);

    // Run AI analysis
    const analysisType = body.analysis_type || "full";
    const focusNodeId = body.focus_node_id || undefined;

    const analysis = await analyzeMindmap(
      {
        mindmap_id: mindmapId,
        project_id: mindmap.project_id,
        project_title: (mindmap as any).projects?.title || "Untitled Project",
        nodes,
        connections: connections || [],
      },
      analysisType as "full" | "quick" | "focused",
      focusNodeId
    );

    // Save suggestions to database (only high-confidence suggestions)
    const highConfidenceSuggestions = analysis.suggestions.filter(
      (s) => s.confidence_score >= 0.6
    );

    if (highConfidenceSuggestions.length > 0) {
      const suggestionsToInsert = highConfidenceSuggestions.map((s) => ({
        mindmap_id: mindmapId,
        node_id: s.node_id || null,
        suggestion_type: s.suggestion_type,
        suggestion_text: s.suggestion_text,
        reasoning: s.reasoning,
        confidence_score: s.confidence_score,
        status: "pending",
      }));

      const { error: insertError } = await supabase
        .from("ai_suggestions")
        .insert(suggestionsToInsert);

      if (insertError) {
        console.error("Failed to save suggestions:", insertError);
      }
    }

    // Log analysis to audit logs
    await supabase.from("auditLogs").insert({
      action: "mindmap_ai_analysis",
      details: {
        mindmap_id: mindmapId,
        analysis_type: analysisType,
        suggestions_generated: analysis.suggestions.length,
        high_confidence_count: highConfidenceSuggestions.length,
        complexity_score: analysis.insights.complexity_score,
        cache_hit: analysis.cache_stats.cache_hit,
      },
    });

    return NextResponse.json({
      suggestions: analysis.suggestions,
      insights: analysis.insights,
      cache_stats: analysis.cache_stats,
      saved_to_db: highConfidenceSuggestions.length,
    });
  } catch (error) {
    console.error("POST /api/mindmap/[mindmapId]/ai-analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mindmapId: string }> }
) {
  try {
    const { mindmapId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .eq("status", status)
      .order("confidence_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (suggestionsError) {
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      suggestions: suggestions || [],
      count: suggestions?.length || 0,
    });
  } catch (error) {
    console.error("GET /api/mindmap/[mindmapId]/ai-analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
