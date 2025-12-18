/**
 * M1 Agents Module - Phase 2
 *
 * Exports for agent implementations within M1 architecture.
 * Currently includes OrchestratorAgent for plan-first execution.
 */

export { OrchestratorAgent, orchestrate } from "./orchestrator";
export type { OrchestratorConfig, OrchestratorError } from "./orchestrator";
