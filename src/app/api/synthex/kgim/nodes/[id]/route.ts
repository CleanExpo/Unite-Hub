/**
 * Synthex KGIM Node by ID API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * GET - Get single node with connections
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { getNode, getConnectedNodes } from "@/lib/synthex/kgimService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/kgim/nodes/[id]
 * Get a single node with optional connected nodes
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const node = await getNode(id);

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    let connected = null;
    if (searchParams.get("connected") === "true") {
      const depth = parseInt(searchParams.get("depth") || "2", 10);
      connected = await getConnectedNodes(node.tenant_id, id, depth);
    }

    return NextResponse.json({
      success: true,
      node,
      ...(connected && { connected }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching node:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
