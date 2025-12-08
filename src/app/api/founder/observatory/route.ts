import { NextRequest, NextResponse } from "next/server";
import {
  listObservatoryEvents,
  recordObservatoryEvent,
  getObservatorySummary,
} from "@/src/lib/founder/observatoryService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "summary") {
      const days = parseInt(searchParams.get("days") || "7");
      const summary = await getObservatorySummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    const eventType = searchParams.get("eventType") as any;
    const severity = searchParams.get("severity") as any;
    const limit = parseInt(searchParams.get("limit") || "100");

    const items = await listObservatoryEvents(workspaceId, {
      eventType,
      severity,
      limit,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[observatory] GET error:", error);
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

    const body = await req.json().catch(() => ({}));
    const { eventType, severity, value, description, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType required" }, { status: 400 });
    }

    const eventId = await recordObservatoryEvent({
      tenantId: workspaceId,
      eventType,
      severity,
      value,
      description,
      metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[observatory] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
