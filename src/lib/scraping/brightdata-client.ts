/**
 * Bright Data API Wrapper
 * Provides ethical web scraping with robots.txt compliance, rate limiting, and proxy rotation
 *
 * Environment variables required:
 * - BRIGHTDATA_API_KEY: Your Bright Data API key
 * - BRIGHTDATA_ZONE: Your zone name (default: "unite_hub")
 */

import axios, { AxiosError } from "axios";

// ============================================
// Types
// ============================================

export interface BrightDataRequest {
  url: string;
  format?: "html" | "json"; // response format
  cookies?: boolean; // maintain cookies
  headers?: Record<string, string>;
  proxy_zone?: string;
}

export interface BrightDataResponse {
  statusCode: number;
  statusMessage: string;
  body: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface ScrapeOptions {
  url: string;
  format?: "html" | "json";
  timeout?: number; // ms
  retries?: number;
  rateLimit?: {
    delayMs: number; // wait between requests
    concurrent: number; // max parallel requests
  };
  userAgent?: string; // custom user agent
}

export interface ScrapeResult {
  success: boolean;
  url: string;
  statusCode?: number;
  content?: string;
  error?: string;
  headers?: Record<string, string>;
}

// ============================================
// Bright Data Client
// ============================================

let axisoInstance: any = null;

function getBrightDataClient() {
  if (!axisoInstance) {
    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      throw new Error("BRIGHTDATA_API_KEY environment variable not set");
    }

    axisoInstance = axios.create({
      baseURL: "https://api.brightdata.com/request",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30s default
    });
  }
  return axisoInstance;
}

/**
 * Scrape a URL using Bright Data proxy
 */
export async function scrapeUrl(
  options: ScrapeOptions
): Promise<ScrapeResult> {
  const client = getBrightDataClient();
  const zone = process.env.BRIGHTDATA_ZONE || "unite_hub";

  try {
    const request: BrightDataRequest = {
      url: options.url,
      format: options.format || "html",
      proxy_zone: zone,
    };

    if (options.userAgent) {
      request.headers = {
        "User-Agent": options.userAgent,
      };
    }

    const response = await client.post<BrightDataResponse>("", request, {
      timeout: options.timeout || 30000,
    });

    const data = response.data;

    if (data.statusCode !== 200) {
      return {
        success: false,
        url: options.url,
        statusCode: data.statusCode,
        error: `HTTP ${data.statusCode}: ${data.statusMessage}`,
      };
    }

    return {
      success: true,
      url: options.url,
      statusCode: data.statusCode,
      content: data.body,
      headers: data.headers,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      url: options.url,
      statusCode: axiosError.response?.status,
      error: axiosError.message || "Unknown error",
    };
  }
}

/**
 * Batch scrape multiple URLs with rate limiting
 */
export async function scrapeBatch(
  urls: string[],
  options: Partial<ScrapeOptions> = {}
): Promise<ScrapeResult[]> {
  const rateLimit = options.rateLimit || {
    delayMs: 1000, // 1s between requests
    concurrent: 3, // 3 concurrent
  };

  const results: ScrapeResult[] = [];
  let activeRequests = 0;

  for (let i = 0; i < urls.length; i++) {
    if (activeRequests >= rateLimit.concurrent) {
      await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs));
    }

    activeRequests++;

    scrapeUrl({ url: urls[i], ...options })
      .then((result) => {
        results.push(result);
        activeRequests--;
      })
      .catch((error) => {
        results.push({
          success: false,
          url: urls[i],
          error: error.message,
        });
        activeRequests--;
      });

    if (i < urls.length - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, rateLimit.delayMs / rateLimit.concurrent)
      );
    }
  }

  // Wait for remaining requests
  while (activeRequests > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Check if a URL is scrapable (respects robots.txt)
 * Bright Data handles this automatically, but you can pre-check
 */
export async function isUrlScrapable(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    const response = await axios.get(robotsUrl, { timeout: 5000 });
    const robotsContent = response.data;

    // Simple check: if disallow all, it's not scrapable
    if (
      robotsContent.toLowerCase().includes("user-agent: *") &&
      robotsContent.toLowerCase().includes("disallow: /")
    ) {
      return false;
    }

    return true;
  } catch {
    // If robots.txt doesn't exist, assume scrapable
    return true;
  }
}

/**
 * Get scraping statistics and quota usage
 */
export async function getQuotaStatus(): Promise<{
  remainingRequests: number;
  totalRequests: number;
  resetDate: string;
} | null> {
  try {
    const client = getBrightDataClient();
    const response = await client.get("/status");

    return {
      remainingRequests: response.data.remaining_requests,
      totalRequests: response.data.total_requests,
      resetDate: response.data.reset_date,
    };
  } catch (error) {
    console.error("Error getting quota status:", error);
    return null;
  }
}
