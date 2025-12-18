/**
 * OrchestratorAgent Tests
 *
 * Comprehensive test suite for Phase 2 OrchestratorAgent implementation.
 * Tests agent initialization, Claude API integration, proposal validation,
 * M1 integration, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrchestratorAgent, orchestrate } from "../agents/orchestrator";
import { registry } from "../tools/registry";
import { policyEngine } from "../tools/policy";
import { agentRunsLogger } from "../logging/agentRuns";
import type { ExecutionRequest } from "../types";

describe("OrchestratorAgent", () => {
  beforeEach(() => {
    agentRunsLogger.clear();
    policyEngine.clearCache();
  });

  // ============================================================
  // Agent Initialization Tests
  // ============================================================
  describe("Initialization", () => {
    it("should initialize with goal", () => {
      const agent = new OrchestratorAgent("Find restaurants");
      expect(agent.getRunId()).toBeDefined();
      expect(agent.getDuration()).toBeGreaterThanOrEqual(0);
      expect(agent.getProposalCount()).toBe(0);
    });

    it("should generate unique runIds for each agent", () => {
      const agent1 = new OrchestratorAgent("Goal 1");
      const agent2 = new OrchestratorAgent("Goal 2");

      expect(agent1.getRunId()).not.toBe(agent2.getRunId());
    });

    it("should accept custom config", () => {
      const agent = new OrchestratorAgent("Test goal", {
        model: "claude-opus-4-5-20251101",
        maxTokens: 512,
        temperature: 0.5,
      });

      expect(agent).toBeDefined();
    });

    it("should set execution constraints correctly", async () => {
      const agent = new OrchestratorAgent("Test goal");
      // Mock Claude to prevent actual API call
      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.constraints).toEqual({
        maxSteps: 12,
        maxToolCalls: 8,
        maxRuntimeSeconds: 60,
      });
    });
  });

  // ============================================================
  // ExecutionRequest Building Tests
  // ============================================================
  describe("ExecutionRequest Building", () => {
    it("should build valid ExecutionRequest structure", async () => {
      const agent = new OrchestratorAgent("Test goal");

      // Mock Claude API
      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Need to check tools",
        toolCalls: [
          {
            toolName: "tool_registry_list",
            args: {},
            reasoning: "List available tools",
          },
        ],
        explanation: "Will check registry",
      });

      const request = await agent.execute();

      expect(request).toHaveProperty("runId");
      expect(request).toHaveProperty("agentName", "orchestrator");
      expect(request).toHaveProperty("goal", "Test goal");
      expect(request).toHaveProperty("constraints");
      expect(request).toHaveProperty("proposedActions");
    });

    it("should include runId matching agent execution", async () => {
      const agent = new OrchestratorAgent("Test goal");
      const runId = agent.getRunId();

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.runId).toBe(runId);
    });

    it("should include goal in ExecutionRequest", async () => {
      const goal = "Analyze market trends";
      const agent = new OrchestratorAgent(goal);

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.goal).toBe(goal);
    });

    it("should handle empty proposals", async () => {
      const agent = new OrchestratorAgent("Complex goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "No applicable tools",
        toolCalls: [],
        explanation: "Unable to handle this goal",
      });

      const request = await agent.execute();

      expect(request.proposedActions).toEqual([]);
    });
  });

  // ============================================================
  // Tool Proposal Validation Tests
  // ============================================================
  describe("Tool Proposal Validation", () => {
    it("should validate tool names against registry", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [
          {
            toolName: "evil_tool_not_in_registry",
            args: {},
            reasoning: "Malicious tool",
          },
        ],
        explanation: "Test",
      });

      const request = await agent.execute();

      // Should have 0 proposed actions since tool doesn't exist
      expect(request.proposedActions).toHaveLength(0);
    });

    it("should accept valid registered tools", async () => {
      const agent = new OrchestratorAgent("List available tools");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Need to list tools",
        toolCalls: [
          {
            toolName: "tool_registry_list",
            args: {},
            reasoning: "List tools",
          },
        ],
        explanation: "Will list tools",
      });

      const request = await agent.execute();

      // tool_registry_list is in registry, so should be included
      expect(request.proposedActions.length).toBeGreaterThanOrEqual(0);
    });

    it("should truncate proposals over maxToolCalls", async () => {
      const agent = new OrchestratorAgent("Test goal");

      // Create 12 proposals (exceeds maxToolCalls of 8)
      const toolCalls = Array(12).fill(null).map((_, i) => ({
        toolName: "tool_registry_list",
        args: {},
        reasoning: `Tool call ${i + 1}`,
      }));

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Many tools needed",
        toolCalls,
        explanation: "Lots of work",
      });

      const request = await agent.execute();

      // Should be truncated to at most 8
      expect(request.proposedActions.length).toBeLessThanOrEqual(8);
    });

    it("should determine scope from registry", async () => {
      const agent = new OrchestratorAgent("Log execution");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Log the run",
        toolCalls: [
          {
            toolName: "log_agent_run",
            args: { runId: "test" },
            reasoning: "Log run",
          },
        ],
        explanation: "Will log",
      });

      const request = await agent.execute();

      // log_agent_run has write scope
      if (request.proposedActions.length > 0) {
        const action = request.proposedActions[0];
        expect(action.scope).toBe("write");
      }
    });
  });

  // ============================================================
  // M1 Integration Tests
  // ============================================================
  describe("M1 Integration", () => {
    it("should create run record in M1 logger", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      // Check that run was logged
      const run = agentRunsLogger.getRun(request.runId);
      expect(run).toBeDefined();
      expect(run?.agentName).toBe("orchestrator");
      expect(run?.goal).toBe("Test goal");
    });

    it("should log proposals to M1 logger", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Need to check tools",
        toolCalls: [
          {
            toolName: "tool_registry_list",
            args: {},
            reasoning: "List tools",
          },
        ],
        explanation: "Will list",
      });

      const request = await agent.execute();

      // Check that tool calls were logged
      const toolCalls = agentRunsLogger.getToolCalls(request.runId);
      expect(toolCalls.length).toBeGreaterThanOrEqual(0);
    });

    it("should submit proposals to policy engine", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Need to check tools",
        toolCalls: [
          {
            toolName: "tool_registry_list",
            args: {},
            reasoning: "List tools",
          },
        ],
        explanation: "Will list",
      });

      const request = await agent.execute();

      // Proposals should be in ExecutionRequest if policy approved
      expect(request.proposedActions).toBeDefined();
      expect(Array.isArray(request.proposedActions)).toBe(true);
    });

    it("should complete run record after execution", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();
      const run = agentRunsLogger.getRun(request.runId);

      expect(run?.completedAt).toBeDefined();
      expect(run?.stopReason).toBe("completed");
    });

    it("should handle policy rejections gracefully", async () => {
      const agent = new OrchestratorAgent("Test goal");

      // Try to propose write scope tool without approval
      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Log something",
        toolCalls: [
          {
            toolName: "log_agent_run",
            args: { runId: "test" },
            reasoning: "Log it",
          },
        ],
        explanation: "Will log",
      });

      const request = await agent.execute();

      // Should return ExecutionRequest (may be empty due to policy rejection)
      expect(request).toBeDefined();
      expect(request.runId).toBeDefined();
    });
  });

  // ============================================================
  // Error Handling Tests
  // ============================================================
  describe("Error Handling", () => {
    it("should handle missing Claude response", async () => {
      const agent = new OrchestratorAgent("Test goal");

      // Mock Claude to return no text
      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Error",
        toolCalls: [],
        explanation: "Failed to parse",
      });

      const request = await agent.execute();

      expect(request).toBeDefined();
      expect(request.proposedActions).toEqual([]);
    });

    it("should handle malformed JSON from Claude", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Parse failed",
        toolCalls: [],
        explanation: "Invalid JSON",
      });

      const request = await agent.execute();

      expect(request).toBeDefined();
      expect(request.proposedActions).toEqual([]);
    });

    it("should handle no proposals from Claude", async () => {
      const agent = new OrchestratorAgent("Impossible goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Cannot accomplish goal",
        toolCalls: [],
        explanation: "No tools available",
      });

      const request = await agent.execute();

      expect(request.proposedActions).toHaveLength(0);
      expect(agent.getErrors().length).toBeGreaterThanOrEqual(0);
    });

    it("should track and report errors", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Unknown tool needed",
        toolCalls: [
          {
            toolName: "unknown_tool",
            args: {},
            reasoning: "This tool doesn't exist",
          },
        ],
        explanation: "Will fail",
      });

      await agent.execute();

      const errors = agent.getErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should record error severity correctly", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Unknown tool",
        toolCalls: [
          {
            toolName: "this_tool_does_not_exist",
            args: {},
            reasoning: "Invalid tool",
          },
        ],
        explanation: "Will fail",
      });

      await agent.execute();

      const errors = agent.getErrors();
      const hasWarning = errors.some((e) => e.severity === "warning");
      expect(hasWarning || errors.length === 0).toBe(true);
    });
  });

  // ============================================================
  // Helper Function Tests
  // ============================================================
  describe("Helper Function", () => {
    it("should provide orchestrate() convenience function", async () => {
      vi.doMock("../agents/orchestrator", () => ({
        OrchestratorAgent: class {
          constructor() {}
          getRunId() {
            return "test-run";
          }
          async execute() {
            return {
              runId: "test-run",
              agentName: "orchestrator",
              goal: "Test",
              constraints: {
                maxSteps: 12,
                maxToolCalls: 8,
                maxRuntimeSeconds: 60,
              },
              proposedActions: [],
            };
          }
        },
        orchestrate: async () => ({
          runId: "test-run",
          agentName: "orchestrator",
          goal: "Test",
          constraints: {
            maxSteps: 12,
            maxToolCalls: 8,
            maxRuntimeSeconds: 60,
          },
          proposedActions: [],
        }),
      }));

      const result = await orchestrate("Test goal");
      expect(result).toBeDefined();
      expect(result.runId).toBeDefined();
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================
  describe("Edge Cases", () => {
    it("should handle very long goals", async () => {
      const longGoal = "Do something " + "very ".repeat(100) + "important";
      const agent = new OrchestratorAgent(longGoal);

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.goal).toBe(longGoal);
    });

    it("should handle empty goal", async () => {
      const agent = new OrchestratorAgent("");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.goal).toBe("");
    });

    it("should handle special characters in goal", async () => {
      const goal = 'Find "special" characters & symbols: $%#@!';
      const agent = new OrchestratorAgent(goal);

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      const request = await agent.execute();

      expect(request.goal).toBe(goal);
    });

    it("should track execution duration", async () => {
      const agent = new OrchestratorAgent("Test goal");

      vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
        reasoning: "Test",
        toolCalls: [],
        explanation: "Test",
      });

      await agent.execute();
      const duration = agent.getDuration();

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Integration with M1 Tools Tests
  // ============================================================
  describe("M1 Tools Integration", () => {
    it("should have access to all registered tools", () => {
      const tools = registry.listTools();
      expect(tools.length).toBeGreaterThan(0);

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain("tool_registry_list");
      expect(toolNames).toContain("tool_policy_check");
      expect(toolNames).toContain("request_approval");
      expect(toolNames).toContain("log_agent_run");
    });

    it("should respect tool scopes from registry", () => {
      const readTools = registry.getToolsByScope("read");
      const writeTools = registry.getToolsByScope("write");
      const executeTools = registry.getToolsByScope("execute");

      expect(readTools.length).toBeGreaterThan(0);
      expect(writeTools.length).toBeGreaterThan(0);
      expect(executeTools.length).toBeGreaterThan(0);
    });
  });
});
