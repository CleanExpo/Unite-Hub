/**
 * Global Autonomy System Export Index
 *
 * Unified multi-agent reasoning and cross-domain autonomy layer.
 * Coordinates memory, reasoning, orchestrator, and all agent systems.
 */

export { GlobalAutonomyEngine, globalAutonomyEngine } from './globalAutonomyEngine';
export type { GlobalAutonomyRun, AutonomyEvent, AutonomyEvaluation } from './globalAutonomyEngine';

export { globalContextBuilder } from './globalContextBuilder';
export type { GlobalContext } from './globalContextBuilder';

export { autonomyScoringModel } from './autonomyScoringModel';
export type { AutonomyScoringParams } from './autonomyScoringModel';

export { autonomyArchiveBridge } from './autonomyArchiveBridge';
export type { AutonomyArchiveData } from './autonomyArchiveBridge';

export { selfCorrectionEngine } from './selfCorrectionEngine';
export type { CorrectionCycle, FailurePrediction, WeaknessCluster } from './selfCorrectionEngine';

export { weaknessClusterModel } from './weaknessClusterModel';
export type { WeaknessCluster as ClusterModel, WeaknessNode, FailurePattern, MemoryContradiction, AgentPerformanceIssue } from './weaknessClusterModel';

export { predictiveFailureModel } from './predictiveFailureModel';
export type { FailurePrediction as PredictionModel, SignalInput, ContributingFactor } from './predictiveFailureModel';

export { correctionArchiveBridge } from './correctionArchiveBridge';
export type { CorrectionArchiveData } from './correctionArchiveBridge';
