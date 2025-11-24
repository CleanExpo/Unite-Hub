/**
 * Compliance Module
 * Phase 93: GCCAE - Global Compliance & Cultural Adaptation
 */

// Types
export * from './complianceTypes';

// Policy Registry
export {
  listPolicies,
  getActivePolicies,
  getPolicyByCode,
  getAllPolicyCodes,
  getPolicyCoverage,
} from './policyRegistryService';

// Locale Profiles
export {
  getLocaleProfile,
  getDefaultLocaleForRegion,
  listAllLocales,
  getLocalesForRegion,
  checkUpcomingHolidays,
  getSpellingDifferences,
} from './localeProfileService';

// Content Compliance Checker
export {
  checkContent,
  summariseViolations,
  hasComplianceIssues,
} from './contentComplianceCheckerService';

// Cultural Adaptation
export {
  adaptCopyToLocale,
  suggestCulturalAdjustments,
  getToneRecommendation,
} from './culturalAdaptationService';

// Incident Management
export {
  logIncident,
  resolveIncident,
  overrideIncident,
  listIncidents,
  getIncidentSummary,
  getRecentCriticalIncidents,
} from './complianceIncidentService';

// Truth Adapter
export {
  annotateComplianceSummary,
  enforceLegalDisclaimer,
  formatViolation,
  getRiskLevelDescription,
  createComplianceReport,
  requiresImmediateAttention,
} from './complianceTruthAdapter';

// Integration
export {
  attachComplianceToPreflight,
  preventExecutionOnCriticalViolations,
  emitAutopilotTasksFromIncidents,
  getComplianceStatus,
  batchComplianceCheck,
} from './complianceIntegrationService';
