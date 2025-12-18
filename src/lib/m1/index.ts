/**
 * M1 Agent Architecture Control Layer - Main Export
 *
 * Provides the foundational infrastructure for safe agent orchestration:
 * - Type definitions for agents, tools, and approvals
 * - Tool registry with strict allowlisting
 * - Policy engine for validation and safety checks
 * - Logging infrastructure for observability
 * - CLI command integration layer
 */

// Type definitions
export * from "./types";

// Tool registry and allowlisting
export { TOOL_REGISTRY, registry, ToolRegistryManager, getToolRegistry } from "./tools/registry";

// Policy engine and validation
export {
  PolicyEngine,
  policyEngine,
  isToolAllowed,
  toolNeedsApproval,
  getDenialReasons,
  type PolicyDecision,
  type ValidationError,
} from "./tools/policy";

// Logging infrastructure
export {
  AgentRunsLogger,
  agentRunsLogger,
  type AgentRunRecord,
  type ToolCallRecord,
} from "./logging/agentRuns";

// Version
export const M1_VERSION = "1.0.0";
export const M1_RELEASE = "m1-architecture-control-v1";
