/**
 * Multi-Agent Routing Optimizer (MARO)
 */

export { MultiAgentRoutingOptimizer, generateRoutingRecommendations } from './agent-routing-optimizer';
export type { RoutingRecommendation, MAROReport, TaskAnalysis, RoutingHook } from './agent-routing-optimizer';

export { maroConfig } from './agent-routing-config';
export type { MAROConfig, TaskPattern, AgentCapability, RoutingRule } from './agent-routing-config';

export { runMAR } from './run-routing';
