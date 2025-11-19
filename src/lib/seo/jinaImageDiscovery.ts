/**
 * Jina AI Image Discovery
 * Phase 7: Docker Multi-Tenant Architecture
 *
 * External image-assisted intelligence for HTML dashboards:
 * - Search for relevant images using s.jina.ai (search)
 * - Scrape Unsplash URLs using r.jina.ai (scrape)
 * - Never store raw API key in client folders
 * - Use [IMAGE_PLACEHOLDER] when auto-insertion not possible
 *
 * Workflow:
 * 1. Use s.jina to search "unsplash + keyword"
 * 2. Identify promising Unsplash URLs from results
 * 3. Use r.jina on each URL to scrape markdown with actual image URLs
 * 4. Insert URLs into HTML/CSS/JSON as needed
 */

export type PanelType =
  | "audits"
  | "geo"
  | "competitors"
  | "velocity"
  | "keywords"
  | "backlinks"
  | "snapshots";

export interface ImageSearchResult {
  url: string;
  title: string;
  description: string;
  source: string; // e.g., "unsplash.com"
  image_url?: string; // Scraped from Unsplash
}

export interface ImagePlaceholder {
  panel_type: PanelType;
  keyword: string;
  description: string;
  placeholder_text: string;
}

export class JinaImageDiscovery {
  private static API_KEY = process.env.JINA_API_KEY || "";
  private static SEARCH_ENDPOINT = "https://s.jina.ai/";
  private static SCRAPE_ENDPOINT = "https://r.jina.ai/";

  /**
   * Panel-specific image keywords
   */
  private static PANEL_KEYWORDS: Record<PanelType, string[]> = {
    audits: ["seo dashboard ui", "ranking graph", "technical seo report"],
    geo: ["local seo map", "radius optimization", "local search heatmap"],
    competitors: ["competitor analysis UI", "keyword gap chart"],
    velocity: ["content velocity dashboard", "workflow pipeline UI"],
    keywords: ["keyword research tool", "search volume chart"],
    backlinks: ["backlink analysis graph", "link profile visualization"],
    snapshots: ["weekly report dashboard", "seo metrics overview"],
  };

