/**
 * Predictive Opportunity Engine
 * Phase 95: Truth-layer compliant forecasting
 */

// Types
export * from './predictiveTypes';

// Signal Collection
export {
  collectForTenant,
  collectForRegion,
  collectForClient,
} from './opportunitySignalCollector';

// Scoring
export {
  computeScores,
  normalizeConfidence,
  computeUncertaintyNotes,
  getSignalDiversity,
  filterQualitySignals,
} from './opportunityScoringService';

// Window Management
export {
  generateWindow,
  saveWindow,
  listWindowsForTenant,
  listWindowsForRegion,
  getWindowWithSignals,
  updateWindowStatus,
} from './opportunityWindowService';

// Insights
export {
  detectMomentumOpportunities,
  detectAudienceWindows,
  generateFounderOpportunityReport,
  getCategoryTrends,
} from './predictiveInsightService';

// Scheduler
export {
  runDailyPredictiveSweep,
  generateWindowsForRegion,
  generateWindowsForClient,
  cleanupExpiredWindows,
} from './predictiveSchedulerService';
