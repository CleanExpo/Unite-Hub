/**
 * Bing Webmaster Tools Client
 *
 * Client for fetching Bing Webmaster data including search traffic, crawl info, and SEO issues.
 */

import {
  BingApiResponse,
  BingQueryData,
  BingSeoIssue,
  BingSnapshot,
} from './searchProviderTypes';

export interface BingClientConfig {
  apiKey: string;
  siteUrl: string;
}

export interface BingTrafficOptions {
  startDate: Date;
  endDate: Date;
  page?: number;
}

export interface BingCrawlStats {
  crawledPages: number;
  crawlErrors: number;
  httpErrors: Record<string, number>;
  lastCrawlDate?: Date;
  avgCrawlTimeMs?: number;
}

export interface BingIndexStats {
  indexedPages: number;
  discoveredUrls: number;
  inIndex: number;
  blockedByRobots: number;
}

export interface BingBacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  topBacklinks: Array<{
    sourceUrl: string;
    targetUrl: string;
    anchorText?: string;
    linkType: 'follow' | 'nofollow';
  }>;
}

class BingClient {
  private apiKey: string;
  private siteUrl: string;
  private baseUrl = 'https://ssl.bing.com/webmaster/api.svc/json';

  constructor(config: BingClientConfig) {
    this.apiKey = config.apiKey;
    this.siteUrl = config.siteUrl;
  }

  /**
   * Make authenticated request to Bing API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set('apikey', this.apiKey);
    url.searchParams.set('siteUrl', this.siteUrl);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bing API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get search traffic data (queries)
   */
  async getTrafficStats(options: BingTrafficOptions): Promise<{
    queries: BingQueryData[];
    totalClicks: number;
    totalImpressions: number;
  }> {
    try {
      const response = await this.makeRequest<BingApiResponse>(
        `GetQueryStats?startDate=${this.formatDate(options.startDate)}&endDate=${this.formatDate(options.endDate)}`
      );

      const queries: BingQueryData[] = (response.d?.results || []).map((row) => ({
        query: row.Query || '',
        clicks: row.Clicks || 0,
        impressions: row.Impressions || 0,
        position: row.AvgPosition || 0,
      }));

      const totals = queries.reduce(
        (acc, q) => ({
          clicks: acc.clicks + q.clicks,
          impressions: acc.impressions + q.impressions,
        }),
        { clicks: 0, impressions: 0 }
      );

      return {
        queries,
        totalClicks: totals.clicks,
        totalImpressions: totals.impressions,
      };
    } catch (error) {
      console.error('[Bing] Error fetching traffic stats:', error);
      throw error;
    }
  }

  /**
   * Get page traffic stats
   */
  async getPageStats(options: BingTrafficOptions): Promise<
    Array<{
      url: string;
      clicks: number;
      impressions: number;
    }>
  > {
    try {
      const response = await this.makeRequest<{
        d?: {
          results?: Array<{
            Url?: string;
            Clicks?: number;
            Impressions?: number;
          }>;
        };
      }>(
        `GetPageStats?startDate=${this.formatDate(options.startDate)}&endDate=${this.formatDate(options.endDate)}`
      );

      return (response.d?.results || []).map((row) => ({
        url: row.Url || '',
        clicks: row.Clicks || 0,
        impressions: row.Impressions || 0,
      }));
    } catch (error) {
      console.error('[Bing] Error fetching page stats:', error);
      throw error;
    }
  }

