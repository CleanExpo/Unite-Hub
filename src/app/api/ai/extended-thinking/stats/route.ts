/**
 * Extended Thinking Statistics API
 * GET /api/ai/extended-thinking/stats
 *
 * Returns cost and performance statistics for Extended Thinking operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get authorization
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get workspace from query
    workspaceId = req.nextUrl.searchParams.get("workspaceId") || "";
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Get period from query (default: last 7 days)
    const periodDays = parseInt(req.nextUrl.searchParams.get("periodDays") || "7");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Query database
    const supabase = await getSupabaseServer();

    const { data: operations, error } = await supabase
      .from("extended_thinking_operations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Calculate statistics
    if (!operations || operations.length === 0) {
      return NextResponse.json(
        {
          period: { days: periodDays, startDate: startDate.toISOString() },
          stats: {
            totalOperations: 0,
            totalCost: 0,
            averageCost: 0,
            thinkingTokensUsed: 0,
            cacheHitRate: 0,
            fallbackCount: 0,
            averageLatency: 0,
          },
          breakdown: {
            byComplexity: {},
            byOperationType: {},
            dailyCosts: {},
          },
          costAlerts: [],
        },
        { status: 200 }
      );
    }

    const totalCost = operations.reduce((sum, op) => sum + op.total_cost, 0);
    const thinkingTokensUsed = operations.reduce(
      (sum, op) => sum + op.thinking_tokens,
      0
    );
    const cacheReadTokens = operations.reduce(
      (sum, op) => sum + op.cache_read_tokens,
      0
    );
    const totalInputTokens = operations.reduce(
      (sum, op) => sum + op.input_tokens,
      0
    );
    const fallbackCount = operations.filter(
      (op) => op.operation_type?.includes("fallback")
    ).length;
    const averageLatency =
      operations.reduce((sum, op) => sum + op.duration_ms, 0) / operations.length;

    const cacheHitRate =
      totalInputTokens > 0 ? cacheReadTokens / totalInputTokens : 0;

    // Breakdown by complexity
    const byComplexity: Record<string, any> = {};
    operations.forEach((op) => {
      const complexity = op.complexity_level || "unknown";
      if (!byComplexity[complexity]) {
        byComplexity[complexity] = {
          count: 0,
          totalCost: 0,
          totalTokens: 0,
        };
      }
      byComplexity[complexity].count++;
      byComplexity[complexity].totalCost += op.total_cost;
      byComplexity[complexity].totalTokens +=
        op.thinking_tokens + op.input_tokens + op.output_tokens;
    });

    // Breakdown by operation type
    const byOperationType: Record<string, any> = {};
    operations.forEach((op) => {
      const type = op.operation_type || "unknown";
      if (!byOperationType[type]) {
        byOperationType[type] = {
          count: 0,
          totalCost: 0,
          averageLatency: 0,
        };
      }
      byOperationType[type].count++;
      byOperationType[type].totalCost += op.total_cost;
    });

    // Calculate average latency per operation type
    Object.keys(byOperationType).forEach((type) => {
      const typeOps = operations.filter((op) => op.operation_type === type);
      byOperationType[type].averageLatency =
        typeOps.reduce((sum, op) => sum + op.duration_ms, 0) / typeOps.length;
    });

    // Daily costs
    const dailyCosts: Record<string, number> = {};
    operations.forEach((op) => {
      const date = new Date(op.timestamp).toISOString().split("T")[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + op.total_cost;
    });

    // Generate alerts
    const costAlerts: string[] = [];
    const dailyCostSum = Object.values(dailyCosts).reduce((a, b) => a + b, 0);
    const averageDailyCost = dailyCostSum / Object.keys(dailyCosts).length;

    if (totalCost > 50) {
      costAlerts.push(`High usage: $${totalCost.toFixed(2)} in ${periodDays} days`);
    }
    if (averageDailyCost > 10) {
      costAlerts.push(
        `Average daily cost: $${averageDailyCost.toFixed(2)} (exceeds $10 threshold)`
      );
    }
    if (thinkingTokensUsed > 1000000) {
      costAlerts.push(
        `High thinking token usage: ${(thinkingTokensUsed / 1000000).toFixed(2)}M tokens`
      );
    }
    if (fallbackCount > operations.length * 0.1) {
      costAlerts.push(
        `${fallbackCount} fallbacks (${((fallbackCount / operations.length) * 100).toFixed(1)}% of requests)`
      );
    }

    return NextResponse.json(
      {
        period: { days: periodDays, startDate: startDate.toISOString() },
        stats: {
          totalOperations: operations.length,
          totalCost: Math.round(totalCost * 10000) / 10000,
          averageCost:
            Math.round((totalCost / operations.length) * 10000) / 10000,
          thinkingTokensUsed,
          cacheHitRate: Math.round(cacheHitRate * 10000) / 10000,
          fallbackCount,
          averageLatency: Math.round(averageLatency * 100) / 100,
        },
        breakdown: {
          byComplexity,
          byOperationType,
          dailyCosts,
        },
        costAlerts,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Statistics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error.message },
      { status: 500 }
    );
  }
}
