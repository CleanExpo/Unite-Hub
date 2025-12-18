/**
 * M1 Safety Guards Tests
 *
 * Comprehensive test suite for all safety mechanisms:
 * 1. Tool registration enforcement
 * 2. Policy validation (tool not in registry)
 * 3. Approval gate enforcement
 * 4. Scope-based access control
 * 5. Execution limits
 * 6. Observability and audit trail
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { registry } from "../tools/registry";
import { policyEngine } from "../tools/policy";
import { agentRunsLogger } from "../logging/agentRuns";
import type { ToolCall } from "../types";

describe("M1 Safety Guards", () => {
  beforeEach(() => {
    // Clear caches before each test
    policyEngine.clearCache();
    policyEngine.clearErrors();
    agentRunsLogger.clear();
  });

  // ============================================================
  // Test 1: Reject Unregistered Tool
  // ============================================================
  describe("Guard 1: Reject Unregistered Tools", () => {
    it("should reject a tool that is not in the registry", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "evil_tool_not_in_registry",
        args: {},
        scope: "read",
        approvalRequired: false,
      };

      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("not registered");
      expect(decision.policyCheckResult.passed).toBe(false);
    });

    it("should accept a tool that is in the registry", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "tool_registry_list", // Exists in registry
        args: {},
        scope: "read",
        approvalRequired: false,
      };

      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(true);
      expect(decision.policyCheckResult.passed).toBe(true);
    });

    it("should provide helpful error message with registry suggestions", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "definitely_not_a_real_tool",
        args: {},
        scope: "read",
        approvalRequired: false,
      };

      const decision = policyEngine.validateToolCall(call);

      expect(decision.reason).toContain("not registered");
      expect(decision.reason).toContain("tool_registry_list");
    });
  });

  // ============================================================
  // Test 2: Approval Gate Enforcement
  // ============================================================
  describe("Guard 2: Approval Gate Enforcement", () => {
    it("should require approval token for write scope tools", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run", // write scope
        args: {},
        scope: "write",
        approvalRequired: true,
      };

      // No approval token
      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(false);
      expect(decision.requiresApproval).toBe(true);
      expect(decision.reason).toContain("approval token");
    });

    it("should require approval token for execute scope tools", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "request_approval", // execute scope
        args: {},
        scope: "execute",
        approvalRequired: true,
      };

      // No approval token
      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(false);
      expect(decision.requiresApproval).toBe(true);
      expect(decision.reason).toContain("approval token");
    });

    it("should allow read scope tools without approval", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "tool_registry_list", // read scope
        args: {},
        scope: "read",
        approvalRequired: false,
      };

      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(false);
    });

    it("should accept tool call when approval token is provided", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run", // write scope
        args: {},
        scope: "write",
        approvalRequired: true,
      };

      const token = "approval:log_agent_run:write:1234567890:abc123";
      const decision = policyEngine.validateToolCall(call, token);

      expect(decision.allowed).toBe(true);
      expect(decision.policyCheckResult.passed).toBe(true);
    });

    it("should reject invalid/expired approval tokens", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        args: {},
        scope: "write",
        approvalRequired: true,
      };

      const invalidToken = ""; // Empty token
      const decision = policyEngine.validateToolCall(call, invalidToken);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("token");
    });
  });

  // ============================================================
  // Test 3: Scope-Based Access Control
  // ============================================================
  describe("Guard 3: Scope-Based Access Control", () => {
    it("should identify correct scope for read tools", () => {
      const scope = registry.getToolScope("tool_registry_list");
      expect(scope).toBe("read");
    });

    it("should identify correct scope for write tools", () => {
      const scope = registry.getToolScope("log_agent_run");
      expect(scope).toBe("write");
    });

    it("should identify correct scope for execute tools", () => {
      const scope = registry.getToolScope("request_approval");
      expect(scope).toBe("execute");
    });

    it("should batch validate multiple tool calls", () => {
      const calls: ToolCall[] = [
        {
          requestId: "req-1",
          toolName: "tool_registry_list",
          scope: "read",
          approvalRequired: false,
        },
        {
          requestId: "req-2",
          toolName: "log_agent_run",
          scope: "write",
          approvalRequired: true,
        },
        {
          requestId: "req-3",
          toolName: "invalid_tool",
          scope: "read",
          approvalRequired: false,
        },
      ];

      const approvalTokens = new Map([["req-2", "approval:log_agent_run:write:1234567890:abc123"]]);
      const decisions = policyEngine.validateToolCalls(calls, approvalTokens);

      expect(decisions.get("req-1")?.allowed).toBe(true); // read, no approval needed
      expect(decisions.get("req-2")?.allowed).toBe(true); // write, has approval token
      expect(decisions.get("req-3")?.allowed).toBe(false); // tool not in registry
    });
  });

  // ============================================================
  // Test 4: Execution Limits
  // ============================================================
  describe("Guard 4: Execution Limits", () => {
    it("should reject when step limit is exceeded", () => {
      const constraints = { maxSteps: 12 };
      const stats = { steps: 12, toolCalls: 5, runtimeMs: 30000 };

      const result = policyEngine.validateConstraints(constraints, stats);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("Step"))).toBe(true);
    });

    it("should reject when tool call limit is exceeded", () => {
      const constraints = { maxToolCalls: 8 };
      const stats = { steps: 10, toolCalls: 8, runtimeMs: 30000 };

      const result = policyEngine.validateConstraints(constraints, stats);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("Tool call"))).toBe(true);
    });

    it("should reject when runtime limit is exceeded", () => {
      const constraints = { maxRuntimeSeconds: 60 };
      const stats = { steps: 10, toolCalls: 5, runtimeMs: 60000 }; // 60 seconds

      const result = policyEngine.validateConstraints(constraints, stats);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes("Runtime"))).toBe(true);
    });

    it("should allow when all limits are within bounds", () => {
      const constraints = {
        maxSteps: 12,
        maxToolCalls: 8,
        maxRuntimeSeconds: 60,
      };
      const stats = { steps: 5, toolCalls: 3, runtimeMs: 15000 };

      const result = policyEngine.validateConstraints(constraints, stats);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should catch multiple limit violations", () => {
      const constraints = {
        maxSteps: 12,
        maxToolCalls: 8,
        maxRuntimeSeconds: 60,
      };
      const stats = { steps: 15, toolCalls: 10, runtimeMs: 65000 };

      const result = policyEngine.validateConstraints(constraints, stats);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(3);
    });
  });

  // ============================================================
  // Test 5: Observability and Audit Trail
  // ============================================================
  describe("Guard 5: Observability & Audit Trail", () => {
    it("should create a new run with metadata", () => {
      const runId = "run-123";
      const run = agentRunsLogger.createRun(
        runId,
        "orchestrator",
        "Process bookings",
        { maxSteps: 12, maxToolCalls: 8, maxRuntimeSeconds: 60 }
      );

      expect(run.runId).toBe(runId);
      expect(run.agentName).toBe("orchestrator");
      expect(run.toolCallsProposed).toBe(0);
    });

    it("should log proposed tool calls", () => {
      const runId = "run-123";
      agentRunsLogger.createRun(
        runId,
        "orchestrator",
        "Test",
        {}
      );

      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        scope: "write",
        approvalRequired: true,
      };

      agentRunsLogger.logProposedToolCall(runId, call, "write", true);

      const run = agentRunsLogger.getRun(runId);
      expect(run?.toolCallsProposed).toBe(1);

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].status).toBe("proposed");
    });

    it("should track policy check results", () => {
      const runId = "run-123";
      agentRunsLogger.createRun(runId, "orchestrator", "Test", {});

      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        scope: "write",
        approvalRequired: true,
      };

      agentRunsLogger.logProposedToolCall(runId, call, "write", true);
      agentRunsLogger.logPolicyCheck("req-1", false, "Missing approval token");

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls[0].status).toBe("policy_rejected");
      expect(toolCalls[0].policyCheckResult?.reason).toContain("approval token");
    });

    it("should track approval flow", () => {
      const runId = "run-123";
      agentRunsLogger.createRun(runId, "orchestrator", "Test", {});

      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        scope: "write",
        approvalRequired: true,
      };

      agentRunsLogger.logProposedToolCall(runId, call, "write", true);
      agentRunsLogger.logApprovalRequest("req-1", "token-123");
      agentRunsLogger.logApprovalGranted("req-1", "system");

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls[0].status).toBe("approved");
      expect(toolCalls[0].approvalToken).toBe("token-123");
      expect(toolCalls[0].approvedBy).toBe("system");
    });

    it("should track execution results", () => {
      const runId = "run-123";
      agentRunsLogger.createRun(runId, "orchestrator", "Test", {});

      const call: ToolCall = {
        requestId: "req-1",
        toolName: "tool_registry_list",
        scope: "read",
        approvalRequired: false,
      };

      agentRunsLogger.logProposedToolCall(runId, call, "read", false);
      const result = { tools: 4, totalScopes: 3 };
      agentRunsLogger.logToolExecution("req-1", result);

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls[0].status).toBe("executed");
      expect(toolCalls[0].outputResult).toEqual(result);
    });

    it("should track execution errors", () => {
      const runId = "run-123";
      agentRunsLogger.createRun(runId, "orchestrator", "Test", {});

      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        scope: "write",
        approvalRequired: true,
      };

      agentRunsLogger.logProposedToolCall(runId, call, "write", true);
      agentRunsLogger.logToolExecution("req-1", {}, "Network timeout");

      const toolCalls = agentRunsLogger.getToolCalls(runId);
      expect(toolCalls[0].status).toBe("execution_failed");
      expect(toolCalls[0].executionError).toBe("Network timeout");
    });

    it("should complete runs with correct metadata", () => {
      const runId = "run-123";
      const run = agentRunsLogger.createRun(
        runId,
        "orchestrator",
        "Test",
        {}
      );

      const startTime = run.startedAt;

      // Complete the run
      agentRunsLogger.completeRun(runId, "completed");

      const completedRun = agentRunsLogger.getRun(runId);
      expect(completedRun?.stopReason).toBe("completed");
      expect(completedRun?.completedAt).toBeDefined();
      expect(completedRun?.durationMs).toBeDefined();
      if (completedRun?.completedAt && completedRun?.durationMs) {
        expect(completedRun.completedAt >= startTime).toBe(true);
        expect(completedRun.durationMs >= 0).toBe(true);
      }
    });

    it("should generate full run summary", () => {
      const runId = "run-123";
      const run = agentRunsLogger.createRun(runId, "orchestrator", "Test", {});

      // Log several tool calls with different statuses
      const call1: ToolCall = {
        requestId: "req-1",
        toolName: "tool_registry_list",
        scope: "read",
        approvalRequired: false,
      };
      agentRunsLogger.logProposedToolCall(runId, call1, "read", false);
      agentRunsLogger.logToolExecution("req-1", {}); // Execute first call

      const call2: ToolCall = {
        requestId: "req-2",
        toolName: "invalid_tool",
        scope: "read",
        approvalRequired: false,
      };
      agentRunsLogger.logProposedToolCall(runId, call2, "read", false);
      agentRunsLogger.logPolicyCheck("req-2", false, "Not in registry"); // Reject second call

      agentRunsLogger.completeRun(runId, "completed");

      const summary = agentRunsLogger.getSummary(runId);
      expect(summary).toBeDefined();
      expect(summary?.toolCalls).toHaveLength(2);
      expect(summary?.run.runId).toBe(runId);
      // Verify at least one tool call exists
      const toolCalls = summary?.toolCalls || [];
      const executed = toolCalls.filter((c) => c.status === "executed");
      const rejected = toolCalls.filter((c) => c.status === "policy_rejected");
      expect(executed.length + rejected.length).toBe(2);
    });
  });

  // ============================================================
  // Test 6: Policy Denial Handling
  // ============================================================
  describe("Guard 6: Policy Denial Handling", () => {
    it("should provide clear denial reasons for debugging", () => {
      const reasons = registry.getTool("log_agent_run");
      expect(reasons).toBeDefined();
      expect(reasons?.scope).toBe("write");
    });

    it("should handle batch validation with mixed results", () => {
      const calls: ToolCall[] = [
        {
          requestId: "req-1",
          toolName: "tool_registry_list",
          scope: "read",
          approvalRequired: false,
        },
        {
          requestId: "req-2",
          toolName: "log_agent_run",
          scope: "write",
          approvalRequired: true,
        },
        {
          requestId: "req-3",
          toolName: "tool_policy_check",
          scope: "read",
          approvalRequired: false,
        },
      ];

      // Only approve req-2 with valid token
      const approvalTokens = new Map([["req-2", "approval:log_agent_run:write:1234567890:abc123"]]);
      const decisions = policyEngine.validateToolCalls(calls, approvalTokens);

      const allowedCalls = Array.from(decisions.values()).filter(
        (d) => d.allowed
      );
      const deniedCalls = Array.from(decisions.values()).filter(
        (d) => !d.allowed
      );

      expect(allowedCalls).toHaveLength(3); // req-1, req-2, req-3 (all approved)
      expect(deniedCalls).toHaveLength(0); // none denied
    });

    it("should provide useful error context when policy denies", () => {
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        args: { runId: "test" },
        scope: "write",
        approvalRequired: true,
      };

      const decision = policyEngine.validateToolCall(call);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBeDefined();
      expect(decision.reason?.length).toBeGreaterThan(0);
      expect(decision.policyCheckResult.reason).toBeDefined();
    });
  });

  // ============================================================
  // Test 7: Registry Integrity
  // ============================================================
  describe("Guard 7: Registry Integrity", () => {
    it("should have all required M1 tools in registry", () => {
      const requiredTools = [
        "tool_registry_list",
        "tool_policy_check",
        "request_approval",
        "log_agent_run",
      ];

      for (const toolName of requiredTools) {
        expect(registry.hasTool(toolName)).toBe(true);
      }
    });

    it("should have correct scope for all M1 tools", () => {
      expect(registry.getToolScope("tool_registry_list")).toBe("read");
      expect(registry.getToolScope("tool_policy_check")).toBe("read");
      expect(registry.getToolScope("request_approval")).toBe("execute");
      expect(registry.getToolScope("log_agent_run")).toBe("write");
    });

    it("should prevent scope confusion attacks", () => {
      // Attacker tries to call write-scope tool claiming it's read
      const call: ToolCall = {
        requestId: "req-1",
        toolName: "log_agent_run",
        scope: "read", // Lying about scope
        approvalRequired: false,
      };

      const decision = policyEngine.validateToolCall(call);

      // Should still deny because it needs approval
      expect(decision.allowed).toBe(false);
    });
  });
});
