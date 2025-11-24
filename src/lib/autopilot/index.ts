/**
 * Autopilot Module
 * Phase 89: Founder Autopilot Mode (Weekly Operator Engine)
 */

// Types
export * from './autopilotTypes';

// Preference service
export {
  getPreferences,
  upsertPreferences,
  resolveDomainLevel,
  canAutoExecute,
} from './autopilotPreferenceService';

// Signal collector
export {
  collectSignalsForPeriod,
} from './autopilotSignalCollectorService';

// Planner
export {
  transformSignalsToActions,
  prioritiseActions,
} from './autopilotPlannerService';

// Playbook service
export {
  createPlaybookWithActions,
  generatePlaybook,
  getPlaybook,
  listPlaybooks,
  getPlaybookActions,
  updateActionState,
  getAutopilotStats,
} from './autopilotPlaybookService';

// Executor service
export {
  executeAction,
  executeAutoBatch,
  approveAndExecute,
  skipAction,
} from './autopilotExecutorService';
