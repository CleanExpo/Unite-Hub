/**
 * SEO Enhancement Suite
 * Unified exports for legitimate SEO improvement tools
 *
 * Components:
 * - Technical SEO Audit (Core Web Vitals, crawl analysis)
 * - Content Optimization (keyword analysis, readability)
 * - Rich Results (schema markup, structured data)
 * - CTR Optimization (title/meta testing, benchmarking)
 * - Competitor Gap Analysis (keywords, content, backlinks)
 */

// Services
export { seoAuditService } from './seoAuditService';
export { contentOptimizationService } from './contentOptimizationService';
export { richResultsService } from './richResultsService';
export { ctrOptimizationService } from './ctrOptimizationService';
export { competitorGapService } from './competitorGapService';

// Types - SEO Audit
export type {
  SEOAuditJob,
  SEOAuditResult,
  CoreWebVitals,
  SEOIssue,
  CreateAuditParams,
} from './seoAuditService';

// Types - Content Optimization
export type {
  ContentAnalysisJob,
  ContentOptimizationResult,
  HeadingStructure,
  ContentRecommendation,
  CreateContentAnalysisParams,
} from './contentOptimizationService';

// Types - Rich Results
export type {
  SchemaTemplate,
  GeneratedSchema,
  RichResultMonitoring,
  ValidationIssue,
  CompetitorRichResult,
  SchemaType,
} from './richResultsService';

// Types - CTR Optimization
export type {
  TitleMetaTest,
  CTRBenchmark,
  CTRRecommendation,
  CreateTestParams,
} from './ctrOptimizationService';

// Types - Competitor Gap
export type {
  CompetitorProfile,
  KeywordGapAnalysis,
  ContentGapAnalysis,
  BacklinkGapAnalysis,
  KeywordGap,
  KeywordOpportunity,
  TopicGap,
  LinkGapDomain,
  LinkOpportunity,
} from './competitorGapService';

// Convenience combined service
export const seoEnhancementSuite = {
  // Technical Audit
  createAudit: async (params: import('./seoAuditService').CreateAuditParams) => {
    const { seoAuditService } = await import('./seoAuditService');
    return seoAuditService.createAuditJob(params);
  },
  getAuditResults: async (jobId: string) => {
    const { seoAuditService } = await import('./seoAuditService');
    return seoAuditService.getAuditResults(jobId);
  },

  // Content Optimization
  analyzeContent: async (params: import('./contentOptimizationService').CreateContentAnalysisParams) => {
    const { contentOptimizationService } = await import('./contentOptimizationService');
    return contentOptimizationService.createContentAnalysis(params);
  },

  // Rich Results
  generateSchema: async (
    workspaceId: string,
    url: string,
    type: import('./richResultsService').SchemaType,
    pageInfo?: { title?: string; description?: string; content?: string }
  ) => {
    const { richResultsService } = await import('./richResultsService');
    return richResultsService.generateSchema(workspaceId, url, type, pageInfo);
  },

  // CTR Optimization
  analyzeCTR: async (
    workspaceId: string,
    url: string,
    keyword: string,
    currentData: {
      title: string;
      meta: string;
      position: number;
      impressions: number;
      clicks: number;
    }
  ) => {
    const { ctrOptimizationService } = await import('./ctrOptimizationService');
    return ctrOptimizationService.analyzeCTRBenchmark(workspaceId, url, keyword, currentData);
  },

  // Competitor Analysis
  analyzeCompetitors: async (workspaceId: string, clientDomain: string) => {
    const { competitorGapService } = await import('./competitorGapService');
    const [keywordGap, contentGap, backlinkGap] = await Promise.all([
      competitorGapService.analyzeKeywordGap(workspaceId, clientDomain),
      competitorGapService.analyzeContentGap(workspaceId, clientDomain),
      competitorGapService.analyzeBacklinkGap(workspaceId, clientDomain),
    ]);
    return { keywordGap, contentGap, backlinkGap };
  },
};

export default seoEnhancementSuite;
