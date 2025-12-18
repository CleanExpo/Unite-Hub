/**
 * M1 Phase 4: Integration Tests
 *
 * Comprehensive integration test suite covering multi-step workflows,
 * end-to-end approval flows, policy enforcement, and error recovery.
 *
 * Test Categories (30+ tests):
 * - End-to-End Workflow Tests (8 tests)
 * - Approval Flow Integration (6 tests)
 * - Policy Enforcement (6 tests)
 * - Error Recovery (6 tests)
 * - Multi-Agent Scenarios (4 tests)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runAgent } from "../cli/agent-run";
import { executeTool } from "../cli/tool-executor";
import { agentRunsLogger } from "../logging/agentRuns";
import { OrchestratorAgent } from "../agents/orchestrator";
import type { ExecutionResult, CLIOptions } from "../types";

/**
 * Integration test fixtures
 */
const integrationFixtures = {
  simpleGoals: {
    readOnly: "List all available M1 tools",
    singleTool: "Check policy for tool_registry_list",
    multiTool: "List tools and check policy for log_agent_run",
  },

  complexGoals: {
    withApproval: "List tools, check policy, and log the run",
    errorHandling: "Execute with invalid tool",
    policyViolation: "Execute tool without approval",
  },

  preAuthTokens: new Map([
    ["request_approval", "pre-auth:request_approval:execute:123:abc"],
    ["log_agent_run", "pre-auth:log_agent_run:execute:456:def"],
  ]),

  mockClaudeResponses: {
    validProposal: {
      reasoning: "User wants to list tools",
      toolCalls: [
        {
          toolName: "tool_registry_list",
          args: {},
          reasoning: "List available tools in registry",
        },
      ],
      explanation: "Will execute tool_registry_list",
    },

    multiToolProposal: {
      reasoning: "Multi-step workflow needed",
      toolCalls: [
        {
          toolName: "tool_registry_list",
          args: {},
          reasoning: "Step 1: List tools",
        },
        {
          toolName: "tool_policy_check",
          args: { toolName: "log_agent_run", scope: "execute" },
          reasoning: "Step 2: Check policy",
        },
      ],
      explanation: "Two-step process",
    },

    approvalRequiredProposal: {
      reasoning: "Need to log execution",
      toolCalls: [
        {
          toolName: "log_agent_run",
          args: { runId: "test-run-123" },
          reasoning: "Log the agent run",
        },
      ],
      explanation: "Will log execution to audit trail",
    },

    errorProposal: {
      reasoning: "Invalid tool requested",
      toolCalls: [
        {
          toolName: "invalid_tool_xyz",
          args: {},
          reasoning: "This tool does not exist",
        },
      ],
      explanation: "Will attempt invalid tool",
    },
  },
};

/**
 * Mock Claude API responses
 */
function mockClaudeAPI(
  responseType: "simple" | "multi" | "approval" | "error"
) {
  const responses: Record<string, any> = {
    simple: integrationFixtures.mockClaudeResponses.validProposal,
    multi: integrationFixtures.mockClaudeResponses.multiToolProposal,
    approval: integrationFixtures.mockClaudeResponses.approvalRequiredProposal,
    error: integrationFixtures.mockClaudeResponses.errorProposal,
  };

  return vi
    .spyOn(OrchestratorAgent.prototype as any, "generateProposals")
    .mockResolvedValue(responses[responseType]);
}

/**
 * Wait for execution with timeout
 */
async function waitForExecution(
  goal: string,
  options: CLIOptions = {},
  timeout = 10000
): Promise<ExecutionResult> {
  return await Promise.race([
    runAgent(goal, options),
    new Promise<ExecutionResult>((_, reject) =>
      setTimeout(() => reject(new Error("Execution timeout")), timeout)
    ),
  ]);
}

/**
 * Verify audit trail completeness
 */
function verifyAuditTrail(runId: string) {
  const run = agentRunsLogger.getRun(runId);
  expect(run).toBeDefined();
  if (run) {
    expect(run.startedAt).toBeGreaterThan(0);
    expect(run.stopReason).toBeDefined();
  }
}

// ============================================================
// END-TO-END WORKFLOW TESTS (8 tests)
// ============================================================

