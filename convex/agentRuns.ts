/**
 * M1 Agent Runs - Convex Mutation and Query Functions (Phase 6)
 *
 * Provides database operations for persistent storage of agent runs and tool calls.
 * Implements CRUD operations for audit trail tracking.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * MUTATIONS
 */

/**
 * Create a new agent run record
 */
export const createRun = mutation({
  args: {
    runId: v.string(),
    agentName: v.string(),
    goal: v.string(),
    constraints: v.optional(
      v.object({
        maxSteps: v.optional(v.number()),
        maxToolCalls: v.optional(v.number()),
        maxRuntimeSeconds: v.optional(v.number()),
      })
    ),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if run already exists
    const existing = await ctx.db
      .query("agentRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first();

    if (existing) {
      throw new Error(`Agent run ${args.runId} already exists`);
    }

    const id = await ctx.db.insert("agentRuns", {
      runId: args.runId,
      agentName: args.agentName,
      goal: args.goal,
      constraints: args.constraints || {},
      stopReason: "running",
      toolCallsProposed: 0,
      toolCallsApproved: 0,
      toolCallsExecuted: 0,
      approvalTokens: [],
      startedAt: args.startedAt,
      createdAt: now,
    });

    return id;
  },
});

/**
 * Complete agent run with final status
 */
export const completeRun = mutation({
  args: {
    runId: v.string(),
    stopReason: v.union(
      v.literal("completed"),
      v.literal("limit_exceeded"),
      v.literal("approval_required"),
      v.literal("policy_denied"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    toolCallsProposed: v.number(),
    toolCallsApproved: v.number(),
    toolCallsExecuted: v.number(),
    approvalTokens: v.optional(v.array(v.string())),
    completedAt: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first();

    if (!run) {
      throw new Error(`Agent run ${args.runId} not found`);
    }

    await ctx.db.patch(run._id, {
      stopReason: args.stopReason,
      errorMessage: args.errorMessage,
      toolCallsProposed: args.toolCallsProposed,
      toolCallsApproved: args.toolCallsApproved,
      toolCallsExecuted: args.toolCallsExecuted,
      approvalTokens: args.approvalTokens || [],
      completedAt: args.completedAt,
      durationMs: args.durationMs,
    });

    return run._id;
  },
});

/**
 * Create tool call record
 */
export const createToolCall = mutation({
  args: {
    requestId: v.string(),
    runId: v.string(),
    toolName: v.string(),
    args: v.optional(v.any()),
    scope: v.union(v.literal("read"), v.literal("write"), v.literal("execute")),
    approvalRequired: v.boolean(),
    status: v.union(
      v.literal("proposed"),
      v.literal("policy_rejected"),
      v.literal("approval_pending"),
      v.literal("approved"),
      v.literal("executed"),
      v.literal("execution_failed")
    ),
    proposedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if tool call already exists
    const existing = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId))
      .first();

    if (existing) {
      throw new Error(`Tool call ${args.requestId} already exists`);
    }

    const id = await ctx.db.insert("agentToolCalls", {
      requestId: args.requestId,
      runId: args.runId,
      toolName: args.toolName,
      args: args.args,
      scope: args.scope,
      approvalRequired: args.approvalRequired,
      status: args.status,
      proposedAt: args.proposedAt,
      createdAt: now,
    });

    return id;
  },
});

/**
 * Update tool call with execution result
 */
export const updateToolCall = mutation({
  args: {
    requestId: v.string(),
    status: v.union(
      v.literal("approved"),
      v.literal("executed"),
      v.literal("execution_failed")
    ),
    policyCheckPassed: v.optional(v.boolean()),
    policyCheckReason: v.optional(v.string()),
    policyCheckedAt: v.optional(v.number()),
    approvalToken: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.string()),
    result: v.optional(v.any()),
    executionError: v.optional(v.string()),
    executedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const toolCall = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!toolCall) {
      throw new Error(`Tool call ${args.requestId} not found`);
    }

    await ctx.db.patch(toolCall._id, {
      status: args.status,
      policyCheckPassed: args.policyCheckPassed,
      policyCheckReason: args.policyCheckReason,
      policyCheckedAt: args.policyCheckedAt,
      approvalToken: args.approvalToken,
      approvedAt: args.approvedAt,
      approvedBy: args.approvedBy,
      result: args.result,
      executionError: args.executionError,
      executedAt: args.executedAt,
      durationMs: args.durationMs,
    });

    return toolCall._id;
  },
});

/**
 * QUERIES
 */

/**
 * Get agent run by ID
 */
export const getRun = query({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .first();

    return run || null;
  },
});

/**
 * Get tool calls for a run
 */
export const getToolCalls = query({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_run_id", (q) => q.eq("runId", args.runId))
      .collect();

    return calls;
  },
});

/**
 * Get runs by agent name
 */
export const getRunsByAgent = query({
  args: { agentName: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .order("desc")
      .take(args.limit || 50)
      .collect();

    return runs;
  },
});

/**
 * Get recent runs
 */
export const getRecentRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit || 50)
      .collect();

    return runs;
  },
});

/**
 * Get tool calls by tool name
 */
export const getToolCallsByName = query({
  args: { toolName: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("agentToolCalls")
      .withIndex("by_tool_name", (q) => q.eq("toolName", args.toolName))
      .order("desc")
      .take(args.limit || 50)
      .collect();

    return calls;
  },
});

/**
 * Get runs by status (stop reason)
 */
export const getRunsByStatus = query({
  args: {
    stopReason: v.union(
      v.literal("completed"),
      v.literal("limit_exceeded"),
      v.literal("approval_required"),
      v.literal("policy_denied"),
      v.literal("error")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_stop_reason", (q) => q.eq("stopReason", args.stopReason))
      .order("desc")
      .take(args.limit || 50)
      .collect();

    return runs;
  },
});

/**
 * Get summary statistics for agent runs
 */
export const getRunStatistics = query({
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
      avgDuration,
      totalToolCallsProposed,
      totalToolCallsExecuted,
      executionRate,
    };
  },
});
