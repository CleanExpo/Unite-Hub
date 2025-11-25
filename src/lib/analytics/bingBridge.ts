/**
 * Bing Webmaster Tools Bridge
 * Extends Search Console Service with Bing-specific functionality
 * Provides additional Bing endpoints beyond basic query stats
 */

import { supabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'bingBridge' });

export interface BingSiteInfo {
  siteUrl: string;
  verified: boolean;
  crawlStats: {
    lastCrawlDate: string;
    pagesInIndex: number;
    pagesCrawled: number;
  };
}

export interface BingBacklink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  firstDiscovered: string;
  lastCrawled: string;
}

export interface BingCrawlIssue {
  url: string;
  issueType: string;
  severity: 'error' | 'warning' | 'info';
  detectedDate: string;
  description: string;
}

export interface BingRankingKeyword {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  change: number; // Position change from previous period
}

export class BingBridge {
  private readonly BASE_URL = 'https://ssl.bing.com/webmaster/api.svc/json';

  /**
   * Get active Bing API key
   */
  private async getApiKey(workspaceId: string, brandSlug?: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_active_integration_token', {
        p_workspace_id: workspaceId,
        p_integration_type: 'bing_webmaster_tools',
        p_brand_slug: brandSlug || null,
      });

      if (error || !data || data.length === 0) {
        logger.warn('No active Bing API key found', { workspaceId, brandSlug });
        return null;
      }

      return data[0].api_key;
    } catch (error) {
      logger.error('Error getting Bing API key', { error, workspaceId });
      return null;
    }
  }

  /**
   * Make API request to Bing Webmaster Tools
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string>,
    apiKey: string
  ): Promise<T | null> {
    try {
      const url = new URL(`${this.BASE_URL}/${endpoint}`);
      url.searchParams.append('apikey', apiKey);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.d as T;
    } catch (error) {
      logger.error('Bing API request failed', { error, endpoint, params });
      return null;
    }
  }

  /**
   * Get site information and verification status
   */
  async getSiteInfo(workspaceId: string, brandSlug: string, siteUrl: string): Promise<BingSiteInfo | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const data = await this.makeRequest<any>('GetSite', { siteUrl }, apiKey);

      if (!data) {
        return null;
      }

      return {
        siteUrl: data.Url || siteUrl,
        verified: data.IsVerified || false,
        crawlStats: {
          lastCrawlDate: data.LastCrawlDate || '',
          pagesInIndex: data.PagesInIndex || 0,
          pagesCrawled: data.PagesCrawled || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get Bing site info', { error, workspaceId, brandSlug, siteUrl });
      return null;
    }
  }

  /**
   * Get backlinks for a site
   */
  async getBacklinks(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string,
    page?: number,
    pageSize: number = 50
  ): Promise<BingBacklink[] | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const params: Record<string, string> = {
        siteUrl,
        page: (page || 1).toString(),
        pageSize: pageSize.toString(),
      };

      const data = await this.makeRequest<any>('GetBackLinks', params, apiKey);

      if (!data || !data.results) {
        return [];
      }

      return data.results.map((item: any) => ({
        sourceUrl: item.SourceUrl || '',
        targetUrl: item.TargetUrl || '',
        anchorText: item.AnchorText || '',
        firstDiscovered: item.FirstDiscovered || '',
        lastCrawled: item.LastCrawled || '',
      }));
    } catch (error) {
      logger.error('Failed to get Bing backlinks', { error, workspaceId, brandSlug, siteUrl });
      return null;
    }
  }

  /**
   * Get crawl issues (errors and warnings)
   */
  async getCrawlIssues(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string
  ): Promise<BingCrawlIssue[] | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const data = await this.makeRequest<any>('GetCrawlIssues', { siteUrl }, apiKey);

      if (!data || !data.results) {
        return [];
      }

      return data.results.map((item: any) => ({
        url: item.Url || '',
        issueType: item.IssueType || '',
        severity: this.mapSeverity(item.Severity),
        detectedDate: item.DetectedDate || '',
        description: item.Description || '',
      }));
    } catch (error) {
      logger.error('Failed to get Bing crawl issues', { error, workspaceId, brandSlug, siteUrl });
      return null;
    }
  }

  /**
   * Map Bing severity codes to standard severity levels
   */
  private mapSeverity(severity: number | string): 'error' | 'warning' | 'info' {
    if (typeof severity === 'number') {
      if (severity >= 3) return 'error';
      if (severity >= 2) return 'warning';
      return 'info';
    }

    const severityStr = severity.toLowerCase();
    if (severityStr.includes('error') || severityStr.includes('critical')) return 'error';
    if (severityStr.includes('warning')) return 'warning';
    return 'info';
  }

  /**
   * Get ranking keywords (queries where site appears in search results)
   */
  async getRankingKeywords(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string,
    dateStart: string,
    dateEnd: string
  ): Promise<BingRankingKeyword[] | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const params = {
        siteUrl,
        startDate: dateStart,
        endDate: dateEnd,
      };

      const data = await this.makeRequest<any>('GetQueryStats', params, apiKey);

      if (!data || !data.results) {
        return [];
      }

      // Get previous period data for comparison
      const previousPeriodEnd = dateStart;
      const daysRange = Math.floor(
        (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousPeriodStart = new Date(new Date(dateStart).getTime() - daysRange * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const previousData = await this.makeRequest<any>(
        'GetQueryStats',
        {
          siteUrl,
          startDate: previousPeriodStart,
          endDate: previousPeriodEnd,
        },
        apiKey
      );

      const previousPositions = new Map<string, number>();
      if (previousData?.results) {
        previousData.results.forEach((item: any) => {
          previousPositions.set(item.Query, item.AvgPosition || 0);
        });
      }

      return data.results.map((item: any) => {
        const keyword = item.Query || '';
        const currentPosition = item.AvgPosition || 0;
        const previousPosition = previousPositions.get(keyword) || 0;
        const change = previousPosition > 0 ? previousPosition - currentPosition : 0;

        return {
          keyword,
          position: currentPosition,
          impressions: item.Impressions || 0,
          clicks: item.Clicks || 0,
          ctr: item.Ctr || 0,
          change,
        };
      });
    } catch (error) {
      logger.error('Failed to get Bing ranking keywords', {
        error,
        workspaceId,
        brandSlug,
        siteUrl,
      });
      return null;
    }
  }

  /**
   * Get URL inspection details
   */
  async inspectUrl(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string,
    url: string
  ): Promise<{
    isIndexed: boolean;
    lastCrawled?: string;
    crawlStatus?: string;
    indexStatus?: string;
    issues?: string[];
  } | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const params = {
        siteUrl,
        url,
      };

      const data = await this.makeRequest<any>('GetUrlInfo', params, apiKey);

      if (!data) {
        return null;
      }

      return {
        isIndexed: data.IsIndexed || false,
        lastCrawled: data.LastCrawled || undefined,
        crawlStatus: data.CrawlStatus || undefined,
        indexStatus: data.IndexStatus || undefined,
        issues: data.Issues || [],
      };
    } catch (error) {
      logger.error('Failed to inspect URL', { error, workspaceId, brandSlug, siteUrl, url });
      return null;
    }
  }

  /**
   * Submit URL for crawling
   */
  async submitUrl(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string,
    url: string
  ): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const submitUrl = new URL(`${this.BASE_URL}/SubmitUrl`);
      submitUrl.searchParams.append('apikey', apiKey);
      submitUrl.searchParams.append('siteUrl', siteUrl);
      submitUrl.searchParams.append('url', url);

      const response = await fetch(submitUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Submit URL failed: ${response.status} ${response.statusText}`);
      }

      logger.info('URL submitted to Bing successfully', { workspaceId, brandSlug, url });

      return true;
    } catch (error) {
      logger.error('Failed to submit URL to Bing', { error, workspaceId, brandSlug, url });
      return false;
    }
  }

  /**
   * Get sitemap submission status
   */
  async getSitemaps(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string
  ): Promise<Array<{
    sitemapUrl: string;
    status: string;
    lastSubmitted?: string;
    urlsDiscovered?: number;
  }> | null> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const data = await this.makeRequest<any>('GetSitemaps', { siteUrl }, apiKey);

      if (!data || !data.results) {
        return [];
      }

      return data.results.map((item: any) => ({
        sitemapUrl: item.SitemapUrl || '',
        status: item.Status || '',
        lastSubmitted: item.LastSubmitted || undefined,
        urlsDiscovered: item.UrlsDiscovered || undefined,
      }));
    } catch (error) {
      logger.error('Failed to get Bing sitemaps', { error, workspaceId, brandSlug, siteUrl });
      return null;
    }
  }

  /**
   * Submit sitemap to Bing
   */
  async submitSitemap(
    workspaceId: string,
    brandSlug: string,
    siteUrl: string,
    sitemapUrl: string
  ): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(workspaceId, brandSlug);
      if (!apiKey) {
        throw new Error('No Bing API key found');
      }

      const submitUrl = new URL(`${this.BASE_URL}/SubmitSitemap`);
      submitUrl.searchParams.append('apikey', apiKey);
      submitUrl.searchParams.append('siteUrl', siteUrl);
      submitUrl.searchParams.append('sitemapUrl', sitemapUrl);

      const response = await fetch(submitUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Submit sitemap failed: ${response.status} ${response.statusText}`);
      }

      logger.info('Sitemap submitted to Bing successfully', {
        workspaceId,
        brandSlug,
        sitemapUrl,
      });

      return true;
    } catch (error) {
      logger.error('Failed to submit sitemap to Bing', {
        error,
        workspaceId,
        brandSlug,
        sitemapUrl,
      });
      return false;
    }
  }
}

export const bingBridge = new BingBridge();
