/**
 * Posting Execution Module
 * Phase 87: Cross-Channel Publishing Execution Layer
 */

// Types
export * from './postingExecutionTypes';

// Preflight service
export {
  runPreflight,
  getPreflightById,
  listPreflights,
} from './preflightService';

// Execution service
export {
  executePost,
  getExecutionById,
  listExecutions,
  getExecutionStats,
  retryExecution,
} from './executionService';

// Channel adapters
export {
  executeOnChannel,
} from './channelExecutionAdapterService';

// Rollback service
export {
  initiateRollback,
  getRollbackById,
  listRollbacks,
} from './rollbackService';

// Scheduler
export {
  processDueSchedules,
  getSchedulerStatus,
  getUpcomingSchedules,
} from './postingExecutionSchedulerService';
