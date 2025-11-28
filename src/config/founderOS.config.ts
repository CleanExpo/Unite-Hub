/**
 * Founder Intelligence OS - Core Configuration
 * Central configuration for the Founder OS ecosystem
 *
 * @module founderOS.config
 * @version 1.0.0
 */

/**
 * Governance modes for Founder OS
 */
export type GovernanceMode = 'HUMAN_GOVERNED' | 'AI_ASSISTED' | 'AUTONOMOUS';

/**
 * Supported regions for Founder OS
 */
export type FounderOSRegion = 'AU' | 'US' | 'UK' | 'EU' | 'APAC' | 'GLOBAL';

/**
 * Founder OS core configuration interface
 */
export interface FounderOSConfig {
  /** Enable/disable Founder OS completely */
  FOUNDER_OS_ENABLED: boolean;

  /** Default owner user ID for Founder OS instances */
  FOUNDER_OS_DEFAULT_OWNER_USER_ID: string | null;

  /** Maximum number of businesses a single user can manage */
  FOUNDER_OS_MAX_BUSINESSES: number;

  /** Governance mode: HUMAN_GOVERNED (default), AI_ASSISTED, AUTONOMOUS */
  FOUNDER_OS_GOVERNANCE_MODE: GovernanceMode;

  /** Default region for Founder OS deployment */
  FOUNDER_OS_DEFAULT_REGION: FounderOSRegion;

  /** How many days to retain business snapshots */
  FOUNDER_OS_SNAPSHOT_RETENTION_DAYS: number;

  /** Interval (in hours) for aggregating signals from all business modules */
  FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS: number;

  /** Enable cross-business insights and pattern detection */
  FOUNDER_OS_CROSS_BUSINESS_INSIGHTS_ENABLED: boolean;

  /** Enable emergency protocols for critical issues */
  FOUNDER_OS_EMERGENCY_PROTOCOLS_ENABLED: boolean;

  /** Maximum concurrent background jobs per Founder OS instance */
  FOUNDER_OS_MAX_CONCURRENT_JOBS: number;
}

/**
 * Founder OS runtime configuration
 * Load from environment variables with sensible defaults
 */
export const FOUNDER_OS_CONFIG: FounderOSConfig = {
  FOUNDER_OS_ENABLED: process.env.FOUNDER_OS_ENABLED !== 'false',

  FOUNDER_OS_DEFAULT_OWNER_USER_ID:
    process.env.FOUNDER_OS_DEFAULT_OWNER_ID || null,

  FOUNDER_OS_MAX_BUSINESSES:
    parseInt(process.env.FOUNDER_OS_MAX_BUSINESSES || '50', 10),

  FOUNDER_OS_GOVERNANCE_MODE:
    (process.env.FOUNDER_OS_GOVERNANCE_MODE as GovernanceMode) ||
    'HUMAN_GOVERNED',

  FOUNDER_OS_DEFAULT_REGION:
    (process.env.FOUNDER_OS_DEFAULT_REGION as FounderOSRegion) || 'AU',

  FOUNDER_OS_SNAPSHOT_RETENTION_DAYS: parseInt(
    process.env.FOUNDER_OS_SNAPSHOT_RETENTION_DAYS || '90',
    10
  ),

  FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS: parseInt(
    process.env.FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS || '6',
    10
  ),

  FOUNDER_OS_CROSS_BUSINESS_INSIGHTS_ENABLED:
    process.env.FOUNDER_OS_CROSS_BUSINESS_INSIGHTS_ENABLED !== 'false',

  FOUNDER_OS_EMERGENCY_PROTOCOLS_ENABLED:
    process.env.FOUNDER_OS_EMERGENCY_PROTOCOLS_ENABLED !== 'false',

  FOUNDER_OS_MAX_CONCURRENT_JOBS: parseInt(
    process.env.FOUNDER_OS_MAX_CONCURRENT_JOBS || '20',
    10
  ),
};

/**
 * Validate Founder OS configuration at runtime
 */
export function validateFounderOSConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (FOUNDER_OS_CONFIG.FOUNDER_OS_MAX_BUSINESSES < 1) {
    errors.push('FOUNDER_OS_MAX_BUSINESSES must be at least 1');
  }

  if (FOUNDER_OS_CONFIG.FOUNDER_OS_SNAPSHOT_RETENTION_DAYS < 7) {
    errors.push('FOUNDER_OS_SNAPSHOT_RETENTION_DAYS should be at least 7');
  }

  if (FOUNDER_OS_CONFIG.FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS < 1) {
    errors.push(
      'FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS must be at least 1'
    );
  }

  if (FOUNDER_OS_CONFIG.FOUNDER_OS_MAX_CONCURRENT_JOBS < 1) {
    errors.push('FOUNDER_OS_MAX_CONCURRENT_JOBS must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration value with type safety
 */
export function getFounderOSConfig<K extends keyof FounderOSConfig>(
  key: K
): FounderOSConfig[K] {
  return FOUNDER_OS_CONFIG[key];
}
