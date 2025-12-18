/**
 * M1 Agent Architecture - Type Definitions
 * Core types for agent orchestration, tool registry, and approval flow
 */

/**
 * Tool scope levels determine approval requirements
 * - read: No approval needed, can be executed immediately
 * - write: Approval token required for execution
 * - execute: Approval token required, plus explicit authorization
 */
export type ToolScope = "read" | "write" | "execute";

/**
 * Agent run lifecycle states
 */
export type AgentRunStatus =
  | "proposed" // Agent has proposed action
  | "policy_rejected" // Policy check failed
  | "approval_pending" // Waiting for approval token
  | "approved" // Approved by authority
  | "executed" // Successfully executed
  | "execution_failed"; // Failed during execution

/**
 * Reason why an agent run stopped
 */
export type RunStopReason =
  | "completed" // Finished successfully
  | "limit_exceeded" // Hit step/call/runtime limit
  | "approval_required" // Can't proceed without approval
  | "policy_denied" // Policy check rejected
  | "error"; // Unexpected error

/**
 * Execution constraints for a run
 */
export interface ExecutionConstraints {
  maxSteps?: number; // Max workflow steps (12)
  maxToolCalls?: number; // Max tool calls (8)
  maxRuntimeSeconds?: number; // Max runtime (60s)
}

/**
 * Tool definition in the registry
 */
export interface ToolDefinition {
  name: string; // Unique tool identifier
  description: string; // What this tool does
  scope: ToolScope; // read/write/execute
  parameters?: Record<string, unknown>; // Expected input schema
  requiresApproval?: boolean; // Override: force approval for this tool
}

/**
 * Policy validation result
 */
export interface PolicyCheckResult {
  passed: boolean; // Did policy check pass?
  reason?: string; // Why did it fail?
  checkedAt: number; // Timestamp of check
}

/**
 * A single tool call proposed by the agent
 */
export interface ToolCall {
  requestId: string; // UUID for this specific call
  toolName: string; // Which tool to call
  args?: Record<string, unknown>; // Arguments for the tool
  scope: ToolScope; // Scope of this call
  approvalRequired: boolean; // Does this call need approval?
}

/**
 * Response from approval gate check
 */
export interface ApprovalGateResponse {
  approved: boolean; // Is this call approved?
  token?: string; // Approval token if approved
  reason?: string; // Why denied?
  expiresAt?: number; // When does approval expire?
}

/**
 * Execution request to the CLI
 */
export interface ExecutionRequest {
  runId: string; // Unique run identifier
  agentName: string; // Which agent (e.g., "orchestrator")
  goal: string; // What are we trying to accomplish?
  constraints: ExecutionConstraints; // Execution limits
  proposedActions: ToolCall[]; // Actions the agent wants to take
  approvalTokens?: string[]; // Approval tokens for restricted actions
}

/**
 * Execution result from the CLI
 */
export interface ExecutionResult {
  runId: string; // Same as request
  stopReason: RunStopReason; // Why did we stop?
  toolCallsProposed: number; // Total proposed
  toolCallsApproved: number; // Total approved
  toolCallsExecuted: number; // Total executed
  results: Record<string, unknown>; // Results from each tool call
  errors?: Record<string, string>; // Errors from tool calls
  durationMs: number; // How long did it take?
}
