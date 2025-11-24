/**
 * Signal Matrix & Early Warning Engine
 * Phase 82: Exports
 */

// Types
export * from './signalMatrixTypes';

// Collector
export {
  collectSignalsForScope,
  getLatestMatrix,
} from './signalMatrixCollectorService';

// Engine
export {
  evaluateMatrixRow,
} from './earlyWarningEngineService';

// Snapshot service
export {
  createWarningEvent,
  listWarningEvents,
  getWarningEvent,
  updateWarningStatus,
  getOpenWarningCount,
  getWarningsBySeverity,
} from './earlyWarningSnapshotService';

// Truth adapter
export {
  validateWarningIntegrity,
  adaptWarningForTruth,
  annotateWarningSummary,
  meetsMinimumTruthStandards,
} from './earlyWarningTruthAdapter';
export type { TruthAdaptedWarning } from './earlyWarningTruthAdapter';

// Founder bridge
export {
  generateFounderAlertsFromWarnings,
  getEarlyWarningSummary,
  getEarlyWarningSignals,
  getEarlyWarningBriefingContent,
  createFounderIntelFromWarnings,
} from './earlyWarningFounderBridge';
export type {
  FounderEarlyWarningAlert,
  EarlyWarningSummary,
  EarlyWarningSignal,
} from './earlyWarningFounderBridge';

// Scheduler
export {
  runDailyEvaluation,
  runClientEvaluation,
  shouldRunEvaluation,
  getEvaluationStatus,
  generateDemoMatrix,
} from './earlyWarningScheduler';
