/**
 * Browser Automation Boost Configuration
 *
 * Configuration for browser session persistence, DOM map caching, replay task limits,
 * and safety thresholds for the Auto-Action Engine.
 */

export interface SessionPersistenceConfig {
  enabled: boolean;
  encryptionKeyEnv: string;
  maxSessionsPerWorkspace: number;
  sessionTimeoutHours: number;
  autoCleanupEnabled: boolean;
  cleanupIntervalHours: number;
}

export interface DOMMapCacheConfig {
  enabled: boolean;
  maxCacheEntriesPerSession: number;
  cacheTTLHours: number;
  maxCacheSizeBytes: number;
  compressCache: boolean;
  includeElementMetadata: boolean;
  excludeSelectors: string[];
}

export interface ReplayTaskConfig {
  enabled: boolean;
  maxStepsPerTask: number;
  maxTasksPerWorkspace: number;
  defaultTimeoutMs: number;
  stepDelayMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  screenshotOnError: boolean;
  logVerbosity: 'minimal' | 'standard' | 'verbose';
}

export interface PatternLearningConfig {
  enabled: boolean;
  minSuccessfulRunsToSave: number;
  maxPatternSteps: number;
  autoDetectLoginFlows: boolean;
  autoDetectFormSubmissions: boolean;
  confidenceThreshold: number;
}

export interface SafetyConfig {
  maxConcurrentBrowsers: number;
  maxActionsPerMinute: number;
  maxNavigationsPerSession: number;
  blockedDomains: string[];
  blockedPatterns: RegExp[];
  requireApprovalForSensitiveActions: boolean;
  sensitiveActionTypes: string[];
  sandboxMode: boolean;
  networkThrottling: {
    enabled: boolean;
    downloadKbps: number;
    uploadKbps: number;
    latencyMs: number;
  };
  resourceLimits: {
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxDiskMB: number;
  };
}

export interface BrowserAutomationBoostConfig {
  enabled: boolean;
  sessionPersistence: SessionPersistenceConfig;
  domMapCache: DOMMapCacheConfig;
  replayTask: ReplayTaskConfig;
  patternLearning: PatternLearningConfig;
  safety: SafetyConfig;
}

export const browserAutomationBoostConfig: BrowserAutomationBoostConfig = {
  enabled: process.env.BROWSER_AUTOMATION_BOOST_ENABLED !== 'false',

  sessionPersistence: {
    enabled: true,
    encryptionKeyEnv: 'BROWSER_AUTOMATION_STATE_ENCRYPTION_KEY',
    maxSessionsPerWorkspace: 10,
    sessionTimeoutHours: 24,
    autoCleanupEnabled: true,
    cleanupIntervalHours: 12,
  },

  domMapCache: {
    enabled: true,
    maxCacheEntriesPerSession: 100,
    cacheTTLHours: 4,
    maxCacheSizeBytes: 50 * 1024 * 1024, // 50MB
    compressCache: true,
    includeElementMetadata: true,
    excludeSelectors: [
      'script',
      'style',
      'noscript',
      'iframe[src*="ads"]',
      '[data-testid="ad"]',
      '.advertisement',
      '#cookie-banner',
      '.cookie-consent',
    ],
  },

  replayTask: {
    enabled: true,
    maxStepsPerTask: 50,
    maxTasksPerWorkspace: 100,
    defaultTimeoutMs: 60000, // 1 minute
    stepDelayMs: 500,
    retryAttempts: 2,
    retryDelayMs: 2000,
    screenshotOnError: true,
    logVerbosity: 'standard',
  },

  patternLearning: {
    enabled: true,
    minSuccessfulRunsToSave: 3,
    maxPatternSteps: 30,
    autoDetectLoginFlows: true,
    autoDetectFormSubmissions: true,
    confidenceThreshold: 0.8,
  },

  safety: {
    maxConcurrentBrowsers: 3,
    maxActionsPerMinute: 60,
    maxNavigationsPerSession: 100,
    blockedDomains: [
      'bank',
      'banking',
      'paypal.com',
      'stripe.com',
      'venmo.com',
      'chase.com',
      'wellsfargo.com',
      'bankofamerica.com',
      'citibank.com',
      'healthcare.gov',
      'irs.gov',
      'ssa.gov',
      'dmv',
    ],
    blockedPatterns: [
      /password.*change/i,
      /delete.*account/i,
      /close.*account/i,
      /transfer.*funds/i,
      /wire.*transfer/i,
      /payment.*confirm/i,
    ],
    requireApprovalForSensitiveActions: true,
    sensitiveActionTypes: [
      'form_submit',
      'file_upload',
      'download',
      'clipboard_write',
      'popup_handle',
      'alert_dismiss',
      'navigation_external',
    ],
    sandboxMode: true,
    networkThrottling: {
      enabled: false,
      downloadKbps: 5000,
      uploadKbps: 1000,
      latencyMs: 50,
    },
    resourceLimits: {
      maxMemoryMB: 2048,
      maxCPUPercent: 80,
      maxDiskMB: 500,
    },
  },
};

export function isSessionPersistenceEnabled(): boolean {
  return (
    browserAutomationBoostConfig.enabled && browserAutomationBoostConfig.sessionPersistence.enabled
  );
}

export function isDOMMapCacheEnabled(): boolean {
  return browserAutomationBoostConfig.enabled && browserAutomationBoostConfig.domMapCache.enabled;
}

export function isReplayTaskEnabled(): boolean {
  return browserAutomationBoostConfig.enabled && browserAutomationBoostConfig.replayTask.enabled;
}

export function isPatternLearningEnabled(): boolean {
  return (
    browserAutomationBoostConfig.enabled && browserAutomationBoostConfig.patternLearning.enabled
  );
}

export function isSandboxModeEnabled(): boolean {
  return browserAutomationBoostConfig.safety.sandboxMode;
}

export function isActionAllowed(actionType: string): boolean {
  const { safety } = browserAutomationBoostConfig;

  // Check if action requires approval
  if (safety.requireApprovalForSensitiveActions && safety.sensitiveActionTypes.includes(actionType)) {
    return false; // Requires approval, not auto-allowed
  }

  return true;
}

export function isDomainBlocked(domain: string): boolean {
  const { blockedDomains, blockedPatterns } = browserAutomationBoostConfig.safety;

  // Check exact domain match
  if (blockedDomains.some((blocked) => domain.toLowerCase().includes(blocked.toLowerCase()))) {
    return true;
  }

  // Check pattern match
  if (blockedPatterns.some((pattern) => pattern.test(domain))) {
    return true;
  }

  return false;
}

export function getMaxConcurrentBrowsers(): number {
  return browserAutomationBoostConfig.safety.maxConcurrentBrowsers;
}

export function getSessionTimeout(): number {
  return browserAutomationBoostConfig.sessionPersistence.sessionTimeoutHours * 60 * 60 * 1000;
}

export function getReplayConfig(): ReplayTaskConfig {
  return browserAutomationBoostConfig.replayTask;
}

export function getSafetyConfig(): SafetyConfig {
  return browserAutomationBoostConfig.safety;
}
