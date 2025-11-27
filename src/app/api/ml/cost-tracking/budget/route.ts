/**
 * Budget Management API
 * GET/POST /api/ml/cost-tracking/budget
 * Manages workspace budgets
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getCostOptimizationEngine } from "@/lib/ml/cost-optimization";

export async function GET(req: NextRequest) {
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

    const engine = getCostOptimizationEngine();
    const budget = await engine.getBudget(workspaceId);

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        budget: {
          monthlyBudgetUsd: budget.monthly_budget_usd,
          dailyLimitUsd: budget.daily_limit_usd,
          operationLimits: budget.operation_limits,
          thresholds: {
            warning80: budget.threshold_80_percent_usd,
            warning90: budget.threshold_90_percent_usd,
            critical100: budget.threshold_100_percent_usd,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Budget retrieval error:", error);
    return NextResponse.json(
      { error: "Budget retrieval failed", details: error.message },
      { status: 500 }
    );
  }
}

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
      monthlyBudgetUsd,
      tierType = "growth",
    } = body;

    if (!monthlyBudgetUsd || monthlyBudgetUsd <= 0) {
      return NextResponse.json(
        { error: "monthlyBudgetUsd must be greater than 0" },
        { status: 400 }
      );
    }

    const engine = getCostOptimizationEngine();
    const budget = await engine.setBudget(
      workspaceId,
      monthlyBudgetUsd,
      tierType
    );

    return NextResponse.json(
      {
        success: true,
        budget: {
          monthlyBudgetUsd: budget.monthly_budget_usd,
          dailyLimitUsd: budget.daily_limit_usd,
          operationLimits: budget.operation_limits,
          thresholds: {
            warning80: budget.threshold_80_percent_usd,
            warning90: budget.threshold_90_percent_usd,
            critical100: budget.threshold_100_percent_usd,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Budget update error:", error);
    return NextResponse.json(
      { error: "Budget update failed", details: error.message },
      { status: 500 }
    );
  }
}
