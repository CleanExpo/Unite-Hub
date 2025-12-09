/**
 * @fileoverview F06 Distraction Shield API
 * GET: List distraction events, get summary
 * POST: Record distraction event
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordDistractionEvent,
  listDistractionEvents,
  getDistractionSummary,
} from "@/src/lib/founder/distractionShieldService";

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
      const summary = await getDistractionSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List events
    const source = searchParams.get("source") as any;
    const severity = searchParams.get("severity") as any;
    const prevented = searchParams.get("prevented");
    const hours = parseInt(searchParams.get("hours") || "24");
    const limit = parseInt(searchParams.get("limit") || "200");

    const events = await listDistractionEvents(workspaceId, {
      source,
      severity,
      prevented: prevented !== null ? prevented === "true" : undefined,
      hours,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[distraction-shield] GET error:", error);
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

    const eventId = await recordDistractionEvent({
      tenantId: workspaceId,
      source: body.source,
      severity: body.severity,
      description: body.description,
      context: body.context,
      mitigationApplied: body.mitigationApplied,
      recoveryTimeMins: body.recoveryTimeMins,
      prevented: body.prevented,
      metadata: body.metadata,
    });

    return NextResponse.json({ eventId });
  } catch (error: any) {
    console.error("[distraction-shield] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
