/**
 * Brave Search API Integration
 *
 * Provides web search, news search, image search, local POI search,
 * and AI-powered summarization capabilities.
 *
 * @see https://brave.com/search/api/
 * @see spec: .claude/plans/structured-leaping-pike.md
 */

import { BraveSearch } from "brave-search";

// Lazy initialization pattern (matches Anthropic client pattern)
let braveSearchClient: BraveSearch | null = null;
let braveSearchClientTimestamp = 0;
const BRAVE_CLIENT_TTL = 60000; // 60 seconds

/**
 * Get or create Brave Search client (singleton with TTL)
 */
function getBraveSearchClient(): BraveSearch {
  const now = Date.now();
  if (!braveSearchClient || now - braveSearchClientTimestamp > BRAVE_CLIENT_TTL) {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      throw new Error("BRAVE_API_KEY environment variable is required");
    }
    braveSearchClient = new BraveSearch(apiKey);
    braveSearchClientTimestamp = now;
  }
  return braveSearchClient;
}

// ============================================================================
// Types
// ============================================================================

export interface WebSearchOptions {
  count?: number;
  offset?: number;
  safesearch?: "off" | "moderate" | "strict";
  search_lang?: string;
  country?: string;
  text_decorations?: boolean;
  freshness?: "pd" | "pw" | "pm" | "py"; // past day/week/month/year
}

export interface LocalSearchOptions {
  lat?: number;
  lng?: number;
  count?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  extra_snippets?: string[];
}

export interface NewsResult {
  title: string;
  url: string;
  description: string;
  age: string;
  source: string;
  thumbnail?: string;
}

export interface LocalResult {
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  reviews_count?: number;
  category?: string;
  coordinates?: { lat: number; lng: number };
}

export interface BraveSearchResponse<T> {
  results: T[];
  query: string;
  total_count?: number;
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Perform a web search
 *
 * @param query - Search query string
 * @param options - Search options (count, language, country, etc.)
 * @returns Web search results
 *
 * @example
 * const results = await webSearch("Next.js 16 features", { count: 10 });
 */
export async function webSearch(
  query: string,
  options: WebSearchOptions = {}
): Promise<BraveSearchResponse<SearchResult>> {
  const client = getBraveSearchClient();

  const defaultOptions: WebSearchOptions = {
    count: 10,
    safesearch: "moderate",
    search_lang: "en",
    country: "AU", // Default to Australia for the founder
    text_decorations: false,
    ...options,
  };

  try {
    const response = await client.webSearch(query, defaultOptions);

    return {
      query,
      results: response.web?.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        age: r.age,
        extra_snippets: r.extra_snippets,
      })) || [],
      total_count: response.web?.totalEstimatedMatches,
    };
  } catch (error) {
    console.error("[BraveSearch] Web search error:", error);
    throw error;
  }
}

/**
 * Perform a news search
 *
 * @param query - News search query
 * @param options - Search options
 * @returns News search results
 *
 * @example
 * const news = await newsSearch("AI startups funding 2026");
 */
export async function newsSearch(
  query: string,
  options: WebSearchOptions = {}
): Promise<BraveSearchResponse<NewsResult>> {
  const client = getBraveSearchClient();

  const defaultOptions: WebSearchOptions = {
    count: 10,
    safesearch: "moderate",
    freshness: "pw", // Past week by default for news
    ...options,
  };

  try {
    const response = await client.webSearch(query, {
      ...defaultOptions,
      result_filter: "news",
    } as any);

    return {
      query,
      results: response.news?.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
        age: r.age,
        source: r.meta_url?.hostname || "Unknown",
        thumbnail: r.thumbnail?.src,
      })) || [],
    };
  } catch (error) {
    console.error("[BraveSearch] News search error:", error);
    throw error;
  }
}

/**
 * Perform an image search
 *
 * @param query - Image search query
 * @param options - Search options
 * @returns Image search results
 */
export async function imageSearch(
  query: string,
  options: WebSearchOptions = {}
): Promise<BraveSearchResponse<any>> {
  const client = getBraveSearchClient();

  try {
    const response = await client.imageSearch(query, {
      count: options.count || 20,
      safesearch: options.safesearch || "moderate",
    });

    return {
      query,
      results: response.results || [],
    };
  } catch (error) {
    console.error("[BraveSearch] Image search error:", error);
    throw error;
  }
}

