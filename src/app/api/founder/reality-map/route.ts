/**
 * @fileoverview E42 Founder Reality Map API
 * GET: List panels and snapshots, get summary
 * POST: Record panel or snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listRealityPanels,
  getLatestRealitySnapshots,
  recordRealityPanel,
  recordRealitySnapshot,
  getRealityMapSummary,
} from "@/src/lib/founder/realityMapService";

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
      const summary = await getRealityMapSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Latest snapshots action
    if (action === "snapshots") {
      const panelCode = searchParams.get("panelCode") || undefined;
      const snapshots = await getLatestRealitySnapshots(workspaceId, panelCode);
      return NextResponse.json({ snapshots });
    }

    // Default: List panels
    const status = searchParams.get("status") as any;
    const panels = await listRealityPanels(workspaceId, { status });
    return NextResponse.json({ panels });
  } catch (error: any) {
    console.error("[reality-map] GET error:", error);
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

    // Record snapshot
    if (action === "snapshot") {
      const snapshotId = await recordRealitySnapshot({
        tenantId: workspaceId,
        panelCode: body.panelCode,
        score: body.score,
        level: body.level,
        summary: body.summary,
        metadata: body.metadata,
      });
      return NextResponse.json({ snapshotId });
    }

    // Default: Record panel
    const panelId = await recordRealityPanel({
      tenantId: workspaceId,
      code: body.code,
      title: body.title,
      description: body.description,
      metadata: body.metadata,
    });

    return NextResponse.json({ panelId });
  } catch (error: any) {
    console.error("[reality-map] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
