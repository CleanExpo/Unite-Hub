/**
 * Scaling Mode Module
 * Phase 86: Scaling Mode Control & Capacity Engine
 */

// Types
export * from './scalingModeTypes';

// Config Service
export {
  getConfig,
  updateConfig,
  createConfig,
  getModeLimits,
  getCurrentModeLimits,
  getNextMode,
  getPreviousMode,
  setCurrentMode,
  setAutoModeEnabled,
  updateGuardrailThresholds,
  getModeDisplayName,
} from './scalingModeConfigService';

// Health Aggregation
export {
  collectHealthInputs,
  computeScores,
  calculateSafeCapacity,
  calculateConfidence,
} from './scalingHealthAggregationService';

// Snapshot Service
export {
  generateSnapshot,
  listSnapshots,
  getLatestSnapshot,
  getSnapshotById,
  getSnapshotsInRange,
} from './scalingHealthSnapshotService';

// Decision Service
export {
  decideNextMode,
  shouldFreezeOnboarding,
  getRecommendationText,
} from './scalingModeDecisionService';

// History Service
export {
  logModeChange,
  logEvent,
  logFreeze,
  logUnfreeze,
  logNote,
  logCapacityUpdate,
  listHistory,
  listHistoryByType,
  getEventTypeDisplayText,
  getActorDisplayText,
} from './scalingHistoryService';

// Truth Adapter
export {
  validateScalingInputs,
  generateSnapshotSummary,
  generateInvestorNarrative,
  shouldBlockRecommendation,
} from './scalingModeTruthAdapter';

// Scheduler Service
export {
  runDailyScalingEvaluation,
  runWeeklySummary,
  needsEvaluation,
} from './scalingModeSchedulerService';
