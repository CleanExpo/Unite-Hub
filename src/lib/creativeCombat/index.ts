/**
 * Creative Combat Module
 * Phase 88: A/B Intelligence Layer
 */

// Types
export * from './combatTypes';

// Round service
export {
  createRound,
  startRound,
  completeRound,
  getRoundById,
  listRounds,
  getCombatStats,
  getReadyRounds,
} from './combatRoundService';

// Entry service
export {
  attachEntry,
  updateEntryMetrics,
  applyRealityAdjustments,
  getEntryById,
  listEntriesByRound,
  updateEntryStatus,
} from './combatEntryService';

// Winner service
export {
  determineWinner,
  getResultByRound,
  listResults,
} from './combatWinnerService';

// Integration service
export {
  promoteWinner,
  retireLoser,
  triggerEvolution,
  processIntegrations,
  getIntegrationStats,
} from './combatIntegrationService';

// Scheduler service
export {
  runCombatCycle,
  cleanupStaleRounds,
  getSchedulerStatus,
} from './combatSchedulerService';
