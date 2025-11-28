/**
 * Boost Bump Module - HUMAN_GOVERNED
 *
 * Coordinates organic search enhancement through legitimate optimization techniques.
 * All jobs require human approval before execution.
 *
 * WARNING: This module coordinates SEO optimization. All actions must comply
 * with search engine guidelines and be approved by humans.
 *
 * @module boostBump
 */

// Main coordinator service
export {
  // Types
  type BoostType,
  type BoostJobStatus,
  type GeoTarget,
  type BoostJob,
  type BoostMetrics,
  type CreateBoostJobParams,
  type BoostJobFilters,
  type PerformanceSummary,

  // Functions
  createBoostJob,
  getBoostJobs,
  getBoostJob,
  scheduleBoost,
  approveBoostJob,
  rejectBoostJob,
  recordBoostResult,
  startBoostJob,
  cancelBoostJob,
  getPerformanceSummary,
  getPendingApprovalJobs,
  getReadyToExecuteJobs,
} from './boostCoordinatorService';

// Default export for convenience
export { default as boostCoordinatorService } from './boostCoordinatorService';
