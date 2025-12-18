/**
 * M1 Integration Test Fixtures
 *
 * Provides reusable test data, mock responses, and utilities
 * for integration testing of the M1 Agent Architecture.
 */

import { v4 as generateUUID } from "uuid";
import type { ExecutionRequest, ToolCall } from "../../types";

/**
 * Simple test goals for basic workflows
 */
export const simpleGoals = {
  readOnly: "List all available M1 tools",
  singleTool: "Check policy for tool_registry_list",
  multiTool: "List tools and check policy for log_agent_run",
  listRegistry: "Show me the available tools",
  validatePolicy: "Validate the policy engine",
};

/**
 * Complex test goals for advanced scenarios
 */
export const complexGoals = {
  withApproval: "List tools, check policy, and log the run",
  errorHandling: "Execute with invalid tool",
  policyViolation: "Execute tool without proper approval",
  multiStep: "List, validate, and log in sequence",
  dependentChain: "Check registry then validate policies",
};

/**
 * Mock pre-authorized tokens for batch mode testing
 */
export const preAuthTokens = new Map([
  ["request_approval", `approval:request_approval:execute:${Date.now()}:abc123`],
  ["log_agent_run", `approval:log_agent_run:execute:${Date.now()}:def456`],
  ["tool_policy_check", `approval:tool_policy_check:read:${Date.now()}:ghi789`],
]);

/**
 * Mock Claude API responses for different scenarios
 */
export const mockClaudeResponses = {
  /**
   * Simple single-tool proposal
   */
  validProposal: {
    reasoning: "User wants to list available tools",
    toolCalls: [
      {
        toolName: "tool_registry_list",
        args: {},
        reasoning: "List all tools in the M1 registry",
      },
    ],
    explanation: "I will execute tool_registry_list to show available tools",
  },

  /**
   * Multi-tool workflow proposal
   */
  multiToolProposal: {
    reasoning: "Multi-step workflow required",
    toolCalls: [
      {
        toolName: "tool_registry_list",
        args: {},
        reasoning: "Step 1: List available tools",
      },
      {
        toolName: "tool_policy_check",
        args: { toolName: "log_agent_run", scope: "execute" },
        reasoning: "Step 2: Check if we can execute log_agent_run",
      },
    ],
    explanation: "Will execute a two-step process: list tools, then check policy",
  },

  /**
   * Approval-required workflow proposal
   */
  approvalRequiredProposal: {
    reasoning: "Need to record execution to audit trail",
    toolCalls: [
      {
        toolName: "log_agent_run",
        args: { runId: generateUUID() },
        reasoning: "Log this agent run to the audit trail",
      },
    ],
    explanation: "I will log the execution results",
  },

  /**
   * Mixed read and write scope proposal
   */
  mixedScopeProposal: {
    reasoning: "Demonstrate both read and write operations",
    toolCalls: [
      {
        toolName: "tool_registry_list",
        args: { filter: "execute" },
        reasoning: "Step 1: List execute-scope tools",
      },
      {
        toolName: "tool_policy_check",
        args: { toolName: "request_approval", scope: "execute" },
        reasoning: "Step 2: Check approval policy",
      },
    ],
    explanation: "Mixed workflow with read and potential write operations",
  },

  /**
   * Error scenario proposal (invalid tool)
   */
  errorProposal: {
    reasoning: "User asked for an invalid operation",
    toolCalls: [
      {
        toolName: "invalid_tool_xyz_does_not_exist",
        args: {},
        reasoning: "Attempt to execute non-existent tool",
      },
    ],
    explanation: "Will attempt to execute a tool that doesn't exist",
  },

  /**
   * Complex multi-step workflow
   */
  complexProposal: {
    reasoning: "Complex workflow with multiple operations",
    toolCalls: [
      {
        toolName: "tool_registry_list",
        args: {},
        reasoning: "Step 1: Get all registered tools",
      },
      {
        toolName: "tool_policy_check",
        args: { toolName: "tool_registry_list", scope: "read" },
        reasoning: "Step 2: Verify registry_list is allowed",
      },
      {
        toolName: "tool_policy_check",
        args: { toolName: "log_agent_run", scope: "execute" },
        reasoning: "Step 3: Check if logging is allowed",
      },
    ],
    explanation: "Complex three-step validation workflow",
  },

  /**
   * Empty/no-op proposal
   */
  emptyProposal: {
    reasoning: "No action required",
    toolCalls: [],
    explanation: "No tools need to be executed",
  },
};

/**
 * Tool call templates for testing
 */
export const toolCallTemplates = {
  registryList: (): ToolCall => ({
    requestId: generateUUID(),
    toolName: "tool_registry_list",
    args: {},
    scope: "read",
    approvalRequired: false,
  }),

  policyCheck: (toolName = "tool_registry_list"): ToolCall => ({
    requestId: generateUUID(),
    toolName: "tool_policy_check",
    args: { toolName, scope: "read" },
    scope: "read",
    approvalRequired: false,
  }),

  requestApproval: (toolName = "log_agent_run"): ToolCall => ({
    requestId: generateUUID(),
    toolName: "request_approval",
    args: { toolName, scope: "execute", reason: "Test approval" },
    scope: "execute",
    approvalRequired: true,
  }),

  logAgentRun: (runId?: string): ToolCall => ({
    requestId: generateUUID(),
    toolName: "log_agent_run",
    args: { runId: runId || generateUUID() },
    scope: "execute",
    approvalRequired: true,
  }),
};

