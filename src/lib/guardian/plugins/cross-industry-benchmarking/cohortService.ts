/**
 * Cohort Selection & K-Anonymity Service
 *
 * Selects safe peer cohorts without exposing tenant identities.
 * Enforces k-anonymity (k >= 10) and gracefully falls back to global cohort.
 */

import type { CohortMetadata, BenchmarkWindow, IndustryLabel } from './types';
import { createCohortMetadata, BENCHMARK_CONSTANTS } from './types';

/**
 * Cohort selection result
 */
export interface CohortSelection {
  cohort: CohortMetadata;
  fallbackReason?: string; // If industry cohort too small, explains fallback
}

/**
 * Select safe cohort for benchmarking
 *
 * Priority:
 * 1. Industry-specific cohort if k >= 10
 * 2. Fallback to global cohort if industry < 10
 * 3. Never expose cohort membership or tenant identifiers
 */
export async function selectBenchmarkCohort(
  tenantIndustry: IndustryLabel | null,
  window: BenchmarkWindow
): Promise<CohortSelection> {
  // Mock cohort sizes (in production, query aggregated warehouse data)
  const industryCohortSizes: Record<IndustryLabel, number> = {
    healthcare: 15,
    government: 8, // Below threshold
    education: 12,
    insurance: 22,
    restoration: 6, // Below threshold
    global: 150 // Always available
  };

  // Attempt industry-specific cohort if provided
  if (tenantIndustry && tenantIndustry !== 'global') {
    const industrySizeSize = industryCohortSizes[tenantIndustry] || 0;

    if (industrySizeSize >= BENCHMARK_CONSTANTS.MIN_COHORT_SIZE) {
      return {
        cohort: createCohortMetadata(industrySizeSize, window, tenantIndustry),
        fallbackReason: undefined
      };
    }

    // Industry cohort too small, fall back to global
    return {
      cohort: createCohortMetadata(
        industryCohortSizes.global,
        window,
        'global'
      ),
      fallbackReason: `Industry cohort (${tenantIndustry}) has ${industrySizeSize} members, below k=${BENCHMARK_CONSTANTS.MIN_COHORT_SIZE}. Using global cohort for privacy.`
    };
  }

  // No industry specified, use global
  return {
    cohort: createCohortMetadata(industryCohortSizes.global, window, 'global'),
    fallbackReason: undefined
  };
}

/**
 * Verify k-anonymity compliance
 */
export function verifyKAnonymity(cohortSize: number): boolean {
  return cohortSize >= BENCHMARK_CONSTANTS.MIN_COHORT_SIZE;
}

/**
 * Get cohort description for UI (no membership details)
 */
export function getCohortLabel(cohort: CohortMetadata): string {
  if (cohort.industryLabel === 'global') {
    return `Global Peer Cohort (${cohort.size} organizations)`;
  }

  return `${capitalize(cohort.industryLabel)} Cohort (${cohort.size} organizations)`;
}

/**
 * Helper: capitalize string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
