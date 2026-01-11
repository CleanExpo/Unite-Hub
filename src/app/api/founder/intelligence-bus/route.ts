/**
 * @fileoverview E44 Intelligence Bus API
 * GET: List signals, get summary
 * POST: Record signal
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listIntelligenceSignals,
  recordIntelligenceSignal,
  getIntelligenceSummary,
} from "@/lib/founder/intelligenceBusService";

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
      const summary = await getIntelligenceSummary(workspaceId, hours);
      return NextResponse.json({ summary });
    }

    // Default: List signals
    const domain = searchParams.get("domain") as any;
    const kind = searchParams.get("kind") as any;
    const sourceAgent = searchParams.get("sourceAgent") || undefined;
    const minImportance = searchParams.get("minImportance")
      ? parseInt(searchParams.get("minImportance")!)
      : undefined;
    const limit = parseInt(searchParams.get("limit") || "300");

    const signals = await listIntelligenceSignals(workspaceId, {
      domain,
      kind,
      sourceAgent,
      minImportance,
      limit,
    });

    return NextResponse.json({ signals });
  } catch (error: any) {
    console.error("[intelligence-bus] GET error:", error);
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

    const signalId = await recordIntelligenceSignal({
      tenantId: workspaceId,
      sourceAgent: body.sourceAgent,
      domain: body.domain,
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      payload: body.payload,
      importance: body.importance,
    });

    return NextResponse.json({ signalId });
  } catch (error: any) {
    console.error("[intelligence-bus] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
