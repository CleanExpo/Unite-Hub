/**
 * Autonomous Skill Evolution Engine (ASEE)
 */

export { AutonomousSkillEvolutionEngine, runSkillEvolutionAnalysis } from './skill-evolution-engine';
export type { SkillEvolutionPlan, EvolutionOpportunity, ASEEReport } from './skill-evolution-engine';

export { aseeConfig } from './skill-evolution-config';
export type { ASEEConfig, EvolutionStrategy, NewSkillBlueprint } from './skill-evolution-config';

export { runASEE } from './run-evolution';
