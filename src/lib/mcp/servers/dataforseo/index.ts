/**
 * DataForSEO MCP Server - Code Execution API
 *
 * TypeScript wrapper for the DataForSEO MCP server.
 * Use this for SEO intelligence without loading all tool definitions.
 *
 * @example
 * import * as seo from '@/lib/mcp/servers/dataforseo';
 *
 * // Get SERP results
 * const results = await seo.serpGoogle({
 *   keyword: 'stainless steel balustrades Brisbane',
 *   location_code: 2036 // Australia
 * });
 *
 * // Analyze competitors
 * const competitors = await seo.getCompetitors({
 *   domain: 'example.com'
 * });
 */

import { callMCPTool } from '../../client';

const SERVER_NAME = 'dataforseo';

// ========================================================================
// Type Definitions
// ========================================================================

export interface SerpInput {
  keyword: string;
  location_code?: number;
  language_code?: string;
  device?: 'desktop' | 'mobile';
  os?: 'windows' | 'macos' | 'android' | 'ios';
}

export interface KeywordsInput {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

export interface DomainInput {
  domain: string;
  location_code?: number;
  language_code?: string;
}

export interface BacklinksInput {
  target: string;
  limit?: number;
  filters?: string[];
}

export interface SerpResult {
  keyword: string;
  check_url: string;
  datetime: string;
  items: Array<{
    type: string;
    rank_group: number;
    rank_absolute: number;
    position: string;
    title: string;
    url: string;
    domain: string;
    description: string;
  }>;
  items_count: number;
}

export interface KeywordData {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
  monthly_searches: Array<{
    month: string;
    search_volume: number;
  }>;
}

export interface BacklinkData {
  url_from: string;
  url_to: string;
  anchor: string;
  domain_from: string;
  dofollow: boolean;
  rank: number;
}

// ========================================================================
// SERP Functions
// ========================================================================

/**
 * Get Google SERP results for a keyword
 */
export async function serpGoogle(input: SerpInput): Promise<SerpResult> {
  return callMCPTool<SerpResult>(SERVER_NAME, 'serp_google_organic', input);
}

/**
 * Get Google Maps results
 */
export async function serpGoogleMaps(input: SerpInput): Promise<unknown> {
  return callMCPTool(SERVER_NAME, 'serp_google_maps', input);
}

/**
 * Get Bing SERP results
 */
export async function serpBing(input: SerpInput): Promise<SerpResult> {
  return callMCPTool<SerpResult>(SERVER_NAME, 'serp_bing_organic', input);
}

// ========================================================================
// Keyword Research Functions
// ========================================================================

/**
 * Get keyword search volume and competition data
 */
export async function keywordData(input: KeywordsInput): Promise<KeywordData[]> {
  return callMCPTool<KeywordData[]>(SERVER_NAME, 'keywords_data', input);
}

/**
 * Get keyword suggestions based on seed keywords
 */
export async function keywordSuggestions(
  input: KeywordsInput
): Promise<KeywordData[]> {
  return callMCPTool<KeywordData[]>(SERVER_NAME, 'keywords_suggestions', input);
}

/**
 * Get related keywords
 */
export async function relatedKeywords(
  input: KeywordsInput
): Promise<KeywordData[]> {
  return callMCPTool<KeywordData[]>(SERVER_NAME, 'keywords_related', input);
}

// ========================================================================
// Domain Analysis Functions
// ========================================================================

/**
 * Get competitors for a domain
 */
export async function getCompetitors(input: DomainInput): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'domain_competitors', input);
}

/**
 * Get domain rankings for keywords
 */
export async function domainRankings(input: DomainInput): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'domain_rankings', input);
}

/**
 * Get domain metrics
 */
export async function domainMetrics(input: DomainInput): Promise<unknown> {
  return callMCPTool(SERVER_NAME, 'domain_metrics', input);
}

// ========================================================================
// Backlink Functions
// ========================================================================

