/**
 * Cost Summary API
 * GET /api/ml/cost-tracking/summary
 * Returns cost summaries for budget monitoring
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

    const period = req.nextUrl.searchParams.get("period") || "daily"; // daily, monthly
    const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD or YYYY-MM

    const engine = getCostOptimizationEngine();

    let summary;

    if (period === "daily") {
      if (!date) {
        const today = new Date().toISOString().split("T")[0];
        summary = await engine.getDailyCost(workspaceId, today);
      } else {
        summary = await engine.getDailyCost(workspaceId, date);
      }
    } else if (period === "monthly") {
      if (!date) {
        const now = new Date();
        summary = await engine.getMonthlyCost(now.getFullYear(), now.getMonth() + 1);
      } else {
        const [year, month] = date.split("-").map(Number);
        summary = await engine.getMonthlyCost(year, month);
      }
    } else {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    // Get budget info
    const budget = await engine.getBudget(workspaceId);
    const budgetStatus = await engine.canAffordOperation(
      workspaceId,
      0,
      "other"
    );

    // Get recommendations
    const recommendations = await engine.getOptimizationRecommendations(workspaceId);

    return NextResponse.json(
      {
        success: true,
        summary: {
          period: period,
          date: summary.date,
          totalOperations: summary.total_operations,
          totalTokens: {
            input: summary.total_input_tokens,
            output: summary.total_output_tokens,
            thinking: summary.total_thinking_tokens,
          },
          totalCostUsd: summary.total_cost_usd,
          byOperation: summary.by_operation,
          dailyAverage: summary.daily_average_cost,
          projectedMonthlyCost: summary.projected_monthly_cost,
        },
        budget: budget
          ? {
              monthlyBudgetUsd: budget.monthly_budget_usd,
              dailyLimitUsd: budget.daily_limit_usd,
              thresholds: {
                warning80: budget.threshold_80_percent_usd,
                warning90: budget.threshold_90_percent_usd,
                critical100: budget.threshold_100_percent_usd,
              },
            }
          : null,
        budgetStatus: {
          currentSpend: summary.total_cost_usd,
          remainingBudget: budgetStatus.remainingBudget,
          percentageUsed: budget
            ? (summary.total_cost_usd / budget.monthly_budget_usd) * 100
            : 0,
          alert: budgetStatus.alert,
        },
        recommendations,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Cost summary error:", error);
    return NextResponse.json(
      { error: "Cost summary failed", details: error.message },
      { status: 500 }
    );
  }
}
