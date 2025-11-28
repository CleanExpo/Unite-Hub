/**
 * Ads Provider Types
 *
 * Types for ad platforms, accounts, campaigns, and metrics.
 */

export type AdProvider = 'google' | 'meta' | 'tiktok';

export type CampaignStatus = 'active' | 'paused' | 'deleted' | 'archived' | 'draft' | 'pending';

export type CampaignObjective =
  | 'awareness'
  | 'reach'
  | 'traffic'
  | 'engagement'
  | 'app_installs'
  | 'video_views'
  | 'lead_generation'
  | 'messages'
  | 'conversions'
  | 'catalog_sales'
  | 'store_traffic'
  | 'brand_awareness';

export type OptimizationType =
  | 'budget_increase'
  | 'budget_decrease'
  | 'bid_adjustment'
  | 'targeting_expansion'
  | 'targeting_refinement'
  | 'placement_change'
  | 'creative_refresh'
  | 'schedule_optimization'
  | 'audience_overlap'
  | 'underperforming_ad'
  | 'high_performer_scale'
  | 'cost_efficiency'
  | 'conversion_opportunity'
  | 'quality_improvement'
  | 'trend_alert';

export type OpportunitySeverity = 'low' | 'medium' | 'high' | 'critical';

export type OpportunityStatus = 'open' | 'reviewing' | 'approved' | 'rejected' | 'applied' | 'expired';

export interface AdAccount {
  id: string;
  workspaceId: string;
  provider: AdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: 'active' | 'paused' | 'disabled' | 'error';
  accountType?: 'standard' | 'mcc' | 'manager' | 'business';
  parentAccountId?: string;
  lastSyncAt?: Date;
  permissions?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdCampaign {
  id: string;
  adAccountId: string;
  workspaceId: string;
  externalCampaignId: string;
  name: string;
  objective?: CampaignObjective;
  status: CampaignStatus;
  buyingType?: 'auction' | 'reserved' | 'fixed_price';
  dailyBudget?: number;
  lifetimeBudget?: number;
  budgetRemaining?: number;
  spendCap?: number;
  startDate?: Date;
  endDate?: Date;
  bidStrategy?: string;
  bidAmount?: number;
  targeting?: Record<string, unknown>;
  placements?: unknown[];
  optimizationGoal?: string;
  adSetsCount: number;
  adsCount: number;
  lastSyncAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSet {
  id: string;
  adCampaignId: string;
  workspaceId: string;
  externalAdsetId: string;
  name: string;
  status: CampaignStatus;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidAmount?: number;
  bidStrategy?: string;
  targeting?: Record<string, unknown>;
  placements?: unknown[];
  schedule?: Record<string, unknown>;
  optimizationGoal?: string;
  billingEvent?: string;
  adsCount: number;
  lastSyncAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdPerformanceSnapshot {
  id: string;
  adCampaignId: string;
  adSetId?: string;
  workspaceId: string;
  snapshotDate: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  // Reach & Impressions
  impressions: number;
  reach: number;
  frequency?: number;
  // Engagement
  clicks: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  // Conversions
  conversions: number;
  conversionRate?: number;
  costPerConversion?: number;
  conversionValue?: number;
  // Cost & Revenue
  cost: number;
  revenue: number;
  roas?: number;
  profit?: number;
  // Video Metrics
  videoViews?: number;
  videoViewsP25?: number;
  videoViewsP50?: number;
  videoViewsP75?: number;
  videoViewsP100?: number;
  videoAvgWatchTime?: number;
  // Social Metrics
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  // App Metrics
  appInstalls?: number;
  appOpens?: number;
  // Lead Metrics
  leads?: number;
  costPerLead?: number;
  // Quality Scores
  qualityScore?: number;
  relevanceScore?: number;
  // Raw data
  rawMetrics?: Record<string, unknown>;
  createdAt: Date;
}

export interface AdOptimizationOpportunity {
  id: string;
  adCampaignId: string;
  adSetId?: string;
  workspaceId: string;
  detectedAt: Date;
  type: OptimizationType;
  severity: OpportunitySeverity;
  title: string;
  description: string;
  recommendation?: string;
  estimatedImpactScore?: number;
  estimatedImpactValue?: number;
  confidenceScore?: number;
  supportingData?: Record<string, unknown>;
  comparisonPeriod?: string;
  baselineMetrics?: Record<string, unknown>;
  currentMetrics?: Record<string, unknown>;
  status: OpportunityStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  appliedAt?: Date;
  appliedBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSyncLog {
  id: string;
  adAccountId: string;
  workspaceId: string;
  syncType: 'full' | 'incremental' | 'manual' | 'scheduled';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  campaignsSynced: number;
  adSetsSynced: number;
  snapshotsCreated: number;
  opportunitiesDetected: number;
  errors?: Array<{ code: string; message: string; timestamp: Date }>;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface AdChangeHistory {
  id: string;
  workspaceId: string;
  entityType: 'account' | 'campaign' | 'ad_set' | 'ad';
  entityId: string;
  externalEntityId?: string;
  changeType: 'create' | 'update' | 'delete' | 'status_change' | 'budget_change' | 'bid_change' | 'targeting_change';
  fieldChanged?: string;
  oldValue?: unknown;
  newValue?: unknown;
  changeSource: 'user' | 'api' | 'automation' | 'platform';
  triggeredByOpportunityId?: string;
  performedBy?: string;
  performedAt: Date;
  notes?: string;
  createdAt: Date;
}

// Platform-specific API response types
export interface GoogleAdsCampaign {
  resourceName: string;
  id: string;
  name: string;
  status: string;
  advertisingChannelType: string;
  biddingStrategyType: string;
  campaignBudget: string;
  startDate: string;
  endDate?: string;
}

export interface GoogleAdsMetrics {
  impressions: string;
  clicks: string;
  costMicros: string;
  conversions: number;
  conversionValue: number;
  ctr: number;
  averageCpc: number;
  averageCpm: number;
}

export interface MetaAdsCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  buying_type: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdsInsights {
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  video_p25_watched_actions?: Array<{ action_type: string; value: string }>;
}

export interface TikTokAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  objective_type: string;
  budget: number;
  budget_mode: string;
}

export interface TikTokAdsMetrics {
  impression: number;
  click: number;
  cost: number;
  conversion: number;
  ctr: number;
  cpm: number;
  cpc: number;
}

// Normalized types for internal use
export interface NormalizedCampaign {
  externalId: string;
  provider: AdProvider;
  name: string;
  status: CampaignStatus;
  objective?: CampaignObjective;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startDate?: Date;
  endDate?: Date;
  rawData: unknown;
}

export interface NormalizedMetrics {
  impressions: number;
  reach?: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  rawData: unknown;
}