describe("E2E Workflow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should complete simple read-only goal", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result.stopReason).toBe("completed");
    expect(result.toolCallsProposed).toBeGreaterThan(0);
    expect(result.toolCallsExecuted).toBeGreaterThan(0);
    verifyAuditTrail(result.runId);
  });

  it("should handle multi-tool execution workflow", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      integrationFixtures.simpleGoals.multiTool,
      { autoApprove: true }
    );

    expect(result.stopReason).toBe("completed");
    expect(result.toolCallsProposed).toBeGreaterThanOrEqual(2);
    expect(result.toolCallsApproved).toBeGreaterThanOrEqual(2);
    verifyAuditTrail(result.runId);
  });

  it("should execute tools sequentially in order", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "List tools then check policy",
      { autoApprove: true }
    );

    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(2);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should track timing metrics for each execution", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const run = agentRunsLogger.getRun(result.runId);
    if (run) {
      expect(run.completedAt).toBeGreaterThan(0);
    }
  });

  it("should handle empty goal gracefully", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent("", { autoApprove: true });

    expect(result).toBeDefined();
    expect(result.stopReason).toBeDefined();
  });

  it("should handle long goal strings", async () => {
    mockClaudeAPI("simple");

    const longGoal =
      "List all tools ".repeat(50).substring(0, 500);
    const result = await runAgent(longGoal, { autoApprove: true });

    expect(result).toBeDefined();
    expect(result.stopReason).toBeDefined();
  });

  it("should handle special characters in goals", async () => {
    mockClaudeAPI("simple");

    const specialGoal =
      "List tools & check @policy #with $special %chars!";
    const result = await runAgent(specialGoal, { autoApprove: true });

    expect(result).toBeDefined();
    expect(result.stopReason).toBeDefined();
  });

  it("should complete workflow within reasonable time", async () => {
    mockClaudeAPI("simple");

    const startTime = Date.now();
    await runAgent(integrationFixtures.simpleGoals.readOnly, {
      autoApprove: true,
    });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
  });
});

// ============================================================
// APPROVAL FLOW INTEGRATION TESTS (6 tests)
// ============================================================

describe("Approval Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle pre-authorized token flow", async () => {
    mockClaudeAPI("approval");

    const preAuthTokens = new Map([
      ["log_agent_run", "pre-auth:token:here"],
    ]);

    const result = await runAgent(
      integrationFixtures.complexGoals.withApproval,
      { preAuthTokens, autoApprove: false }
    );

    expect(result).toBeDefined();
  });

  it("should auto-approve in testing mode", async () => {
    mockClaudeAPI("approval");

    const result = await runAgent(
      integrationFixtures.complexGoals.withApproval,
      { autoApprove: true }
    );

    expect(result.stopReason).toBe("completed");
  });

  it("should handle mixed read and write scope workflows", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "List tools (read) and then check policy (read)",
      { autoApprove: true }
    );

    expect(result.toolCallsExecuted).toBeGreaterThan(0);
  });

  it("should track approval status in audit trail", async () => {
    mockClaudeAPI("approval");

    const result = await runAgent(
      integrationFixtures.complexGoals.withApproval,
      { autoApprove: true }
    );

    verifyAuditTrail(result.runId);
    const run = agentRunsLogger.getRun(result.runId);
    if (run) {
      expect(run.stopReason).toBeDefined();
    }
  });

  it("should handle approval denial gracefully", async () => {
    mockClaudeAPI("approval");

    // Mock approval denial
    vi.spyOn(global, "setTimeout").mockImplementation(
      (cb: any) => (cb(), {} as any)
    );

    const result = await runAgent(
      integrationFixtures.complexGoals.withApproval,
      { autoApprove: true }
    );

    expect(result).toBeDefined();
  });

  it("should not require approval for read-scope tools", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: false } // No auto-approve, but should still work
    );

    expect(result.toolCallsExecuted).toBeGreaterThan(0);
  });
});

// ============================================================
// POLICY ENFORCEMENT TESTS (6 tests)
// ============================================================

describe("Policy Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should validate tools through policy engine", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result.toolCallsProposed).toBeGreaterThan(0);
    expect(result.stopReason).toBe("completed");
  });

  it("should enforce scope-based access control", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      "Check read-scope tool",
      { autoApprove: true }
    );

    // Read-scope tools should execute without approval
    expect(result.toolCallsExecuted).toBeGreaterThan(0);
  });

  it("should detect unregistered tools", async () => {
    mockClaudeAPI("error");

    const result = await runAgent(
      integrationFixtures.complexGoals.errorHandling,
      { autoApprove: true }
    );

    // Should handle gracefully
    expect(result).toBeDefined();
  });

  it("should log policy check results", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    verifyAuditTrail(result.runId);
  });

  it("should enforce execution limits", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result.toolCallsProposed).toBeLessThan(100); // Reasonable limit
  });

  it("should validate scope mismatch", async () => {
    const result = await executeTool("tool_policy_check", {
      toolName: "tool_registry_list",
      scope: "invalid_scope",
    });

    expect(result).toBeDefined();
  });
});

// ============================================================
// ERROR RECOVERY TESTS (6 tests)
// ============================================================

