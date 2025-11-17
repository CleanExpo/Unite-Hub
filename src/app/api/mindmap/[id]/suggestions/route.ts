/**
 * AI Suggestions API
 * Endpoint: /api/mindmap/[id]/suggestions
 *
 * GET - List suggestions
 * PUT - Update suggestion status (accept/dismiss)
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

    const { id: mindmapId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

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

    // Fetch suggestions
    let query = supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", mindmapId)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: suggestions, error: suggestionsError } = await query;

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError);
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: suggestions || [],
    });
  } catch (error) {
    console.error("GET /api/mindmap/[id]/suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const { id: mindmapId } = await params;
    const body = await request.json();

    if (!body.suggestion_id || !body.action) {
      return NextResponse.json(
        { error: "Missing required fields: suggestion_id, action" },
        { status: 400 }
      );
    }

    if (!["accept", "dismiss", "apply"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be: accept, dismiss, or apply" },
        { status: 400 }
      );
    }

    const user = await validateUserAuth(request);
    const supabase = await getSupabaseServer();

    // Verify suggestion exists and user has access
    const { data: existing, error: checkError } = await supabase
      .from("ai_suggestions")
      .select(`
        *,
        mindmap:project_mindmaps!inner(id, workspace_id)
      `)
      .eq("id", body.suggestion_id)
      .eq("mindmap_id", mindmapId)
      .eq("mindmap.workspace_id", user.workspaceId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Update suggestion status
    const updates: any = {
      status: body.action === "accept" ? "accepted" : body.action === "dismiss" ? "dismissed" : "applied",
    };

    if (body.action === "dismiss") {
      updates.dismissed_at = new Date().toISOString();
    } else if (body.action === "apply" || body.action === "accept") {
      updates.applied_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("ai_suggestions")
      .update(updates)
      .eq("id", body.suggestion_id)
      .select()
      .single();

    if (updateError) {
      console.error("Suggestion update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update suggestion" },
        { status: 500 }
      );
    }

    // If applying suggestion, potentially create/update nodes based on suggestion type
    if (body.action === "apply") {
      await applySuggestion(existing, mindmapId, supabase);
    }

    // Log to audit
    await supabase.from("auditLogs").insert({
      action: `mindmap_suggestion_${body.action}ed`,
      details: {
        mindmap_id: mindmapId,
        suggestion_id: body.suggestion_id,
        suggestion_type: existing.suggestion_type,
        action: body.action,
        by_user: user.userId,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/mindmap/[id]/suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Apply a suggestion by creating/updating nodes
 */
async function applySuggestion(suggestion: any, mindmapId: string, supabase: any) {
  try {
    // Handle different suggestion types
    switch (suggestion.suggestion_type) {
      case "add_feature":
        // Create a new feature node
        await supabase.from("mindmap_nodes").insert({
          mindmap_id: mindmapId,
          node_type: "feature",
          label: extractLabelFromSuggestion(suggestion.suggestion_text),
          description: suggestion.suggestion_text,
          status: "pending",
          priority: 5,
          ai_generated: true,
          metadata: {
            generated_from_suggestion: suggestion.id,
            suggestion_reasoning: suggestion.reasoning,
          },
        });
        break;

      case "identify_dependency":
        // If suggestion references two nodes, create a connection
        if (suggestion.node_id) {
          // Implementation would parse suggestion to find target node
          // and create a "depends_on" connection
        }
        break;

      case "clarify_requirement":
        // Update the node description with clarification
        if (suggestion.node_id) {
          const { data: node } = await supabase
            .from("mindmap_nodes")
            .select("description, metadata")
            .eq("id", suggestion.node_id)
            .single();

          if (node) {
            await supabase
              .from("mindmap_nodes")
              .update({
                description: node.description
                  ? `${node.description}\n\n**Clarification:** ${suggestion.suggestion_text}`
                  : suggestion.suggestion_text,
                metadata: {
                  ...node.metadata,
                  clarification_added: new Date().toISOString(),
                  clarification_from_suggestion: suggestion.id,
                },
              })
              .eq("id", suggestion.node_id);
          }
        }
        break;

      // Other suggestion types can be implemented similarly
      default:
        console.log(`Suggestion type ${suggestion.suggestion_type} has no automatic action`);
    }
  } catch (error) {
    console.error("Failed to apply suggestion:", error);
    // Don't throw - suggestion was marked as applied even if action failed
  }
}

/**
 * Extract a concise label from suggestion text
 */
function extractLabelFromSuggestion(text: string): string {
  // Simple heuristic: take first sentence, limit to 50 chars
  const firstSentence = text.split(".")[0];
  return firstSentence.length > 50
    ? firstSentence.substring(0, 47) + "..."
    : firstSentence;
}
