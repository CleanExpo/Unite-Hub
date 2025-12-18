/**
 * M1 Metrics Queries - Convex (Phase 7)
 *
 * Provides database queries for monitoring and observability.
 * Includes agent run metrics, tool statistics, and cost tracking.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get agent run metrics for a time period
 */
export const getRunMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    const endDate = args.endDate || Date.now();

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_created")
      .collect();

    // Filter by date range
    const filteredRuns = runs.filter(
      (r) => r.createdAt >= startDate && r.createdAt <= endDate
    );

    const totalRuns = filteredRuns.length;
    const completedRuns = filteredRuns.filter(
      (r) => r.stopReason === "completed"
    ).length;
    const errorRuns = filteredRuns.filter(
      (r) => r.stopReason === "error"
    ).length;
    const deniedRuns = filteredRuns.filter(
      (r) => r.stopReason === "policy_denied"
    ).length;
    const limitExceededRuns = filteredRuns.filter(
      (r) => r.stopReason === "limit_exceeded"
    ).length;
    const approvalRequiredRuns = filteredRuns.filter(
      (r) => r.stopReason === "approval_required"
    ).length;

    const avgDuration =
      totalRuns > 0
        ? filteredRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) /
          totalRuns
        : 0;

    const totalToolCallsProposed = filteredRuns.reduce(
      (sum, r) => sum + r.toolCallsProposed,
      0
    );
    const totalToolCallsExecuted = filteredRuns.reduce(
      (sum, r) => sum + r.toolCallsExecuted,
      0
    );

    const executionRate =
      totalToolCallsProposed > 0
        ? (totalToolCallsExecuted / totalToolCallsProposed) * 100
        : 0;

    return {
      dateRange: { start: startDate, end: endDate },
      totalRuns,
      completedRuns,
      completionRate: totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0,
      errorRuns,
      errorRate: totalRuns > 0 ? (errorRuns / totalRuns) * 100 : 0,
      deniedRuns,
      denialRate: totalRuns > 0 ? (deniedRuns / totalRuns) * 100 : 0,
      limitExceededRuns,
      approvalRequiredRuns,
      avgDuration,
      totalToolCallsProposed,
      totalToolCallsExecuted,
      executionRate,
    };
  },
});

/**
 * Get tool execution statistics
 */
export const getToolStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_tool_name")
      .collect();

    // Group by tool name
    const stats: Record<
      string,
      {
        total: number;
        executed: number;
        failed: number;
        rejected: number;
        durations: number[];
      }
    > = {};

    for (const call of calls) {
      if (!stats[call.toolName]) {
        stats[call.toolName] = {
          total: 0,
          executed: 0,
          failed: 0,
          rejected: 0,
          durations: [],
        };
      }

      stats[call.toolName].total++;

      if (call.status === "executed") {
        stats[call.toolName].executed++;
      } else if (call.status === "execution_failed") {
        stats[call.toolName].failed++;
      } else if (call.status === "policy_rejected") {
        stats[call.toolName].rejected++;
      }

      if (call.executedAt && call.proposedAt) {
        const duration = call.executedAt - call.proposedAt;
        stats[call.toolName].durations.push(duration);
      }
    }

    // Calculate statistics
    const toolStats: Record<
      string,
      {
        total: number;
        executed: number;
        failed: number;
        rejected: number;
        successRate: number;
        avgDuration: number;
        minDuration?: number;
        maxDuration?: number;
      }
    > = {};

    for (const [toolName, data] of Object.entries(stats)) {
      const durations = data.durations;
      const avgDuration =
        durations.length > 0
          ? durations.reduce((a: number, b: number) => a + b, 0) /
            durations.length
          : 0;

      toolStats[toolName] = {
        total: data.total,
        executed: data.executed,
        failed: data.failed,
        rejected: data.rejected,
        successRate:
          data.total > 0
            ? ((data.executed / data.total) * 100)
            : 0,
        avgDuration,
        minDuration:
          durations.length > 0
            ? Math.min(...durations)
            : undefined,
        maxDuration:
          durations.length > 0
            ? Math.max(...durations)
            : undefined,
      };
    }

    // Sort by total and limit
    const sorted = Object.entries(toolStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, args.limit || 50);

    return Object.fromEntries(sorted);
  },
});

