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

export { alignmentCalibrationEngine } from './alignmentCalibrationEngine';
export type { CalibrationMetrics, CalibrationProposal, CalibrationCycle } from './alignmentCalibrationEngine';

export { autonomyTuningModel } from './autonomyTuningModel';
export type { ParameterAdjustment, TuningResult, CalibratedParameters } from './autonomyTuningModel';

export { thresholdAdjustmentModel } from './thresholdAdjustmentModel';
export type { ThresholdAdjustmentParams, ThresholdAdjustmentResult, ThresholdSet } from './thresholdAdjustmentModel';

export { calibrationArchiveBridge } from './calibrationArchiveBridge';
export type { CalibrationArchiveEntry, CalibrationPattern } from './calibrationArchiveBridge';

export { executionOptimizer } from './executionOptimizer';
export type { ExecutionOptimization, ExecutionOptimizationParams } from './executionOptimizer';

export { executionAdaptationModel } from './executionAdaptationModel';
export type { AdaptationProfile, AdaptationParams } from './executionAdaptationModel';

export { optimizerArchiveBridge } from './optimizerArchiveBridge';
export type { OptimizationResult } from './optimizerArchiveBridge';

export { agentNegotiationEngine } from '../negotiation';
export type { AgentProposal, ConsensusScore, NegotiationSession } from '../negotiation';

export { arbitrationModel } from '../negotiation';
export type { ArbitrationInput, ArbitrationDecision } from '../negotiation';

export { negotiationArchiveBridge } from '../negotiation';
export type { NegotiationRecord, NegotiationPattern } from '../negotiation';

export { taskMarketplaceEngine } from '../marketplace';
export type { MarketplaceTask, AgentBid, AuctionSession, BidResponse } from '../marketplace';

export { bidEvaluationModel } from '../marketplace';
export type { BidScoringInput, ScoringBreakdown, BidComparison } from '../marketplace';

export { auctionArchiveBridge } from '../marketplace';
export type { AuctionArchiveEntry, MarketplacePattern, MarketplaceAnalytics } from '../marketplace';

export { coalitionFormationEngine } from '../coalition';
export type { CoalitionCandidate, CoalitionProposal } from '../coalition';

export { coalitionRoleAllocator } from '../coalition';
export type { RoleAssignment, RoleAllocationResult } from '../coalition';

export { coalitionLifecycleManager } from '../coalition';
export type { CoalitionState, CoalitionHealthMetrics, CoalitionExecutionStats } from '../coalition';

export { coalitionArchiveBridge } from '../coalition';
export type { CoalitionArchiveEntry, CoalitionPattern, CoalitionAnalytics } from '../coalition';

// Placeholder strategy exports to maintain compatibility (real implementations absent here)
export const strategyHierarchyEngine = () => null;
export type StrategyHierarchy = unknown;
export type StrategyLevel = unknown;
export type StrategyItem = unknown;

export const strategicDecompositionModel = () => null;
export type DecompositionAnalysis = unknown;
export type DecompositionMetrics = unknown;

export const strategyValidationModel = () => null;
export type MultiAgentValidationResult = unknown;
export type AgentValidation = unknown;
export type StrategyConflict = unknown;

export const strategyArchiveBridge = () => null;
export type StrategyArchiveRecord = unknown;
export type StrategyPattern = unknown;
