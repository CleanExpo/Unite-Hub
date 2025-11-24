/**
 * Client Agent Module
 * Phase 83: Safety-caged AI agent for client operations
 */

// Types
export * from './clientAgentTypes';

// Services
export {
  buildClientContext,
  buildWorkspaceContext,
  summarizeContext,
} from './clientAgentContextService';

export {
  getPolicy,
  upsertPolicy,
  listPolicies,
  deletePolicy,
  isActionAllowed,
  canAutoExecute,
  getPolicySummary,
} from './clientAgentPolicyService';

export {
  planAgentResponse,
  generateSimpleResponse,
} from './clientAgentPlannerService';

export {
  checkGuardrails,
  assessRisk,
  getGuardrailSummary,
} from './clientAgentGuardrailsService';

export {
  executeAction,
  recordExecution,
} from './clientAgentExecutorService';

export {
  createSession,
  getSession,
  addMessage,
  endSession,
  logAction,
  updateActionStatus,
  getSessionActions,
  getPendingActions,
  getRecentSessions,
  getClientActionHistory,
} from './clientAgentLogService';

export {
  validateTruthCompliance,
  adaptProposalForTruth,
  generateTruthDisclaimer,
  meetsMinimumTruthStandards,
  scoreTruthCompliance,
  suggestTruthImprovements,
} from './clientAgentTruthAdapter';

export {
  runScheduledEvaluation,
  getAgentOverview,
  getActionSummary,
  getOverdueActions,
} from './clientAgentScheduler';
