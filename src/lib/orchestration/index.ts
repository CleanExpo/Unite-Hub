/**
 * MCOE Module
 * Phase 84: Multi-Agent Campaign Orchestration Engine
 */

// Types
export * from './mcoeTypes';

// Services
export {
  planWeeklySchedule,
  selectOptimalTimes,
  getWeekSchedules,
  detectConflicts,
} from './mcoePlannerService';

export {
  selectAssetForChannel,
  selectVariationOrEvolution,
  getUnusedAssets,
  checkAssetFreshness,
} from './mcoeAssetSelectorService';

export {
  validateSchedule,
  validateAssetAgainstReality,
  getGuardrailSummary,
} from './mcoeGuardrailsService';

export {
  executeDraftPost,
  updateScheduleStatus,
  blockSchedule,
  approveSchedule,
  cancelSchedule,
  executeDueSchedules,
  syncPostingIntentToLogs,
} from './mcoeExecutorService';

export {
  logOrchestrationAction,
  attachTruthNotes,
  getScheduleActions,
  getRecentActions,
  getActionsByType,
  getConflictActions,
  getActionStats,
} from './mcoeLogService';

export {
  runDailyOrchestrationPass,
  runWeeklyCampaignPlanning,
  createSchedule,
  getOrchestrationOverview,
  getChannelSummaries,
} from './mcoeSchedulerService';
