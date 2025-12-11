/**
 * @fileoverview F07 Time-Block Orchestrator API
 * GET: List time blocks, get summary
 * POST: Record block, complete block
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordTimeBlock,
  completeTimeBlock,
  listTimeBlocks,
  getTimeBlockSummary,
} from "@/lib/founder/timeBlockService";

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
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getTimeBlockSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List blocks
    const category = searchParams.get("category") as any;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "200");

    const blocks = await listTimeBlocks(workspaceId, {
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ blocks });
  } catch (error: any) {
    console.error("[time-blocks] GET error:", error);
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

    // Complete block
    if (action === "complete") {
      await completeTimeBlock({
        blockId: body.blockId,
        actualStart: new Date(body.actualStart),
        actualEnd: new Date(body.actualEnd),
        adherence: body.adherence,
        outcomeQuality: body.outcomeQuality,
        energyLevel: body.energyLevel,
        notes: body.notes,
      });
      return NextResponse.json({ success: true });
    }

    // Default: Record block
    const blockId = await recordTimeBlock({
      tenantId: workspaceId,
      label: body.label,
      plannedStart: new Date(body.plannedStart),
      plannedEnd: new Date(body.plannedEnd),
      category: body.category,
      metadata: body.metadata,
    });

    return NextResponse.json({ blockId });
  } catch (error: any) {
    console.error("[time-blocks] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
