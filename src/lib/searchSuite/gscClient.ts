/**
 * Google Search Console Client
 *
 * Client for fetching GSC data including search analytics, sitemaps, and URL inspection.
 */

import { google } from 'googleapis';
import {
  GscApiResponse,
  GscQueryData,
  GscPageData,
  GscSnapshot,
} from './searchProviderTypes';

export interface GscClientConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SearchAnalyticsOptions {
  siteUrl: string;
  startDate: Date;
  endDate: Date;
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  rowLimit?: number;
  startRow?: number;
  filters?: Array<{
    dimension: string;
    operator: 'equals' | 'contains' | 'notContains';
    expression: string;
  }>;
}

export interface UrlInspectionResult {
  url: string;
  indexingStatus: 'indexed' | 'not_indexed' | 'unknown';
  crawledAs: 'desktop' | 'mobile' | 'unknown';
  lastCrawlTime?: Date;
  mobileUsability: 'usable' | 'not_usable' | 'unknown';
  richResults?: string[];
  issues?: Array<{
    severity: 'warning' | 'error';
    message: string;
  }>;
}

export interface SitemapInfo {
  path: string;
  type: 'sitemap' | 'sitemapindex';
  lastSubmitted?: Date;
  lastDownloaded?: Date;
  warnings?: number;
  errors?: number;
  isPending: boolean;
  contents?: Array<{
    type: string;
    submitted: number;
    indexed: number;
  }>;
}

class GscClient {
  private oauth2Client: ReturnType<typeof this.createOAuth2Client>;
  private searchConsole: ReturnType<typeof google.searchconsole>;

