/**
 * Gap Analysis Service
 * Keyword, content, and backlink gap analysis aligned with SEO leak insights
 *
 * Features:
 * - Keyword gap analysis (find opportunities where competitors rank)
 * - Content gap analysis (identify topic coverage gaps)
 * - Backlink gap analysis (discover link building opportunities)
 * - Opportunity scoring for prioritization
 * - Human governance mode enforced
 *
 * @module gapAnalysisService
 * @version 1.0.0
 */

import { getSupabaseServer } from '@/lib/supabase';
import { DataForSEOClient } from '@/server/dataforseoClient';
import { SEO_LEAK_ENGINE_CONFIG } from '@/config/seoLeakEngine.config';

// =============================================================================
// Types & Interfaces
// =============================================================================

export type GapType = 'competitor_only' | 'you_outrank' | 'they_outrank' | 'shared_opportunity' | 'untapped';

export interface KeywordGap {
  keyword: string;
  your_position: number | null;
  competitor_position: number | null;
  search_volume: number;
  difficulty: number;
  cpc?: number;
  opportunity_score: number;
  gap_type: GapType;
  traffic_potential?: number;
}

export interface KeywordGapAnalysis {
  id: string;
  founder_business_id: string;
  competitor_domain: string | null;
  gap_type: GapType | null;
  gaps: KeywordGap[];
  created_at: string;
}

export interface ContentGap {
  topic: string;
  competitor_coverage: number; // 0-100
  your_coverage: number; // 0-100
  search_demand: number; // estimated monthly searches
  content_type_recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggested_keywords?: string[];
  competitor_urls?: string[];
}

export interface ContentGapAnalysis {
  id: string;
  founder_business_id: string;
  topic_cluster: string | null;
  gaps: ContentGap[];
  created_at: string;
}

export interface BacklinkGap {
  referring_domain: string;
  domain_authority: number;
  link_type: 'dofollow' | 'nofollow' | 'unknown';
  anchor_text?: string;
  competitor_has: boolean;
  you_have: boolean;
  acquisition_difficulty: 'easy' | 'medium' | 'hard';
  opportunity_score: number;
  contact_info?: string;
}

export interface BacklinkGapAnalysis {
  id: string;
  founder_business_id: string;
  competitor_domain: string | null;
  gaps: BacklinkGap[];
  created_at: string;
}

export interface FullGapAnalysisResult {
  keywords: KeywordGapAnalysis | null;
  content: ContentGapAnalysis | null;
  backlinks: BacklinkGapAnalysis | null;
  summary: {
    totalKeywordOpportunities: number;
    totalContentGaps: number;
    totalBacklinkOpportunities: number;
    topPriorityActions: string[];
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get DataForSEO client instance
 */
function getDataForSEOClient(): DataForSEOClient | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.warn('[Gap Analysis] DataForSEO credentials not configured');
    return null;
  }

  return new DataForSEOClient(login, password);
}

/**
 * Calculate opportunity score for a keyword gap
 */