/**
 * Get agent run summary by agent name
 */
export const getAgentSummary = query({
  args: {
    agentName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .collect();

    const limitedRuns = runs.slice(0, args.limit || 50);

    const totalRuns = limitedRuns.length;
    const completedRuns = limitedRuns.filter(
      (r) => r.stopReason === "completed"
    ).length;
    const errorRuns = limitedRuns.filter(
      (r) => r.stopReason === "error"
    ).length;
    const deniedRuns = limitedRuns.filter(
      (r) => r.stopReason === "policy_denied"
    ).length;

    const avgDuration =
      totalRuns > 0
        ? limitedRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) /
          totalRuns
        : 0;

    const totalToolCalls = limitedRuns.reduce(
      (sum, r) => sum + r.toolCallsExecuted,
      0
    );

    return {
      agentName: args.agentName,
      totalRuns,
      completedRuns,
      errorRuns,
      deniedRuns,
      successRate: totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0,
      avgDuration,
      totalToolCalls,
      runs: limitedRuns,
    };
  },
});

/**
 * Get approval metrics
 */
export const getApprovalMetrics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate || Date.now();

    const calls = await ctx.db
      .query("agentToolCalls")
      .collect();

    // Filter by date range
    const filteredCalls = calls.filter(
      (c) => c.createdAt >= startDate && c.createdAt <= endDate
    );

    const totalCalls = filteredCalls.length;
    const approvalRequired = filteredCalls.filter(
      (c) => c.approvalRequired
    ).length;
    const approved = filteredCalls.filter(
      (c) => c.status === "approved"
    ).length;
    const rejected = filteredCalls.filter(
      (c) => c.status === "policy_rejected"
    ).length;
    const pending = filteredCalls.filter(
      (c) => c.status === "approval_pending"
    ).length;

    const avgApprovalTime =
      approved > 0
        ? filteredCalls
            .filter((c) => c.approvedAt)
            .reduce((sum, c) => sum + (c.approvedAt || 0), 0) / approved
        : 0;

    return {
      dateRange: { start: startDate, end: endDate },
      totalCalls,
      approvalRequired,
      approved,
      rejected,
      pending,
      approvalRate:
        approvalRequired > 0
          ? ((approved / approvalRequired) * 100)
          : 0,
      rejectionRate:
        approvalRequired > 0
          ? ((rejected / approvalRequired) * 100)
          : 0,
      avgApprovalTime,
    };
  },
});

/**
 * Get error rate over time
 */
export const getErrorRate = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    interval: v.optional(v.string()), // "hourly", "daily", "weekly"
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate || Date.now();
    const interval = args.interval || "daily";

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_created")
      .collect();

    // Filter by date range
    const filteredRuns = runs.filter(
      (r) => r.createdAt >= startDate && r.createdAt <= endDate
    );

    // Group by interval
    const buckets: Record<
      string,
      { total: number; errors: number; errorRate: number }
    > = {};

    for (const run of filteredRuns) {
      let key = "";

      if (interval === "hourly") {
        const date = new Date(run.createdAt);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:00`;
      } else if (interval === "daily") {
        const date = new Date(run.createdAt);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      } else if (interval === "weekly") {
        const date = new Date(run.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toISOString().split("T")[0]}`;
      }

      if (!buckets[key]) {
        buckets[key] = { total: 0, errors: 0, errorRate: 0 };
      }

      buckets[key].total++;
      if (run.stopReason === "error") {
        buckets[key].errors++;
      }

      buckets[key].errorRate =
        buckets[key].total > 0
          ? (buckets[key].errors / buckets[key].total) * 100
          : 0;
    }

    return {
      dateRange: { start: startDate, end: endDate },
      interval,
      data: buckets,
      totalRuns: filteredRuns.length,
      totalErrors: filteredRuns.filter((r) => r.stopReason === "error").length,
      overallErrorRate:
        filteredRuns.length > 0
          ? (filteredRuns.filter((r) => r.stopReason === "error").length /
            filteredRuns.length) *
            100
          : 0,
    };
  },
});