/**
 * Get backlinks for a target URL
 */
export async function getBacklinks(
  input: BacklinksInput
): Promise<BacklinkData[]> {
  return callMCPTool<BacklinkData[]>(SERVER_NAME, 'backlinks_list', input);
}

/**
 * Get backlink summary/overview
 */
export async function backlinksSummary(target: string): Promise<unknown> {
  return callMCPTool(SERVER_NAME, 'backlinks_summary', { target });
}

/**
 * Get referring domains
 */
export async function referringDomains(
  input: BacklinksInput
): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'backlinks_referring_domains', input);
}

// ========================================================================
// Local SEO Functions
// ========================================================================

/**
 * Get Google Business Profile data
 */
export async function googleBusinessProfile(
  placeId: string
): Promise<unknown> {
  return callMCPTool(SERVER_NAME, 'gbp_data', { place_id: placeId });
}

/**
 * Search for local businesses
 */
export async function localSearch(input: SerpInput): Promise<unknown[]> {
  return callMCPTool<unknown[]>(SERVER_NAME, 'local_search', input);
}

// ========================================================================
// Convenience Functions (Context-Efficient Patterns)
// ========================================================================

/**
 * Quick competitor analysis - returns only top 10 competitors with key metrics
 */
export async function quickCompetitorAnalysis(
  domain: string,
  locationCode = 2840 // USA default
): Promise<Array<{ domain: string; keywords: number; traffic: number }>> {
  const competitors = (await getCompetitors({
    domain,
    location_code: locationCode,
  })) as Array<{ domain: string; keywords_count: number; etv: number }>;

  // Filter and transform in code - only return what's needed
  return competitors.slice(0, 10).map((c) => ({
    domain: c.domain,
    keywords: c.keywords_count,
    traffic: c.etv,
  }));
}

/**
 * Get high-value keywords - filters to keywords with volume > 100 and low competition
 */
export async function highValueKeywords(
  seedKeywords: string[],
  locationCode = 2840
): Promise<KeywordData[]> {
  const suggestions = await keywordSuggestions({
    keywords: seedKeywords,
    location_code: locationCode,
  });

  // Filter in code - reduces context significantly
  return suggestions.filter(
    (kw) => kw.search_volume > 100 && kw.competition < 0.5
  );
}

/**
 * SERP position check - returns just the rank for a domain
 */
export async function checkPosition(
  keyword: string,
  domain: string,
  locationCode = 2840
): Promise<number | null> {
  const results = await serpGoogle({
    keyword,
    location_code: locationCode,
  });

  // Filter in code - only return the rank
  const item = results.items.find((i) =>
    i.domain.includes(domain.replace('www.', ''))
  );
  return item?.rank_absolute || null;
}

/**
 * Quality backlinks only - filters to dofollow with good domain rank
 */
export async function qualityBacklinks(
  target: string,
  limit = 100
): Promise<BacklinkData[]> {
  const backlinks = await getBacklinks({ target, limit: limit * 2 });

  // Filter in code - return only quality links
  return backlinks
    .filter((bl) => bl.dofollow && bl.rank > 30)
    .slice(0, limit);
}

/**
 * Keyword gap analysis - find keywords competitors rank for but you don't
 */
export async function keywordGap(
  yourDomain: string,
  competitorDomain: string,
  locationCode = 2840
): Promise<string[]> {
  const [yourKeywords, competitorKeywords] = await Promise.all([
    domainRankings({ domain: yourDomain, location_code: locationCode }),
    domainRankings({ domain: competitorDomain, location_code: locationCode }),
  ]);

  const yourSet = new Set(
    (yourKeywords as Array<{ keyword: string }>).map((k) => k.keyword)
  );

  // Filter in code - return only gaps
  return (competitorKeywords as Array<{ keyword: string }>)
    .map((k) => k.keyword)
    .filter((kw) => !yourSet.has(kw));
}
