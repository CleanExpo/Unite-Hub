import { NextRequest, NextResponse } from "next/server";
import {
  listWarningEvents,
  recordWarningEvent,
  updateWarningStatus,
  getWarningSummary,
} from "@/lib/founder/earlyWarningService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    if (action === "summary") {
      const summary = await getWarningSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    const signalType = searchParams.get("signalType") as any;
    const riskLevel = searchParams.get("riskLevel") as any;
    const status = searchParams.get("status") as any;

    const items = await listWarningEvents(workspaceId, {
      signalType,
      riskLevel,
      status,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[early-warning] GET error:", error);
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
      await updateWarningStatus(eventId, status);
      return NextResponse.json({ success: true });
    }

    const { signalType, riskLevel, title, details, thresholdValue, actualValue, metadata } = body;

    if (!signalType || !riskLevel || !title) {
      return NextResponse.json(
        { error: "signalType, riskLevel, and title required" },
        { status: 400 }
      );
    }

    const eventId = await recordWarningEvent({
      tenantId: workspaceId,
      signalType,
      riskLevel,
      title,
      details,
      thresholdValue,
      actualValue,
      metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[early-warning] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
