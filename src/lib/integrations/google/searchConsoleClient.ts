/**
 * Google Search Console API Client
 *
 * Provides access to Search Console data for SEO analytics and monitoring.
 *
 * Features:
 * - Query search analytics data
 * - Get site information and verification status
 * - Submit sitemaps
 * - Monitor search performance
 * - Track indexing status
 *
 * Environment Variables:
 * - GOOGLE_CLIENT_ID: OAuth client ID
 * - GOOGLE_CLIENT_SECRET: OAuth client secret
 * - GOOGLE_REDIRECT_URI: OAuth redirect URI
 * - GOOGLE_SERVICE_ACCOUNT_KEY: Service account JSON key (base64 encoded)
 */

import { google, searchconsole_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Types
export interface SearchConsoleConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  serviceAccountKey?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface SearchAnalyticsQuery {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  dimensionFilterGroups?: {
    groupType?: 'and';
    filters: {
      dimension: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'notContains';
      expression: string;
    }[];
  }[];
  rowLimit?: number;
  startRow?: number;
}

export interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel: string;
}

export interface Sitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
}

/**
 * Google Search Console Client
 */
export class SearchConsoleClient {
  private auth: OAuth2Client;
  private searchConsole: searchconsole_v1.Searchconsole;

  constructor(config: SearchConsoleConfig) {
    if (config.serviceAccountKey) {
      // Service Account authentication
      const credentials = JSON.parse(
        Buffer.from(config.serviceAccountKey, 'base64').toString('utf-8')
      );

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      }) as any;
    } else if (config.accessToken) {
      // OAuth with access token
      this.auth = new OAuth2Client({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
      });

      this.auth.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      });
    } else {
      throw new Error('Either serviceAccountKey or accessToken must be provided');
    }

    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth: this.auth,
    });
  }

  /**
   * Query search analytics data
   */
  async querySearchAnalytics(
    query: SearchAnalyticsQuery
  ): Promise<SearchAnalyticsRow[]> {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: query.siteUrl,
        requestBody: {
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions,
          dimensionFilterGroups: query.dimensionFilterGroups,
          rowLimit: query.rowLimit || 1000,
          startRow: query.startRow || 0,
        },
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('[Search Console] Query failed:', error);
      throw error;
    }
  }

  /**
   * Get list of sites the user has access to
   */
  async listSites(): Promise<SiteInfo[]> {
    try {
      const response = await this.searchConsole.sites.list();
      return (
        response.data.siteEntry?.map((site) => ({
          siteUrl: site.siteUrl || '',
          permissionLevel: site.permissionLevel || '',
        })) || []
      );
    } catch (error) {
      console.error('[Search Console] List sites failed:', error);
      throw error;
    }
  }

  /**
   * Get information about a specific site
   */
  async getSite(siteUrl: string): Promise<SiteInfo> {
    try {
      const response = await this.searchConsole.sites.get({
        siteUrl,
      });

      return {
        siteUrl: response.data.siteUrl || '',
        permissionLevel: response.data.permissionLevel || '',
      };
    } catch (error) {
      console.error('[Search Console] Get site failed:', error);
      throw error;
    }
  }

  /**
   * List sitemaps for a site
   */
  async listSitemaps(siteUrl: string): Promise<Sitemap[]> {
    try {
      const response = await this.searchConsole.sitemaps.list({
        siteUrl,
      });

      return (
        response.data.sitemap?.map((sitemap) => ({
          path: sitemap.path || '',
          lastSubmitted: sitemap.lastSubmitted,
          isPending: sitemap.isPending,
          isSitemapsIndex: sitemap.isSitemapsIndex,
          type: sitemap.type,
          lastDownloaded: sitemap.lastDownloaded,
          warnings: sitemap.warnings?.toString(),
          errors: sitemap.errors?.toString(),
        })) || []
      );
    } catch (error) {
      console.error('[Search Console] List sitemaps failed:', error);
      throw error;
    }
  }

  /**
   * Submit a sitemap
   */
  async submitSitemap(siteUrl: string, feedpath: string): Promise<void> {
    try {
      await this.searchConsole.sitemaps.submit({
        siteUrl,
        feedpath,
      });
    } catch (error) {
      console.error('[Search Console] Submit sitemap failed:', error);
      throw error;
    }
  }

  /**
   * Delete a sitemap
   */
  async deleteSitemap(siteUrl: string, feedpath: string): Promise<void> {
    try {
      await this.searchConsole.sitemaps.delete({
        siteUrl,
        feedpath,
      });
    } catch (error) {
      console.error('[Search Console] Delete sitemap failed:', error);
      throw error;
    }
  }

  /**
   * Get top queries for a date range
   */
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<
    {
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[]
  > {
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    });

    return rows.map((row) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  }

  /**
   * Get top pages for a date range
   */
  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<
    {
      page: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[]
  > {
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    });

    return rows.map((row) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  }

  /**
   * Get search performance by country
   */
  async getPerformanceByCountry(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<
    {
      country: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[]
  > {
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['country'],
    });

    return rows.map((row) => ({
      country: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  }

  /**
   * Get search performance by device
   */
  async getPerformanceByDevice(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<
    {
      device: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[]
  > {
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['device'],
    });

    return rows.map((row) => ({
      device: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  }
}

/**
 * Create a Search Console client with server credentials
 */
export function getSearchConsoleClient(): SearchConsoleClient {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  return new SearchConsoleClient({ serviceAccountKey });
}

/**
 * Create a Search Console client with user OAuth token
 */
export function getSearchConsoleClientWithToken(
  accessToken: string,
  refreshToken?: string
): SearchConsoleClient {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }

  return new SearchConsoleClient({
    clientId,
    clientSecret,
    redirectUri,
    accessToken,
    refreshToken,
  });
}
