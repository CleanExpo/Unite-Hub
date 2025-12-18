/**
 * M1 Integration Test Helpers
 *
 * Utility functions for integration testing including mocking,
 * execution helpers, and verification utilities.
 */

import { vi } from "vitest";
import { OrchestratorAgent } from "../../agents/orchestrator";
import { agentRunsLogger } from "../../logging/agentRuns";
import { runAgent } from "../../cli/agent-run";
import type { ExecutionResult, CLIOptions, GenerateProposalsResponse } from "../../types";

/**
 * Mock Claude API to return specific response type
 *
 * @param responseType - Type of response to mock ('simple', 'multi', 'approval', 'error', 'empty')
 * @param customResponse - Optional custom response to use instead
 * @returns The mock spy
 */
export function mockClaudeAPI(
  responseType:
    | "simple"
    | "multi"
    | "approval"
    | "error"
    | "empty",
  customResponse?: GenerateProposalsResponse
) {
  const responses: Record<string, GenerateProposalsResponse> = {
    simple: {
      reasoning: "Single tool execution",
      toolCalls: [
        {
          toolName: "tool_registry_list",
          args: {},
          reasoning: "List tools",
        },
      ],
      explanation: "Will list available tools",
    },
    multi: {
      reasoning: "Multi-step workflow",
      toolCalls: [
        {
          toolName: "tool_registry_list",
          args: {},
          reasoning: "Step 1",
        },
        {
          toolName: "tool_policy_check",
          args: { toolName: "log_agent_run", scope: "execute" },
          reasoning: "Step 2",
        },
      ],
      explanation: "Multi-step process",
    },
    approval: {
      reasoning: "Approval required",
      toolCalls: [
        {
          toolName: "log_agent_run",
          args: { runId: "test-123" },
          reasoning: "Log execution",
        },
      ],
      explanation: "Will require approval",
    },
    error: {
      reasoning: "Invalid tool",
      toolCalls: [
        {
          toolName: "invalid_tool_xyz",
          args: {},
          reasoning: "Invalid",
        },
      ],
      explanation: "Will fail",
    },
    empty: {
      reasoning: "No action needed",
      toolCalls: [],
      explanation: "Empty proposal",
    },
  };

  const response = customResponse || responses[responseType];

  return vi
    .spyOn(OrchestratorAgent.prototype as any, "generateProposals")
    .mockResolvedValue(response);
}

/**
 * Mock Claude API to return an error
 *
 * @param error - Error message or Error object
 * @returns The mock spy
 */
export function mockClaudeAPIError(error: string | Error) {
  return vi
    .spyOn(OrchestratorAgent.prototype as any, "generateProposals")
    .mockRejectedValue(
      typeof error === "string" ? new Error(error) : error
    );
}

/**
 * Execute agent run with timeout protection
 *
 * @param goal - Agent goal
 * @param options - CLI options
 * @param timeout - Timeout in milliseconds (default 10000)
 * @returns ExecutionResult or timeout error
 */
