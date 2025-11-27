/**
 * Cost Tracking API
 * POST /api/ml/cost-tracking/track
 * Tracks operation costs for budget management
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getCostOptimizationEngine } from "@/lib/ml/cost-optimization";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = data.user.id;
    }

    workspaceId = req.nextUrl.searchParams.get("workspaceId") || "";
    if (!workspaceId)
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );

    const body = await req.json();
    const {
      operationType,
      operationId,
      inputTokens = 0,
      outputTokens = 0,
      thinkingTokens = 0,
    } = body;

    if (
      !operationType ||
      !operationId ||
      typeof inputTokens !== "number" ||
      typeof outputTokens !== "number" ||
      typeof thinkingTokens !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "operationType, operationId, and token counts are required",
        },
        { status: 400 }
      );
    }

    const engine = getCostOptimizationEngine();

    // Track the cost
    const costRecord = await engine.trackCost(
      workspaceId,
      operationType,
      operationId,
      inputTokens,
      outputTokens,
      thinkingTokens
    );

    // Check budget status
    const budgetStatus = await engine.canAffordOperation(
      workspaceId,
      costRecord.cost_usd,
      operationType
    );

    return NextResponse.json(
      {
        success: true,
        costRecord: {
          id: costRecord.id,
          operationType: costRecord.operation_type,
          inputTokens: costRecord.input_tokens,
          outputTokens: costRecord.output_tokens,
          thinkingTokens: costRecord.thinking_tokens,
          costUsd: costRecord.cost_usd,
          costBreakdown: costRecord.cost_breakdown,
          createdAt: costRecord.created_at,
        },
        budgetStatus: {
          canAfford: budgetStatus.canAfford,
          remainingBudget: budgetStatus.remainingBudget,
          projectedTotal: budgetStatus.projectedTotal,
          alert: budgetStatus.alert,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Cost tracking error:", error);
    return NextResponse.json(
      { error: "Cost tracking failed", details: error.message },
      { status: 500 }
    );
  }
}
