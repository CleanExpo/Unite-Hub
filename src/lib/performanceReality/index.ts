/**
 * Performance Reality Engine
 * Phase 81: Exports
 */

// Types
export * from './performanceRealityTypes';

// Core model
export {
  computeTruePerformanceScore,
  generateDemoPerceivedScore,
  getPrimaryDriver,
  getSecondaryDrivers,
} from './performanceRealityModelService';

// Attribution
export {
  computeAttributionFactors,
  getSnapshotAttribution,
  DEFAULT_ATTRIBUTION_FACTORS,
} from './performanceAttributionService';

// External signals
export {
  getExternalSignals,
  getExternalContext,
  createExternalSignal,
  seedHolidaysForRegion,
  checkDateForSignals,
  generateDemoExternalSignals,
} from './performanceExternalSignalService';

// Snapshots
export {
  createPerformanceRealitySnapshot,
  getPerformanceRealitySnapshot,
  listPerformanceRealitySnapshots,
  getLatestSnapshot,
  deletePerformanceRealitySnapshot,
  generateDemoSnapshot,
} from './performanceRealitySnapshotService';

// Truth adapter
export {
  adaptSnapshotForTruth,
  meetsMinimumTruthStandards,
  generateTruthSummary,
} from './performanceRealityTruthAdapter';
export type { TruthAdaptedSnapshot } from './performanceRealityTruthAdapter';

// Founder bridge
export {
  getRealityStripData,
  generateRealityAlerts,
  getRealitySignals,
  getRealityBriefingContent,
} from './performanceRealityFounderBridge';
export type {
  RealityStripData,
  RealityAlert,
  RealitySignal,
} from './performanceRealityFounderBridge';
