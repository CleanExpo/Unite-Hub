/**
 * @fileoverview E48 Autonomous Self-Evaluation Loop API
 * GET: List cycles and factors, get summary
 * POST: Start cycle, record factor, complete cycle
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listEvaluationCycles,
  listEvaluationFactors,
  startEvaluationCycle,
  recordEvaluationFactor,
  completeEvaluationCycle,
  getEvaluationSummary,
} from "@/src/lib/founder/selfEvaluationService";

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
      const summary = await getEvaluationSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Factors action
    if (action === "factors") {
      const cycleCode = searchParams.get("cycleCode");
      if (!cycleCode) {
        return NextResponse.json({ error: "cycleCode required for factors" }, { status: 400 });
      }
      const factors = await listEvaluationFactors(workspaceId, cycleCode);
      return NextResponse.json({ factors });
    }

    // Default: List cycles
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "100");
    const cycles = await listEvaluationCycles(workspaceId, { status, limit });
    return NextResponse.json({ cycles });
  } catch (error: any) {
    console.error("[self-eval] GET error:", error);
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

    // Complete cycle
    if (action === "complete") {
      await completeEvaluationCycle({
        cycleId: body.cycleId,
        summary: body.summary,
        recommendations: body.recommendations,
      });
      return NextResponse.json({ success: true });
    }

    // Record factor
    if (action === "factor") {
      const factorId = await recordEvaluationFactor({
        tenantId: workspaceId,
        cycleCode: body.cycleCode,
        factor: body.factor,
        value: body.value,
        weight: body.weight,
        details: body.details,
        metadata: body.metadata,
      });
      return NextResponse.json({ factorId });
    }

    // Default: Start cycle
    const cycleId = await startEvaluationCycle({
      tenantId: workspaceId,
      cycleCode: body.cycleCode,
      metadata: body.metadata,
    });

    return NextResponse.json({ cycleId });
  } catch (error: any) {
    console.error("[self-eval] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
