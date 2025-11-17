/**
 * AI Suggestions API - Accept/Dismiss individual suggestions
 * Path: /api/mindmap/suggestions/[suggestionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate action
    if (!["accepted", "dismissed", "applied"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: accepted, dismissed, or applied" },
        { status: 400 }
      );
    }

    // Update suggestion status
    const updates: any = {
      status: body.status,
    };

    if (body.status === "applied") {
      updates.applied_at = new Date().toISOString();
    } else if (body.status === "dismissed") {
      updates.dismissed_at = new Date().toISOString();
    }

    const { data: suggestion, error: updateError } = await supabase
      .from("ai_suggestions")
      .update(updates)
      .eq("id", suggestionId)
      .select()
      .single();

    if (updateError || !suggestion) {
      return NextResponse.json(
        { error: "Failed to update suggestion" },
        { status: 500 }
      );
    }

    // Log action to audit logs
    await supabase.from("auditLogs").insert({
      action: `suggestion_${body.status}`,
      details: {
        suggestion_id: suggestionId,
        mindmap_id: suggestion.mindmap_id,
        suggestion_type: suggestion.suggestion_type,
        confidence_score: suggestion.confidence_score,
      },
    });

    return NextResponse.json({
      suggestion,
      message: `Suggestion ${body.status} successfully`,
    });
  } catch (error) {
    console.error("PUT /api/mindmap/suggestions/[suggestionId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Apply suggestion based on type
    let appliedResult = null;

    if (suggestion.suggestion_type === "add_feature") {
      // Create a new node based on suggestion
      const { data: newNode, error: nodeError } = await supabase
        .from("mindmap_nodes")
        .insert({
          mindmap_id: suggestion.mindmap_id,
          parent_id: suggestion.node_id || null,
          node_type: "feature",
          label: suggestion.suggestion_text,
          description: suggestion.reasoning,
          position_x: Math.random() * 400,
          position_y: Math.random() * 400,
          status: "pending",
          priority: Math.round(suggestion.confidence_score * 10),
          ai_generated: true,
          metadata: {
            generated_from_suggestion: suggestionId,
            confidence_score: suggestion.confidence_score,
          },
        })
        .select()
        .single();

      if (nodeError) {
        return NextResponse.json(
          { error: "Failed to create node from suggestion" },
          { status: 500 }
        );
      }

      appliedResult = { node_created: newNode };
    } else if (suggestion.suggestion_type === "clarify_requirement") {
      // Update the related node with clarification
      if (suggestion.node_id) {
        const { data: existingNode } = await supabase
          .from("mindmap_nodes")
          .select("description, metadata")
          .eq("id", suggestion.node_id)
          .single();

        if (existingNode) {
          await supabase
            .from("mindmap_nodes")
            .update({
              description: `${existingNode.description || ""}\n\n[AI Clarification]: ${suggestion.suggestion_text}`,
              metadata: {
                ...existingNode.metadata,
                ai_clarifications: [
                  ...(existingNode.metadata?.ai_clarifications || []),
                  {
                    text: suggestion.suggestion_text,
                    reasoning: suggestion.reasoning,
                    applied_at: new Date().toISOString(),
                  },
                ],
              },
            })
            .eq("id", suggestion.node_id);

          appliedResult = { node_updated: suggestion.node_id };
        }
      }
    }

    // Mark suggestion as applied
    await supabase
      .from("ai_suggestions")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", suggestionId);

    return NextResponse.json({
      message: "Suggestion applied successfully",
      result: appliedResult,
    });
  } catch (error) {
    console.error("POST /api/mindmap/suggestions/[suggestionId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark as dismissed instead of deleting (for audit trail)
    const { error: updateError } = await supabase
      .from("ai_suggestions")
      .update({
        status: "dismissed",
        dismissed_at: new Date().toISOString(),
      })
      .eq("id", suggestionId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to dismiss suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Suggestion dismissed successfully" });
  } catch (error) {
    console.error(
      "DELETE /api/mindmap/suggestions/[suggestionId] error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
