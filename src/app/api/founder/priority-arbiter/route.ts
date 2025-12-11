/**
 * @fileoverview F04 AI-Assisted Priority Arbiter API
 * GET: List priority decisions, get priority summary
 * POST: Record priority decision
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordPriorityDecision,
  listPriorityDecisions,
  getPrioritySummary,
} from "@/lib/founder/priorityArbiterService";

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
      const summary = await getPrioritySummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Default: List priority decisions
    const humanOverride = searchParams.get("humanOverride");
    const decided = searchParams.get("decided");
    const limit = parseInt(searchParams.get("limit") || "300");

    const decisions = await listPriorityDecisions(workspaceId, {
      humanOverride: humanOverride !== null ? humanOverride === "true" : undefined,
      decided: decided !== null ? decided === "true" : undefined,
      limit,
    });

    return NextResponse.json({ decisions });
  } catch (error: any) {
    console.error("[priority-arbiter] GET error:", error);
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

    const decisionId = await recordPriorityDecision({
      tenantId: workspaceId,
      decisionCode: body.decisionCode,
      context: body.context,
      recommendation: body.recommendation,
      confidence: body.confidence,
      reasoning: body.reasoning,
      signalsUsed: body.signalsUsed,
      finalPriority: body.finalPriority,
      humanOverride: body.humanOverride,
      metadata: body.metadata,
    });

    return NextResponse.json({ decisionId });
  } catch (error: any) {
    console.error("[priority-arbiter] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
