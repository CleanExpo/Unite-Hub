/**
 * Synthex KGIM Extract API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * POST - AI extract concepts from text
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { aiExtractConcepts, createNode, createEdge } from "@/lib/synthex/kgimService";

/**
 * POST /api/synthex/kgim/extract
 * Extract concepts from text and optionally create nodes
 *
 * Body:
 * - tenantId: tenant ID
 * - text: text to extract concepts from
 * - auto_create: if true, automatically create nodes (default: false)
 * - source: source of the text (e.g., "document", "conversation")
 * - source_id: ID of the source
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, text, auto_create, source, source_id } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Extract concepts using AI
    const concepts = await aiExtractConcepts(text);

    if (!auto_create) {
      return NextResponse.json({ success: true, concepts });
    }

    // Create nodes for each concept
    const createdNodes = [];
    for (const concept of concepts) {
      try {
        const node = await createNode(tenantId, {
          node_key: concept.name.toLowerCase().replace(/\s+/g, "-"),
          node_name: concept.name,
          node_type: concept.type,
          description: concept.description,
          source,
          source_id,
        });
        createdNodes.push(node);
      } catch {
        // Node might already exist, skip
      }
    }

    // Create edges between related concepts (based on co-occurrence)
    const createdEdges = [];
    for (let i = 0; i < createdNodes.length; i++) {
      for (let j = i + 1; j < createdNodes.length; j++) {
        try {
          const edge = await createEdge(tenantId, {
            source_node_id: createdNodes[i].id,
            target_node_id: createdNodes[j].id,
            edge_type: "relates_to",
            weight: 0.5,
            confidence: 0.7,
          });
          createdEdges.push(edge);
        } catch {
          // Edge might already exist
        }
      }
    }

    return NextResponse.json({
      success: true,
      concepts,
      created: {
        nodes: createdNodes.length,
        edges: createdEdges.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error extracting concepts:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
