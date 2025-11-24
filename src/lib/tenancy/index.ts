/**
 * Tenancy Module
 * Phase 90: Unified Multi-Tenant Agency Engine
 */

// Types
export * from './tenantTypes';

// Context resolver
export {
  resolveForRequest,
  assertTenantAccess,
  listUserTenants,
  getUserRole,
  isOwner,
  canManage,
} from './tenantContextResolver';

// Scoped queries
export {
  query,
  insert,
  update,
  remove,
  count,
  exists,
} from './tenantScopedQueryService';

// Agency service
export {
  createAgency,
  getAgency,
  getAgencyBySlug,
  updateAgency,
  getAgencyStats,
  addAgencyUser,
  removeAgencyUser,
  getAgencyUsers,
} from './agencyService';

// Adapters
export {
  getTenantSchedules,
  getTenantAssets,
  getTenantPendingTasks,
  createTenantSchedule,
} from './tenantOrchestrationAdapter';

export {
  getTenantTokens,
  postForTenant,
  getTenantPostingQueue,
  getTenantRecentPosts,
} from './tenantPostingAdapter';

export {
  computeTenantScaling,
  recommendTenantMode,
  getTenantScalingHistory,
  getTenantCurrentMode,
} from './tenantScalingAdapter';

export {
  loadTenantIntel,
  loadTenantAlerts,
  loadTenantPerformance,
  loadTenantCombatResults,
  getTenantIntelSummary,
} from './tenantIntelAdapter';
