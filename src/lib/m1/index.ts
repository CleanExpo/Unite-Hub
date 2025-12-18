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
  reinitializeLogger,
  type AgentRunRecord,
  type ToolCallRecord,
} from "./logging/agentRuns";

// Agents (Phase 2+)
export {
  OrchestratorAgent,
  orchestrate,
  type OrchestratorConfig,
  type OrchestratorError,
} from "./agents";

// CLI Command (Phase 3)
export {
  runAgent,
  executeTool,
  requestApprovalFromUser,
  checkPreAuthorizedToken,
  verifyApprovalToken,
  type CLIOptions,
  type ToolExecutionResult,
  type ApprovalResult,
} from "./cli";

// Configuration (Phase 5+)
export {
  JWT_CONFIG,
  APPROVAL_CONFIG,
  EXECUTION_LIMITS,
  LOGGING_CONFIG,
  STORAGE_CONFIG,
  SECURITY_CONFIG,
  VALIDATION_CONFIG,
  getM1Config,
} from "./config";

// Structured Logging (Phase 7)
export {
  m1Logger,
  logAgentStart,
  logAgentComplete,
  logAgentError,
  logToolExecutionStart,
  logToolExecutionEnd,
  logPolicyDecision,
  logApprovalRequest,
  logApprovalGrant,
  logApprovalDenial,
} from "./logging/structured-logger";

// Metrics Collection (Phase 7)
export {
  MetricsCollector,
  metricsCollector,
  trackAgentRun,
  trackToolExecution,
  trackPolicyDecision,
  trackApprovalRequest,
  trackApprovalGrant,
  trackApprovalDenial,
  trackClaudeAPICall,
  setActiveRunsGauge,
  getMetrics,
  exportMetricsPrometheus,
  resetMetrics,
} from "./monitoring/metrics";

// Cost Tracking (Phase 7)
export {
  CostTracker,
  costTracker,
  trackClaudeCall,
  getTotalCost,
  getCostBreakdown,
  formatCostAsUSD,
  getEstimatedMonthlyCost,
  type CostRecord,
} from "./monitoring/cost-tracking";

// Alert System (Phase 7)
export {
  AlertManager,
  alertManager,
  alertPolicyViolation,
  alertExecutionError,
  alertHighErrorRate,
  alertApprovalDenied,
  alertTokenExpired,
  alertCostThreshold,
  alertPerformance,
  getCriticalAlerts,
  getAlertStats,
  type Alert,
  type AlertLevel,
  type AlertCategory,
  type AlertCallback,
} from "./monitoring/alerts";

// Version
export const M1_VERSION = "2.0.0";
export const M1_RELEASE = "m1-monitoring-observability-v7";
