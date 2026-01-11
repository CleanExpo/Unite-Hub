/**
 * @fileoverview E46 Coherence Matrix API
 * GET: List nodes and edges, get summary
 * POST: Record node or edge
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listCoherenceNodes,
  listCoherenceEdges,
  recordCoherenceNode,
  recordCoherenceEdge,
  getCoherenceSummary,
} from "@/lib/founder/coherenceService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Summary action
    if (action === "summary") {
      const summary = await getCoherenceSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Nodes action
    if (action === "nodes") {
      const nodes = await listCoherenceNodes(workspaceId);
      return NextResponse.json({ nodes });
    }

    // Default: List edges
    const health = searchParams.get("health") as any;
    const limit = parseInt(searchParams.get("limit") || "300");
    const edges = await listCoherenceEdges(workspaceId, { health, limit });
    return NextResponse.json({ edges });
  } catch (error: any) {
    console.error("[coherence] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    // Record node
    if (action === "node") {
      const nodeId = await recordCoherenceNode({
        tenantId: workspaceId,
        systemCode: body.systemCode,
        systemName: body.systemName,
        description: body.description,
        metadata: body.metadata,
      });
      return NextResponse.json({ nodeId });
    }

    // Default: Record edge
    const edgeId = await recordCoherenceEdge({
      tenantId: workspaceId,
      sourceSystem: body.sourceSystem,
      targetSystem: body.targetSystem,
      edgeType: body.edgeType,
      coherenceScore: body.coherenceScore,
      driftScore: body.driftScore,
      health: body.health,
      metadata: body.metadata,
    });

    return NextResponse.json({ edgeId });
  } catch (error: any) {
    console.error("[coherence] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