  /**
   * Get crawl statistics
   */
  async getCrawlStats(): Promise<BingCrawlStats> {
    try {
      const response = await this.makeRequest<{
        d?: {
          CrawledPages?: number;
          CrawlErrors?: number;
          HttpErrors?: Array<{ Code: string; Count: number }>;
          LastCrawlDate?: string;
          AvgCrawlTimeMs?: number;
        };
      }>('GetCrawlStats');

      const httpErrors: Record<string, number> = {};
      for (const err of response.d?.HttpErrors || []) {
        httpErrors[err.Code] = err.Count;
      }

      return {
        crawledPages: response.d?.CrawledPages || 0,
        crawlErrors: response.d?.CrawlErrors || 0,
        httpErrors,
        lastCrawlDate: response.d?.LastCrawlDate ? new Date(response.d.LastCrawlDate) : undefined,
        avgCrawlTimeMs: response.d?.AvgCrawlTimeMs,
      };
    } catch (error) {
      console.error('[Bing] Error fetching crawl stats:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<BingIndexStats> {
    try {
      const response = await this.makeRequest<{
        d?: {
          IndexedPages?: number;
          DiscoveredUrls?: number;
          InIndex?: number;
          BlockedByRobots?: number;
        };
      }>('GetUrlInfo');

      return {
        indexedPages: response.d?.IndexedPages || 0,
        discoveredUrls: response.d?.DiscoveredUrls || 0,
        inIndex: response.d?.InIndex || 0,
        blockedByRobots: response.d?.BlockedByRobots || 0,
      };
    } catch (error) {
      console.error('[Bing] Error fetching index stats:', error);
      throw error;
    }
  }

  /**
   * Get SEO issues
   */
  async getSeoIssues(): Promise<BingSeoIssue[]> {
    try {
      const response = await this.makeRequest<{
        d?: {
          results?: Array<{
            Severity?: string;
            IssueType?: string;
            Description?: string;
            AffectedPages?: number;
          }>;
        };
      }>('GetSeoIssues');

      return (response.d?.results || []).map((issue) => ({
        severity: this.mapSeverity(issue.Severity),
        issueType: issue.IssueType || 'unknown',
        description: issue.Description || '',
        affectedPages: issue.AffectedPages || 0,
      }));
    } catch (error) {
      console.error('[Bing] Error fetching SEO issues:', error);
      throw error;
    }
  }

  /**
   * Get backlink data
   */
  async getBacklinks(page = 0, count = 50): Promise<BingBacklinkData> {
    try {
      const response = await this.makeRequest<{
        d?: {
          TotalBacklinks?: number;
          ReferringDomains?: number;
          results?: Array<{
            SourceUrl?: string;
            TargetUrl?: string;
            AnchorText?: string;
            IsFollow?: boolean;
          }>;
        };
      }>(`GetBacklinks?page=${page}&count=${count}`);

      return {
        totalBacklinks: response.d?.TotalBacklinks || 0,
        referringDomains: response.d?.ReferringDomains || 0,
        topBacklinks: (response.d?.results || []).map((link) => ({
          sourceUrl: link.SourceUrl || '',
          targetUrl: link.TargetUrl || '',
          anchorText: link.AnchorText,
          linkType: link.IsFollow ? 'follow' : 'nofollow',
        })),
      };
    } catch (error) {
      console.error('[Bing] Error fetching backlinks:', error);
      throw error;
    }
  }

  /**
   * Submit URL for indexing
   */
  async submitUrl(url: string): Promise<{ success: boolean; message?: string }> {
    try {
      await this.makeRequest('SubmitUrl', 'POST', { siteUrl: this.siteUrl, url });
      return { success: true };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  /**
   * Submit sitemap
   */
  async submitSitemap(sitemapUrl: string): Promise<{ success: boolean; message?: string }> {
    try {
      await this.makeRequest('SubmitSitemap', 'POST', { siteUrl: this.siteUrl, sitemapUrl });
      return { success: true };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  /**
   * Get keyword research data
   */
  async getKeywordResearch(keyword: string): Promise<{
    keyword: string;
    searchVolume: number;
    impressions: number;
    clicks: number;
    relatedKeywords: Array<{ keyword: string; searchVolume: number }>;
  }> {
    try {
      const response = await this.makeRequest<{
        d?: {
          Keyword?: string;
          SearchVolume?: number;
          Impressions?: number;
          Clicks?: number;
          RelatedKeywords?: Array<{ Keyword?: string; SearchVolume?: number }>;
        };
      }>(`GetKeywordData?keyword=${encodeURIComponent(keyword)}`);

      return {
        keyword: response.d?.Keyword || keyword,
        searchVolume: response.d?.SearchVolume || 0,
        impressions: response.d?.Impressions || 0,
        clicks: response.d?.Clicks || 0,
        relatedKeywords: (response.d?.RelatedKeywords || []).map((k) => ({
          keyword: k.Keyword || '',
          searchVolume: k.SearchVolume || 0,
        })),
      };
    } catch (error) {
      console.error('[Bing] Error fetching keyword research:', error);
      throw error;
    }
  }

  /**
   * Create a full snapshot for storage
   */
  async createSnapshot(
    startDate: Date,
    endDate: Date
  ): Promise<Omit<BingSnapshot, 'id' | 'projectId' | 'workspaceId' | 'createdAt'>> {
    const [trafficStats, crawlStats, indexStats, seoIssues] = await Promise.all([
      this.getTrafficStats({ startDate, endDate }),
      this.getCrawlStats(),
      this.getIndexStats(),
      this.getSeoIssues(),
    ]);

    return {
      snapshotDate: endDate,
      clicks: trafficStats.totalClicks,
      impressions: trafficStats.totalImpressions,
      crawledPages: crawlStats.crawledPages,
      indexedPages: indexStats.indexedPages,
      crawlErrors: crawlStats.crawlErrors,
      topQueries: trafficStats.queries.slice(0, 100),
      seoIssues,
      rawData: {
        httpErrors: crawlStats.httpErrors,
        blockedByRobots: indexStats.blockedByRobots,
      },
    };
  }

  // Helper methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private mapSeverity(severity?: string): 'high' | 'medium' | 'low' {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'high';
      case 'medium':
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }
}

export function createBingClient(config: BingClientConfig): BingClient {
  return new BingClient(config);
}

export { BingClient };
