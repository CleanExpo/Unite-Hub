/**
 * Skill Refactor Recommendation Engine (SRRE)
 * Generates structured refactor plans from drift and health data
 */

export { SkillRefactorRecommendationEngine, generateRefactorPlans } from './srre-engine';
export type { SRREAnalysis, RefactorPlan, RefactorAction } from './srre-engine';

export { runSRREAnalysis } from './run-srre';

export { srreConfig } from './srre-config';
export type { SRREConfig, RefactorCategory, RefactorPriority } from './srre-config';
