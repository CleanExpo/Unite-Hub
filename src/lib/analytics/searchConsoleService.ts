/**
 * Search Console Service
 * Integrates Google Search Console and Bing Webmaster Tools
 * Implements 24-hour caching with brand-aware filtering
 */

import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'searchConsoleService' });

export interface SearchConsoleQuery {
  query: string;
  page?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleData {
  queries: SearchConsoleQuery[];
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  averagePosition: number;
  dateStart: string;
  dateEnd: string;
  source: 'google_search_console' | 'bing_webmaster_tools';
  uncertaintyNotes?: string;
}

export interface BingWebmasterQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export class SearchConsoleService {
  /**
   * Get active token for Search Console (Google or Bing)
   */
  private async getActiveToken(
    workspaceId: string,
    integrationType: 'google_search_console' | 'bing_webmaster_tools',
    brandSlug?: string
  ): Promise<{
    id: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    property_id: string;
    api_key?: string;
  } | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_active_integration_token', {
        p_workspace_id: workspaceId,
        p_integration_type: integrationType,
        p_brand_slug: brandSlug || null,
      });

      if (error) {
        logger.error('Failed to get active token', { error, workspaceId, integrationType });
        return null;
      }

      if (!data || data.length === 0) {
        logger.warn('No active token found', { workspaceId, integrationType, brandSlug });
        return null;
      }

      return data[0];
    } catch (error) {
      logger.error('Error getting active token', { error, workspaceId, integrationType });
      return null;
    }
  }

  /**
   * Check if token is expired and refresh if needed
   */
  private async ensureValidToken(tokenId: string, refreshToken?: string): Promise<string | null> {
    try {
      // Check if token is expired
      const { data: isExpired } = await supabaseAdmin.rpc('is_token_expired', {
        p_token_id: tokenId,
      });

      if (!isExpired || !refreshToken) {
        return null; // Token is valid or can't be refreshed
      }

      // Refresh token using Google OAuth
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update token in database
      await supabaseAdmin.rpc('refresh_oauth_token', {
        p_token_id: tokenId,
        p_new_access_token: credentials.access_token,
        p_new_refresh_token: credentials.refresh_token || refreshToken,
        p_expires_in_seconds: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
      });

      logger.info('Token refreshed successfully', { tokenId });

      return credentials.access_token || null;
    } catch (error) {
      logger.error('Failed to refresh token', { error, tokenId });
      await supabaseAdmin.rpc('increment_token_error', {
        p_token_id: tokenId,
        p_error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Fetch data from Google Search Console
   */
  async fetchGoogleSearchConsoleData(
    workspaceId: string,
    brandSlug: string,
    dateStart: string,
    dateEnd: string,
    options: {
      dimensions?: ('query' | 'page' | 'country' | 'device')[];
      rowLimit?: number;
    } = {}
  ): Promise<SearchConsoleData | null> {
    const startTime = Date.now();

    try {
      // Get active token
      const token = await this.getActiveToken(workspaceId, 'google_search_console', brandSlug);
      if (!token) {
        throw new Error('No active Google Search Console token found');
      }

      // Ensure token is valid
      let accessToken = token.access_token;
      if (token.refresh_token) {
        const refreshedToken = await this.ensureValidToken(token.id, token.refresh_token);
        if (refreshedToken) {
          accessToken = refreshedToken;
        }
      }

      // Initialize Google Search Console API
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

      // Build query request
      const dimensions = options.dimensions || ['query', 'page'];
      const rowLimit = options.rowLimit || 1000;

      const request = {
        siteUrl: token.property_id,
        requestBody: {
          startDate: dateStart,
          endDate: dateEnd,
          dimensions,
          rowLimit,
          dataState: 'final', // Use finalized data only
        },
      };

      // Fetch data
      const response = await searchConsole.searchanalytics.query(request);

      const rows = response.data.rows || [];

      // Transform data
      const queries: SearchConsoleQuery[] = rows.map((row) => ({
        query: row.keys?.[0] || '',
        page: dimensions.includes('page') ? row.keys?.[dimensions.indexOf('page')] : undefined,
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      // Calculate totals
      const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0);
      const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0);
      const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const averagePosition =
        queries.length > 0 ? queries.reduce((sum, q) => sum + q.position, 0) / queries.length : 0;

      const data: SearchConsoleData = {
        queries,
        totalImpressions,
        totalClicks,
        averageCtr,
        averagePosition,
        dateStart,
        dateEnd,
        source: 'google_search_console',
        uncertaintyNotes:
          'Data represents finalized Search Console metrics. Recent data (last 2-3 days) may be incomplete.',
      };

      // Cache data
      await this.cacheSearchConsoleData(workspaceId, brandSlug, data, response.data);

      // Log usage
      await supabaseAdmin.rpc('log_token_usage', {
        p_token_id: token.id,
        p_operation: 'fetch_search_console_data',
        p_success: true,
        p_api_endpoint: 'searchanalytics.query',
        p_request_params: request.requestBody,
        p_response_status: 200,
        p_duration_ms: Date.now() - startTime,
        p_data_cached: true,
        p_cache_table: 'search_console_cache',
        p_records_cached: queries.length,
      });

      logger.info('Google Search Console data fetched successfully', {
        workspaceId,
        brandSlug,
        queriesCount: queries.length,
        totalImpressions,
        totalClicks,
      });

      return data;
    } catch (error) {
      logger.error('Failed to fetch Google Search Console data', {
        error,
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
      });

      // Log error
      const token = await this.getActiveToken(workspaceId, 'google_search_console', brandSlug);
      if (token) {
        await supabaseAdmin.rpc('log_token_usage', {
          p_token_id: token.id,
          p_operation: 'fetch_search_console_data',
          p_success: false,
          p_error_message: error instanceof Error ? error.message : 'Unknown error',
          p_api_endpoint: 'searchanalytics.query',
          p_duration_ms: Date.now() - startTime,
        });
      }

      return null;
    }
  }

  /**
   * Fetch data from Bing Webmaster Tools
   */
  async fetchBingWebmasterData(
    workspaceId: string,
    brandSlug: string,
    dateStart: string,
    dateEnd: string
  ): Promise<SearchConsoleData | null> {
    const startTime = Date.now();

    try {
      // Get active token (Bing uses API key, not OAuth)
      const token = await this.getActiveToken(workspaceId, 'bing_webmaster_tools', brandSlug);
      if (!token || !token.api_key) {
        throw new Error('No active Bing Webmaster Tools API key found');
      }

      // Bing Webmaster Tools API endpoint
      const apiUrl = 'https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats';

      const params = new URLSearchParams({
        apikey: token.api_key,
        siteUrl: token.property_id,
        startDate: dateStart,
        endDate: dateEnd,
      });

      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      // Transform Bing data to common format
      const queries: SearchConsoleQuery[] = (responseData.d?.results || []).map((row: any) => ({
        query: row.Query || '',
        page: undefined, // Bing doesn't provide page-level data in this endpoint
        impressions: row.Impressions || 0,
        clicks: row.Clicks || 0,
        ctr: row.Ctr || 0,
        position: row.AvgPosition || 0,
      }));

      // Calculate totals
      const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0);
      const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0);
      const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const averagePosition =
        queries.length > 0 ? queries.reduce((sum, q) => sum + q.position, 0) / queries.length : 0;

      const data: SearchConsoleData = {
        queries,
        totalImpressions,
        totalClicks,
        averageCtr,
        averagePosition,
        dateStart,
        dateEnd,
        source: 'bing_webmaster_tools',
        uncertaintyNotes:
          'Data from Bing Webmaster Tools. Bing has lower search volume than Google in most markets.',
      };

      // Cache data
      await this.cacheSearchConsoleData(workspaceId, brandSlug, data, responseData);

      // Log usage
      await supabaseAdmin.rpc('log_token_usage', {
        p_token_id: token.id,
        p_operation: 'fetch_bing_webmaster_data',
        p_success: true,
        p_api_endpoint: apiUrl,
        p_response_status: 200,
        p_duration_ms: Date.now() - startTime,
        p_data_cached: true,
        p_cache_table: 'search_console_cache',
        p_records_cached: queries.length,
      });

      logger.info('Bing Webmaster Tools data fetched successfully', {
        workspaceId,
        brandSlug,
        queriesCount: queries.length,
        totalImpressions,
        totalClicks,
      });

      return data;
    } catch (error) {
      logger.error('Failed to fetch Bing Webmaster Tools data', {
        error,
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
      });

      // Log error
      const token = await this.getActiveToken(workspaceId, 'bing_webmaster_tools', brandSlug);
      if (token) {
        await supabaseAdmin.rpc('log_token_usage', {
          p_token_id: token.id,
          p_operation: 'fetch_bing_webmaster_data',
          p_success: false,
          p_error_message: error instanceof Error ? error.message : 'Unknown error',
          p_duration_ms: Date.now() - startTime,
        });
      }

      return null;
    }
  }

  /**
   * Get cached Search Console data (if available and not expired)
   */
  async getCachedData(
    workspaceId: string,
    brandSlug?: string,
    dataSource?: 'google_search_console' | 'bing_webmaster_tools'
  ): Promise<SearchConsoleData | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_search_console_cache', {
        p_workspace_id: workspaceId,
        p_brand_slug: brandSlug || null,
        p_data_source: dataSource || null,
      });

      if (error) {
        logger.error('Failed to get cached data', { error, workspaceId, brandSlug });
        return null;
      }

      if (!data || data.length === 0) {
        return null; // No cached data available
      }

      // Group data by query
      const queriesMap = new Map<string, SearchConsoleQuery>();
      let totalImpressions = 0;
      let totalClicks = 0;

      data.forEach((row: any) => {
        if (!queriesMap.has(row.query)) {
          queriesMap.set(row.query, {
            query: row.query,
            page: row.page,
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
          });
        }
        totalImpressions += row.impressions;
        totalClicks += row.clicks;
      });

      const queries = Array.from(queriesMap.values());
      const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const averagePosition =
        queries.length > 0 ? queries.reduce((sum, q) => sum + q.position, 0) / queries.length : 0;

      return {
        queries,
        totalImpressions,
        totalClicks,
        averageCtr,
        averagePosition,
        dateStart: data[0].date_start,
        dateEnd: data[0].date_end,
        source: data[0].data_source,
        uncertaintyNotes: data[0].uncertainty_notes,
      };
    } catch (error) {
      logger.error('Error getting cached data', { error, workspaceId, brandSlug });
      return null;
    }
  }

  /**
   * Cache Search Console data to database
   */
  private async cacheSearchConsoleData(
    workspaceId: string,
    brandSlug: string,
    data: SearchConsoleData,
    rawResponse: any
  ): Promise<void> {
    try {
      const cacheEntries = data.queries.map((query) => ({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        data_source: data.source,
        site_url: rawResponse.siteUrl || '',
        query: query.query,
        page: query.page,
        impressions: query.impressions,
        clicks: query.clicks,
        ctr: query.ctr,
        position: query.position,
        date_start: data.dateStart,
        date_end: data.dateEnd,
        raw_response: rawResponse,
        uncertainty_notes: data.uncertaintyNotes,
      }));

      const { error } = await supabaseAdmin.from('search_console_cache').insert(cacheEntries);

      if (error) {
        logger.error('Failed to cache Search Console data', { error, workspaceId, brandSlug });
      } else {
        logger.info('Search Console data cached successfully', {
          workspaceId,
          brandSlug,
          entriesCount: cacheEntries.length,
        });
      }
    } catch (error) {
      logger.error('Error caching Search Console data', { error, workspaceId, brandSlug });
    }
  }

  /**
   * Invalidate cache for manual refresh
   */
  async invalidateCache(workspaceId: string, brandSlug?: string): Promise<void> {
    try {
      await supabaseAdmin.rpc('invalidate_analytics_cache', {
        p_workspace_id: workspaceId,
        p_brand_slug: brandSlug || null,
      });

      logger.info('Analytics cache invalidated', { workspaceId, brandSlug });
    } catch (error) {
      logger.error('Failed to invalidate cache', { error, workspaceId, brandSlug });
    }
  }
}

export const searchConsoleService = new SearchConsoleService();