/**
 * Perform a local POI (Point of Interest) search
 *
 * @param query - Local search query (e.g., "coffee shops")
 * @param options - Location and count options
 * @returns Local business results
 *
 * @example
 * const cafes = await localSearch("coffee shops", { lat: -33.8688, lng: 151.2093 });
 */
export async function localSearch(
  query: string,
  options: LocalSearchOptions = {}
): Promise<BraveSearchResponse<LocalResult>> {
  const client = getBraveSearchClient();

  try {
    const response = await client.localPoiSearch(query, {
      count: options.count || 10,
      ...(options.lat && options.lng ? { lat: options.lat, lng: options.lng } : {}),
    } as any);

    return {
      query,
      results: response.results?.map((r: any) => ({
        name: r.name,
        address: r.address,
        phone: r.phone,
        rating: r.rating?.value,
        reviews_count: r.rating?.count,
        category: r.category,
        coordinates: r.coordinates,
      })) || [],
    };
  } catch (error) {
    console.error("[BraveSearch] Local search error:", error);
    throw error;
  }
}

/**
 * Get AI-generated summary for a query
 * Uses polling to wait for summary completion
 *
 * @param query - Query to summarize
 * @param maxWaitMs - Maximum wait time in milliseconds (default: 30s)
 * @returns AI-generated summary text
 *
 * @example
 * const summary = await getAISummary("What are the benefits of TypeScript?");
 */
export async function getAISummary(
  query: string,
  maxWaitMs: number = 30000
): Promise<string | null> {
  const client = getBraveSearchClient();

  try {
    const response = await client.getSummary(query, {
      timeout: maxWaitMs,
    } as any);

    return response.summary || null;
  } catch (error) {
    console.error("[BraveSearch] AI summary error:", error);
    return null;
  }
}

// ============================================================================
// Specialized Search Functions for Unite-Hub
// ============================================================================

/**
 * Search for competitor information (SEO Intelligence)
 *
 * @param domain - Competitor domain to research
 * @returns Search results about the competitor
 */
export async function searchCompetitor(domain: string): Promise<BraveSearchResponse<SearchResult>> {
  const queries = [
    `site:${domain}`,
    `"${domain}" reviews`,
    `"${domain}" pricing`,
  ];

  // Search for the domain directly
  return webSearch(`site:${domain}`, { count: 20 });
}

/**
 * Search for company/contact research (Pre-Client)
 *
 * @param companyName - Company name to research
 * @param options - Additional search options
 * @returns Company research results
 */
export async function researchCompany(
  companyName: string,
  options: { includeNews?: boolean; includeLocal?: boolean } = {}
): Promise<{
  web: BraveSearchResponse<SearchResult>;
  news?: BraveSearchResponse<NewsResult>;
  local?: BraveSearchResponse<LocalResult>;
}> {
  const [web, news, local] = await Promise.all([
    webSearch(`"${companyName}" company`, { count: 10 }),
    options.includeNews ? newsSearch(companyName, { count: 5 }) : Promise.resolve(undefined),
    options.includeLocal ? localSearch(companyName, { count: 5 }) : Promise.resolve(undefined),
  ]);

  return {
    web,
    ...(news && { news }),
    ...(local && { local }),
  };
}

/**
 * Search for industry/market news (Market Radar)
 *
 * @param industry - Industry or market to monitor
 * @param freshness - Time range for news
 * @returns Recent industry news
 */
export async function searchIndustryNews(
  industry: string,
  freshness: "pd" | "pw" | "pm" = "pw"
): Promise<BraveSearchResponse<NewsResult>> {
  return newsSearch(`${industry} industry news trends`, { freshness, count: 15 });
}

/**
 * Search for content research topics (Content Agent)
 *
 * @param topic - Topic to research for content creation
 * @returns Research results with potential content angles
 */
export async function researchContentTopic(
  topic: string
): Promise<{
  results: BraveSearchResponse<SearchResult>;
  summary: string | null;
}> {
  const [results, summary] = await Promise.all([
    webSearch(topic, { count: 15, freshness: "pm" }),
    getAISummary(`What are the key points about: ${topic}`),
  ]);

  return { results, summary };
}

// ============================================================================
// Export client getter for advanced use cases
// ============================================================================

export { getBraveSearchClient };
