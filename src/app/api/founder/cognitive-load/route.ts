/**
 * @fileoverview F09 Cognitive Load Monitor API
 * GET: List cognitive load events, get summary, get current level
 * POST: Record cognitive load event
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordCognitiveLoad,
  listCognitiveLoadEvents,
  getCognitiveLoadSummary,
  getCurrentCognitiveLoad,
} from "@/lib/founder/cognitiveLoadService";

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
      const summary = await getCognitiveLoadSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Current load action
    if (action === "current") {
      const windowMinutes = parseInt(searchParams.get("windowMinutes") || "60");
      const currentLoad = await getCurrentCognitiveLoad(workspaceId, windowMinutes);
      return NextResponse.json({ currentLoad });
    }

    // Default: List events
    const intensity = searchParams.get("intensity") as any;
    const signalType = searchParams.get("signalType") as any;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "200");

    const events = await listCognitiveLoadEvents(workspaceId, {
      intensity,
      signalType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[cognitive-load] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    const loadId = await recordCognitiveLoad({
      tenantId: workspaceId,
      signalType: body.signalType,
      signalValue: body.signalValue,
      intensity: body.intensity,
      context: body.context,
      contributingFactors: body.contributingFactors,
      metadata: body.metadata,
    });

    return NextResponse.json({ loadId });
  } catch (error: any) {
    console.error("[cognitive-load] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
