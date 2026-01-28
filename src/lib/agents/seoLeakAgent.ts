/**
 * SEO Leak Engine Agent
 * AI-powered SEO analysis based on Google/DOJ/Yandex leak signals
 *
 * Capabilities:
 * 1. Signal Profile Generation: Estimate Q* (quality), P* (popularity), T* (trust) scores
 * 2. NavBoost Analysis: Analyze user engagement signals (CTR, dwell time, pogo-sticking)
 * 3. E-E-A-T Assessment: Score Experience, Expertise, Authoritativeness, Trustworthiness
 * 4. Gap Analysis: Identify keyword, content, and backlink gaps vs competitors
 * 5. Audit Orchestration: Coordinate full SEO audits
 *
 * All recommendations are ADVISORY ONLY - human governance enforced.
 *
 * @module seoLeakAgent
 * @version 1.0.0
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import {
  computeLeakProfile,
  getProfile,
  analyzeProfile,
  calculateOverallScore,
  type LeakSignalProfile,
  type LeakSignalInput,
  type ProfileInsight,
} from '@/lib/seoLeak/seoLeakEngineService';
import {
  createAuditJob,
  runAudit,
  getAuditResults,
  listAudits,
  type SEOAuditJob,
  type SEOAuditResult,
  type AuditRecommendation,
} from '@/lib/seoLeak/seoAuditOrchestratorService';
import {
  analyzeKeywordGaps,
  analyzeContentGaps,
  analyzeBacklinkGaps,
  runFullGapAnalysis,
  type KeywordGap,
  type ContentGap,
  type BacklinkGap,
  type FullGapAnalysisResult,
} from '@/lib/seoLeak/gapAnalysisService';
import {
  generateSchema,
  validateSchema,
  type SchemaType,
  type PageInfo,
  type GeneratedSchema,
} from '@/lib/seoLeak/schemaEngineService';
import {
  analyzeCTRBenchmarks,
  computeNavBoostPotential,
  type CTRBenchmark,
  type NavBoostPotential,
  type NavBoostInference,
} from '@/lib/seoLeak/behaviouralSearchService';
import { SEO_LEAK_ENGINE_CONFIG, getSeoFactorWeights } from '@/config/seoLeakEngine.config';

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Leak-aligned signal estimate for a URL
 */
export interface LeakSignalEstimate {
  /** Q* (Quality) score 0-100 */
  qStar: number;
  /** P* (Popularity) score 0-100 */
  pStar: number;
  /** T* (Trust) score 0-100 */
  tStar: number;
  /** NavBoost user engagement estimates */
  navBoostEstimate: {
    ctrScore: number;
    dwellTimeScore: number;
    pogoStickingPenalty: number;
  };
  /** E-E-A-T assessment scores */
  eeatScore: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
  };
  /** Overall leak-aligned score 0-100 */
  overallScore: number;
  /** Risk factors identified */
  risks: string[];
  /** Opportunities identified */
  opportunities: string[];
}

/**
 * Full SEO audit result
 */
export interface AuditResult {
  job: SEOAuditJob;
  results: SEOAuditResult;
  leakProfile: LeakSignalProfile | null;
  insights: ProfileInsight[];
  recommendations: AuditRecommendation[];
  overallHealthScore: number;
}

/**
 * Gap analysis result combining all gap types
 */
export interface GapAnalysis {
  keywordGaps: KeywordGap[];
  contentGaps: ContentGap[];
  backlinkGaps: BacklinkGap[];
  summary: {
    totalKeywordOpportunities: number;
    totalContentGaps: number;
    totalBacklinkOpportunities: number;
    topPriorityActions: string[];
  };
  aiAnalysis: {
    strategicPriorities: string[];
    quickWins: string[];
    longTermPlays: string[];
  };
}

/**
 * Optimization plan with AI-generated recommendations
 */
export interface OptimizationPlan {
  url: string;
  currentScore: number;
  targetScore: number;
  timelineWeeks: number;
  priorities: OptimizationPriority[];
  technicalFixes: TechnicalFix[];
  contentRecommendations: ContentRecommendation[];
  linkBuildingStrategy: LinkBuildingAction[];
  estimatedImpact: {
    rankingImprovement: string;
    trafficIncrease: string;
    conversionPotential: string;
  };
}

