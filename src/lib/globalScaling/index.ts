/**
 * Global Region Scaling Engine
 * Phase 92: GRSE - Region-level execution isolation and scaling
 */

// Types
export * from './globalScalingTypes';

// Region Context
export {
  resolveRegionForAgency,
  resolveRegionForClient,
  resolveRegionFromHeaders,
  getRegionWithState,
  getAgencyRegions,
} from './regionContextResolver';

// Scaling Service
export {
  computeRegionCapacity,
  computePressure,
  generateRegionSnapshot,
  saveRegionSnapshot,
  updateScalingMode,
  getRegionScalingSummary,
  updatePressureScores,
} from './regionScalingService';

// Budget Allocator
export {
  allocateDaily,
  checkBudget,
  decrement,
  refund,
  getBudgetStats,
  setMonthlyBudget,
} from './regionAIBudgetAllocator';

// Shard Router
export {
  routePostingJob,
  routeOrchestrationJob,
  routeCreativeJob,
  routePerformanceJob,
  getBestRegionForJob,
  updateJobQueue,
} from './regionShardRouter';

// Global Monitor
export {
  listRegionHealth,
  detectCrossRegionConflicts,
  computeGlobalRisk,
  getRegionHealthTrend,
  getRegionsByMetric,
  alertCriticalIssues,
} from './globalRegionMonitor';
