/**
 * APM Configuration Management
 *
 * Central configuration for Application Performance Monitoring (APM):
 * - Environment-based configuration for Datadog and Sentry
 * - Sampling rates per environment
 * - Service tagging strategy
 * - Custom instrumentation rules
 * - Feature flags for APM components
 *
 * @module config/apm-config
 */

 


// ============================================================================
// TYPES
// ============================================================================

export interface APMConfig {
  enabled: boolean;
  environment: string;
  serviceName: string;
  version: string;
  datadog: DatadogConfig;
  sentry: SentryConfig;
  sampling: SamplingConfig;
  tags: Record<string, string>;
  features: FeatureFlags;
}

export interface DatadogConfig {
  enabled: boolean;
  applicationId: string;
  clientToken: string;
  apiKey: string;
  site: string;
}

export interface SentryConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  release?: string;
}

export interface SamplingConfig {
  traces: number;
  sessionReplay: number;
  sessionReplayOnError: number;
  metrics: number;
}

export interface FeatureFlags {
  trackUserInteractions: boolean;
  trackResources: boolean;
  trackLongTasks: boolean;
  sessionReplay: boolean;
  performanceMonitoring: boolean;
  errorTracking: boolean;
  metricsExport: boolean;
}

export type Environment = 'development' | 'staging' | 'production' | 'test';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV || process.env.NEXT_PUBLIC_ENV || 'development';

  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    case 'test':
      return 'test';
    default:
      return 'development';
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === 'test';
}

// ============================================================================
// SAMPLING RATES
// ============================================================================

/**
 * Get sampling rates based on environment
 */
