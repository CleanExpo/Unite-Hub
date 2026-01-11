/**
 * URL Discovery Service
 * Finds relevant URLs based on seed URL + keywords using multiple search strategies
 *
 * Strategies:
 * 1. Exa AI web search (recommended - fresher results)
 * 2. Google Custom Search (if configured)
 * 3. Site-related searches
 * 4. Manual URL patterns (guessing common pages)
 */

import axios from "axios";

// ============================================
// Types
// ============================================

export interface DiscoverURLsInput {
  seedUrl: string; // Starting URL (e.g., competitor.com)
  keywords: string[]; // Search keywords
  maxResults?: number; // Max URLs to find (default: 20)
  excludeDomains?: string[]; // Domains to skip
}

export interface DiscoveredURL {
  url: string;
  source: "search" | "pattern" | "seed";
  relevanceScore: number; // 0-1
  title?: string;
  snippet?: string;
}

// ============================================
// URL Discovery
// ============================================

/**
 * Discover relevant URLs based on seed URL and keywords
 */
export async function discoverURLs(
  input: DiscoverURLsInput
): Promise<DiscoveredURL[]> {
  const seedDomain = extractDomain(input.seedUrl);
  const maxResults = input.maxResults || 20;
  const excludeDomains = input.excludeDomains || [
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "youtube.com",
    "reddit.com",
  ];

  const allUrls = new Map<string, DiscoveredURL>();

  // Strategy 1: Exa AI Search
  const exaResults = await searchWithExa(input.keywords, {
    excludeDomains: [...excludeDomains, seedDomain], // Exclude seed domain initially
    limit: Math.ceil(maxResults * 0.6),
  });

  exaResults.forEach((url) => {
    if (!allUrls.has(url.url)) {
      allUrls.set(url.url, url);
    }
  });

  // Strategy 2: Search within seed domain (related pages)
  const seedDomainUrls = await findUrlsWithinDomain(seedDomain, input.keywords);
  seedDomainUrls.forEach((url) => {
    if (!allUrls.has(url.url)) {
      allUrls.set(url.url, url);
    }
  });

  // Strategy 3: Common page patterns
  const patternUrls = generateCommonPagePatterns(seedDomain, input.keywords);
  patternUrls.forEach((url) => {
    if (!allUrls.has(url.url)) {
      allUrls.set(url.url, url);
    }
  });

  // Sort by relevance and return top results
  return Array.from(allUrls.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

// ============================================
// Search Strategies
// ============================================

/**
 * Search using Exa AI (web search)
 */
async function searchWithExa(
  keywords: string[],
  options: {
    excludeDomains: string[];
    limit: number;
  }
): Promise<DiscoveredURL[]> {
  try {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      console.warn("EXA_API_KEY not set, skipping Exa search");
      return [];
    }

    const results: DiscoveredURL[] = [];

    // Search for each keyword
    for (const keyword of keywords) {
      const query = `${keyword} -${options.excludeDomains.join(" -")}`;

      const response = await axios.post(
        "https://api.exa.ai/search",
        {
          query,
          numResults: options.limit,
          type: "auto",
          contentOptions: {
            text: true,
          },
        },
        {
          headers: {
            "x-api-key": apiKey,
          },
        }
      );

      const searchResults = response.data.results || [];

      searchResults.forEach((result: any) => {
        results.push({
          url: result.url,
          source: "search",
          relevanceScore: calculateRelevanceScore(result.title, keyword),
          title: result.title,
          snippet: result.text?.substring(0, 200),
        });
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching with Exa:", error);
    return [];
  }
}

/**
 * Find URLs within the seed domain (related pages)
 */
async function findUrlsWithinDomain(
  domain: string,
  keywords: string[]
): Promise<DiscoveredURL[]> {
  const results: DiscoveredURL[] = [];

  // Add common pages
  const commonPages = [
    "/",
    "/about",
    "/products",
    "/services",
    "/pricing",
    "/features",
    "/blog",
    "/case-studies",
    "/resources",
    "/solutions",
  ];

  // Add keyword-based pages
  const keywordPages = keywords.map((kw) =>
    kw.toLowerCase().replace(/\s+/g, "-")
  );

  const pages = [
    ...commonPages,
    ...keywordPages.map((p) => `/${p}`),
    ...keywordPages.map((p) => `/blog/${p}`),
  ];

  pages.forEach((page) => {
    const url = `https://${domain}${page}`;
    results.push({
      url,
      source: "pattern",
      relevanceScore: page === "/" ? 0.9 : 0.6,
    });
  });

  return results;
}

/**
 * Generate common page patterns based on keywords
 */
function generateCommonPagePatterns(
  domain: string,
  keywords: string[]
): DiscoveredURL[] {
  const results: DiscoveredURL[] = [];

  // Common URL patterns for products/pricing
  const patterns = [
    "/pricing",
    "/products",
    "/features",
    "/solutions",
    "/services",
    "/catalog",
    "/shop",
    "/pricing-plans",
    "/pricing-tiers",
  ];

  patterns.forEach((pattern) => {
    const url = `https://${domain}${pattern}`;
    results.push({
      url,
      source: "pattern",
      relevanceScore: 0.5,
    });
  });

  return results;
}

// ============================================
// Utilities
// ============================================

/**
 * Extract domain from URL
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);
    return url.hostname;
  } catch {
    // Fallback for simple domain strings
    return urlString.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

/**
 * Calculate relevance score based on keyword match
 */
function calculateRelevanceScore(title: string, keyword: string): number {
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  if (lowerTitle === lowerKeyword) {
return 1.0;
} // Exact match
  if (lowerTitle.includes(lowerKeyword)) {
return 0.9;
} // Contains keyword
  if (lowerTitle.includes(keyword.split(" ")[0])) {
return 0.7;
} // Contains first word

  // Partial word match
  const words = keyword.split(" ");
  const matchedWords = words.filter((w) => lowerTitle.includes(w)).length;
  return Math.min(0.6, 0.3 + matchedWords * 0.15);
}

/**
 * Deduplicate URLs
 */
export function deduplicateURLs(urls: DiscoveredURL[]): DiscoveredURL[] {
  const seen = new Set<string>();
  return urls.filter((item) => {
    const normalizedUrl = normalizeURL(item.url);
    if (seen.has(normalizedUrl)) {
      return false;
    }
    seen.add(normalizedUrl);
    return true;
  });
}

/**
 * Normalize URL for deduplication
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Remove trailing slash, query params, fragments
    return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Filter URLs by criteria
 */
export function filterURLs(
  urls: DiscoveredURL[],
  options: {
    minRelevanceScore?: number;
    excludePatterns?: RegExp[];
    maxResults?: number;
  } = {}
): DiscoveredURL[] {
  const minScore = options.minRelevanceScore || 0.3;
  const excludePatterns = options.excludePatterns || [];

  return urls
    .filter((url) => url.relevanceScore >= minScore)
    .filter((url) => !excludePatterns.some((pattern) => pattern.test(url.url)))
    .slice(0, options.maxResults);
}
