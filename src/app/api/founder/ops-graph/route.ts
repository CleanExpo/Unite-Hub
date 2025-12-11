/**
 * @fileoverview F01 Founder Daily Ops Graph API
 * GET: List streams, list nodes, get summary
 * POST: Record stream or node
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listOpsStreams,
  listOpsNodes,
  recordOpsStream,
  recordOpsNode,
  getOpsSummary,
} from "@/lib/founder/opsGraphService";

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
      const summary = await getOpsSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Streams action
    if (action === "streams") {
      const streams = await listOpsStreams(workspaceId);
      return NextResponse.json({ streams });
    }

    // Default: List nodes
    const streamCode = searchParams.get("streamCode") || undefined;
    const state = searchParams.get("state") as any;
    const category = searchParams.get("category") as any;
    const limit = parseInt(searchParams.get("limit") || "500");

    const nodes = await listOpsNodes(workspaceId, {
      streamCode,
      state,
      category,
      limit,
    });

    return NextResponse.json({ nodes });
  } catch (error: any) {
    console.error("[ops-graph] GET error:", error);
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

    // Record stream
    if (action === "stream") {
      const streamId = await recordOpsStream({
        tenantId: workspaceId,
        streamCode: body.streamCode,
        streamName: body.streamName,
        description: body.description,
        metadata: body.metadata,
      });
      return NextResponse.json({ streamId });
    }

    // Default: Record node
    const nodeId = await recordOpsNode({
      tenantId: workspaceId,
      streamCode: body.streamCode,
      nodeCode: body.nodeCode,
      label: body.label,
      category: body.category,
      state: body.state,
      importance: body.importance,
      metadata: body.metadata,
    });

    return NextResponse.json({ nodeId });
  } catch (error: any) {
    console.error("[ops-graph] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