export function getSamplingRates(environment: Environment): SamplingConfig {
  switch (environment) {
    case 'production':
      return {
        traces: 0.1, // 10% trace sampling
        sessionReplay: 0.05, // 5% session replay
        sessionReplayOnError: 1.0, // 100% replay on errors
        metrics: 1.0, // 100% metrics collection
      };

    case 'staging':
      return {
        traces: 1.0, // 100% trace sampling
        sessionReplay: 1.0, // 100% session replay
        sessionReplayOnError: 1.0, // 100% replay on errors
        metrics: 1.0, // 100% metrics collection
      };

    case 'development':
      return {
        traces: 0.0, // No trace sampling
        sessionReplay: 0.0, // No session replay
        sessionReplayOnError: 0.0, // No replay on errors
        metrics: 0.0, // No metrics collection
      };

    case 'test':
      return {
        traces: 0.0, // No trace sampling
        sessionReplay: 0.0, // No session replay
        sessionReplayOnError: 0.0, // No replay on errors
        metrics: 0.0, // No metrics collection
      };

    default:
      return getSamplingRates('development');
  }
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Get feature flags based on environment
 */
export function getFeatureFlags(environment: Environment): FeatureFlags {
  const baseFlags: FeatureFlags = {
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    sessionReplay: true,
    performanceMonitoring: true,
    errorTracking: true,
    metricsExport: true,
  };

  switch (environment) {
    case 'production':
      return baseFlags;

    case 'staging':
      return baseFlags;

    case 'development':
      return {
        ...baseFlags,
        sessionReplay: false,
        metricsExport: false,
      };

    case 'test':
      return {
        trackUserInteractions: false,
        trackResources: false,
        trackLongTasks: false,
        sessionReplay: false,
        performanceMonitoring: false,
        errorTracking: false,
        metricsExport: false,
      };

    default:
      return getFeatureFlags('development');
  }
}

// ============================================================================
// SERVICE TAGS
// ============================================================================

/**
 * Get default service tags
 */
export function getServiceTags(environment: Environment): Record<string, string> {
  return {
    service: 'unite-hub',
    environment,
    platform: 'nextjs',
    runtime: 'nodejs',
    region: process.env.DEPLOYMENT_REGION || 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
}

// ============================================================================
// DATADOG CONFIGURATION
// ============================================================================

/**
 * Get Datadog configuration from environment
 */
export function getDatadogConfig(): DatadogConfig {
  return {
    enabled: process.env.DATADOG_ENABLED !== 'false',
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || '',
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || '',
    apiKey: process.env.DATADOG_API_KEY || '',
    site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com',
  };
}

/**
 * Validate Datadog configuration
 */
export function validateDatadogConfig(config: DatadogConfig): boolean {
  if (!config.enabled) {
    return true; // Valid if disabled
  }

  const hasClientConfig = config.applicationId && config.clientToken;
  const hasServerConfig = config.apiKey;

  if (!hasClientConfig && !hasServerConfig) {
    console.warn('[APM] Datadog configuration incomplete - missing required keys');
    return false;
  }

  return true;
}

// ============================================================================
// SENTRY CONFIGURATION
// ============================================================================

/**
 * Get Sentry configuration from environment
 */
export function getSentryConfig(): SentryConfig {
  return {
    enabled: process.env.SENTRY_ENABLED !== 'false',
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: getCurrentEnvironment(),
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
  };
}

/**
 * Validate Sentry configuration
 */
export function validateSentryConfig(config: SentryConfig): boolean {
  if (!config.enabled) {
    return true; // Valid if disabled
  }

  if (!config.dsn) {
    console.warn('[APM] Sentry configuration incomplete - missing DSN');
    return false;
  }

  return true;
}

// ============================================================================
// MAIN APM CONFIGURATION
// ============================================================================

/**
 * Get complete APM configuration
 */
export function getAPMConfig(): APMConfig {
  const environment = getCurrentEnvironment();
  const datadogConfig = getDatadogConfig();
  const sentryConfig = getSentryConfig();

  // Validate configurations
  const datadogValid = validateDatadogConfig(datadogConfig);
  const sentryValid = validateSentryConfig(sentryConfig);

  // Determine if APM is enabled
  const enabled = (datadogValid && datadogConfig.enabled) || (sentryValid && sentryConfig.enabled);

  return {
    enabled,
    environment,
    serviceName: 'unite-hub',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    datadog: datadogConfig,
    sentry: sentryConfig,
    sampling: getSamplingRates(environment),
    tags: getServiceTags(environment),
    features: getFeatureFlags(environment),
  };
}

/**
 * Validate complete APM configuration
 */
export function validateAPMConfig(config: APMConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if at least one APM service is enabled
  if (!config.datadog.enabled && !config.sentry.enabled) {
    warnings.push('No APM services enabled - monitoring will be limited');
  }

  // Validate Datadog
  if (config.datadog.enabled) {
    if (!config.datadog.applicationId || !config.datadog.clientToken) {
      if (!config.datadog.apiKey) {
        errors.push('Datadog enabled but missing required configuration');
      } else {
        warnings.push('Datadog RUM disabled - only server-side metrics available');
      }
    }
  }

  // Validate Sentry
  if (config.sentry.enabled) {
    if (!config.sentry.dsn) {
      errors.push('Sentry enabled but missing DSN');
    }
  }

  // Check sampling rates
  if (config.environment === 'production' && config.sampling.traces > 0.2) {
    warnings.push('High trace sampling rate in production - may impact performance');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log APM configuration status
 */
export function logAPMConfig(config: APMConfig): void {
  console.log('[APM] Configuration loaded:', {
    enabled: config.enabled,
    environment: config.environment,
    service: config.serviceName,
    version: config.version,
    datadog: {
      enabled: config.datadog.enabled,
      hasClientConfig: !!(config.datadog.applicationId && config.datadog.clientToken),
      hasServerConfig: !!config.datadog.apiKey,
    },
    sentry: {
      enabled: config.sentry.enabled,
      hasDSN: !!config.sentry.dsn,
    },
    sampling: config.sampling,
  });

  // Validate and log any issues
  const validation = validateAPMConfig(config);

  if (validation.errors.length > 0) {
    console.error('[APM] Configuration errors:', validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn('[APM] Configuration warnings:', validation.warnings);
  }

  if (validation.valid && config.enabled) {
    console.log('[APM] Configuration valid - APM enabled');
  } else if (!config.enabled) {
    console.log('[APM] APM disabled by configuration');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default getAPMConfig;