export interface OptimizationPriority {
  rank: number;
  category: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  leakFactor: string;
  description: string;
}

export interface TechnicalFix {
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fix: string;
  leakSignalImpact: string;
}

export interface ContentRecommendation {
  type: 'create' | 'update' | 'optimize' | 'remove';
  target: string;
  recommendation: string;
  keywords: string[];
  estimatedWords?: number;
}

export interface LinkBuildingAction {
  strategy: string;
  targetDomains: string[];
  outreachType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDA: number;
}

/**
 * Ranking factor estimate for a keyword/URL pair
 */
export interface RankingEstimate {
  keyword: string;
  url: string;
  currentPosition: number | null;
  estimatedPosition: number;
  confidence: number;
  rankingFactors: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
    insight: string;
  }[];
  competitorAnalysis: {
    domain: string;
    position: number;
    strengths: string[];
    weaknesses: string[];
  }[];
  improvementOpportunities: string[];
}

// =============================================================================
// Claude API Configuration
// =============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

// Static system prompt for SEO analysis (cacheable)
const SEO_ANALYSIS_SYSTEM_PROMPT = `You are an expert SEO analyst specializing in Google Search ranking factors, with deep knowledge of the Google/DOJ/Yandex algorithm leaks.

Your expertise covers:
- Q* (Quality), P* (Popularity), T* (Trust) signals from Yandex leaks
- NavBoost user engagement signals (CTR, dwell time, pogo-sticking)
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Site Authority and PageRank-derived signals
- Sandbox risk for new domains
- Spam detection patterns

Key principles from the leaks:
1. NavBoost is a major ranking factor - user engagement signals from Chrome data
2. Click satisfaction (not just CTR) matters - Google measures if users found what they needed
3. Site-level authority affects page rankings significantly
4. Topical authority matters - sites focused on topics rank better for those topics
5. E-E-A-T is evaluated at page, author, and site levels

You analyze content, URLs, and competitive data to provide actionable SEO recommendations.
All recommendations are ADVISORY - never suggest auto-deploying changes.

Return structured JSON responses when asked.`;

// =============================================================================
// SEO Leak Agent Class
// =============================================================================

/**
 * SEO Leak Engine Agent
 * Orchestrates SEO analysis using leak-aligned signals and AI
 */
export class SeoLeakAgent {
  private founderId: string;

  constructor(founderId: string) {
    this.founderId = founderId;
  }

  // ===========================================================================
  // URL Analysis
  // ===========================================================================