export async function executeWithTimeout(
  goal: string,
  options: CLIOptions = {},
  timeout = 10000
): Promise<ExecutionResult> {
  return Promise.race([
    runAgent(goal, options),
    new Promise<ExecutionResult>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Execution timeout after ${timeout}ms`)),
        timeout
      )
    ),
  ]);
}

/**
 * Wait for execution and measure timing
 *
 * @param goal - Agent goal
 * @param options - CLI options
 * @returns { result, elapsedMs }
 */
export async function executeAndMeasure(
  goal: string,
  options: CLIOptions = {}
): Promise<{ result: ExecutionResult; elapsedMs: number }> {
  const startTime = Date.now();
  const result = await runAgent(goal, options);
  const elapsedMs = Date.now() - startTime;
  return { result, elapsedMs };
}

/**
 * Verify audit trail completeness
 *
 * @param runId - Run ID to verify
 * @throws If audit trail is invalid
 */
export function verifyAuditTrail(runId: string): void {
  const run = agentRunsLogger.getRun(runId);

  if (!run) {
    throw new Error(`Run ${runId} not found in audit trail`);
  }

  if (!run.startedAt || run.startedAt <= 0) {
    throw new Error(`Run ${runId} has invalid startedAt`);
  }

  if (!run.stopReason) {
    throw new Error(`Run ${runId} has no stopReason`);
  }

  if (run.completedAt === undefined || run.completedAt <= run.startedAt) {
    throw new Error(
      `Run ${runId} has invalid completedAt (${run.completedAt} <= ${run.startedAt})`
    );
  }
}

/**
 * Get execution summary from audit trail
 *
 * @param runId - Run ID
 * @returns Summary object or null if not found
 */
export function getExecutionSummary(runId: string) {
  const run = agentRunsLogger.getRun(runId);
  if (!run) {
return null;
}

  return {
    runId: run.runId,
    goal: run.goal,
    stopReason: run.stopReason,
    duration: run.completedAt - run.startedAt,
    toolCallsProposed: run.toolCallsProposed,
    toolCallsApproved: run.toolCallsApproved,
    toolCallsExecuted: run.toolCallsExecuted,
    errorMessage: run.errorMessage,
  };
}

/**
 * Verify execution result structure
 *
 * @param result - ExecutionResult to verify
 * @throws If result structure is invalid
 */
export function verifyResultStructure(result: ExecutionResult): void {
  if (!result.runId) {
    throw new Error("Result missing runId");
  }

  if (!result.stopReason) {
    throw new Error("Result missing stopReason");
  }

  if (typeof result.toolCallsProposed !== "number") {
    throw new Error("Result toolCallsProposed is not a number");
  }

  if (typeof result.toolCallsApproved !== "number") {
    throw new Error("Result toolCallsApproved is not a number");
  }

  if (typeof result.toolCallsExecuted !== "number") {
    throw new Error("Result toolCallsExecuted is not a number");
  }

  if (typeof result.durationMs !== "number" || result.durationMs < 0) {
    throw new Error("Result durationMs is invalid");
  }

  if (!result.results || typeof result.results !== "object") {
    throw new Error("Result missing results object");
  }
}

/**
 * Create test execution report
 *
 * @param result - ExecutionResult
 * @returns Formatted report string
 */
export function createExecutionReport(result: ExecutionResult): string {
  return `
Execution Report
===============
Run ID: ${result.runId}
Status: ${result.stopReason}
Duration: ${result.durationMs}ms

Tools:
  Proposed:  ${result.toolCallsProposed}
  Approved:  ${result.toolCallsApproved}
  Executed:  ${result.toolCallsExecuted}

Results: ${Object.keys(result.results).length} tool results
Errors: ${result.errors ? Object.keys(result.errors).length : 0}

${result.errors ? `Error Details:\n${JSON.stringify(result.errors, null, 2)}` : ""}
  `.trim();
}

/**
 * Compare two execution results
 *
 * @param result1 - First result
 * @param result2 - Second result
 * @returns Comparison object
 */
export function compareExecutionResults(
  result1: ExecutionResult,
  result2: ExecutionResult
) {
  return {
    sameStatus: result1.stopReason === result2.stopReason,
    sameToolCount: result1.toolCallsExecuted === result2.toolCallsExecuted,
    timingDiff: Math.abs(result1.durationMs - result2.durationMs),
    resultMatch:
      JSON.stringify(result1.results) === JSON.stringify(result2.results),
  };
}

/**
 * Mock pre-authorized tokens for batch execution
 *
 * @param tokens - Map of tool name to token
 * @returns CLI options with preAuthTokens
 */
export function createBatchOptions(
  tokens: Map<string, string>
): CLIOptions {
  return {
    preAuthTokens: tokens,
    autoApprove: false,
  };
}

/**
 * Create auto-approve options
 *
 * @param verbose - Include verbose output
 * @param dryRun - Dry run mode
 * @returns CLI options
 */
export function createAutoApproveOptions(
  verbose = false,
  dryRun = false
): CLIOptions {
  return {
    autoApprove: true,
    verbose,
    dryRun,
  };
}

/**
 * Clear all test state
 */
export function clearTestState(): void {
  vi.clearAllMocks();
  agentRunsLogger.clear();
}

/**
 * Setup test environment
 */
export function setupTestEnvironment(): void {
  clearTestState();

  // Set test environment variables
  process.env.M1_AUTO_APPROVE = "0";
  process.env.M1_DRY_RUN = "0";
  process.env.M1_VERBOSE = "0";
}

/**
 * Teardown test environment
 */
export function teardownTestEnvironment(): void {
  clearTestState();
  delete process.env.M1_AUTO_APPROVE;
  delete process.env.M1_DRY_RUN;
  delete process.env.M1_VERBOSE;
}

/**
 * Assert execution succeeded
 *
 * @param result - ExecutionResult
 * @throws If execution did not succeed
 */
export function assertExecutionSucceeded(result: ExecutionResult): void {
  if (result.stopReason !== "completed") {
    throw new Error(
      `Expected execution to complete, but got: ${result.stopReason}`
    );
  }

  if (!result.results || Object.keys(result.results).length === 0) {
    throw new Error("Expected execution results but got none");
  }
}

/**
 * Assert execution failed
 *
 * @param result - ExecutionResult
 * @throws If execution succeeded
 */
export function assertExecutionFailed(result: ExecutionResult): void {
  if (result.stopReason === "completed") {
    throw new Error("Expected execution to fail but it completed successfully");
  }
}

/**
 * Generate multiple test runs and return results
 *
 * @param goal - Goal to execute
 * @param count - Number of runs
 * @param options - CLI options
 * @returns Array of results
 */
export async function generateMultipleRuns(
  goal: string,
  count: number = 3,
  options: CLIOptions = {}
): Promise<ExecutionResult[]> {
  const promises = Array(count)
    .fill(null)
    .map(() => runAgent(goal, options));

  return Promise.all(promises);
}

/**
 * Analyze multiple execution results for consistency
 *
 * @param results - Array of ExecutionResult
 * @returns Analysis object
 */
export function analyzeConsistency(results: ExecutionResult[]) {
  if (results.length === 0) {
    return {
      samplesCount: 0,
      allSucceeded: false,
      allFailed: false,
      statusConsistency: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
    };
  }

  const succeeded = results.filter((r) => r.stopReason === "completed").length;
  const failed = results.length - succeeded;
  const durations = results.map((r) => r.durationMs);

  return {
    samplesCount: results.length,
    allSucceeded: succeeded === results.length,
    allFailed: failed === results.length,
    statusConsistency: (succeeded / results.length) * 100,
    avgDuration: durations.reduce((a, b) => a + b, 0) / results.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    successRate: (succeeded / results.length) * 100,
  };
}

/**
 * Mock CLI options for different scenarios
 */
export const cliOptionPresets = {
  simple: {},
  withApproval: { autoApprove: true },
  dryRun: { dryRun: true },
  verbose: { verbose: true },
  fullDebug: { verbose: true, autoApprove: true },
};

export default {
  mockClaudeAPI,
  mockClaudeAPIError,
  executeWithTimeout,
  executeAndMeasure,
  verifyAuditTrail,
  getExecutionSummary,
  verifyResultStructure,
  createExecutionReport,
  compareExecutionResults,
  createBatchOptions,
  createAutoApproveOptions,
  clearTestState,
  setupTestEnvironment,
  teardownTestEnvironment,
  assertExecutionSucceeded,
  assertExecutionFailed,
  generateMultipleRuns,
  analyzeConsistency,
  cliOptionPresets,
};
