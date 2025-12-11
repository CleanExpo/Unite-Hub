/**
 * @fileoverview E43 AI Oversight Loop API
 * GET: List policies and events, get summary
 * POST: Record policy or event
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listOversightPolicies,
  listOversightEvents,
  recordOversightPolicy,
  recordOversightEvent,
  getOversightSummary,
} from "@/lib/founder/aiOversightService";

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
      const summary = await getOversightSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Events action
    if (action === "events") {
      const policyCode = searchParams.get("policyCode") || undefined;
      const level = searchParams.get("level") as any;
      const limit = parseInt(searchParams.get("limit") || "200");
      const events = await listOversightEvents(workspaceId, { policyCode, level, limit });
      return NextResponse.json({ events });
    }

    // Default: List policies
    const status = searchParams.get("status") as any;
    const policies = await listOversightPolicies(workspaceId, { status });
    return NextResponse.json({ policies });
  } catch (error: any) {
    console.error("[ai-oversight] GET error:", error);
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

    // Record event
    if (action === "event") {
      const eventId = await recordOversightEvent({
        tenantId: workspaceId,
        policyCode: body.policyCode,
        level: body.level,
        summary: body.summary,
        details: body.details,
        impactScore: body.impactScore,
        metadata: body.metadata,
      });
      return NextResponse.json({ eventId });
    }

    // Default: Record policy
    const policyId = await recordOversightPolicy({
      tenantId: workspaceId,
      code: body.code,
      name: body.name,
      description: body.description,
      threshold: body.threshold,
      metadata: body.metadata,
    });

    return NextResponse.json({ policyId });
  } catch (error: any) {
    console.error("[ai-oversight] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