/**
 * ExecutionRequest templates for testing
 */
export const executionRequestTemplates = {
  simple: (): ExecutionRequest => ({
    runId: generateUUID(),
    goal: "List all available tools",
    proposedActions: [toolCallTemplates.registryList()],
  }),

  multiTool: (): ExecutionRequest => ({
    runId: generateUUID(),
    goal: "List tools and check policy",
    proposedActions: [
      toolCallTemplates.registryList(),
      toolCallTemplates.policyCheck(),
    ],
  }),

  withApproval: (): ExecutionRequest => ({
    runId: generateUUID(),
    goal: "List tools and log execution",
    proposedActions: [
      toolCallTemplates.registryList(),
      toolCallTemplates.logAgentRun(),
    ],
  }),

  empty: (): ExecutionRequest => ({
    runId: generateUUID(),
    goal: "Do nothing",
    proposedActions: [],
  }),
};

/**
 * Test scenarios combining goals, proposals, and expected outcomes
 */
export const testScenarios = {
  simpleReadOnly: {
    goal: simpleGoals.readOnly,
    proposal: mockClaudeResponses.validProposal,
    expectedToolCalls: 1,
    expectedApprovals: 0,
    shouldSucceed: true,
  },

  multiToolWorkflow: {
    goal: complexGoals.multiStep,
    proposal: mockClaudeResponses.multiToolProposal,
    expectedToolCalls: 2,
    expectedApprovals: 0,
    shouldSucceed: true,
  },

  withApprovalRequired: {
    goal: complexGoals.withApproval,
    proposal: mockClaudeResponses.approvalRequiredProposal,
    expectedToolCalls: 1,
    expectedApprovals: 1,
    shouldSucceed: true,
  },

  mixedScopes: {
    goal: "Check read and write scopes",
    proposal: mockClaudeResponses.mixedScopeProposal,
    expectedToolCalls: 2,
    expectedApprovals: 0,
    shouldSucceed: true,
  },

  errorHandling: {
    goal: complexGoals.errorHandling,
    proposal: mockClaudeResponses.errorProposal,
    expectedToolCalls: 1,
    expectedApprovals: 0,
    shouldSucceed: false,
  },

  complexWorkflow: {
    goal: "Complex validation workflow",
    proposal: mockClaudeResponses.complexProposal,
    expectedToolCalls: 3,
    expectedApprovals: 0,
    shouldSucceed: true,
  },
};

/**
 * Helper function to create random test data
 */
export function generateRandomRunId(): string {
  return generateUUID();
}

/**
 * Helper to create test ExecutionRequest with custom tool calls
 */
export function createExecutionRequest(
  toolNames: string[],
  goal: string = "Test goal"
): ExecutionRequest {
  const proposedActions: ToolCall[] = toolNames.map((toolName) => ({
    requestId: generateUUID(),
    toolName,
    args: {},
    scope: "read" as const,
    approvalRequired: false,
  }));

  return {
    runId: generateUUID(),
    goal,
    proposedActions,
  };
}

/**
 * Helper to clone mock responses safely
 */
export function cloneMockResponse(
  response: typeof mockClaudeResponses[keyof typeof mockClaudeResponses]
) {
  return JSON.parse(JSON.stringify(response));
}

/**
 * Fixture for testing approval flow
 */
export const approvalFlowFixtures = {
  preAuthToken: "pre-auth:tool_name:execute:1234567890:abc123",
  invalidToken: "invalid-token-format",
  expiredToken: "expired:tool:execute:999:xyz",
  scopeMismatchToken: "approval:tool:read:12345:abc", // read scope for execute requirement
};

/**
 * Fixture for policy validation scenarios
 */
export const policyValidationFixtures = {
  readScopeTools: ["tool_registry_list", "tool_policy_check"],
  writeScopeTools: [] as string[],
  executeScopeTools: ["request_approval", "log_agent_run"],
  invalidScope: "invalid_scope",
};

/**
 * Fixture for performance/timing tests
 */
export const performanceFixtures = {
  shortTimeout: 100,
  mediumTimeout: 5000,
  longTimeout: 30000,
  maxExecutionTime: 60000,
};

/**
 * Error messages expected during testing
 */
export const expectedErrors = {
  toolNotFound: 'Tool "invalid_tool" not found',
  scopeMismatch: "Scope mismatch",
  approvalDenied: "Approval denied",
  policyRejected: "Policy rejected",
  tokenExpired: "Token expired",
  invalidToken: "Invalid token",
};

export default {
  simpleGoals,
  complexGoals,
  preAuthTokens,
  mockClaudeResponses,
  toolCallTemplates,
  executionRequestTemplates,
  testScenarios,
  generateRandomRunId,
  createExecutionRequest,
  cloneMockResponse,
  approvalFlowFixtures,
  policyValidationFixtures,
  performanceFixtures,
  expectedErrors,
};
