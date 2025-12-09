/**
 * @fileoverview F03 Founder Stress Load Balancer API
 * GET: List load events, get load summary, get stream load
 * POST: Record load event
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordLoadEvent,
  listLoadEvents,
  getLoadSummary,
  getStreamLoad,
} from "@/src/lib/founder/loadBalancerService";

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
      const hours = parseInt(searchParams.get("hours") || "24");
      const summary = await getLoadSummary(workspaceId, hours);
      return NextResponse.json({ summary });
    }

    // Stream load action
    if (action === "stream-load") {
      const streamCode = searchParams.get("streamCode");
      if (!streamCode) {
        return NextResponse.json({ error: "streamCode required for stream-load" }, { status: 400 });
      }
      const hours = parseInt(searchParams.get("hours") || "24");
      const streamLoad = await getStreamLoad(workspaceId, streamCode, hours);
      return NextResponse.json({ streamLoad });
    }

    // Default: List load events
    const streamCode = searchParams.get("streamCode") || undefined;
    const loadSource = searchParams.get("loadSource") as any;
    const hours = parseInt(searchParams.get("hours") || "24");
    const limit = parseInt(searchParams.get("limit") || "500");

    const events = await listLoadEvents(workspaceId, {
      streamCode,
      loadSource,
      hours,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[load-balancer] GET error:", error);
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

    const eventId = await recordLoadEvent({
      tenantId: workspaceId,
      streamCode: body.streamCode,
      loadSource: body.loadSource,
      perceivedLoad: body.perceivedLoad,
      calculatedLoad: body.calculatedLoad,
      resolution: body.resolution,
      metadata: body.metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[load-balancer] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