  /**
   * Analyze a URL for leak-aligned signal estimates
   *
   * @param url - URL to analyze
   * @returns Leak signal estimates with AI analysis
   */
  async analyzeUrl(url: string): Promise<LeakSignalEstimate> {
    try {
      // Extract domain from URL
      const domain = new URL(url).hostname;

      // Check for existing profile
      let profile = await getProfile(this.founderId, domain);

      // If no profile or needs refresh, compute new one
      if (!profile) {
        // Gather input signals (in production, these would come from DataForSEO/GSC)
        const input: LeakSignalInput = await this.gatherSignalInputs(url);

        const result = await computeLeakProfile(this.founderId, domain, input);
        if (!result.success || !result.profile) {
          throw new Error(result.error || 'Failed to compute leak profile');
        }
        profile = result.profile;
      }

      // Analyze profile for insights
      const insights = analyzeProfile(profile);
      const overallScore = calculateOverallScore(profile);

      // Use Claude for deeper content analysis
      const aiAnalysis = await this.analyzeContentWithClaude(url, profile);

      // Build leak signal estimate
      const estimate: LeakSignalEstimate = {
        qStar: profile.q_star_estimate,
        pStar: profile.p_star_estimate,
        tStar: profile.t_star_estimate,
        navBoostEstimate: {
          ctrScore: profile.navboost_strength_estimate,
          dwellTimeScore: Math.round(profile.navboost_strength_estimate * 0.9), // Approximation
          pogoStickingPenalty: Math.round(100 - profile.navboost_strength_estimate),
        },
        eeatScore: {
          experience: Math.round(profile.eeat_strength_estimate * 0.85),
          expertise: profile.eeat_strength_estimate,
          authoritativeness: Math.round(profile.site_authority_estimate * 0.95),
          trustworthiness: profile.t_star_estimate,
        },
        overallScore,
        risks: aiAnalysis.risks,
        opportunities: aiAnalysis.opportunities,
      };

      return estimate;
    } catch (error) {
      console.error('[SEO Leak Agent] analyzeUrl error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Full Audit
  // ===========================================================================

  /**
   * Run a comprehensive SEO audit on a domain
   *
   * @param domain - Domain to audit
   * @returns Full audit result with recommendations
   */
  async runFullAudit(domain: string): Promise<AuditResult> {
    try {
      // Create audit job
      const jobResult = await createAuditJob({
        businessId: this.founderId,
        targetType: 'domain',
        targetIdentifier: domain.startsWith('http') ? domain : `https://${domain}`,
        auditType: 'full',
      });

      if (!jobResult.success || !jobResult.job) {
        throw new Error(jobResult.error || 'Failed to create audit job');
      }

      // Run the audit
      const auditResult = await runAudit(jobResult.job.id);

      if (!auditResult.success || !auditResult.results) {
        throw new Error(auditResult.error || 'Audit failed');
      }

      // Get leak profile
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      let leakProfile = await getProfile(this.founderId, cleanDomain);

      if (!leakProfile) {
        // Compute profile from audit data
        const input = this.auditResultsToSignalInput(auditResult.results);
        const profileResult = await computeLeakProfile(this.founderId, cleanDomain, input);
        leakProfile = profileResult.profile || null;
      }

      // Generate insights
      const insights = leakProfile ? analyzeProfile(leakProfile) : [];
      const overallHealthScore = leakProfile
        ? calculateOverallScore(leakProfile)
        : auditResult.results.overall_score || 0;

      // Enhance recommendations with AI
      const enhancedRecommendations = await this.enhanceRecommendationsWithAI(
        auditResult.results.recommendations,
        leakProfile
      );

      return {
        job: auditResult.job!,
        results: auditResult.results,
        leakProfile,
        insights,
        recommendations: enhancedRecommendations,
        overallHealthScore,
      };
    } catch (error) {
      console.error('[SEO Leak Agent] runFullAudit error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Gap Analysis
  // ===========================================================================

  /**
   * Identify SEO gaps vs competitors
   *
   * @param domain - Your domain
   * @param competitors - Array of competitor domains
   * @returns Gap analysis with AI-generated strategy
   */
  async identifyGaps(domain: string, competitors: string[]): Promise<GapAnalysis> {
    try {
      // Run full gap analysis
      const gapResult = await runFullGapAnalysis(this.founderId, domain, competitors);

      if (!gapResult.success || !gapResult.results) {
        throw new Error(gapResult.error || 'Gap analysis failed');
      }

      const { keywords, content, backlinks, summary } = gapResult.results;

      // Get AI analysis for strategic prioritization
      const aiAnalysis = await this.generateGapStrategy(
        keywords?.gaps || [],
        content?.gaps || [],
        backlinks?.gaps || []
      );

      return {
        keywordGaps: keywords?.gaps || [],
        contentGaps: content?.gaps || [],
        backlinkGaps: backlinks?.gaps || [],
        summary: {
          totalKeywordOpportunities: summary.totalKeywordOpportunities,
          totalContentGaps: summary.totalContentGaps,
          totalBacklinkOpportunities: summary.totalBacklinkOpportunities,
          topPriorityActions: summary.topPriorityActions,
        },
        aiAnalysis,
      };
    } catch (error) {
      console.error('[SEO Leak Agent] identifyGaps error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Optimization Plan
  // ===========================================================================

  /**
   * Generate a comprehensive optimization plan for a URL
   *
   * @param url - URL to optimize
   * @returns Detailed optimization plan
   */
  async generateOptimizationPlan(url: string): Promise<OptimizationPlan> {
    try {
      // Get current state
      const currentEstimate = await this.analyzeUrl(url);
      const domain = new URL(url).hostname;

      // Get audit data
      const recentAudits = await listAudits(this.founderId, {
        targetType: 'domain',
        status: 'completed',
        limit: 1,
      });

      let auditResults: SEOAuditResult | null = null;
      if (recentAudits.length > 0) {
        auditResults = await getAuditResults(recentAudits[0].id);
      }

      // Get NavBoost potential
      const navBoostResult = await computeNavBoostPotential(this.founderId, url, {
        avgCTR: currentEstimate.navBoostEstimate.ctrScore / 10,
        avgPosition: 10, // Default assumption
        avgDwellTime: currentEstimate.navBoostEstimate.dwellTimeScore,
        bounceRate: 100 - currentEstimate.navBoostEstimate.dwellTimeScore,
      });

      // Generate plan with Claude
      const plan = await this.generatePlanWithClaude(
        url,
        currentEstimate,
        auditResults,
        navBoostResult.potential || null
      );

      return plan;
    } catch (error) {
      console.error('[SEO Leak Agent] generateOptimizationPlan error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Ranking Estimate
  // ===========================================================================

  /**
   * Estimate ranking factors for a keyword/URL combination
   *
   * @param keyword - Target keyword
   * @param url - URL to analyze
   * @returns Ranking factor breakdown and estimate
   */
  async estimateRankingFactors(keyword: string, url: string): Promise<RankingEstimate> {
    try {
      // Get leak signal estimate for the URL
      const estimate = await this.analyzeUrl(url);
      const domain = new URL(url).hostname;

      // Get factor weights from config
      const weights = getSeoFactorWeights();

      // Calculate individual factor contributions
      const rankingFactors = [
        {
          factor: 'Query Intent Match (Q*)',
          score: estimate.qStar,
          weight: weights.q_star,
          contribution: Math.round((estimate.qStar * weights.q_star) / 100),
          insight: estimate.qStar >= 70
            ? 'Strong query intent alignment'
            : 'Consider improving content relevance to search intent',
        },
        {
          factor: 'Page Quality (P*)',
          score: estimate.pStar,
          weight: weights.p_star,
          contribution: Math.round((estimate.pStar * weights.p_star) / 100),
          insight: estimate.pStar >= 70
            ? 'Good traffic and engagement signals'
            : 'Traffic growth needed to improve popularity signals',
        },
        {
          factor: 'Trust (T*)',
          score: estimate.tStar,
          weight: weights.t_star,
          contribution: Math.round((estimate.tStar * weights.t_star) / 100),
          insight: estimate.tStar >= 70
            ? 'Domain has established trust'
            : 'Build quality backlinks to improve trust signals',
        },
        {
          factor: 'NavBoost',
          score: estimate.navBoostEstimate.ctrScore,
          weight: weights.navboost,
          contribution: Math.round((estimate.navBoostEstimate.ctrScore * weights.navboost) / 100),
          insight: estimate.navBoostEstimate.ctrScore >= 70
            ? 'Strong user engagement signals'
            : 'Improve CTR and reduce pogo-sticking to boost NavBoost',
        },
        {
          factor: 'E-E-A-T',
          score: estimate.eeatScore.expertise,
          weight: weights.eeat,
          contribution: Math.round((estimate.eeatScore.expertise * weights.eeat) / 100),
          insight: estimate.eeatScore.expertise >= 70
            ? 'Good expertise and authority signals'
            : 'Add author credentials, citations, and social proof',
        },
      ];

      // Calculate total contribution and estimated position
      const totalContribution = rankingFactors.reduce((sum, f) => sum + f.contribution, 0);

      // Estimate position based on total contribution (simplified model)
      // Higher score = better position (lower number)
      let estimatedPosition: number;
      if (totalContribution >= 80) estimatedPosition = 1;
      else if (totalContribution >= 70) estimatedPosition = 3;
      else if (totalContribution >= 60) estimatedPosition = 5;
      else if (totalContribution >= 50) estimatedPosition = 8;
      else if (totalContribution >= 40) estimatedPosition = 12;
      else if (totalContribution >= 30) estimatedPosition = 20;
      else estimatedPosition = 30;

      // Generate improvement opportunities with AI
      const improvements = await this.generateRankingImprovements(keyword, url, estimate, rankingFactors);

      return {
        keyword,
        url,
        currentPosition: null, // Would come from GSC/DataForSEO in production
        estimatedPosition,
        confidence: Math.min(85, 50 + totalContribution / 2),
        rankingFactors,
        competitorAnalysis: [], // Would be populated from competitor data
        improvementOpportunities: improvements,
      };
    } catch (error) {
      console.error('[SEO Leak Agent] estimateRankingFactors error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // NavBoost Analysis
  // ===========================================================================

  /**
   * Analyze NavBoost potential for a URL
   *
   * @param url - URL to analyze
   * @param keyword - Optional target keyword
   * @param position - Optional current SERP position
   * @param actualCTR - Optional actual CTR
   * @returns NavBoost analysis with recommendations
   */
  async analyzeNavBoost(
    url: string,
    keyword?: string,
    position?: number,
    actualCTR?: number
  ): Promise<{
    benchmark: CTRBenchmark | null;
    potential: NavBoostPotential | null;
    recommendations: string[];
  }> {
    try {
      let benchmark: CTRBenchmark | null = null;
      let potential: NavBoostPotential | null = null;
      const recommendations: string[] = [];

      // If we have keyword and position data, analyze CTR benchmarks
      if (keyword && position && actualCTR !== undefined) {
        const benchmarkResult = await analyzeCTRBenchmarks(
          this.founderId,
          keyword,
          position,
          actualCTR,
          url
        );

        if (benchmarkResult.success && benchmarkResult.benchmark) {
          benchmark = benchmarkResult.benchmark;

          // Add benchmark recommendations
          const inference = benchmark.navboost_inference as NavBoostInference;
          if (inference.recommendations) {
            recommendations.push(...inference.recommendations);
          }
        }
      }

      // Compute NavBoost potential
      const potentialResult = await computeNavBoostPotential(this.founderId, url, {
        avgCTR: actualCTR,
        avgPosition: position,
      });

      if (potentialResult.success && potentialResult.potential) {
        potential = potentialResult.potential;

        // Add potential recommendations
        potential.recommendations.forEach((rec) => {
          if (!recommendations.includes(rec.description)) {
            recommendations.push(rec.description);
          }
        });
      }

      return { benchmark, potential, recommendations };
    } catch (error) {
      console.error('[SEO Leak Agent] analyzeNavBoost error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // E-E-A-T Assessment
  // ===========================================================================

  /**
   * Assess E-E-A-T signals for content at a URL
   *
   * @param url - URL to assess
   * @param content - Optional page content for analysis
   * @returns E-E-A-T assessment with recommendations
   */
  async assessEEAT(
    url: string,
    content?: string
  ): Promise<{
    scores: {
      experience: number;
      expertise: number;
      authoritativeness: number;
      trustworthiness: number;
      overall: number;
    };
    signals: {
      positive: string[];
      negative: string[];
    };
    recommendations: string[];
  }> {
    try {
      // Get base estimate
      const estimate = await this.analyzeUrl(url);

      // Use Claude for detailed E-E-A-T analysis
      const eeatAnalysis = await this.analyzeEEATWithClaude(url, content || '', estimate);

      return eeatAnalysis;
    } catch (error) {
      console.error('[SEO Leak Agent] assessEEAT error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Schema Generation
  // ===========================================================================

  /**
   * Generate optimized schema markup for a page
   *
   * @param url - URL to generate schema for
   * @param schemaType - Type of schema to generate
   * @param pageInfo - Page information for schema
   * @returns Generated schema with validation
   */
  async generateOptimizedSchema(
    url: string,
    schemaType: SchemaType,
    pageInfo: PageInfo
  ): Promise<GeneratedSchema | null> {
    try {
      const result = await generateSchema(this.founderId, url, schemaType, pageInfo);

      if (!result.success || !result.schema) {
        console.error('[SEO Leak Agent] Schema generation failed:', result.error);
        return null;
      }

      return result.schema;
    } catch (error) {
      console.error('[SEO Leak Agent] generateOptimizedSchema error:', error);
      throw error;
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Gather signal inputs for a URL (placeholder for real data integration)
   */
  private async gatherSignalInputs(url: string): Promise<LeakSignalInput> {
    // In production, this would pull from DataForSEO, GSC, etc.
    // For now, return estimated defaults
    return {
      contentDepth: 60,
      contentFreshness: 50,
      contentUniqueness: 70,
      monthlyTraffic: 1000,
      trafficGrowth: 5,
      bounceRate: 45,
      avgSessionDuration: 120,
      domainAgeYears: 2,
      backlinksCount: 500,
      referringDomainsCount: 100,
      highQualityBacklinksRatio: 0.3,
      ctrAverage: 3.5,
      dwellTimeAverage: 90,
      pogoStickingRate: 20,
      returnVisitRate: 25,
      authorExpertiseSignals: 50,
      citationsCount: 5,
      socialProofCount: 100,
      professionalCredentials: false,
      topicConsistencyScore: 60,
      topicalDepthScore: 55,
      semanticCoverageScore: 50,
    };
  }

  /**
   * Convert audit results to signal input
   */
  private auditResultsToSignalInput(results: SEOAuditResult): LeakSignalInput {
    const cwv = results.core_web_vitals;
    const mobile = results.mobile_metrics;
    const security = results.security_metrics;
    const crawl = results.crawlability;

    // Calculate content scores from audit
    let contentDepth = 50;
    if (crawl.indexablePages && crawl.indexablePages > 100) contentDepth = 70;
    if (crawl.indexablePages && crawl.indexablePages > 500) contentDepth = 85;

    // Security impacts trust
    let trustBoost = 0;
    if (security.hasHttps) trustBoost += 20;
    if (security.hstsEnabled) trustBoost += 10;
    if (security.cspEnabled) trustBoost += 10;

    return {
      contentDepth,
      contentFreshness: 60, // Would need content date analysis
      contentUniqueness: 70, // Would need duplicate content check
      domainAgeYears: 2, // Would need WHOIS lookup
      backlinksCount: 500, // Would need backlink API
      referringDomainsCount: 100,
      highQualityBacklinksRatio: 0.3 + trustBoost / 100,
      ctrAverage: results.leak_aligned_scores.navboostPotential
        ? results.leak_aligned_scores.navboostPotential / 10
        : 3,
      dwellTimeAverage: cwv.lcp && cwv.lcp < 2500 ? 120 : 60,
      pogoStickingRate: cwv.cls && cwv.cls > 0.1 ? 40 : 20,
      topicConsistencyScore: 60,
      topicalDepthScore: contentDepth,
    };
  }

  /**
   * Analyze content with Claude AI
   */
  private async analyzeContentWithClaude(
    url: string,
    profile: LeakSignalProfile
  ): Promise<{ risks: string[]; opportunities: string[] }> {
    try {
      const prompt = `Analyze this SEO profile for ${url} and identify key risks and opportunities:

SEO Profile:
- Q* (Quality): ${profile.q_star_estimate}/100
- P* (Popularity): ${profile.p_star_estimate}/100
- T* (Trust): ${profile.t_star_estimate}/100
- Site Authority: ${profile.site_authority_estimate}/100
- NavBoost Strength: ${profile.navboost_strength_estimate}/100
- Sandbox Risk: ${profile.sandbox_risk_estimate}/100
- Spam Risk: ${profile.spam_risk_estimate}/100
- E-E-A-T Strength: ${profile.eeat_strength_estimate}/100
- Topical Focus: ${profile.topical_focus_score}/100

Return JSON with this exact format:
{
  "risks": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"]
}

Focus on actionable insights based on the leak signals.`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] Claude analysis error:', error);
      return {
        risks: ['Unable to perform AI analysis'],
        opportunities: ['Retry analysis or check manually'],
      };
    }
  }

  /**
   * Enhance recommendations with AI insights
   */
  private async enhanceRecommendationsWithAI(
    recommendations: AuditRecommendation[],
    profile: LeakSignalProfile | null
  ): Promise<AuditRecommendation[]> {
    if (!profile || recommendations.length === 0) {
      return recommendations;
    }

    try {
      const prompt = `Given these SEO audit recommendations and the leak signal profile, enhance each recommendation with leak-aligned insights:

Recommendations:
${recommendations.map((r, i) => `${i + 1}. [${r.priority}] ${r.title}: ${r.description}`).join('\n')}

Leak Profile:
- Q*: ${profile.q_star_estimate}, P*: ${profile.p_star_estimate}, T*: ${profile.t_star_estimate}
- NavBoost: ${profile.navboost_strength_estimate}, E-E-A-T: ${profile.eeat_strength_estimate}
- Sandbox Risk: ${profile.sandbox_risk_estimate}, Spam Risk: ${profile.spam_risk_estimate}

Return JSON array with enhanced recommendations:
[
  {
    "priority": "critical|high|medium|low",
    "category": "category",
    "title": "title",
    "description": "enhanced description with leak insights",
    "impact": "expected impact",
    "effort": "low|medium|high",
    "leakFactor": "primary leak factor affected"
  }
]`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/(\[[\s\S]*\])/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] Enhance recommendations error:', error);
      return recommendations;
    }
  }

  /**
   * Generate gap analysis strategy with AI
   */
  private async generateGapStrategy(
    keywordGaps: KeywordGap[],
    contentGaps: ContentGap[],
    backlinkGaps: BacklinkGap[]
  ): Promise<{ strategicPriorities: string[]; quickWins: string[]; longTermPlays: string[] }> {
    try {
      const prompt = `Analyze these SEO gaps and provide strategic recommendations:

Keyword Gaps (top 5):
${keywordGaps.slice(0, 5).map(g => `- "${g.keyword}" (Volume: ${g.search_volume}, Type: ${g.gap_type})`).join('\n')}

Content Gaps (top 5):
${contentGaps.slice(0, 5).map(g => `- "${g.topic}" (Priority: ${g.priority}, Demand: ${g.search_demand})`).join('\n')}

Backlink Gaps (top 5):
${backlinkGaps.slice(0, 5).map(g => `- ${g.referring_domain} (DA: ${g.domain_authority}, Difficulty: ${g.acquisition_difficulty})`).join('\n')}

Return JSON:
{
  "strategicPriorities": ["priority 1", "priority 2", "priority 3"],
  "quickWins": ["quick win 1", "quick win 2", "quick win 3"],
  "longTermPlays": ["long term 1", "long term 2", "long term 3"]
}`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] Gap strategy error:', error);
      return {
        strategicPriorities: ['Focus on high-volume keyword gaps'],
        quickWins: ['Target low-difficulty backlink opportunities'],
        longTermPlays: ['Build topical authority through content clusters'],
      };
    }
  }

  /**
   * Generate optimization plan with Claude
   */
  private async generatePlanWithClaude(
    url: string,
    estimate: LeakSignalEstimate,
    auditResults: SEOAuditResult | null,
    navBoostPotential: NavBoostPotential | null
  ): Promise<OptimizationPlan> {
    try {
      const prompt = `Generate a comprehensive SEO optimization plan for ${url}:

Current State:
- Overall Score: ${estimate.overallScore}/100
- Q* (Quality): ${estimate.qStar}/100
- P* (Popularity): ${estimate.pStar}/100
- T* (Trust): ${estimate.tStar}/100
- NavBoost CTR Score: ${estimate.navBoostEstimate.ctrScore}/100
- E-E-A-T Expertise: ${estimate.eeatScore.expertise}/100

Risks Identified: ${estimate.risks.join(', ')}
Opportunities: ${estimate.opportunities.join(', ')}

${auditResults ? `Audit Score: ${auditResults.overall_score}/100` : ''}
${navBoostPotential ? `NavBoost Optimization Potential: ${navBoostPotential.overall_score}/100` : ''}

Return a detailed JSON plan:
{
  "url": "${url}",
  "currentScore": ${estimate.overallScore},
  "targetScore": <target 0-100>,
  "timelineWeeks": <number>,
  "priorities": [
    {
      "rank": 1,
      "category": "category",
      "action": "action",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "leakFactor": "Q*|P*|T*|NavBoost|E-E-A-T",
      "description": "detailed description"
    }
  ],
  "technicalFixes": [
    {
      "issue": "issue",
      "severity": "critical|high|medium|low",
      "fix": "fix description",
      "leakSignalImpact": "impact description"
    }
  ],
  "contentRecommendations": [
    {
      "type": "create|update|optimize|remove",
      "target": "target page or topic",
      "recommendation": "recommendation",
      "keywords": ["keyword1", "keyword2"],
      "estimatedWords": <number>
    }
  ],
  "linkBuildingStrategy": [
    {
      "strategy": "strategy name",
      "targetDomains": ["domain1", "domain2"],
      "outreachType": "type",
      "difficulty": "easy|medium|hard",
      "expectedDA": <number>
    }
  ],
  "estimatedImpact": {
    "rankingImprovement": "description",
    "trafficIncrease": "percentage or description",
    "conversionPotential": "description"
  }
}`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] Plan generation error:', error);
      // Return minimal default plan
      return {
        url,
        currentScore: estimate.overallScore,
        targetScore: Math.min(100, estimate.overallScore + 20),
        timelineWeeks: 12,
        priorities: [
          {
            rank: 1,
            category: 'Content',
            action: 'Improve content quality',
            impact: 'high',
            effort: 'medium',
            leakFactor: 'Q*',
            description: 'Enhance content depth and relevance',
          },
        ],
        technicalFixes: [],
        contentRecommendations: [],
        linkBuildingStrategy: [],
        estimatedImpact: {
          rankingImprovement: 'Gradual improvement expected',
          trafficIncrease: '10-20% over 3 months',
          conversionPotential: 'Moderate',
        },
      };
    }
  }

  /**
   * Generate ranking improvement recommendations
   */
  private async generateRankingImprovements(
    keyword: string,
    url: string,
    estimate: LeakSignalEstimate,
    factors: { factor: string; score: number; contribution: number }[]
  ): Promise<string[]> {
    try {
      // Find weakest factors
      const sortedFactors = [...factors].sort((a, b) => a.score - b.score);
      const weakest = sortedFactors.slice(0, 3);

      const prompt = `For the keyword "${keyword}" targeting ${url}, suggest 5 specific improvements based on these weak ranking factors:

${weakest.map(f => `- ${f.factor}: ${f.score}/100 (contributing ${f.contribution} points)`).join('\n')}

Overall leak-aligned score: ${estimate.overallScore}/100

Return JSON array of 5 specific, actionable improvements:
["improvement 1", "improvement 2", "improvement 3", "improvement 4", "improvement 5"]`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 512,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/(\[[\s\S]*\])/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] Ranking improvements error:', error);
      return [
        'Improve content depth and relevance for target keyword',
        'Build quality backlinks from relevant domains',
        'Optimize title and meta description for CTR',
        'Improve page load speed and Core Web Vitals',
        'Add expert author credentials and citations',
      ];
    }
  }

  /**
   * Analyze E-E-A-T with Claude
   */
  private async analyzeEEATWithClaude(
    url: string,
    content: string,
    estimate: LeakSignalEstimate
  ): Promise<{
    scores: {
      experience: number;
      expertise: number;
      authoritativeness: number;
      trustworthiness: number;
      overall: number;
    };
    signals: {
      positive: string[];
      negative: string[];
    };
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze E-E-A-T signals for ${url}:

Current E-E-A-T Estimates:
- Experience: ${estimate.eeatScore.experience}/100
- Expertise: ${estimate.eeatScore.expertise}/100
- Authoritativeness: ${estimate.eeatScore.authoritativeness}/100
- Trustworthiness: ${estimate.eeatScore.trustworthiness}/100

${content ? `Content Preview:\n${content.substring(0, 500)}...` : 'No content provided'}

Return detailed E-E-A-T analysis as JSON:
{
  "scores": {
    "experience": <0-100>,
    "expertise": <0-100>,
    "authoritativeness": <0-100>,
    "trustworthiness": <0-100>,
    "overall": <0-100>
  },
  "signals": {
    "positive": ["signal 1", "signal 2"],
    "negative": ["signal 1", "signal 2"]
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const result = await callAnthropicWithRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: SEO_ANALYSIS_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: prompt }],
        });
      });

      const message = result.data;

      // Log cache performance
      const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
      logCacheStats('SEOLeak:analyzeContent', cacheStats);

      let jsonText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          jsonText = block.text;
          break;
        }
      }

      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/) || jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[SEO Leak Agent] E-E-A-T analysis error:', error);
      const overallEeat = Math.round(
        (estimate.eeatScore.experience +
          estimate.eeatScore.expertise +
          estimate.eeatScore.authoritativeness +
          estimate.eeatScore.trustworthiness) /
          4
      );
      return {
        scores: {
          ...estimate.eeatScore,
          overall: overallEeat,
        },
        signals: {
          positive: ['Domain has some authority signals'],
          negative: ['E-E-A-T signals could be stronger'],
        },
        recommendations: [
          'Add author bio with credentials',
          'Include citations and references',
          'Display trust signals (testimonials, certifications)',
        ],
      };
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new SEO Leak Agent instance
 *
 * @param founderId - Founder/business ID
 * @returns SeoLeakAgent instance
 */
export function createSeoLeakAgent(founderId: string): SeoLeakAgent {
  if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
    throw new Error('SEO Leak Engine is disabled. Enable via SEO_LEAK_ENGINE_ENABLED=true');
  }
  return new SeoLeakAgent(founderId);
}

// =============================================================================
// Export Default
// =============================================================================

export default SeoLeakAgent;
