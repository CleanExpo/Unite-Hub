import { NextRequest, NextResponse } from "next/server";
import {
  listDriftEvents,
  recordDriftEvent,
  updateDriftStatus,
  getDriftSummary,
} from "@/lib/founder/driftService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "summary") {
      const summary = await getDriftSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    const driftType = searchParams.get("driftType") as any;
    const status = searchParams.get("status") as any;
    const severity = searchParams.get("severity") as any;

    const items = await listDriftEvents(workspaceId, {
      driftType,
      status,
      severity,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[drift] GET error:", error);
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

    const body = await req.json().catch(() => ({}));

    if (action === "update-status") {
      const { eventId, status } = body;
      if (!eventId || !status) {
        return NextResponse.json({ error: "eventId and status required" }, { status: 400 });
      }
      await updateDriftStatus(eventId, status);
      return NextResponse.json({ success: true });
    }

    const { driftType, severity, title, description, expectedValue, actualValue, metadata } = body;

    if (!driftType || !severity || !title) {
      return NextResponse.json(
        { error: "driftType, severity, and title required" },
        { status: 400 }
      );
    }

    const eventId = await recordDriftEvent({
      tenantId: workspaceId,
      driftType,
      severity,
      title,
      description,
      expectedValue,
      actualValue,
      metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[drift] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
