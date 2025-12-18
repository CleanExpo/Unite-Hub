/**
 * M1 Persistence Tests - Phase 6
 *
 * Tests for Convex database integration and persistent storage
 * of agent runs and tool calls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { agentRunsLogger, reinitializeLogger } from "../logging/agentRuns";
import type { ToolCallRecord, AgentRunRecord } from "../logging/agentRuns";

describe("Persistence Layer - Convex Integration", () => {
  beforeEach(() => {
    agentRunsLogger.clear();
  });

  afterEach(() => {
    agentRunsLogger.clear();
  });

  describe("Run Creation and Persistence", () => {
    it("should create a new agent run record", () => {
      const runId = "test-run-001";
      const run = agentRunsLogger.createRun(
        runId,
        "OrchestratorAgent",
        "List all tools",
        {}
      );

      expect(run).toBeDefined();
      expect(run.runId).toBe(runId);
      expect(run.agentName).toBe("OrchestratorAgent");
      expect(run.goal).toBe("List all tools");
      expect(run.stopReason).toBe("completed");
      expect(run.toolCallsProposed).toBe(0);
      expect(run.toolCallsApproved).toBe(0);
      expect(run.toolCallsExecuted).toBe(0);
      expect(run.startedAt).toBeGreaterThan(0);
    });

    it("should retrieve created run from in-memory storage", () => {
      const runId = "test-run-002";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test goal", {});

      const retrieved = agentRunsLogger.getRun(runId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.runId).toBe(runId);
    });

    it("should complete a run with proper metadata", () => {
      const runId = "test-run-003";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      const beforeComplete = Date.now();
      agentRunsLogger.completeRun(runId, "completed");
      const afterComplete = Date.now();

      const run = agentRunsLogger.getRun(runId);
      expect(run?.stopReason).toBe("completed");
      expect(run?.completedAt).toBeGreaterThanOrEqual(beforeComplete);
      expect(run?.completedAt).toBeLessThanOrEqual(afterComplete);
      expect(run?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should handle different stop reasons", () => {
      const stopReasons: Array<"completed" | "error" | "policy_denied"> = [
        "completed",
        "error",
        "policy_denied",
      ];

      stopReasons.forEach((reason, index) => {
        const runId = `test-run-${index}`;
        agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});
        agentRunsLogger.completeRun(runId, reason);

        const run = agentRunsLogger.getRun(runId);
        expect(run?.stopReason).toBe(reason);
      });
    });

    it("should add error messages to failed runs", () => {
      const runId = "test-run-error";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});
      agentRunsLogger.completeRun(
        runId,
        "error",
        "Database connection timeout"
      );

      const run = agentRunsLogger.getRun(runId);
      expect(run?.stopReason).toBe("error");
      expect(run?.errorMessage).toBe("Database connection timeout");
    });
  });

  describe("Tool Call Recording", () => {
    it("should log proposed tool calls", () => {
      const runId = "test-run-tc-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      const toolCall = agentRunsLogger.logProposedToolCall(
        runId,
        {
          requestId: "req-001",
          toolName: "tool_registry_list",
          args: {},
        },
        "read",
        false
      );

      expect(toolCall).toBeDefined();
      expect(toolCall.requestId).toBe("req-001");
      expect(toolCall.toolName).toBe("tool_registry_list");
      expect(toolCall.status).toBe("proposed");
      expect(toolCall.approvalRequired).toBe(false);
    });

    it("should track tool call statistics in run", () => {
      const runId = "test-run-tc-002";
      const run = agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-001", toolName: "tool_registry_list", args: {} },
        "read",
        false
      );

      const updatedRun = agentRunsLogger.getRun(runId);
      expect(updatedRun?.toolCallsProposed).toBe(1);
    });

    it("should log policy check results", () => {
      const runId = "test-run-tc-003";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      const toolCall = agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-001", toolName: "log_agent_run", args: {} },
        "write",
        true
      );

      agentRunsLogger.logPolicyCheck("req-001", true, "Tool allowed");

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.policyCheckResult?.passed).toBe(true);
      expect(recorded?.policyCheckResult?.reason).toBe("Tool allowed");
      expect(recorded?.policyCheckResult?.checkedAt).toBeGreaterThan(0);
    });

    it("should log policy rejection", () => {
      const runId = "test-run-tc-004";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-002", toolName: "dangerous_tool", args: {} },
        "execute",
        true
      );

      agentRunsLogger.logPolicyCheck(
        "req-002",
        false,
        "Tool scope requires approval"
      );

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.status).toBe("policy_rejected");
      expect(recorded?.policyCheckResult?.passed).toBe(false);
    });

    it("should log approval requests", () => {
      const runId = "test-run-tc-005";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-003", toolName: "log_agent_run", args: {} },
        "execute",
        true
      );

      const token = "jwt-token-xxx";
      agentRunsLogger.logApprovalRequest("req-003", token);

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.status).toBe("approval_pending");
      expect(recorded?.approvalToken).toBe(token);
    });

    it("should log approval granted", () => {
      const runId = "test-run-tc-006";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-004", toolName: "log_agent_run", args: {} },
        "execute",
        true
      );

      const beforeApproval = Date.now();
      agentRunsLogger.logApprovalGranted("req-004", "user@example.com");
      const afterApproval = Date.now();

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.status).toBe("approved");
      expect(recorded?.approvedBy).toBe("user@example.com");
      expect(recorded?.approvedAt).toBeGreaterThanOrEqual(beforeApproval);
      expect(recorded?.approvedAt).toBeLessThanOrEqual(afterApproval);
    });

    it("should log successful tool execution", () => {
      const runId = "test-run-tc-007";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-005", toolName: "tool_registry_list", args: {} },
        "read",
        false
      );

      const result = { tools: ["tool1", "tool2"] };
      agentRunsLogger.logToolExecution("req-005", result);

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.status).toBe("executed");
      expect(recorded?.outputResult).toEqual(result);
      expect(recorded?.executedAt).toBeGreaterThan(0);
    });

    it("should log tool execution failure", () => {
      const runId = "test-run-tc-008";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-006", toolName: "test_tool", args: {} },
        "read",
        false
      );

      const error = "Tool execution timeout";
      agentRunsLogger.logToolExecution("req-006", {}, error);

      const recorded = agentRunsLogger.getToolCalls(runId)[0];
      expect(recorded?.status).toBe("execution_failed");
      expect(recorded?.executionError).toBe(error);
      expect(recorded?.executedAt).toBeGreaterThan(0);
    });
  });

  describe("Approval Token Tracking", () => {
    it("should add approval tokens to run", () => {
      const runId = "test-run-at-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      const token1 = "jwt-token-001";
      const token2 = "jwt-token-002";

      agentRunsLogger.addApprovalToken(runId, token1);
      agentRunsLogger.addApprovalToken(runId, token2);

      const run = agentRunsLogger.getRun(runId);
      expect(run?.approvalTokens).toContain(token1);
      expect(run?.approvalTokens).toContain(token2);
      expect(run?.approvalTokens).toHaveLength(2);
    });

    it("should not duplicate approval tokens", () => {
      const runId = "test-run-at-002";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      const token = "jwt-token-001";
      agentRunsLogger.addApprovalToken(runId, token);
      agentRunsLogger.addApprovalToken(runId, token);

      const run = agentRunsLogger.getRun(runId);
      expect(run?.approvalTokens).toHaveLength(1);
    });
  });

  describe("Query Operations", () => {
    beforeEach(() => {
      agentRunsLogger.clear();
      // Create multiple runs with different properties
      for (let i = 0; i < 3; i++) {
        const runId = `test-run-query-op-${i}`;
        agentRunsLogger.createRun(runId, "OrchestratorAgent", `Goal ${i}`, {});
      }

      for (let i = 0; i < 2; i++) {
        const runId = `test-run-query-custom-${i}`;
        agentRunsLogger.createRun(runId, "CustomAgent", `Custom goal ${i}`, {});
      }
    });

    it("should query runs by agent name", () => {
      const orchestratorRuns = agentRunsLogger.runsByAgent("OrchestratorAgent");
      expect(orchestratorRuns).toHaveLength(3);

      const customRuns = agentRunsLogger.runsByAgent("CustomAgent");
      expect(customRuns).toHaveLength(2);
    });

    it("should query runs by stop reason", () => {
      // Complete some runs with different reasons
      // Note: -op-2 stays "completed" from creation by default
      agentRunsLogger.completeRun("test-run-query-op-0", "error");
      agentRunsLogger.completeRun("test-run-query-op-1", "policy_denied");
      agentRunsLogger.completeRun("test-run-query-custom-0", "limit_exceeded");
      // -op-2 stays as "completed"
      // -custom-1 stays as "completed"

      const completedRuns = agentRunsLogger.runsByStopReason("completed");
      expect(completedRuns).toHaveLength(2); // op-2 and custom-1

      const errorRuns = agentRunsLogger.runsByStopReason("error");
      expect(errorRuns).toHaveLength(1); // op-0

      const deniedRuns = agentRunsLogger.runsByStopReason("policy_denied");
      expect(deniedRuns).toHaveLength(1); // op-1

      const limitRuns = agentRunsLogger.runsByStopReason("limit_exceeded");
      expect(limitRuns).toHaveLength(1); // custom-0
    });

    it("should retrieve all runs", () => {
      const allRuns = agentRunsLogger.getAllRuns();
      expect(allRuns.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Summary Operations", () => {
    beforeEach(() => {
      agentRunsLogger.clear();
    });

    it("should generate run summary with no tool calls", () => {
      const runId = "test-run-summary-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});
      agentRunsLogger.completeRun(runId, "completed");

      const summary = agentRunsLogger.getSummary(runId);
      expect(summary).toBeDefined();
      expect(summary?.run?.runId).toBe(runId);
      expect(summary?.toolCalls).toHaveLength(0);
      expect(summary?.summary.proposed).toBe(0);
      expect(summary?.summary.executed).toBe(0);
    });

    it("should generate complete run summary", () => {
      const runId = "test-run-summary-002";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      // Log various tool call states
      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-sum-001", toolName: "tool1", args: {} },
        "read",
        false
      );
      agentRunsLogger.logToolExecution("req-sum-001", { result: "ok" });

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-sum-002", toolName: "tool2", args: {} },
        "execute",
        true
      );
      agentRunsLogger.logPolicyCheck("req-sum-002", false);

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-sum-003", toolName: "tool3", args: {} },
        "write",
        true
      );
      agentRunsLogger.logApprovalGranted("req-sum-003", "user");

      agentRunsLogger.completeRun(runId, "completed");

      const summary = agentRunsLogger.getSummary(runId);
      // All 3 tool calls get status changes, so proposed count is 0
      expect(summary?.summary.proposed).toBe(0);
      expect(summary?.summary.executed).toBe(1); // req-sum-001
      expect(summary?.summary.rejected).toBe(1); // req-sum-002
      expect(summary?.summary.approved).toBe(1); // req-sum-003
      expect(summary?.toolCalls).toHaveLength(3);
    });

    it("should return null for non-existent run", () => {
      const summary = agentRunsLogger.getSummary("non-existent-run");
      expect(summary).toBeNull();
    });
  });

  describe("Export Operations", () => {
    it("should export run to Convex (graceful fallback)", async () => {
      const runId = "test-run-export-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});
      agentRunsLogger.completeRun(runId, "completed");

      // Should not throw even without Convex configured
      const exported = await agentRunsLogger.exportRun(runId);
      expect(exported).toBeDefined();
      expect(exported?.runId).toBe(runId);
    });

    it("should export tool calls to Convex (graceful fallback)", async () => {
      const runId = "test-run-export-002";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Test", {});

      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-001", toolName: "tool1", args: {} },
        "read",
        false
      );

      // Should not throw even without Convex configured
      const exported = await agentRunsLogger.exportToolCalls(runId);
      expect(exported).toBeDefined();
      expect(exported).toHaveLength(1);
    });

    it("should return null when exporting non-existent run", async () => {
      const exported = await agentRunsLogger.exportRun("non-existent");
      expect(exported).toBeNull();
    });

    it("should return empty array when exporting non-existent run tool calls", async () => {
      const exported = await agentRunsLogger.exportToolCalls("non-existent");
      expect(exported).toEqual([]);
    });
  });

  describe("Data Isolation", () => {
    it("should isolate runs from each other", () => {
      const run1Id = "test-run-iso-001";
      const run2Id = "test-run-iso-002";

      agentRunsLogger.createRun(run1Id, "Agent1", "Goal1", {});
      agentRunsLogger.createRun(run2Id, "Agent2", "Goal2", {});

      agentRunsLogger.logProposedToolCall(
        run1Id,
        { requestId: "req-001", toolName: "tool1", args: {} },
        "read",
        false
      );

      const run1Calls = agentRunsLogger.getToolCalls(run1Id);
      const run2Calls = agentRunsLogger.getToolCalls(run2Id);

      expect(run1Calls).toHaveLength(1);
      expect(run2Calls).toHaveLength(0);
    });

    it("should clear all data on clear()", () => {
      agentRunsLogger.createRun("run-1", "Agent", "Goal", {});
      agentRunsLogger.logProposedToolCall(
        "run-1",
        { requestId: "req-001", toolName: "tool1", args: {} },
        "read",
        false
      );

      expect(agentRunsLogger.getAllRuns()).toHaveLength(1);

      agentRunsLogger.clear();

      expect(agentRunsLogger.getAllRuns()).toHaveLength(0);
      expect(agentRunsLogger.getRun("run-1")).toBeUndefined();
    });
  });

  describe("Complex Workflows", () => {
    it("should track complete multi-tool approval workflow", () => {
      const runId = "test-run-workflow-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Complex task", {});

      // Tool 1: Read operation (no approval needed)
      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-001", toolName: "tool_registry_list", args: {} },
        "read",
        false
      );
      agentRunsLogger.logPolicyCheck("req-001", true);
      agentRunsLogger.logToolExecution("req-001", { tools: ["t1", "t2"] });

      // Tool 2: Write operation (needs approval)
      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-002", toolName: "log_agent_run", args: {} },
        "write",
        true
      );
      agentRunsLogger.logPolicyCheck("req-002", true);
      agentRunsLogger.logApprovalRequest("req-002", "token-002");
      agentRunsLogger.addApprovalToken(runId, "token-002");
      agentRunsLogger.logApprovalGranted("req-002", "user@example.com");
      agentRunsLogger.logToolExecution("req-002", { logged: true });

      // Tool 3: Execute operation (needs approval, denied)
      agentRunsLogger.logProposedToolCall(
        runId,
        { requestId: "req-003", toolName: "dangerous_tool", args: {} },
        "execute",
        true
      );
      agentRunsLogger.logPolicyCheck("req-003", false, "Risky operation");

      agentRunsLogger.completeRun(runId, "completed");

      const summary = agentRunsLogger.getSummary(runId);
      const run = summary?.run;

      expect(run?.toolCallsProposed).toBe(3);
      expect(run?.toolCallsApproved).toBe(1);
      expect(run?.toolCallsExecuted).toBe(2);
      expect(run?.approvalTokens).toHaveLength(1);
      expect(summary?.summary.executed).toBe(2);
      expect(summary?.summary.rejected).toBe(1);
    });

    it("should handle rapid successive tool calls", () => {
      const runId = "test-run-rapid-001";
      agentRunsLogger.createRun(runId, "OrchestratorAgent", "Rapid test", {});

      for (let i = 0; i < 10; i++) {
        agentRunsLogger.logProposedToolCall(
          runId,
          { requestId: `req-${i}`, toolName: `tool${i}`, args: {} },
          "read",
          false
        );
      }

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls).toHaveLength(10);

      const run = agentRunsLogger.getRun(runId);
      expect(run?.toolCallsProposed).toBe(10);
    });
  });
});
