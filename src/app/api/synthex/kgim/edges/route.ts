/**
 * Synthex KGIM Edges API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * POST - Create edge
 * GET - List edges
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { createEdge, listEdges, type KGIMEdgeType } from "@/lib/synthex/kgimService";

/**
 * POST /api/synthex/kgim/edges
 * Create a new edge between nodes
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.source_node_id || !body.target_node_id) {
      return NextResponse.json(
        { error: "source_node_id and target_node_id are required" },
        { status: 400 }
      );
    }

    const edge = await createEdge(tenantId, {
      source_node_id: body.source_node_id,
      target_node_id: body.target_node_id,
      edge_type: body.edge_type as KGIMEdgeType,
      edge_label: body.edge_label,
      weight: body.weight,
      confidence: body.confidence,
      is_bidirectional: body.is_bidirectional,
      properties: body.properties,
    });

    return NextResponse.json({ success: true, edge });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating edge:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/kgim/edges?tenantId=xxx
 * List edges with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const edges = await listEdges(tenantId, {
      source_node_id: searchParams.get("source") || undefined,
      target_node_id: searchParams.get("target") || undefined,
      edge_type: searchParams.get("type") as KGIMEdgeType | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, edges });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching edges:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
