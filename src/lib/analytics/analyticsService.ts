/**
 * Analytics Service
 * Integrates Google Analytics 4 (GA4) for website traffic and user behavior metrics
 * Implements 24-hour caching with brand-aware filtering
 */

import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'analyticsService' });

export interface AnalyticsMetric {
  metric_name: string;
  metric_value: number;
  dimension_name?: string;
  dimension_value?: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  dateStart: string;
  dateEnd: string;
  property_id: string;
  uncertaintyNotes?: string;
}

export interface AnalyticsOverview {
  sessions: number;
  users: number;
  pageviews: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversions: number;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; users: number }>;
  deviceBreakdown: Array<{ device: string; sessions: number }>;
}

export class AnalyticsService {
  /**
   * Get active GA4 token
   */
  private async getActiveToken(
    workspaceId: string,
    brandSlug?: string
  ): Promise<{
    id: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    property_id: string;
  } | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_active_integration_token', {
        p_workspace_id: workspaceId,
        p_integration_type: 'google_analytics_4',
        p_brand_slug: brandSlug || null,
      });

      if (error) {
        logger.error('Failed to get active GA4 token', { error, workspaceId });
        return null;
      }

      if (!data || data.length === 0) {
        logger.warn('No active GA4 token found', { workspaceId, brandSlug });
        return null;
      }

      return data[0];
    } catch (error) {
      logger.error('Error getting active GA4 token', { error, workspaceId });
      return null;
    }
  }

  /**
   * Ensure token is valid and refresh if needed
   */
  private async ensureValidToken(tokenId: string, refreshToken?: string): Promise<string | null> {
    try {
      const { data: isExpired } = await supabaseAdmin.rpc('is_token_expired', {
        p_token_id: tokenId,
      });

      if (!isExpired || !refreshToken) {
        return null;
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

      logger.info('GA4 token refreshed successfully', { tokenId });

      return credentials.access_token || null;
    } catch (error) {
      logger.error('Failed to refresh GA4 token', { error, tokenId });
      await supabaseAdmin.rpc('increment_token_error', {
        p_token_id: tokenId,
        p_error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Fetch data from Google Analytics 4
   */
  async fetchGA4Data(
    workspaceId: string,
    brandSlug: string,
    dateStart: string,
    dateEnd: string,
    metrics: string[] = [
      'sessions',
      'totalUsers',
      'screenPageViews',
      'averageSessionDuration',
      'bounceRate',
      'conversions',
    ],
    dimensions: string[] = []
  ): Promise<AnalyticsData | null> {
    const startTime = Date.now();

    try {
      // Get active token
      const token = await this.getActiveToken(workspaceId, brandSlug);
      if (!token) {
        throw new Error('No active GA4 token found');
      }

      // Ensure token is valid
      let accessToken = token.access_token;
      if (token.refresh_token) {
        const refreshedToken = await this.ensureValidToken(token.id, token.refresh_token);
        if (refreshedToken) {
          accessToken = refreshedToken;
        }
      }

      // Initialize Google Analytics Data API
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

      // Build request
      const request = {
        property: `properties/${token.property_id}`,
        requestBody: {
          dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
          metrics: metrics.map((m) => ({ name: m })),
          dimensions: dimensions.map((d) => ({ name: d })),
        },
      };

      // Fetch data
      const response = await analyticsData.properties.runReport(request);

      const rows = response.data.rows || [];
      const metricHeaders = response.data.metricHeaders || [];
      const dimensionHeaders = response.data.dimensionHeaders || [];

      // Transform data
      const analyticsMetrics: AnalyticsMetric[] = [];

      if (dimensions.length === 0) {
        // No dimensions - return total metrics
        if (rows.length > 0) {
          const row = rows[0];
          metricHeaders.forEach((header, index) => {
            analyticsMetrics.push({
              metric_name: header.name || '',
              metric_value: parseFloat(row.metricValues?.[index]?.value || '0'),
            });
          });
        }
      } else {
        // With dimensions - return breakdown
        rows.forEach((row) => {
          const dimensionValues = row.dimensionValues || [];
          metricHeaders.forEach((metricHeader, metricIndex) => {
            dimensionHeaders.forEach((dimHeader, dimIndex) => {
              analyticsMetrics.push({
                metric_name: metricHeader.name || '',
                metric_value: parseFloat(row.metricValues?.[metricIndex]?.value || '0'),
                dimension_name: dimHeader.name,
                dimension_value: dimensionValues[dimIndex]?.value,
              });
            });
          });
        });
      }

      const data: AnalyticsData = {
        metrics: analyticsMetrics,
        dateStart,
        dateEnd,
        property_id: token.property_id,
        uncertaintyNotes:
          'Data from Google Analytics 4. Metrics may be sampled for large date ranges. Recently collected data (last 24-48 hours) may be incomplete.',
      };

      // Cache data
      await this.cacheAnalyticsData(workspaceId, brandSlug, data, response.data);

      // Log usage
      await supabaseAdmin.rpc('log_token_usage', {
        p_token_id: token.id,
        p_operation: 'fetch_ga4_data',
        p_success: true,
        p_api_endpoint: 'analyticsdata.properties.runReport',
        p_request_params: request.requestBody,
        p_response_status: 200,
        p_duration_ms: Date.now() - startTime,
        p_data_cached: true,
        p_cache_table: 'analytics_cache',
        p_records_cached: analyticsMetrics.length,
      });

      logger.info('GA4 data fetched successfully', {
        workspaceId,
        brandSlug,
        metricsCount: analyticsMetrics.length,
        rowsCount: rows.length,
      });

      return data;
    } catch (error) {
      logger.error('Failed to fetch GA4 data', {
        error,
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
      });

      // Log error
      const token = await this.getActiveToken(workspaceId, brandSlug);
      if (token) {
        await supabaseAdmin.rpc('log_token_usage', {
          p_token_id: token.id,
          p_operation: 'fetch_ga4_data',
          p_success: false,
          p_error_message: error instanceof Error ? error.message : 'Unknown error',
          p_api_endpoint: 'analyticsdata.properties.runReport',
          p_duration_ms: Date.now() - startTime,
        });
      }

      return null;
    }
  }

  /**
   * Get analytics overview (aggregated metrics)
   */
  async getAnalyticsOverview(
    workspaceId: string,
    brandSlug: string,
    dateStart: string,
    dateEnd: string
  ): Promise<AnalyticsOverview | null> {
    try {
      // Fetch total metrics (no dimensions)
      const totalMetrics = await this.fetchGA4Data(
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
        ['sessions', 'totalUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate', 'conversions']
      );

      if (!totalMetrics) {
        return null;
      }

      // Fetch top pages
      const topPagesData = await this.fetchGA4Data(
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
        ['screenPageViews'],
        ['pagePath']
      );

      // Fetch top sources
      const topSourcesData = await this.fetchGA4Data(
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
        ['totalUsers'],
        ['sessionSource']
      );

      // Fetch device breakdown
      const deviceData = await this.fetchGA4Data(
        workspaceId,
        brandSlug,
        dateStart,
        dateEnd,
        ['sessions'],
        ['deviceCategory']
      );

      // Build overview object
      const overview: AnalyticsOverview = {
        sessions: totalMetrics.metrics.find((m) => m.metric_name === 'sessions')?.metric_value || 0,
        users: totalMetrics.metrics.find((m) => m.metric_name === 'totalUsers')?.metric_value || 0,
        pageviews: totalMetrics.metrics.find((m) => m.metric_name === 'screenPageViews')?.metric_value || 0,
        averageSessionDuration:
          totalMetrics.metrics.find((m) => m.metric_name === 'averageSessionDuration')?.metric_value || 0,
        bounceRate: totalMetrics.metrics.find((m) => m.metric_name === 'bounceRate')?.metric_value || 0,
        conversions: totalMetrics.metrics.find((m) => m.metric_name === 'conversions')?.metric_value || 0,
        topPages: topPagesData
          ? topPagesData.metrics
              .filter((m) => m.dimension_value)
              .map((m) => ({
                page: m.dimension_value || '',
                views: m.metric_value,
              }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 10)
          : [],
        topSources: topSourcesData
          ? topSourcesData.metrics
              .filter((m) => m.dimension_value)
              .map((m) => ({
                source: m.dimension_value || '',
                users: m.metric_value,
              }))
              .sort((a, b) => b.users - a.users)
              .slice(0, 10)
          : [],
        deviceBreakdown: deviceData
          ? deviceData.metrics
              .filter((m) => m.dimension_value)
              .map((m) => ({
                device: m.dimension_value || '',
                sessions: m.metric_value,
              }))
          : [],
      };

      logger.info('Analytics overview generated', { workspaceId, brandSlug, overview });

      return overview;
    } catch (error) {
      logger.error('Failed to get analytics overview', { error, workspaceId, brandSlug });
      return null;
    }
  }

  /**
   * Get cached Analytics data (if available and not expired)
   */
  async getCachedData(
    workspaceId: string,
    brandSlug?: string,
    metricName?: string
  ): Promise<AnalyticsData | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_analytics_cache', {
        p_workspace_id: workspaceId,
        p_brand_slug: brandSlug || null,
        p_metric_name: metricName || null,
      });

      if (error) {
        logger.error('Failed to get cached analytics data', { error, workspaceId, brandSlug });
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const metrics: AnalyticsMetric[] = data.map((row: any) => ({
        metric_name: row.metric_name,
        metric_value: row.metric_value,
        dimension_name: row.dimension_name,
        dimension_value: row.dimension_value,
      }));

      return {
        metrics,
        dateStart: data[0].date_start,
        dateEnd: data[0].date_end,
        property_id: data[0].property_id,
        uncertaintyNotes: data[0].uncertainty_notes,
      };
    } catch (error) {
      logger.error('Error getting cached analytics data', { error, workspaceId, brandSlug });
      return null;
    }
  }

  /**
   * Cache Analytics data to database
   */
  private async cacheAnalyticsData(
    workspaceId: string,
    brandSlug: string,
    data: AnalyticsData,
    rawResponse: any
  ): Promise<void> {
    try {
      const cacheEntries = data.metrics.map((metric) => ({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        data_source: 'google_analytics_4',
        property_id: data.property_id,
        metric_name: metric.metric_name,
        metric_value: metric.metric_value,
        dimension_name: metric.dimension_name,
        dimension_value: metric.dimension_value,
        date_start: data.dateStart,
        date_end: data.dateEnd,
        raw_response: rawResponse,
        uncertainty_notes: data.uncertaintyNotes,
      }));

      const { error } = await supabaseAdmin.from('analytics_cache').insert(cacheEntries);

      if (error) {
        logger.error('Failed to cache analytics data', { error, workspaceId, brandSlug });
      } else {
        logger.info('Analytics data cached successfully', {
          workspaceId,
          brandSlug,
          entriesCount: cacheEntries.length,
        });
      }
    } catch (error) {
      logger.error('Error caching analytics data', { error, workspaceId, brandSlug });
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
      logger.error('Failed to invalidate analytics cache', { error, workspaceId, brandSlug });
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(workspaceId: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_analytics_cache_status', {
        p_workspace_id: workspaceId,
      });

      if (error) {
        logger.error('Failed to get cache status', { error, workspaceId });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error getting cache status', { error, workspaceId });
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();
