/**
 * Franchise Module
 * Phase 91: Licensing, Franchise & Region Expansion Engine
 */

// Types
export * from './franchiseTypes';

// Agency hierarchy
export {
  getChildAgencies,
  getParentAgency,
  validateParentAccess,
  getAgencyTree,
  setParentAgency,
  countHierarchyAgencies,
} from './agencyHierarchyService';

// Region ownership
export {
  assignRegion,
  listRegionsForAgency,
  isRegionOwnedByAgency,
  getAllRegions,
  getRegion,
  createRegion,
  getRegionsByCountry,
} from './regionOwnershipService';

// Franchise tiers
export {
  getTier,
  getAllTiers,
  getAgencyLicense,
  applyTierLimits,
  validateClientLimit,
  validateUserLimit,
  updateLicenseUsage,
  hasFeature,
} from './franchiseTierService';

// Revenue rollups
export {
  computeRevenueForAgency,
  computeClientGrowth,
  rollUpToParent,
  recordMetrics,
  getMetricsHistory,
  compareMetrics,
} from './revenueRollupService';
