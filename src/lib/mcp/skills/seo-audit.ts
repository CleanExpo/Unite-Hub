/**
 * SEO Audit Skill
 *
 * Reusable SEO audit workflow that combines DataForSEO and Sherlock Think
 * for comprehensive website analysis.
 *
 * @example
 * import { fullSEOAudit, quickSEOCheck } from '@/lib/mcp/skills/seo-audit';
 *
 * const audit = await fullSEOAudit('example.com', ['competitor1.com', 'competitor2.com']);
 * console.log(audit.recommendations);
 */

import * as seo from '../servers/dataforseo';

export interface SEOAuditResult {
  domain: string;
  score: number;
  rankings: {
    totalKeywords: number;
    top3: number;
    top10: number;
    top100: number;
  };
  backlinks: {
    total: number;
    dofollow: number;
    avgRank: number;
  };
  competitors: Array<{
    domain: string;
    overlap: number;
    trafficGap: number;
  }>;
  keywordGaps: string[];
  recommendations: string[];
}

/**
 * Full SEO audit - comprehensive analysis
 *
 * Combines multiple SEO data sources and filters in code
 * to reduce context token usage.
 */
export async function fullSEOAudit(
  domain: string,
  competitorDomains: string[] = [],
  locationCode = 2840
): Promise<SEOAuditResult> {
  // Fetch data in parallel
  const [rankings, backlinks, competitors] = await Promise.all([
    seo.domainRankings({ domain, location_code: locationCode }),
    seo.getBacklinks({ target: domain, limit: 200 }),
    seo.getCompetitors({ domain, location_code: locationCode }),
  ]);

  // Process rankings
  const rankingsArray = rankings as Array<{ rank: number }>;
  const rankingStats = {
    totalKeywords: rankingsArray.length,
    top3: rankingsArray.filter((r) => r.rank <= 3).length,
    top10: rankingsArray.filter((r) => r.rank <= 10).length,
    top100: rankingsArray.filter((r) => r.rank <= 100).length,
  };

  // Process backlinks
  const backlinksArray = backlinks as Array<{
    dofollow: boolean;
    rank: number;
  }>;
  const dofollowLinks = backlinksArray.filter((b) => b.dofollow);
  const backlinkStats = {
    total: backlinksArray.length,
    dofollow: dofollowLinks.length,
    avgRank:
      dofollowLinks.reduce((sum, b) => sum + b.rank, 0) / dofollowLinks.length ||
      0,
  };

  // Process competitors
  const competitorsArray = (
    competitors as Array<{
      domain: string;
      keywords_count: number;
      etv: number;
    }>
  ).slice(0, 5);

  // Calculate keyword gaps for specified competitors
  const gaps: string[] = [];
  for (const comp of competitorDomains.slice(0, 3)) {
    const compGaps = await seo.keywordGap(domain, comp, locationCode);
    gaps.push(...compGaps.slice(0, 20)); // Top 20 per competitor
  }
  const uniqueGaps = [...new Set(gaps)];

  // Generate recommendations based on data
  const recommendations: string[] = [];

  if (rankingStats.top10 < rankingStats.totalKeywords * 0.1) {
    recommendations.push(
      'Less than 10% of keywords in top 10 - focus on content optimization'
    );
  }

  if (backlinkStats.dofollow < backlinkStats.total * 0.5) {
    recommendations.push(
      'Low dofollow ratio - prioritize quality link building'
    );
  }

  if (backlinkStats.avgRank < 30) {
    recommendations.push(
      'Low average backlink domain rank - target higher authority sites'
    );
  }

  if (uniqueGaps.length > 50) {
    recommendations.push(
      `${uniqueGaps.length} keyword gaps found - create content targeting competitor keywords`
    );
  }

  // Calculate score (simplified)
  const score = Math.min(
    100,
    Math.round(
      (rankingStats.top10 / Math.max(rankingStats.totalKeywords, 1)) * 40 +
        (backlinkStats.dofollow / Math.max(backlinkStats.total, 1)) * 30 +
        Math.min(backlinkStats.avgRank, 50) * 0.6
    )
  );

  return {
    domain,
    score,
    rankings: rankingStats,
    backlinks: backlinkStats,
    competitors: competitorsArray.map((c) => ({
      domain: c.domain,
      overlap: c.keywords_count,
      trafficGap: c.etv,
    })),
    keywordGaps: uniqueGaps.slice(0, 50),
    recommendations,
  };
}

/**
 * Quick SEO check - basic health metrics
 *
 * Fast check that returns only critical metrics.
 */
export async function quickSEOCheck(
  domain: string,
  locationCode = 2840
): Promise<{
  score: number;
  topKeywords: number;
  issues: string[];
}> {
  const rankings = (await seo.domainRankings({
    domain,
    location_code: locationCode,
  })) as Array<{ rank: number; keyword: string }>;

  const top10 = rankings.filter((r) => r.rank <= 10).length;
  const total = rankings.length;

  const issues: string[] = [];

  if (total < 10) {
    issues.push('Very few ranking keywords - site may be new or penalized');
  }

  if (top10 === 0) {
    issues.push('No keywords in top 10 - urgent optimization needed');
  }

  const score = Math.round((top10 / Math.max(total, 1)) * 100);

  return {
    score,
    topKeywords: top10,
    issues,
  };
}

/**
 * Keyword opportunity finder
 *
 * Finds high-potential keywords based on search volume and competition.
 */
export async function findKeywordOpportunities(
  seedKeywords: string[],
  locationCode = 2840,
  minVolume = 100,
  maxCompetition = 0.4
): Promise<
  Array<{
    keyword: string;
    volume: number;
    competition: number;
    opportunity: number;
  }>
> {
  const suggestions = await seo.keywordSuggestions({
    keywords: seedKeywords,
    location_code: locationCode,
  });

  // Filter and score opportunities in code
  const opportunities = suggestions
    .filter(
      (kw) =>
        kw.search_volume >= minVolume && kw.competition <= maxCompetition
    )
    .map((kw) => ({
      keyword: kw.keyword,
      volume: kw.search_volume,
      competition: kw.competition,
      opportunity: Math.round(
        (kw.search_volume * (1 - kw.competition)) / 10
      ),
    }))
    .sort((a, b) => b.opportunity - a.opportunity);

  return opportunities.slice(0, 30);
}
