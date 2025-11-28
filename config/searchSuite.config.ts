/**
 * Search Suite Configuration
 *
 * Configuration for GSC, Bing Webmaster Tools, SERP snapshot cadence, and keyword tracking.
 */

export type SearchEngine = 'google' | 'bing' | 'yahoo' | 'duckduckgo';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';

export interface GSCConfig {
  enabled: boolean;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  dataRetentionDays: number;
}

export interface BingConfig {
  enabled: boolean;
  apiKeyEnv: string;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  dataRetentionDays: number;
}

export interface SERPSnapshotConfig {
  enabled: boolean;
  cadenceHours: number;
  maxKeywordsPerRun: number;
  screenshotBucketEnv: string;
  screenshotFormat: 'png' | 'jpeg' | 'webp';
  screenshotQuality: number;
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
  maxConcurrentSnapshots: number;
  timeoutMs: number;
  retryAttempts: number;
}

export interface KeywordTrackingConfig {
  enabled: boolean;
  maxKeywordsPerProject: number;
  defaultLocations: string[];
  defaultDevices: DeviceType[];
  intentClassification: boolean;
  competitorTracking: boolean;
}

export interface VolatilityConfig {
  enabled: boolean;
  checkIntervalHours: number;
  thresholds: {
    positionChangeWarning: number; // Position change to trigger warning
    positionChangeCritical: number; // Position change to trigger critical alert
    trafficDropWarning: number; // Traffic drop percentage for warning
    trafficDropCritical: number; // Traffic drop percentage for critical
    impressionDropWarning: number;
    impressionDropCritical: number;
    newCompetitorAlert: boolean;
    lostKeywordAlert: boolean;
  };
  alertChannels: ('email' | 'slack' | 'webhook' | 'inApp')[];
}

export interface SearchSuiteConfig {
  enabled: boolean;
  gsc: GSCConfig;
  bing: BingConfig;
  serpSnapshot: SERPSnapshotConfig;
  keywordTracking: KeywordTrackingConfig;
  volatility: VolatilityConfig;
  supportedSearchEngines: SearchEngine[];
  dataRetentionDays: number;
}

export const searchSuiteConfig: SearchSuiteConfig = {
  enabled: process.env.SEARCH_SUITE_ENABLED !== 'false',

  gsc: {
    enabled: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters',
    ],
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerDay: 25000,
    },
    dataRetentionDays: 180,
  },

  bing: {
    enabled: !!process.env.BING_WEBMASTER_API_KEY,
    apiKeyEnv: 'BING_WEBMASTER_API_KEY',
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 5000,
    },
    dataRetentionDays: 180,
  },

  serpSnapshot: {
    enabled: true,
    cadenceHours: 24, // Daily by default
    maxKeywordsPerRun: 50,
    screenshotBucketEnv: 'SERP_SCREENSHOT_BUCKET',
    screenshotFormat: 'webp',
    screenshotQuality: 80,
    viewportWidth: 1920,
    viewportHeight: 1080,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    maxConcurrentSnapshots: 3,
    timeoutMs: 30000,
    retryAttempts: 2,
  },

  keywordTracking: {
    enabled: true,
    maxKeywordsPerProject: 500,
    defaultLocations: ['United States', 'United Kingdom', 'Australia'],
    defaultDevices: ['desktop', 'mobile'],
    intentClassification: true,
    competitorTracking: true,
  },

  volatility: {
    enabled: true,
    checkIntervalHours: 6,
    thresholds: {
      positionChangeWarning: 5, // 5+ position change
      positionChangeCritical: 10, // 10+ position change
      trafficDropWarning: 15, // 15% traffic drop
      trafficDropCritical: 30, // 30% traffic drop
      impressionDropWarning: 20, // 20% impression drop
      impressionDropCritical: 40, // 40% impression drop
      newCompetitorAlert: true,
      lostKeywordAlert: true,
    },
    alertChannels: ['email', 'inApp'],
  },

  supportedSearchEngines: ['google', 'bing'],
  dataRetentionDays: 365,
};

export function isGSCEnabled(): boolean {
  return searchSuiteConfig.enabled && searchSuiteConfig.gsc.enabled;
}

export function isBingEnabled(): boolean {
  return searchSuiteConfig.enabled && searchSuiteConfig.bing.enabled;
}

export function isSERPSnapshotEnabled(): boolean {
  return searchSuiteConfig.enabled && searchSuiteConfig.serpSnapshot.enabled;
}

export function isVolatilityEnabled(): boolean {
  return searchSuiteConfig.enabled && searchSuiteConfig.volatility.enabled;
}

export function getMaxKeywordsPerProject(): number {
  return searchSuiteConfig.keywordTracking.maxKeywordsPerProject;
}

export function getSERPSnapshotCadence(): number {
  return searchSuiteConfig.serpSnapshot.cadenceHours;
}

export function getVolatilityThresholds() {
  return searchSuiteConfig.volatility.thresholds;
}