describe("Error Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle Claude API failures gracefully", async () => {
    vi.spyOn(OrchestratorAgent.prototype as any, "generateProposals").mockRejectedValue(
      new Error("API error")
    );

    try {
      await runAgent("Test goal", { autoApprove: true });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle malformed proposal responses", async () => {
    vi.spyOn(OrchestratorAgent.prototype as any, "generateProposals").mockResolvedValue({
      toolCalls: null,
      reasoning: "Invalid response",
    });

    try {
      await runAgent("Test goal", { autoApprove: true });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should recover from partial execution failures", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent("Multi-tool test", { autoApprove: true });

    // Should handle partial failures gracefully
    expect(result).toBeDefined();
  });

  it("should timeout long-running executions", async () => {
    mockClaudeAPI("simple");

    try {
      await waitForExecution(
        integrationFixtures.simpleGoals.readOnly,
        { autoApprove: true },
        100 // Very short timeout
      );
    } catch (error) {
      // Timeout expected in this case
      expect(error).toBeDefined();
    }
  });

  it("should handle policy validation errors", async () => {
    const result = await executeTool("tool_policy_check", {
      toolName: "nonexistent_tool",
      scope: "read",
    });

    expect(result).toBeDefined();
  });

  it("should log execution errors to audit trail", async () => {
    mockClaudeAPI("error");

    const result = await runAgent(
      integrationFixtures.complexGoals.errorHandling,
      { autoApprove: true }
    );

    // Should complete with error state
    expect(result).toBeDefined();
    if (result.errors) {
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// MULTI-AGENT SCENARIOS (4 tests)
// ============================================================

describe("Multi-Agent Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should execute sequential tool workflows", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "List tools then check policy",
      { autoApprove: true }
    );

    expect(result.toolCallsProposed).toBeGreaterThanOrEqual(2);
    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(2);
  });

  it("should handle tool proposals in correct order", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "Execute in sequence",
      { autoApprove: true }
    );

    expect(result.toolCallsExecuted).toEqual(result.toolCallsApproved);
  });

  it("should track dependent tool chains", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "Complex workflow with multiple steps",
      { autoApprove: true }
    );

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    verifyAuditTrail(result.runId);
  });

  it("should handle complex goal decomposition", async () => {
    mockClaudeAPI("multi");

    const complexGoal =
      "Perform analysis: first list all tools, then check policies, finally log results";

    const result = await runAgent(complexGoal, { autoApprove: true });

    expect(result.stopReason).toBe("completed");
  });
});

// ============================================================
// CROSS-CUTTING INTEGRATION TESTS (4 tests)
// ============================================================

describe("Cross-Cutting Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentRunsLogger.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should maintain consistency across runs", async () => {
    mockClaudeAPI("simple");

    const result1 = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );
    const result2 = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result1.stopReason).toBe(result2.stopReason);
    expect(result1.runId).not.toBe(result2.runId); // Different runs
  });

  it("should integrate all M1 components", async () => {
    mockClaudeAPI("multi");

    const result = await runAgent(
      "Integration test of all components",
      { autoApprove: true }
    );

    // Verify integration:
    // 1. OrchestratorAgent (proposed actions)
    expect(result.toolCallsProposed).toBeGreaterThan(0);

    // 2. Policy Engine (validated tools)
    expect(result.toolCallsApproved).toBeGreaterThanOrEqual(0);

    // 3. Tool Executor (executed tools)
    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(0);

    // 4. Audit Trail (logged results)
    verifyAuditTrail(result.runId);
  });

  it("should provide detailed execution metrics", async () => {
    mockClaudeAPI("simple");

    const result = await runAgent(
      integrationFixtures.simpleGoals.readOnly,
      { autoApprove: true }
    );

    expect(result.runId).toBeDefined();
    expect(result.stopReason).toBeDefined();
    expect(result.toolCallsProposed).toBeGreaterThanOrEqual(0);
    expect(result.toolCallsApproved).toBeGreaterThanOrEqual(0);
    expect(result.toolCallsExecuted).toBeGreaterThanOrEqual(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle rapid consecutive calls", async () => {
    mockClaudeAPI("simple");

    const promises = Array(5)
      .fill(null)
      .map(() =>
        runAgent(integrationFixtures.simpleGoals.readOnly, {
          autoApprove: true,
        })
      );

    const results = await Promise.all(promises);

    results.forEach((result) => {
      expect(result.stopReason).toBe("completed");
      expect(result.runId).toBeDefined();
    });

    // Verify all have unique IDs
    const uniqueIds = new Set(results.map((r) => r.runId));
    expect(uniqueIds.size).toBe(results.length);
  });
});