  constructor(config: GscClientConfig) {
    this.oauth2Client = this.createOAuth2Client(config);
    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client,
    });
  }

  private createOAuth2Client(config: GscClientConfig) {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId || process.env.GOOGLE_CLIENT_ID,
      config.clientSecret || process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    return oauth2Client;
  }

  /**
   * Get list of sites the user has access to
   */
  async getSites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    try {
      const response = await this.searchConsole.sites.list();
      return (response.data.siteEntry || []).map((site) => ({
        siteUrl: site.siteUrl || '',
        permissionLevel: site.permissionLevel || 'unknown',
      }));
    } catch (error) {
      console.error('[GSC] Error fetching sites:', error);
      throw error;
    }
  }

  /**
   * Fetch search analytics data
   */
  async getSearchAnalytics(options: SearchAnalyticsOptions): Promise<{
    rows: GscQueryData[] | GscPageData[];
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  }> {
    const {
      siteUrl,
      startDate,
      endDate,
      dimensions = ['query'],
      rowLimit = 1000,
      startRow = 0,
      filters,
    } = options;

    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          dimensions,
          rowLimit,
          startRow,
          dimensionFilterGroups: filters
            ? [{ filters: filters.map((f) => ({ dimension: f.dimension, operator: f.operator, expression: f.expression })) }]
            : undefined,
        },
      });

      const data = response.data as GscApiResponse;
      const rows = (data.rows || []).map((row) => ({
        [dimensions[0]]: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));

      // Calculate totals
      const totals = (data.rows || []).reduce(
        (acc, row) => ({
          clicks: acc.clicks + row.clicks,
          impressions: acc.impressions + row.impressions,
          ctrSum: acc.ctrSum + row.ctr * row.impressions,
          positionSum: acc.positionSum + row.position * row.impressions,
        }),
        { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0 }
      );

      return {
        rows: rows as GscQueryData[] | GscPageData[],
        totalClicks: totals.clicks,
        totalImpressions: totals.impressions,
        avgCtr: totals.impressions > 0 ? totals.ctrSum / totals.impressions : 0,
        avgPosition: totals.impressions > 0 ? totals.positionSum / totals.impressions : 0,
      };
    } catch (error) {
      console.error('[GSC] Error fetching search analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance breakdown by device
   */
  async getDeviceBreakdown(
    siteUrl: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { clicks: number; impressions: number; ctr: number; position: number }>> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          dimensions: ['device'],
        },
      });

      const data = response.data as GscApiResponse;
      const breakdown: Record<string, { clicks: number; impressions: number; ctr: number; position: number }> = {};

      for (const row of data.rows || []) {
        const device = row.keys[0];
        breakdown[device] = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        };
      }

      return breakdown;
    } catch (error) {
      console.error('[GSC] Error fetching device breakdown:', error);
      throw error;
    }
  }

  /**
   * Get performance breakdown by country
   */
  async getCountryBreakdown(
    siteUrl: string,
    startDate: Date,
    endDate: Date,
    limit = 20
  ): Promise<Record<string, { clicks: number; impressions: number; ctr: number; position: number }>> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          dimensions: ['country'],
          rowLimit: limit,
        },
      });

      const data = response.data as GscApiResponse;
      const breakdown: Record<string, { clicks: number; impressions: number; ctr: number; position: number }> = {};

      for (const row of data.rows || []) {
        const country = row.keys[0];
        breakdown[country] = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        };
      }

      return breakdown;
    } catch (error) {
      console.error('[GSC] Error fetching country breakdown:', error);
      throw error;
    }
  }

  /**
   * Inspect a URL
   */
  async inspectUrl(siteUrl: string, inspectionUrl: string): Promise<UrlInspectionResult> {
    try {
      const response = await this.searchConsole.urlInspection.index.inspect({
        requestBody: {
          siteUrl,
          inspectionUrl,
          languageCode: 'en',
        },
      });

      const result = response.data.inspectionResult;

      return {
        url: inspectionUrl,
        indexingStatus: this.mapIndexingStatus(result?.indexStatusResult?.verdict),
        crawledAs: this.mapCrawlType(result?.indexStatusResult?.crawledAs),
        lastCrawlTime: result?.indexStatusResult?.lastCrawlTime
          ? new Date(result.indexStatusResult.lastCrawlTime)
          : undefined,
        mobileUsability: this.mapMobileUsability(result?.mobileUsabilityResult?.verdict),
        richResults: result?.richResultsResult?.detectedItems?.map((i) => i.richResultType || '') || [],
        issues: [
          ...(result?.indexStatusResult?.indexStatusResult === 'VERDICT_UNSPECIFIED'
            ? [{ severity: 'warning' as const, message: 'Index status unknown' }]
            : []),
          ...(result?.mobileUsabilityResult?.issues || []).map((issue) => ({
            severity: 'warning' as const,
            message: issue.message || 'Mobile usability issue',
          })),
        ],
      };
    } catch (error) {
      console.error('[GSC] Error inspecting URL:', error);
      throw error;
    }
  }

  /**
   * Get sitemaps for a site
   */
  async getSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
    try {
      const response = await this.searchConsole.sitemaps.list({ siteUrl });

      return (response.data.sitemap || []).map((sitemap) => ({
        path: sitemap.path || '',
        type: sitemap.type === 'sitemapIndex' ? 'sitemapindex' : 'sitemap',
        lastSubmitted: sitemap.lastSubmitted ? new Date(sitemap.lastSubmitted) : undefined,
        lastDownloaded: sitemap.lastDownloaded ? new Date(sitemap.lastDownloaded) : undefined,
        warnings: sitemap.warnings,
        errors: sitemap.errors,
        isPending: sitemap.isPending || false,
        contents: sitemap.contents?.map((c) => ({
          type: c.type || 'unknown',
          submitted: c.submitted ? parseInt(c.submitted) : 0,
          indexed: c.indexed ? parseInt(c.indexed) : 0,
        })),
      }));
    } catch (error) {
      console.error('[GSC] Error fetching sitemaps:', error);
      throw error;
    }
  }

  /**
   * Submit a sitemap
   */
  async submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
    try {
      await this.searchConsole.sitemaps.submit({
        siteUrl,
        feedpath: sitemapUrl,
      });
    } catch (error) {
      console.error('[GSC] Error submitting sitemap:', error);
      throw error;
    }
  }

  /**
   * Create a full snapshot for storage
   */
  async createSnapshot(
    siteUrl: string,
    startDate: Date,
    endDate: Date
  ): Promise<Omit<GscSnapshot, 'id' | 'projectId' | 'workspaceId' | 'createdAt'>> {
    const [queryData, pageData, deviceBreakdown, countryBreakdown] = await Promise.all([
      this.getSearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100,
      }),
      this.getSearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 100,
      }),
      this.getDeviceBreakdown(siteUrl, startDate, endDate),
      this.getCountryBreakdown(siteUrl, startDate, endDate),
    ]);

    return {
      snapshotDate: endDate,
      clicks: queryData.totalClicks,
      impressions: queryData.totalImpressions,
      ctr: queryData.avgCtr,
      position: queryData.avgPosition,
      topQueries: queryData.rows as GscQueryData[],
      topPages: pageData.rows as GscPageData[],
      deviceBreakdown,
      countryBreakdown,
      rawData: {
        queryDataRowCount: queryData.rows.length,
        pageDataRowCount: pageData.rows.length,
      },
    };
  }

  // Helper methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private mapIndexingStatus(verdict?: string): 'indexed' | 'not_indexed' | 'unknown' {
    switch (verdict) {
      case 'PASS':
        return 'indexed';
      case 'FAIL':
      case 'EXCLUDED':
        return 'not_indexed';
      default:
        return 'unknown';
    }
  }

  private mapCrawlType(crawledAs?: string): 'desktop' | 'mobile' | 'unknown' {
    switch (crawledAs) {
      case 'DESKTOP':
        return 'desktop';
      case 'MOBILE':
        return 'mobile';
      default:
        return 'unknown';
    }
  }

  private mapMobileUsability(verdict?: string): 'usable' | 'not_usable' | 'unknown' {
    switch (verdict) {
      case 'PASS':
        return 'usable';
      case 'FAIL':
        return 'not_usable';
      default:
        return 'unknown';
    }
  }
}

export function createGscClient(config: GscClientConfig): GscClient {
  return new GscClient(config);
}

export { GscClient };
