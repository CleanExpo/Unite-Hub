/**
 * Coalition Formation System Export Index
 *
 * Multi-agent coalition formation with role allocation and pattern learning.
 */

export { coalitionFormationEngine } from './CoalitionFormationEngine';
export type {
  Agent,
  CoalitionCandidate,
  CoalitionProposal,
  CoalitionHistory,
} from './CoalitionFormationEngine';

export { coalitionRoleAllocator } from './CoalitionRoleAllocator';
export type {
  RoleAssignment,
  RoleAllocationResult,
  ConflictResolution,
} from './CoalitionRoleAllocator';

export { coalitionLifecycleManager } from './CoalitionLifecycleManager';
export type {
  CoalitionState,
  CoalitionHealthMetrics,
  HealthAlert,
  CoalitionExecutionStats,
} from './CoalitionLifecycleManager';

export { coalitionArchiveBridge } from './CoalitionArchiveBridge';
export type {
  CoalitionArchiveEntry,
  CoalitionPattern,
  CoalitionAnalytics,
  CoalitionPatternType,
} from './CoalitionArchiveBridge';
