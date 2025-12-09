/**
 * @fileoverview E47 Runtime Integrity Sentinel API
 * GET: List events, get summary
 * POST: Record event, update status
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listIntegrityEvents,
  recordIntegrityEvent,
  updateIntegrityEventStatus,
  getIntegritySummary,
} from "@/src/lib/founder/runtimeIntegrityService";

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
      const summary = await getIntegritySummary(workspaceId, hours);
      return NextResponse.json({ summary });
    }

    // Default: List events
    const subsystem = searchParams.get("subsystem") || undefined;
    const severity = searchParams.get("severity") as any;
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "300");

    const events = await listIntegrityEvents(workspaceId, {
      subsystem,
      severity,
      status,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[integrity] GET error:", error);
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

    // Update event status
    if (action === "update-status") {
      await updateIntegrityEventStatus(body.eventId, body.status);
      return NextResponse.json({ success: true });
    }

    // Default: Record event
    const eventId = await recordIntegrityEvent({
      tenantId: workspaceId,
      subsystem: body.subsystem,
      violationType: body.violationType,
      severity: body.severity,
      title: body.title,
      details: body.details,
      stackTrace: body.stackTrace,
      metadata: body.metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[integrity] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
