/**
 * Founder Intelligence OS - Core Services
 *
 * This module exports all foundational services for the Founder Intelligence
 * Operating System. All services operate in HUMAN_GOVERNED mode - outputs are
 * advisory-only and require human review before action.
 *
 * @module founderOS
 */

// =============================================================================
// Business Registry - Multi-business management
// =============================================================================
export {
  // Types
  type BusinessStatus,
  type FounderBusiness,
  type CreateBusinessInput,
  type UpdateBusinessInput,
  type BusinessRegistryResult,
  // Functions
  createBusiness,
  getBusiness,
  listBusinesses,
  updateBusiness,
  deactivateBusiness,
  archiveBusiness,
  reactivateBusiness,
  getBusinessByCode,
  countBusinesses,
} from './founderBusinessRegistryService';

// =============================================================================
// Business Vault - Secure credential storage
// =============================================================================
export {
  // Types
  type SecretType,
  type SecretMetadata,
  type VaultSecret,
  type AddSecretInput,
  type UpdateSecretInput,
  type VaultServiceResult,
  // Functions
  addSecret,
  getSecrets,
  getSecret,
  getSecretByLabel,
  updateSecret,
  deleteSecret,
  deleteAllSecretsForBusiness,
  secretExists,
  upsertSecret,
  countSecrets,
} from './founderBusinessVaultService';

// =============================================================================
// Umbrella Synopsis - AI-powered business synopses
// =============================================================================
export {
  // Types
  type SnapshotType,
  type SnapshotScope,
  type Synopsis,
  type FounderOsSnapshot,
  type SynopsisServiceResult,
  // Functions
  generateBusinessSynopsis,
  generateUmbrellaSynopsis,
  getSnapshots,
  getSnapshot,
  getLatestSnapshot,
  createSnapshot,
} from './founderUmbrellaSynopsisService';

// =============================================================================
// Signal Inference - Multi-source signal aggregation
// =============================================================================
export {
  // Types
  type SignalFamily,
  type BusinessSignal,
  type RecordSignalInput,
  type SignalServiceResult,
  type AggregationResult,
  // Functions
  recordSignal,
  recordSignals,
  getSignals,
  getLatestSignal,
  getSignalHistory,
  aggregateSignals,
  getSignalSummary,
  cleanupOldSignals,
} from './founderSignalInferenceService';

// =============================================================================
// Risk & Opportunity - Business intelligence analysis
// =============================================================================
export {
  // Types
  type RiskSeverity,
  type OpportunityImpact,
  type IdentifiedRisk,
  type IdentifiedOpportunity,
  type RiskAnalysisResult,
  type OpportunityAnalysisResult,
  type BusinessHealthScore,
  type RiskOpportunityServiceResult,
  // Functions
  analyzeRisks,
  analyzeOpportunities,
  getBusinessHealthScore,
} from './founderRiskOpportunityService';

// =============================================================================
// AI Phill Advisor - Cognitive advisor (HUMAN_GOVERNED mode)
// =============================================================================
export {
  // Types
  type InsightPriority,
  type InsightCategory,
  type GovernanceMode,
  type ReviewStatus,
  type InsightScope,
  type RecommendedAction,
  type AiPhillInsight,
  type GenerateInsightContext,
  type InsightFilters,
  type AiPhillServiceResult,
  // Functions
  generateInsight,
  getInsights,
  getInsight,
  reviewInsight,
  acknowledgeInsight,
  actionInsight,
  dismissInsight,
  deferInsight,
  getPendingInsightsCount,
  getInsightsSummary,
  deleteInsight,
  createManualInsight,
} from './aiPhillAdvisorService';

// =============================================================================
// Founder Journal - Notes and reflections
// =============================================================================
export {
  // Types
  type JournalEntry,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
  type JournalFilters,
  type JournalServiceResult,
  // Functions
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  addTags,
  removeTags,
  getAllTags,
  countEntries,
  getRecentEntriesForContext,
  searchEntries,
  getEntriesByDateRange,
  getEntriesByTag,
  getEntriesByBusiness,
} from './founderJournalService';

// =============================================================================
// Cognitive Twin - Domain health, digests, and decision support
// =============================================================================
export {
  // Types
  type CognitiveDomain,
  type DigestType,
  type DecisionType,
  type Momentum,
  type DomainRisk,
  type DomainOpportunity,
  type CognitiveTwinScore,
  type ActionItem,
  type CognitiveTwinDigest,
  type DecisionOption,
  type DecisionScenario,
  type CognitiveTwinDecision,
  type CognitiveTwinServiceResult,
  // Functions
  computeDomainScore,
  generateDigest,
  simulateDecision,
  getDomainScores,
  getDigests,
  getPendingDecisions,
  recordDecisionOutcome,
  getPortfolioHealthDashboard,
} from './cognitiveTwinService';
