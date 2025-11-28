/**
 * SEO Leak Engine Services
 *
 * Google/DOJ/Yandex leak-aligned SEO intelligence services.
 * All services are ADVISORY ONLY - they generate recommendations but never auto-deploy.
 *
 * Key Concepts from Leaks:
 * - NavBoost: User engagement signals (CTR, dwell time, pogo-sticking)
 * - Q-star/P-star/T-star: Yandex quality, popularity, trust factors
 * - E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness
 * - Site Authority: Domain-level trust signals
 * - Sandbox: New site penalty risk
 *
 * @module seoLeak
 * @version 1.0.0
 */

// =============================================================================
// Core SEO Leak Engine Service
// =============================================================================
export {
  // Types
  type LeakSignalProfile,
  type LeakSignalInput,
  type ComputeProfileResult,
  type ProfileInsight,
  // Functions
  computeLeakProfile,
  refreshProfile,
  getProfile,
  getBusinessProfiles,
  deleteProfile,
  analyzeProfile,
  calculateOverallScore,
  needsRefresh,
} from './seoLeakEngineService';

// =============================================================================
// SEO Audit Orchestrator Service
// =============================================================================
export {
  // Types
  type AuditTargetType,
  type AuditType,
  type AuditStatus,
  type SEOAuditJob,
  type CoreWebVitals,
  type TechnicalIssue,
  type MobileMetrics,
  type SecurityMetrics,
  type CrawlabilityMetrics,
  type LeakAlignedScores,
  type AuditRecommendation,
  type SEOAuditResult,
  type CreateAuditJobInput,
  type AuditFilters,
  type RunAuditResult,
  // Functions
  createAuditJob,
  runAudit,
  getAuditResults,
  getAuditJob,
  listAudits,
  cancelAudit,
  deleteAudit,
  getAuditStats,
} from './seoAuditOrchestratorService';

// =============================================================================
// Gap Analysis Service
// =============================================================================
export {
  // Types
  type GapType,
  type KeywordGap,
  type KeywordGapAnalysis,
  type ContentGap,
  type ContentGapAnalysis,
  type BacklinkGap,
  type BacklinkGapAnalysis,
  type FullGapAnalysisResult,
  // Functions
  analyzeKeywordGaps,
  analyzeContentGaps,
  analyzeBacklinkGaps,
  runFullGapAnalysis,
  getKeywordGapAnalyses,
  getContentGapAnalyses,
  getBacklinkGapAnalyses,
  deleteGapAnalysis,
} from './gapAnalysisService';

// =============================================================================
// Schema Engine Service
// =============================================================================
export {
  // Types
  type SchemaType,
  type ValidationStatus,
  type SchemaStatus,
  type SchemaTemplate,
  type GeneratedSchema,
  type ValidationError,
  type ValidationResult,
  type PageInfo,
  // Functions
  generateSchema,
  validateSchema,
  saveTemplate,
  getTemplates,
  approveSchema,
  rejectSchema,
  markDeployed,
  getGeneratedSchemas,
  getSchema,
  deleteSchema,
  deleteTemplate,
  generateFromTemplate,
} from './schemaEngineService';

// =============================================================================
// Behavioural Search Service
// =============================================================================
export {
  // Types
  type OpportunityLevel,
  type TestStatus,
  type TestWinner,
  type CTRBenchmark,
  type NavBoostInference,
  type TitleMetaVariant,
  type TitleMetaTest,
  type TestResults,
  type NavBoostPotential,
  type NavBoostRecommendation,
  // Functions
  analyzeCTRBenchmarks,
  createTitleMetaTest,
  recordTestResults,
  computeNavBoostPotential,
  getCTRBenchmarks,
  getTitleMetaTests,
  getTest,
  startTest,
  pauseTest,
  cancelTest,
  deleteCTRBenchmark,
  deleteTest,
  getCTROptimizationSummary,
} from './behaviouralSearchService';
