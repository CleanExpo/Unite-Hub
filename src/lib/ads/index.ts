/**
 * Ads Automation Library
 *
 * Clean exports for ads automation functionality.
 */

// Types
export * from './adsProviderTypes';

// Platform Clients
export {
  createAdsClient,
  BaseAdsClient,
  GoogleAdsClient,
  MetaAdsClient,
  TikTokAdsClient,
  type AdsClientConfig,
  type FetchCampaignsOptions,
  type FetchCampaignsResult,
  type FetchMetricsOptions,
} from './adsClients';

// Services
export {
  adsIngestionService,
  type ConnectAccountOptions,
  type SyncCampaignsOptions,
  type SyncCampaignsResult,
  type FetchMetricsOptions as SyncMetricsOptions,
  type PerformanceStats,
} from './adsIngestionService';

export {
  adsOptimizationService,
  type AnalyzeOptions,
  type OpportunityResult,
  type ApplyResult,
} from './adsOptimizationService';
