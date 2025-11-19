/**
 * Report Type Definitions - Phase 7 Week 20
 *
 * TypeScript types for report generation system.
 */

export interface AuditResult {
  auditId: string;
  clientId: string;
  auditType: "full" | "snapshot" | "onboarding" | "geo";
  startedAt: string;
  completedAt: string;
  status: "success" | "partial" | "failed";
  errors?: string[];
}

export interface ReportGenerationConfig {
  clientId: string;
  clientSlug: string;
  auditId: string;
  auditType: "full" | "snapshot" | "onboarding" | "geo";
  formats: Array<"html" | "csv" | "json" | "md" | "pdf">;
  includeImages?: boolean;
  jinaApiKey?: string;
}

export interface ReportOutput {
  auditId: string;
  clientId: string;
  timestamp: string;
  healthScore: number;
  formats: {
    html?: { filePath: string; size: number; error?: string };
    csv?: { files: string[]; totalSize: number; error?: string };
    json?: { filePath: string; size: number; error?: string };
    md?: { filePath: string; size: number; error?: string };
    pdf?: { filePath: string; size: number; error?: string };
  };
}

export interface SEOHealthScore {
  total: number;
  breakdown: {
    gscPerformance: number;
    keywordRankings: number;
    bingIndexing: number;
    geoCoverage: number;
    competitorGap: number;
  };
}

export interface GEOCoverageData {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  targetSuburbs: string[];
  gapSuburbs: string[];
  coveragePercentage: number;
}

export interface CompetitorAnalysis {
  domain: string;
  keywordsOverlap: number;
  rankAverage: number;
  opportunityScore: number;
}

export interface KeywordRankings {
  keyword: string;
  position: number;
  searchVolume: number;
  competition: number;
  url?: string;
}

export interface ActionRecommendation {
  priority: "high" | "medium" | "low";
  category: "seo" | "geo" | "keywords" | "ctr" | "technical";
  title: string;
  description: string;
  actions: string[];
  estimatedImpact: string;
}

export interface DataSources {
  gsc?: {
    queries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
    pages: Array<{
      page: string;
      clicks: number;
      impressions: number;
    }>;
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  bing?: {
    indexedPages: number;
    crawlErrors: number;
    sitemapStatus: string;
  };
  brave?: {
    rankings: Array<{
      keyword: string;
      position: number;
      url: string;
    }>;
    visibility: number;
  };
  dataForSEO?: {
    rankedKeywords: Array<{
      keyword: string;
      position: number;
      search_volume: number;
      competition: number;
    }>;
    competitors: Array<{
      domain: string;
      keywords_overlap: number;
      rank_average: number;
    }>;
    questions: Array<{
      question: string;
      search_volume: number;
    }>;
    relatedKeywords: Array<{
      keyword: string;
      search_volume: number;
    }>;
  };
  geo?: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    targetSuburbs: string[];
    gapSuburbs: string[];
    coveragePercentage: number;
  };
}
