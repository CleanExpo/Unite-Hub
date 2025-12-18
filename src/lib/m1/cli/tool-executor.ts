/**
 * M1 Tool Executor - Phase 3
 *
 * Implements execution logic for M1 registry tools.
 * Each tool function receives args and returns result.
 *
 * Tools:
 * 1. tool_registry_list - List available tools
 * 2. tool_policy_check - Validate tool calls
 * 3. request_approval - Request authorization
 * 4. log_agent_run - Record to audit trail
 */

import { registry } from "../tools/registry";
import { policyEngine } from "../tools/policy";
import { agentRunsLogger } from "../logging/agentRuns";
import type { ToolCall, ToolScope } from "../types";
import { v4 as generateUUID } from "uuid";

/**
 * Result of a tool execution
 */
export interface ToolExecutionResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

/**
 * Main tool execution dispatcher
 *
 * Validates tool exists in registry and executes with proper error handling.
 */
export async function executeTool(
  toolName: string,
  args?: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    // Validate tool exists in registry
    if (!registry.hasTool(toolName)) {
      throw new Error(`Tool "${toolName}" not found in registry`);
    }

    // Dispatch to specific implementation
    let result: Record<string, unknown>;

    switch (toolName) {
      case "tool_registry_list":
        result = executeTool_registry_list(args);
        break;

      case "tool_policy_check":
        result = executeTool_policy_check(args);
        break;

      case "request_approval":
        // Import dynamically to avoid circular dependency
        const { requestApprovalFromUser } = await import("./approval-handler");
        result = await requestApprovalFromUser(args);
        break;

      case "log_agent_run":
        result = await executeLog_agent_run(args);
        break;

      default:
        throw new Error(`No executor implemented for tool "${toolName}"`);
    }

    return {
      success: true,
      result,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Tool 1: tool_registry_list
 *
 * Lists available tools, optionally filtered by scope.
 * Pure read operation, no approval needed.
 */
function executeTool_registry_list(args?: Record<string, unknown>) {
  const filter = args?.filter as string | undefined;

  let tools;
  if (filter && ["read", "write", "execute"].includes(filter)) {
    tools = registry.getToolsByScope(filter as ToolScope);
  } else {
    tools = registry.listTools();
  }

  const byScope = {
    read: registry.getToolsByScope("read").length,
    write: registry.getToolsByScope("write").length,
    execute: registry.getToolsByScope("execute").length,
  };

  return {
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      scope: t.scope,
      requiresApproval: registry.requiresApproval(t.name),
    })),
    totalCount: tools.length,
    byScope,
  };
}

/**
 * Tool 2: tool_policy_check
 *
 * Validates a tool call against policy.
 * Pure read operation, no approval needed.
 * Can include approval token to test restricted tools.
 */
function executeTool_policy_check(args?: Record<string, unknown>) {
  if (!args?.toolName || !args?.scope) {
    throw new Error("toolName and scope are required");
  }

  // Create synthetic ToolCall for validation
  const syntheticCall: ToolCall = {
    requestId: generateUUID(),
    toolName: args.toolName as string,
    args: (args.args as Record<string, unknown>) || undefined,
    scope: args.scope as ToolScope,
    approvalRequired: registry.requiresApproval(args.toolName as string),
  };

  // Validate with policy engine
  const decision = policyEngine.validateToolCall(
    syntheticCall,
    (args.approvalToken as string) || undefined
  );

  return {
    allowed: decision.allowed,
    reason: decision.reason,
    scope: decision.scope,
    requiresApproval: decision.requiresApproval,
    policyCheckResult: decision.policyCheckResult,
  };
}

/**
 * Tool 4: log_agent_run
 *
 * Records agent execution to audit trail.
 * Write scope operation, requires approval token.
 */
async function executeLog_agent_run(args?: Record<string, unknown>) {
  if (!args?.runId) {
    throw new Error("runId is required");
  }

  const runId = args.runId as string;

  // Get existing run record
  const run = agentRunsLogger.getRun(runId);

  if (!run) {
    throw new Error(`Run ${runId} not found in logger`);
  }

  // Update with final data if provided
  if (args.stopReason) {
    agentRunsLogger.completeRun(
      runId,
      args.stopReason as any,
      (args.errorMessage as string) || undefined
    );
  }

  // Get final summary
  const summary = agentRunsLogger.getSummary(runId);

  // Export to persistent storage (Convex - TODO in production)
  // await agentRunsLogger.exportRun(runId);
  // await agentRunsLogger.exportToolCalls(runId);

  return {
    success: true,
    runId,
    persisted: false, // Set to true when Convex export implemented
    summary,
  };
}
