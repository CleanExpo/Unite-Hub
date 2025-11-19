/**
 * SEO Audit Type Definitions
 * Phase 5: Intelligence Layer
 */

export type AuditTier = "free" | "starter" | "pro" | "enterprise";
export type AuditStatus = "pending" | "running" | "completed" | "failed";

export interface AuditConfig {
  seoProfileId: string;
  organizationId: string;
  domain: string;
  tier: AuditTier;
  keywords?: string[];
  competitorDomains?: string[];
  location?: string;
  addons?: AuditAddon[];
}

export interface AuditAddon {
  type: "competitor_tracking" | "local_pack_tracker" | "social_intelligence" | "content_velocity";
  enabled: boolean;
}

export interface AuditResult {
  id: string;
  seoProfileId: string;
  tier: AuditTier;
  timestamp: string;
  duration: number; // milliseconds
  healthScore: number; // 0-100
  gsc: GSCData | null;
  bing: BingData | null;
  brave: BraveData | null;
  dataforSEO: DataForSEOData | null;
  recommendations: string[];
  status: AuditStatus;
  error?: string;
}

export interface GSCData {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  topQueries: GSCQuery[];
}

export interface GSCQuery {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
}

export interface BingData {
  indexedPages: number;
  crawlErrors: number;
  lastIndexedDate: string;
}

export interface BraveData {
  channelStatus: "active" | "pending" | "inactive";
  totalContributions: number;
  activeSubscribers: number;
}

export interface DataForSEOData {
  serpKeywords?: SerpKeyword[];
  onPageScore?: OnPageScore;
  competitorAnalysis?: CompetitorData[];
  keywordGap?: KeywordGapItem[];
  backlinks?: BacklinkSummary;
  localGeoPack?: LocalGeoItem[];
  socialSignals?: SocialSignals;
}

export interface SerpKeyword {
  keyword: string;
  position: number | null;
  url: string | null;
  title: string | null;
  description: string | null;
}

export interface OnPageScore {
  score: number;
  crawledPages: number;
  pagesWithErrors: number;
  totalErrors: number;
  brokenLinks: number;
  duplicateTitles: number;
  duplicateDescriptions: number;
}

export interface CompetitorData {
  domain: string;
  avgPosition: number;
  sumPosition: number;
  intersections: number;
  fullDomainMetrics: any;
}

export interface KeywordGapItem {
  keyword: string;
  searchVolume: number;
  competition: string;
  target1Position: number;
  target2Position: number;
  gap: number;
}

export interface BacklinkSummary {
  totalBacklinks: number;
  referringDomains: number;
  referringMainDomains: number;
  referringIPs: number;
  rank: number;
}

export interface LocalGeoItem {
  title: string;
  address: string;
  rating: number;
  reviews: number;
  category: string;
  phone: string;
  website: string;
}

export interface SocialSignals {
  facebook: {
    shares: number;
    comments: number;
    reactions: number;
  };
  twitter: {
    tweets: number;
    retweets: number;
  };
  pinterest: {
    pins: number;
  };
  reddit: {
    posts: number;
    upvotes: number;
  };
}

export interface AuditSchedule {
  id: string;
  seoProfileId: string;
  tier: AuditTier;
  frequency: "daily" | "twice_weekly" | "weekly" | "every_7_days";
  nextRunAt: string;
  enabled: boolean;
}

export interface AuditSnapshot {
  id: string;
  seoProfileId: string;
  auditId: string;
  timestamp: string;
  healthScore: number;
  summary: string; // Plain-English business report
  trafficPrediction: number; // Predicted monthly traffic
  weeklyImprovementPlan: string[];
}
