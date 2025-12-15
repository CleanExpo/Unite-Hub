import {
  getHealthSummary as getHealthSummaryCore,
  getLatestResults as getLatestResultsCore,
  runTenantChecks as runTenantChecksCore,
} from "@/lib/core/configHealthService";

export async function runTenantChecks(tenantId?: string) {
  if (!tenantId) {
return [];
}
  return runTenantChecksCore(tenantId);
}

export async function getLatestResults(tenantId: string) {
  return getLatestResultsCore(tenantId);
}

export async function getHealthSummary(tenantId: string) {
  return getHealthSummaryCore(tenantId);
}

