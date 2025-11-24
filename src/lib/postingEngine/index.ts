/**
 * AMPE Module
 * Phase 85: Autonomous Multi-Channel Posting Engine
 */

// Types
export * from './postingTypes';

// Orchestrator
export {
  processSchedule,
  buildPostingContext,
  getPostingEngineConfig,
  updatePostingEngineConfig,
  getPostingEngineOverview,
  setEngineEnabled,
  setDraftMode,
  getChannelTokenStatus,
  handoffToChannelAdapter,
} from './postingOrchestratorService';

// Safety
export {
  runSafetyChecks,
  isPublishAllowed,
} from './postingSafetyService';

// Channel Adapters
export {
  publishToChannel,
  getChannelDisplayName,
  channelRequiresMedia,
  getChannelCharacterLimit,
} from './postingChannelAdapterService';

// Execution
export {
  execute,
  recordPostingAttempt,
  getScheduleAttempts,
  getRecentAttempts,
} from './postingExecutionService';

// Scheduler
export {
  runPostingLoop,
  consumeReadySchedules,
  getPendingSchedules,
  processClientSchedules,
  getSchedulerStats,
  markScheduleReady,
  retryFailedAttempt,
} from './postingSchedulerService';

// Truth Adapter
export {
  generateTruthNotes,
  attachTruthNotes,
  generateExplanationPrompt,
  formatTruthNotesForDisplay,
  needsManualReview,
} from './postingTruthAdapter';
