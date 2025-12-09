/**
 * E37: Founder Heatmap API
 * GET: Get heatmap data for date range
 * POST: Compute heatmap data
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getHeatmapData,
  computeDailyHeatmap,
  computeHeatmapRange,
  recordHeatmapEvent,
  listHeatmapItems,
} from "@/src/lib/founder/heatmapService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "list") {
      const items = await listHeatmapItems(workspaceId);
      return NextResponse.json({ items });
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventTypes = searchParams.get("eventTypes")?.split(",") as any;

    const items = await getHeatmapData(workspaceId, {
      startDate,
      endDate,
      eventTypes,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[heatmap] GET error:", error);
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

    if (action === "compute-daily") {
      const body = await req.json().catch(() => ({}));
      const { targetDate } = body;
      const result = await computeDailyHeatmap(workspaceId, targetDate);
      return NextResponse.json({ result });
    }

    if (action === "compute-range") {
      const body = await req.json().catch(() => ({}));
      const { startDate, endDate } = body;
      const result = await computeHeatmapRange(workspaceId, startDate, endDate);
      return NextResponse.json({ result });
    }

    const body = await req.json().catch(() => ({}));
    const { eventType, eventDate, count, metadata } = body;

    if (!eventType || !eventDate) {
      return NextResponse.json({ error: "eventType and eventDate required" }, { status: 400 });
    }

    const eventId = await recordHeatmapEvent(workspaceId, eventType, eventDate, count, metadata);
    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[heatmap] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
