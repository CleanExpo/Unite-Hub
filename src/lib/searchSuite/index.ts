/**
 * Search Suite Library
 *
 * Clean exports for search suite functionality.
 */

// Types
export * from './searchProviderTypes';

// GSC Client
export {
  createGscClient,
  GscClient,
  type GscClientConfig,
  type SearchAnalyticsOptions,
  type UrlInspectionResult,
  type SitemapInfo,
} from './gscClient';

// Bing Client
export {
  createBingClient,
  BingClient,
  type BingClientConfig,
  type BingTrafficOptions,
  type BingCrawlStats,
  type BingIndexStats,
  type BingBacklinkData,
} from './bingClient';

// Services
export {
  serpSnapshotService,
  type CaptureOptions,
  type SerpAnalysis,
} from './serpSnapshotService';

export {
  keywordTrackingService,
  type AddKeywordsOptions,
  type KeywordFilters,
  type RankingTrend,
  type KeywordStats,
} from './keywordTrackingService';

export {
  volatilityService,
  type VolatilityCheckOptions,
  type AlertFilters,
  type VolatilitySummary,
} from './volatilityService';
