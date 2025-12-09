/**
 * Agent Performance Prediction Model (APPM)
 * Predicts agent task failure risk based on skill readiness and drift
 */

export { AgentPerformancePredictionModel, evaluateAgentPerformance } from './appm-engine';
export type { APPMAnalysis, AgentRiskProfile } from './appm-engine';

export { runAPPMAnalysis } from './run-appm';

export { appmConfig } from './appm-config';
export type { APPMConfig } from './appm-config';
