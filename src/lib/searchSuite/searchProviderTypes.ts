/**
 * Search Suite Provider Types
 *
 * Types for search engines, keywords, SERP data, and volatility tracking.
 */

export type SearchEngine = 'google' | 'bing' | 'brave';

export type KeywordStatus = 'active' | 'paused' | 'archived';

export type SerpFeature =
  | 'featured_snippet'
  | 'people_also_ask'
  | 'knowledge_panel'
  | 'local_pack'
  | 'image_pack'
  | 'video_carousel'
  | 'shopping_results'
  | 'news_box'
  | 'related_searches'
  | 'ads_top'
  | 'ads_bottom'
  | 'site_links';

export type VolatilityLevel = 'stable' | 'low' | 'moderate' | 'high' | 'extreme';

export type AlertType =
  | 'rank_drop'
  | 'rank_gain'
  | 'new_competitor'
  | 'lost_feature'
  | 'gained_feature'
  | 'high_volatility'
  | 'index_issue'
  | 'crawl_error';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SearchProject {
  id: string;
  workspaceId: string;
  name: string;
  domain: string;
  primaryEngine: SearchEngine;
  targetCountries: string[];
  targetLanguages: string[];
  competitors: string[];
  gscPropertyUrl?: string;
  bingWebmasterSiteUrl?: string;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchKeyword {
  id: string;
  projectId: string;
  workspaceId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  status: KeywordStatus;
  tags?: string[];
  targetUrl?: string;
  priority?: number;
  currentRank?: number;
  previousRank?: number;
  bestRank?: number;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerpSnapshot {
  id: string;
  keywordId: string;
  projectId: string;
  workspaceId: string;
  engine: SearchEngine;
  snapshotDate: Date;
  location?: string;
  device: 'desktop' | 'mobile';
  language?: string;
  totalResults?: number;
  organicResults: SerpResult[];
  features: SerpFeature[];
  screenshotUrl?: string;
  htmlSnapshotUrl?: string;
  rawData?: Record<string, unknown>;
  createdAt: Date;
}

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description?: string;
  isOurSite: boolean;
  features?: SerpFeature[];
}

export interface SearchCompetitor {
  id: string;
  projectId: string;
  workspaceId: string;
  domain: string;
  name?: string;
  overlapScore?: number;
  visibilityScore?: number;
  commonKeywords: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VolatilityAlert {
  id: string;
  projectId: string;
  keywordId?: string;
  workspaceId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  alertDate: Date;
  previousValue?: string;
  currentValue?: string;
  changePercent?: number;
  affectedUrls?: string[];
  recommendations?: string[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface SearchAuditReport {
  id: string;
  projectId: string;
  workspaceId: string;
  reportType: 'technical_seo' | 'content_audit' | 'backlink_audit' | 'competitor_analysis' | 'full_audit';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  overallScore?: number;
  issuesCritical: number;
  issuesWarning: number;
  issuesInfo: number;
  findings?: AuditFinding[];
  recommendations?: string[];
  rawData?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditFinding {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedUrls?: string[];
  recommendation?: string;
}

// GSC (Google Search Console) types
export interface GscSnapshot {
  id: string;
  projectId: string;
  workspaceId: string;
  snapshotDate: Date;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: GscQueryData[];
  topPages: GscPageData[];
  deviceBreakdown?: Record<string, { clicks: number; impressions: number }>;
  countryBreakdown?: Record<string, { clicks: number; impressions: number }>;
  rawData?: Record<string, unknown>;
  createdAt: Date;
}

export interface GscQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Bing Webmaster types
export interface BingSnapshot {
  id: string;
  projectId: string;
  workspaceId: string;
  snapshotDate: Date;
  clicks: number;
  impressions: number;
  crawledPages: number;
  indexedPages: number;
  crawlErrors: number;
  topQueries: BingQueryData[];
  seoIssues?: BingSeoIssue[];
  rawData?: Record<string, unknown>;
  createdAt: Date;
}

export interface BingQueryData {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface BingSeoIssue {
  severity: 'high' | 'medium' | 'low';
  issueType: string;
  description: string;
  affectedPages: number;
}

// API Response types
export interface GscApiResponse {
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType?: string;
}

export interface BingApiResponse {
  d?: {
    results?: Array<{
      Query?: string;
      Clicks?: number;
      Impressions?: number;
      AvgPosition?: number;
    }>;
    __count?: string;
  };
}

// Normalized types for cross-engine comparisons
export interface NormalizedRankData {
  keyword: string;
  engine: SearchEngine;
  position: number;
  url?: string;
  previousPosition?: number;
  change: number;
  features: SerpFeature[];
  checkedAt: Date;
}

export interface NormalizedSearchMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  engine: SearchEngine;
  date: Date;
}

export interface VolatilityMetrics {
  engine: SearchEngine;
  keyword: string;
  period: '24h' | '7d' | '30d';
  avgPositionChange: number;
  maxPositionChange: number;
  volatilityScore: number;
  volatilityLevel: VolatilityLevel;
  dataPoints: number;
}