  /**
   * Search for images using s.jina.ai
   */
  static async searchImages(keyword: string, preferUnsplash = true): Promise<{
    success: boolean;
    results?: ImageSearchResult[];
    error?: string;
  }> {
    try {
      if (!this.API_KEY) {
        return {
          success: false,
          error: "JINA_API_KEY not configured",
        };
      }

      console.log(`[JinaImageDiscovery] Searching for images: ${keyword}`);

      // Build search query (prioritize Unsplash if requested)
      const searchQuery = preferUnsplash ? `unsplash ${keyword}` : keyword;
      const searchUrl = `${this.SEARCH_ENDPOINT}${encodeURIComponent(searchQuery)}`;

      // Call s.jina.ai
      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          "X-Return-Format": "markdown",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Jina search failed: ${response.statusText}`,
        };
      }

      const markdown = await response.text();

      // Parse markdown for Unsplash URLs
      const unsplashUrls = this.extractUnsplashUrls(markdown);

      if (unsplashUrls.length === 0) {
        return {
          success: true,
          results: [],
        };
      }

      // Return results (without scraped images yet)
      const results: ImageSearchResult[] = unsplashUrls.map((url) => ({
        url,
        title: keyword,
        description: `Image from Unsplash for: ${keyword}`,
        source: "unsplash.com",
      }));

      console.log(`[JinaImageDiscovery] ✅ Found ${results.length} Unsplash URLs`);

      return { success: true, results };
    } catch (error) {
      console.error(`[JinaImageDiscovery] Error searching images:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Scrape Unsplash URL to get actual image URL using r.jina.ai
   */
  static async scrapeImageUrl(unsplashUrl: string): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.API_KEY) {
        return {
          success: false,
          error: "JINA_API_KEY not configured",
        };
      }

      console.log(`[JinaImageDiscovery] Scraping Unsplash URL: ${unsplashUrl}`);

      // Call r.jina.ai
      const scrapeUrl = `${this.SCRAPE_ENDPOINT}${encodeURIComponent(unsplashUrl)}`;

      const response = await fetch(scrapeUrl, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          "X-Return-Format": "markdown",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Jina scrape failed: ${response.statusText}`,
        };
      }

      const markdown = await response.text();

      // Extract image URL from markdown (Unsplash CDN URLs)
      const imageUrl = this.extractImageUrlFromMarkdown(markdown);

      if (!imageUrl) {
        return {
          success: false,
          error: "No image URL found in scraped markdown",
        };
      }

      console.log(`[JinaImageDiscovery] ✅ Scraped image URL: ${imageUrl.substring(0, 50)}...`);

      return { success: true, imageUrl };
    } catch (error) {
      console.error(`[JinaImageDiscovery] Error scraping image URL:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get images for a specific panel type
   */
  static async getImagesForPanel(panelType: PanelType, count = 3): Promise<{
    success: boolean;
    images?: ImageSearchResult[];
    error?: string;
  }> {
    try {
      const keywords = this.PANEL_KEYWORDS[panelType];

      if (!keywords || keywords.length === 0) {
        return {
          success: false,
          error: `No keywords defined for panel type: ${panelType}`,
        };
      }

      console.log(`[JinaImageDiscovery] Getting images for panel: ${panelType}`);

      // Search for images using first keyword
      const { success, results, error } = await this.searchImages(keywords[0]);

      if (!success || !results) {
        return { success: false, error };
      }

      // Scrape up to 'count' Unsplash URLs
      const images: ImageSearchResult[] = [];

      for (let i = 0; i < Math.min(results.length, count); i++) {
        const result = results[i];

        // Scrape image URL
        const scrapeResult = await this.scrapeImageUrl(result.url);

        if (scrapeResult.success && scrapeResult.imageUrl) {
          images.push({
            ...result,
            image_url: scrapeResult.imageUrl,
          });
        }
      }

      console.log(`[JinaImageDiscovery] ✅ Got ${images.length} images for ${panelType}`);

      return { success: true, images };
    } catch (error) {
      console.error(`[JinaImageDiscovery] Error getting panel images:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate image placeholder metadata
   */
  static generatePlaceholder(panelType: PanelType, keyword?: string): ImagePlaceholder {
    const keywords = this.PANEL_KEYWORDS[panelType];
    const selectedKeyword = keyword || keywords[0];

    return {
      panel_type: panelType,
      keyword: selectedKeyword,
      description: `Image for ${panelType} panel: ${selectedKeyword}`,
      placeholder_text: `[IMAGE_PLACEHOLDER: ${selectedKeyword}]`,
    };
  }

  /**
   * Extract Unsplash URLs from markdown
   */
  private static extractUnsplashUrls(markdown: string): string[] {
    const urls: string[] = [];

    // Match Unsplash URLs in markdown links: [text](https://unsplash.com/photos/...)
    const linkRegex = /\[([^\]]+)\]\((https:\/\/unsplash\.com\/[^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      urls.push(match[2]);
    }

    // Also match plain URLs: https://unsplash.com/photos/...
    const plainUrlRegex = /(https:\/\/unsplash\.com\/[^\s)]+)/g;

    while ((match = plainUrlRegex.exec(markdown)) !== null) {
      if (!urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }

    return urls;
  }

  /**
   * Extract image URL from scraped Unsplash markdown
   */
  private static extractImageUrlFromMarkdown(markdown: string): string | null {
    // Match Unsplash CDN image URLs: ![alt](https://images.unsplash.com/...)
    const imageRegex = /!\[([^\]]*)\]\((https:\/\/images\.unsplash\.com\/[^)]+)\)/;
    const match = markdown.match(imageRegex);

    if (match) {
      return match[2];
    }

    // Fallback: Match any direct image URL
    const fallbackRegex = /(https:\/\/images\.unsplash\.com\/[^\s)]+)/;
    const fallbackMatch = markdown.match(fallbackRegex);

    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    return null;
  }
}

export default JinaImageDiscovery;
