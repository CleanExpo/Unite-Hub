/**
 * Synthex KGIM Nodes API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * POST - Create node
 * GET - List nodes
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createNode,
  listNodes,
  getStats,
  type KGIMNodeType,
} from "@/lib/synthex/kgimService";

/**
 * POST /api/synthex/kgim/nodes
 * Create a new knowledge node
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

    if (!body.node_key || !body.node_name) {
      return NextResponse.json(
        { error: "node_key and node_name are required" },
        { status: 400 }
      );
    }

    const node = await createNode(tenantId, {
      node_key: body.node_key,
      node_name: body.node_name,
      node_type: body.node_type as KGIMNodeType,
      description: body.description,
      content: body.content,
      source: body.source,
      source_id: body.source_id,
      confidence: body.confidence,
      properties: body.properties,
      tags: body.tags,
    });

    return NextResponse.json({ success: true, node });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating node:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/kgim/nodes?tenantId=xxx
 * List nodes with optional filters
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

    // Stats request
    if (searchParams.get("stats") === "true") {
      const stats = await getStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }

    const nodes = await listNodes(tenantId, {
      node_type: searchParams.get("type") as KGIMNodeType | undefined,
      is_active: searchParams.get("active") === "true" ? true : undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, nodes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching nodes:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