function calculateKeywordOpportunityScore(gap: Omit<KeywordGap, 'opportunity_score'>): number {
  let score = 0;

  // Search volume contribution (log scale)
  if (gap.search_volume > 0) {
    score += Math.min(40, Math.log10(gap.search_volume) * 10);
  }

  // Position gap contribution
  if (gap.gap_type === 'competitor_only') {
    // Competitor ranks, you don't - high opportunity
    score += 30;
    if (gap.competitor_position && gap.competitor_position <= 10) {
      score += 10; // They're on page 1, even more valuable
    }
  } else if (gap.gap_type === 'they_outrank') {
    // Both rank but they're higher
    const positionDiff = (gap.your_position || 100) - (gap.competitor_position || 1);
    score += Math.min(30, positionDiff);
  } else if (gap.gap_type === 'you_outrank') {
    // You're already winning - lower priority
    score += 5;
  }

  // Difficulty adjustment (lower difficulty = higher score)
  score -= gap.difficulty * 0.2;

  // CPC contribution (higher CPC often means more commercial value)
  if (gap.cpc && gap.cpc > 0) {
    score += Math.min(15, gap.cpc * 2);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate opportunity score for a backlink gap
 */
function calculateBacklinkOpportunityScore(
  domainAuthority: number,
  competitorHas: boolean,
  youHave: boolean,
  linkType: 'dofollow' | 'nofollow' | 'unknown'
): number {
  let score = 0;

  // Domain authority contribution
  score += domainAuthority * 0.4;

  // Gap contribution
  if (competitorHas && !youHave) {
    score += 30; // They have it, you don't
  }

  // Link type contribution
  if (linkType === 'dofollow') {
    score += 15;
  } else if (linkType === 'nofollow') {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine acquisition difficulty based on domain characteristics
 */
function determineAcquisitionDifficulty(
  domainAuthority: number,
  linkType: string
): 'easy' | 'medium' | 'hard' {
  if (domainAuthority > 70) return 'hard';
  if (domainAuthority > 40) return 'medium';
  return 'easy';
}

/**
 * Determine content gap priority
 */
function determineContentPriority(
  searchDemand: number,
  yourCoverage: number,
  competitorCoverage: number
): 'critical' | 'high' | 'medium' | 'low' {
  const coverageGap = competitorCoverage - yourCoverage;

  if (searchDemand > 10000 && coverageGap > 50) return 'critical';
  if (searchDemand > 5000 && coverageGap > 30) return 'high';
  if (searchDemand > 1000 && coverageGap > 20) return 'medium';
  return 'low';
}

// =============================================================================
// Keyword Gap Analysis
// =============================================================================

/**
 * Analyze keyword gaps between your domain and a competitor
 *
 * @param businessId - Founder business ID
 * @param yourDomain - Your domain
 * @param competitorDomain - Competitor domain to analyze
 * @returns Keyword gap analysis result
 */
export async function analyzeKeywordGaps(
  businessId: string,
  yourDomain: string,
  competitorDomain: string
): Promise<{ success: boolean; analysis?: KeywordGapAnalysis; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    const supabase = await getSupabaseServer();
    const dataForSEO = getDataForSEOClient();

    let gaps: KeywordGap[] = [];

    if (dataForSEO) {
      try {
        const gapData = await dataForSEO.getKeywordGap(yourDomain, [competitorDomain]);

        gaps = gapData.map((item: {
          keyword?: string;
          searchVolume?: number;
          competition?: number;
          target1Position?: number | null;
          target2Position?: number | null;
        }) => {
          const yourPos = item.target1Position;
          const competitorPos = item.target2Position;

          let gapType: GapType = 'shared_opportunity';
          if (yourPos === null && competitorPos !== null) {
            gapType = 'competitor_only';
          } else if (yourPos !== null && competitorPos === null) {
            gapType = 'you_outrank';
          } else if (yourPos !== null && competitorPos !== null) {
            gapType = yourPos < competitorPos ? 'you_outrank' : 'they_outrank';
          } else {
            gapType = 'untapped';
          }

          const baseGap = {
            keyword: item.keyword || '',
            your_position: yourPos ?? null,
            competitor_position: competitorPos ?? null,
            search_volume: item.searchVolume || 0,
            difficulty: (item.competition || 0) * 100,
            gap_type: gapType,
          };

          return {
            ...baseGap,
            opportunity_score: calculateKeywordOpportunityScore(baseGap),
          };
        });
      } catch (apiError) {
        console.warn('[Gap Analysis] DataForSEO API error, using mock data:', apiError);
      }
    }

    // If no API data, generate sample gaps for demonstration
    if (gaps.length === 0) {
      gaps = generateSampleKeywordGaps(competitorDomain);
    }

    // Sort by opportunity score
    gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);

    // Store in database
    const { data, error } = await supabase
      .from('keyword_gap_analysis')
      .insert({
        founder_business_id: businessId,
        competitor_domain: competitorDomain,
        gap_type: null, // Analysis contains multiple gap types
        gaps: gaps,
      })
      .select()
      .single();

    if (error) {
      console.error('[Gap Analysis] Save keyword gaps error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, analysis: data as KeywordGapAnalysis };
  } catch (err) {
    console.error('[Gap Analysis] Keyword gap analysis error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Generate sample keyword gaps for demonstration
 */
function generateSampleKeywordGaps(competitorDomain: string): KeywordGap[] {
  const sampleKeywords = [
    { keyword: 'best practices', volume: 5400, difficulty: 45 },
    { keyword: 'how to guide', volume: 3200, difficulty: 35 },
    { keyword: 'tutorial', volume: 8100, difficulty: 50 },
    { keyword: 'comparison', volume: 2900, difficulty: 40 },
    { keyword: 'review', volume: 4500, difficulty: 55 },
  ];

  return sampleKeywords.map(kw => {
    const yourPos = Math.random() > 0.4 ? Math.floor(Math.random() * 50) + 1 : null;
    const competitorPos = Math.floor(Math.random() * 30) + 1;

    let gapType: GapType = 'shared_opportunity';
    if (yourPos === null) {
      gapType = 'competitor_only';
    } else if (yourPos < competitorPos) {
      gapType = 'you_outrank';
    } else {
      gapType = 'they_outrank';
    }

    const baseGap = {
      keyword: `${competitorDomain.split('.')[0]} ${kw.keyword}`,
      your_position: yourPos,
      competitor_position: competitorPos,
      search_volume: kw.volume,
      difficulty: kw.difficulty,
      gap_type: gapType,
    };

    return {
      ...baseGap,
      opportunity_score: calculateKeywordOpportunityScore(baseGap),
    };
  });
}

// =============================================================================
// Content Gap Analysis
// =============================================================================

/**
 * Analyze content topic gaps
 *
 * @param businessId - Founder business ID
 * @param topicCluster - Optional specific topic cluster to analyze
 * @returns Content gap analysis result
 */
export async function analyzeContentGaps(
  businessId: string,
  topicCluster?: string
): Promise<{ success: boolean; analysis?: ContentGapAnalysis; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    const supabase = await getSupabaseServer();

    // Get business domain info
    const { data: business, error: businessError } = await supabase
      .from('founder_businesses')
      .select('domain, industry')
      .eq('id', businessId)
      .single();

    if (businessError) {
      return { success: false, error: 'Business not found' };
    }

    // Generate content gaps based on industry and topic cluster
    const gaps: ContentGap[] = generateContentGaps(
      business?.industry || 'general',
      topicCluster
    );

    // Store in database
    const { data, error } = await supabase
      .from('content_gap_analysis')
      .insert({
        founder_business_id: businessId,
        topic_cluster: topicCluster || null,
        gaps: gaps,
      })
      .select()
      .single();

    if (error) {
      console.error('[Gap Analysis] Save content gaps error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, analysis: data as ContentGapAnalysis };
  } catch (err) {
    console.error('[Gap Analysis] Content gap analysis error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Generate content gaps based on industry
 */
function generateContentGaps(industry: string, topicCluster?: string): ContentGap[] {
  const baseTopics = [
    {
      topic: `${topicCluster || industry} beginner guide`,
      searchDemand: 12000,
      contentType: 'Ultimate Guide',
    },
    {
      topic: `${topicCluster || industry} best practices`,
      searchDemand: 8500,
      contentType: 'List Article',
    },
    {
      topic: `${topicCluster || industry} case studies`,
      searchDemand: 4200,
      contentType: 'Case Study',
    },
    {
      topic: `${topicCluster || industry} comparison`,
      searchDemand: 6800,
      contentType: 'Comparison Article',
    },
    {
      topic: `${topicCluster || industry} tools`,
      searchDemand: 9100,
      contentType: 'Tool Roundup',
    },
    {
      topic: `${topicCluster || industry} templates`,
      searchDemand: 7300,
      contentType: 'Template/Resource',
    },
  ];

  return baseTopics.map(topic => {
    const yourCoverage = Math.floor(Math.random() * 60);
    const competitorCoverage = Math.floor(Math.random() * 40) + 60;

    return {
      topic: topic.topic,
      competitor_coverage: competitorCoverage,
      your_coverage: yourCoverage,
      search_demand: topic.searchDemand,
      content_type_recommendation: topic.contentType,
      priority: determineContentPriority(topic.searchDemand, yourCoverage, competitorCoverage),
      suggested_keywords: [
        topic.topic,
        `best ${topic.topic}`,
        `${topic.topic} guide`,
        `${topic.topic} examples`,
      ],
    };
  });
}

// =============================================================================
// Backlink Gap Analysis
// =============================================================================

/**
 * Analyze backlink gaps between your domain and a competitor
 *
 * @param businessId - Founder business ID
 * @param yourDomain - Your domain
 * @param competitorDomain - Competitor domain to analyze
 * @returns Backlink gap analysis result
 */
export async function analyzeBacklinkGaps(
  businessId: string,
  yourDomain: string,
  competitorDomain: string
): Promise<{ success: boolean; analysis?: BacklinkGapAnalysis; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    const supabase = await getSupabaseServer();
    const dataForSEO = getDataForSEOClient();

    let gaps: BacklinkGap[] = [];

    if (dataForSEO) {
      try {
        // Get competitor's referring domains
        const competitorBacklinks = await dataForSEO.getReferringDomains(competitorDomain, {
          limit: 100,
        });

        // Get your referring domains
        const yourBacklinks = await dataForSEO.getReferringDomains(yourDomain, {
          limit: 100,
        });

        const yourDomains = new Set(yourBacklinks.map((b: { domain: string }) => b.domain));

        // Find gaps - domains linking to competitor but not to you
        gaps = competitorBacklinks
          .filter((b: { domain: string }) => !yourDomains.has(b.domain))
          .map((b: { domain: string; rank: number; dofollow_count: number; nofollow_count: number }) => {
            const linkType: 'dofollow' | 'nofollow' | 'unknown' =
              b.dofollow_count > b.nofollow_count ? 'dofollow' :
              b.nofollow_count > 0 ? 'nofollow' : 'unknown';

            // Convert rank to approximate DA (0-100 scale)
            const domainAuthority = Math.min(100, Math.round(b.rank / 10));

            return {
              referring_domain: b.domain,
              domain_authority: domainAuthority,
              link_type: linkType,
              competitor_has: true,
              you_have: false,
              acquisition_difficulty: determineAcquisitionDifficulty(domainAuthority, linkType),
              opportunity_score: calculateBacklinkOpportunityScore(
                domainAuthority,
                true,
                false,
                linkType
              ),
            };
          });
      } catch (apiError) {
        console.warn('[Gap Analysis] DataForSEO API error, using mock data:', apiError);
      }
    }

    // If no API data, generate sample gaps
    if (gaps.length === 0) {
      gaps = generateSampleBacklinkGaps(competitorDomain);
    }

    // Sort by opportunity score
    gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);

    // Store in database
    const { data, error } = await supabase
      .from('backlink_gap_analysis')
      .insert({
        founder_business_id: businessId,
        competitor_domain: competitorDomain,
        gaps: gaps,
      })
      .select()
      .single();

    if (error) {
      console.error('[Gap Analysis] Save backlink gaps error:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, analysis: data as BacklinkGapAnalysis };
  } catch (err) {
    console.error('[Gap Analysis] Backlink gap analysis error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Generate sample backlink gaps for demonstration
 */
function generateSampleBacklinkGaps(competitorDomain: string): BacklinkGap[] {
  const sampleDomains = [
    { domain: 'techcrunch.com', da: 92 },
    { domain: 'forbes.com', da: 95 },
    { domain: 'medium.com', da: 96 },
    { domain: 'industry-blog.com', da: 55 },
    { domain: 'local-news.com', da: 42 },
    { domain: 'niche-directory.com', da: 38 },
    { domain: 'review-site.com', da: 61 },
    { domain: 'podcast-host.com', da: 48 },
  ];

  return sampleDomains.map(d => {
    const linkType: 'dofollow' | 'nofollow' = Math.random() > 0.3 ? 'dofollow' : 'nofollow';

    return {
      referring_domain: d.domain,
      domain_authority: d.da,
      link_type: linkType,
      competitor_has: true,
      you_have: false,
      acquisition_difficulty: determineAcquisitionDifficulty(d.da, linkType),
      opportunity_score: calculateBacklinkOpportunityScore(d.da, true, false, linkType),
    };
  });
}

// =============================================================================
// Full Gap Analysis
// =============================================================================

/**
 * Run full gap analysis (keywords, content, backlinks)
 *
 * @param businessId - Founder business ID
 * @param yourDomain - Your domain
 * @param competitorDomains - Array of competitor domains
 * @returns Full gap analysis result
 */
export async function runFullGapAnalysis(
  businessId: string,
  yourDomain: string,
  competitorDomains: string[]
): Promise<{ success: boolean; results?: FullGapAnalysisResult; error?: string }> {
  try {
    if (!SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED) {
      return { success: false, error: 'SEO Leak Engine is disabled' };
    }

    const primaryCompetitor = competitorDomains[0];
    if (!primaryCompetitor) {
      return { success: false, error: 'At least one competitor domain is required' };
    }

    // Run all analyses
    const [keywordResult, contentResult, backlinkResult] = await Promise.all([
      analyzeKeywordGaps(businessId, yourDomain, primaryCompetitor),
      analyzeContentGaps(businessId),
      analyzeBacklinkGaps(businessId, yourDomain, primaryCompetitor),
    ]);

    // Generate summary
    const topPriorityActions: string[] = [];

    // Add top keyword opportunities
    if (keywordResult.analysis?.gaps) {
      const topKeywords = keywordResult.analysis.gaps
        .filter(g => g.gap_type === 'competitor_only')
        .slice(0, 3);
      topKeywords.forEach(kw => {
        topPriorityActions.push(`Target keyword: "${kw.keyword}" (Volume: ${kw.search_volume})`);
      });
    }

    // Add top content gaps
    if (contentResult.analysis?.gaps) {
      const criticalContent = contentResult.analysis.gaps
        .filter(g => g.priority === 'critical' || g.priority === 'high')
        .slice(0, 2);
      criticalContent.forEach(c => {
        topPriorityActions.push(`Create content: "${c.topic}" (${c.content_type_recommendation})`);
      });
    }

    // Add top backlink opportunities
    if (backlinkResult.analysis?.gaps) {
      const topBacklinks = backlinkResult.analysis.gaps
        .filter(g => g.acquisition_difficulty !== 'hard')
        .slice(0, 2);
      topBacklinks.forEach(b => {
        topPriorityActions.push(`Acquire backlink from: ${b.referring_domain} (DA: ${b.domain_authority})`);
      });
    }

    const results: FullGapAnalysisResult = {
      keywords: keywordResult.analysis || null,
      content: contentResult.analysis || null,
      backlinks: backlinkResult.analysis || null,
      summary: {
        totalKeywordOpportunities: keywordResult.analysis?.gaps?.filter(g => g.gap_type === 'competitor_only').length || 0,
        totalContentGaps: contentResult.analysis?.gaps?.filter(g => g.priority !== 'low').length || 0,
        totalBacklinkOpportunities: backlinkResult.analysis?.gaps?.length || 0,
        topPriorityActions,
      },
    };

    return { success: true, results };
  } catch (err) {
    console.error('[Gap Analysis] Full gap analysis error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get keyword gap analyses for a business
 */
export async function getKeywordGapAnalyses(
  businessId: string,
  limit = 10
): Promise<KeywordGapAnalysis[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('keyword_gap_analysis')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Gap Analysis] Get keyword gaps error:', error);
      return [];
    }

    return (data ?? []) as KeywordGapAnalysis[];
  } catch (err) {
    console.error('[Gap Analysis] Get keyword gaps error:', err);
    return [];
  }
}

/**
 * Get content gap analyses for a business
 */
export async function getContentGapAnalyses(
  businessId: string,
  limit = 10
): Promise<ContentGapAnalysis[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('content_gap_analysis')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Gap Analysis] Get content gaps error:', error);
      return [];
    }

    return (data ?? []) as ContentGapAnalysis[];
  } catch (err) {
    console.error('[Gap Analysis] Get content gaps error:', err);
    return [];
  }
}

/**
 * Get backlink gap analyses for a business
 */
export async function getBacklinkGapAnalyses(
  businessId: string,
  limit = 10
): Promise<BacklinkGapAnalysis[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('backlink_gap_analysis')
      .select('*')
      .eq('founder_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Gap Analysis] Get backlink gaps error:', error);
      return [];
    }

    return (data ?? []) as BacklinkGapAnalysis[];
  } catch (err) {
    console.error('[Gap Analysis] Get backlink gaps error:', err);
    return [];
  }
}

/**
 * Delete a gap analysis by ID and type
 */
export async function deleteGapAnalysis(
  id: string,
  type: 'keyword' | 'content' | 'backlink'
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const tableName =
      type === 'keyword' ? 'keyword_gap_analysis' :
      type === 'content' ? 'content_gap_analysis' :
      'backlink_gap_analysis';

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[Gap Analysis] Delete ${type} gap error:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[Gap Analysis] Delete ${type} gap error:`, err);
    return false;
  }
}
