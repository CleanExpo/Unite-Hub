/**
 * @fileoverview F05 Founder Focus Engine API
 * GET: List focus sessions, get summary
 * POST: Record session, update session
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordFocusSession,
  updateFocusSession,
  listFocusSessions,
  getFocusSummary,
} from "@/lib/founder/focusEngineService";

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
      const summary = await getFocusSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List sessions
    const category = searchParams.get("category") as any;
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "200");

    const sessions = await listFocusSessions(workspaceId, {
      category,
      status,
      limit,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("[focus-engine] GET error:", error);
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

    // Update session
    if (action === "update") {
      await updateFocusSession({
        sessionId: body.sessionId,
        status: body.status,
        depthScore: body.depthScore,
        actualStart: body.actualStart ? new Date(body.actualStart) : undefined,
        actualEnd: body.actualEnd ? new Date(body.actualEnd) : undefined,
        interruptions: body.interruptions,
        outcomeNotes: body.outcomeNotes,
      });
      return NextResponse.json({ success: true });
    }

    // Default: Record session
    const sessionId = await recordFocusSession({
      tenantId: workspaceId,
      label: body.label,
      category: body.category,
      status: body.status,
      depthScore: body.depthScore,
      plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
      plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : undefined,
      actualStart: body.actualStart ? new Date(body.actualStart) : undefined,
      actualEnd: body.actualEnd ? new Date(body.actualEnd) : undefined,
      interruptions: body.interruptions,
      outcomeNotes: body.outcomeNotes,
      metadata: body.metadata,
    });

    return NextResponse.json({ sessionId });
  } catch (error: any) {
    console.error("[focus-engine] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
