/**
 * @fileoverview E45 Critical Path Engine API
 * GET: List paths and nodes, get summary
 * POST: Record path or node, update node state
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listCriticalPaths,
  listCriticalNodes,
  recordCriticalPath,
  recordCriticalNode,
  updateNodeState,
  getCriticalPathSummary,
} from "@/src/lib/founder/criticalPathService";

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
      const pathCode = searchParams.get("pathCode");
      if (!pathCode) {
        return NextResponse.json({ error: "pathCode required for summary" }, { status: 400 });
      }
      const summary = await getCriticalPathSummary(workspaceId, pathCode);
      return NextResponse.json({ summary });
    }

    // Nodes action
    if (action === "nodes") {
      const pathCode = searchParams.get("pathCode");
      if (!pathCode) {
        return NextResponse.json({ error: "pathCode required for nodes" }, { status: 400 });
      }
      const nodes = await listCriticalNodes(workspaceId, pathCode);
      return NextResponse.json({ nodes });
    }

    // Default: List paths
    const status = searchParams.get("status") as any;
    const paths = await listCriticalPaths(workspaceId, { status });
    return NextResponse.json({ paths });
  } catch (error: any) {
    console.error("[critical-path] GET error:", error);
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

    // Update node state
    if (action === "update-node-state") {
      await updateNodeState(body.nodeId, body.state);
      return NextResponse.json({ success: true });
    }

    // Record node
    if (action === "node") {
      const nodeId = await recordCriticalNode({
        tenantId: workspaceId,
        pathCode: body.pathCode,
        nodeCode: body.nodeCode,
        label: body.label,
        description: body.description,
        dependsOn: body.dependsOn,
        weight: body.weight,
        assignee: body.assignee,
        metadata: body.metadata,
      });
      return NextResponse.json({ nodeId });
    }

    // Default: Record path
    const pathId = await recordCriticalPath({
      tenantId: workspaceId,
      code: body.code,
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      targetDate: body.targetDate,
      metadata: body.metadata,
    });

    return NextResponse.json({ pathId });
  } catch (error: any) {
    console.error("[critical-path] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
