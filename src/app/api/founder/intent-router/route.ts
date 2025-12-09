/**
 * @fileoverview F11 Founder Intent Router API
 * GET: List intent signals, get routing summary
 * POST: Record intent signal
 * PATCH: Update intent routing status
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordIntentSignal,
  updateIntentRouting,
  listIntentSignals,
  getIntentRoutingSummary,
} from "@/src/lib/founder/intentRouterService";

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
      const summary = await getIntentRoutingSummary(workspaceId, days);
      return NextResponse.json({ summary });
    }

    // Default: List signals
    const intentType = searchParams.get("intentType") as any;
    const routingStatus = searchParams.get("routingStatus") as any;
    const routedTo = searchParams.get("routedTo");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "200");

    const signals = await listIntentSignals(workspaceId, {
      intentType,
      routingStatus,
      routedTo: routedTo || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return NextResponse.json({ signals });
  } catch (error: any) {
    console.error("[intent-router] GET error:", error);
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

    const signalId = await recordIntentSignal({
      tenantId: workspaceId,
      intentType: body.intentType,
      signalSource: body.signalSource,
      signalData: body.signalData,
      confidenceScore: body.confidenceScore,
      confidence: body.confidence,
      interpretation: body.interpretation,
      metadata: body.metadata,
    });

    return NextResponse.json({ signalId });
  } catch (error: any) {
    console.error("[intent-router] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json();

    await updateIntentRouting({
      signalId: body.signalId,
      routingStatus: body.routingStatus,
      routedTo: body.routedTo,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[intent-router] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
