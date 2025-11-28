/**
 * Founder Cognitive Twin Engine
 *
 * Central export for all Founder Memory and Cognitive Twin services.
 *
 * This engine provides:
 * - Cross-client pattern extraction
 * - Strategic forecasting (6-week, 12-week, 1-year)
 * - Opportunity and risk consolidation
 * - Momentum scoring across 7 business domains
 * - Shadow Founder decision simulator
 * - Weekly digest generation
 * - Next action recommendations
 * - Overload detection
 */

// Memory Aggregation Service
export {
  founderMemoryAggregationService,
  type FounderMemorySnapshot,
  type SnapshotSummary,
  type SentimentOverview,
  type OpportunitySummary,
  type RiskSummary,
  type ChannelActivity,
  type AggregationConfig,
  type DataSourceResult,
} from './founderMemoryAggregationService';

// Pattern Extraction Service
export {
  patternExtractionService,
  type PatternType,
  type PatternStatus,
  type PatternEvidence,
  type CrossClientPattern,
  type PatternExtractionConfig,
  type PatternAnalysis,
} from './patternExtractionService';

// Momentum Scoring Service
export {
  momentumScoringService,
  type MomentumDomain,
  type TrendDirection,
  type MomentumScore,
  type DomainNotes,
  type InputSignals,
  type SignalSummary,
  type MomentumConfig,
  type DomainMetrics,
} from './momentumScoringService';

// Opportunity Consolidation Service
export {
  opportunityConsolidationService,
  type OpportunitySource,
  type OpportunityCategory,
  type OpportunityStatus,
  type FounderOpportunity,
  type ConsolidationConfig,
  type ConsolidationResult,
  type OpportunityInput,
} from './opportunityConsolidationService';

// Risk Analysis Service
export {
  riskAnalysisService,
  type RiskSourceType,
  type RiskCategory,
  type MitigationStatus,
  type FounderRisk,
  type RiskAnalysisConfig,
  type RiskAnalysisResult,
} from './riskAnalysisService';

// Forecast Engine Service
export {
  forecastEngineService,
  type ForecastHorizon,
  type ForecastScenario,
  type Forecast,
  type ForecastInputs,
  type ForecastConfig,
  type ForecastResult,
} from './forecastEngineService';

// Decision Simulator Service (Shadow Founder)
export {
  decisionSimulatorService,
  type ScenarioType,
  type ScenarioStatus,
  type ScenarioAssumptions,
  type SimulatedOutcome,
  type OutcomeScenario,
  type DecisionScenario,
  type SimulationRequest,
} from './decisionSimulatorService';

// Overload Detection Service
export {
  overloadDetectionService,
  type OverloadSeverity,
  type OverloadIndicator,
  type OverloadAnalysis,
  type OverloadConfig,
  type OverloadThresholds,
} from './overloadDetectionService';

// Next Action Recommender Service
export {
  nextActionRecommenderService,
  type ActionCategory,
  type ActionUrgency,
  type NextAction,
  type ActionContext,
  type RecommendationConfig,
  type RecommendationResult,
} from './nextActionRecommenderService';

// Weekly Digest Service
export {
  weeklyDigestService,
  type WeeklyDigest,
  type DigestWin,
  type DigestRisk,
  type DigestOpportunity,
  type DigestRecommendation,
  type MomentumSnapshot,
  type PatternSummary,
  type KeyMetrics,
  type DigestConfig,
} from './weeklyDigestService';
