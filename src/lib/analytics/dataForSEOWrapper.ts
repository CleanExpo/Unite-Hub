/**
 * DataForSEO API Wrapper
 * Provides SEO intelligence: keyword research, SERP analysis, backlinks, competitor analysis
 * Implements 24-hour caching with brand-aware filtering
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'dataForSEOWrapper' });

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  competition: number;
  trends: number[]; // Monthly search volume trends
}

export interface SerpResult {
  keyword: string;
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

export interface BacklinkData {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainRank: number;
  firstSeen: string;
  lastSeen: string;
}

export interface CompetitorData {
  domain: string;
  organicTraffic: number;
  organicKeywords: number;
  paidKeywords: number;
  domainRank: number;
  backlinks: number;
}

export class DataForSEOWrapper {
  private readonly BASE_URL = 'https://api.dataforseo.com/v3';
  private readonly TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Get active DataForSEO API credentials
   */
  private async getApiCredentials(
    workspaceId: string,
    brandSlug?: string
  ): Promise<{ username: string; password: string } | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_active_integration_token', {
        p_workspace_id: workspaceId,
        p_integration_type: 'dataforseo',
        p_brand_slug: brandSlug || null,
      });

      if (error || !data || data.length === 0) {
        logger.warn('No active DataForSEO credentials found', { workspaceId, brandSlug });
        return null;
      }

      return {
        username: data[0].api_key,
        password: data[0].api_secret,
      };
    } catch (error) {
      logger.error('Error getting DataForSEO credentials', { error, workspaceId });
      return null;
    }
  }

  /**
   * Make API request to DataForSEO
   */
  private async makeRequest<T>(
    endpoint: string,
    payload: any[],
    credentials: { username: string; password: string }
  ): Promise<T | null> {
    try {
      const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

      const response = await fetch(`${this.BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`);
      }

      return data.tasks?.[0]?.result as T;
    } catch (error) {
      logger.error('DataForSEO API request failed', { error, endpoint, payload });
      return null;
    }
  }

  /**
   * Get keyword search volume and metrics
   */
  async getKeywordData(
    workspaceId: string,
    brandSlug: string,
    keywords: string[],
    locationCode: number = 2840, // USA
    languageCode: string = 'en'
  ): Promise<KeywordData[] | null> {
    const startTime = Date.now();

    try {
      const credentials = await this.getApiCredentials(workspaceId, brandSlug);
      if (!credentials) {
        throw new Error('No DataForSEO credentials found');
      }

      const payload = [
        {
          keywords,
          location_code: locationCode,
          language_code: languageCode,
          search_partners: false,
          date_from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0],
        },
      ];

      const result = await this.makeRequest<any>(
        'keywords_data/google_ads/search_volume/live',
        payload,
        credentials
      );

      if (!result) {
        return null;
      }

      const keywordDataList: KeywordData[] = result.map((item: any) => ({
        keyword: item.keyword || '',
        searchVolume: item.search_volume || 0,
        keywordDifficulty: item.keyword_difficulty || 0,
        cpc: item.cpc || 0,
        competition: item.competition || 0,
        trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
      }));

      // Cache data
      await this.cacheKeywordData(workspaceId, brandSlug, keywordDataList, locationCode, languageCode);

      logger.info('Keyword data fetched successfully', {
        workspaceId,
        brandSlug,
        keywordsCount: keywordDataList.length,
      });

      return keywordDataList;
    } catch (error) {
      logger.error('Failed to fetch keyword data', { error, workspaceId, brandSlug, keywords });
      return null;
    }
  }

  /**
   * Get SERP results for a keyword
   */
  async getSerpResults(
    workspaceId: string,
    brandSlug: string,
    keyword: string,
    locationCode: number = 2840,
    languageCode: string = 'en',
    device: 'desktop' | 'mobile' = 'desktop'
  ): Promise<SerpResult[] | null> {
    const startTime = Date.now();

    try {
      const credentials = await this.getApiCredentials(workspaceId, brandSlug);
      if (!credentials) {
        throw new Error('No DataForSEO credentials found');
      }

      const payload = [
        {
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          device,
          depth: 100, // Get top 100 results
        },
      ];

      const result = await this.makeRequest<any>(
        'serp/google/organic/live/regular',
        payload,
        credentials
      );

      if (!result || !result[0]?.items) {
        return [];
      }

      const serpResults: SerpResult[] = result[0].items
        .filter((item: any) => item.type === 'organic')
        .map((item: any, index: number) => ({
          keyword,
          position: item.rank_group || index + 1,
          url: item.url || '',
          title: item.title || '',
          description: item.description || '',
          domain: item.domain || '',
        }));

      // Cache SERP data
      await this.cacheSerpData(workspaceId, brandSlug, keyword, serpResults, locationCode, device);

      logger.info('SERP results fetched successfully', {
        workspaceId,
        brandSlug,
        keyword,
        resultsCount: serpResults.length,
      });

      return serpResults;
    } catch (error) {
      logger.error('Failed to fetch SERP results', { error, workspaceId, brandSlug, keyword });
      return null;
    }
  }

  /**
   * Find ranking position for a specific domain in SERP
   */
  async checkDomainRanking(
    workspaceId: string,
    brandSlug: string,
    keyword: string,
    domain: string,
    locationCode: number = 2840
  ): Promise<{ position: number; url: string; title: string } | null> {
    try {
      const serpResults = await this.getSerpResults(workspaceId, brandSlug, keyword, locationCode);

      if (!serpResults) {
        return null;
      }

      const domainResult = serpResults.find((result) =>
        result.domain.toLowerCase().includes(domain.toLowerCase())
      );

      if (!domainResult) {
        return null; // Not ranking in top 100
      }

      return {
        position: domainResult.position,
        url: domainResult.url,
        title: domainResult.title,
      };
    } catch (error) {
      logger.error('Failed to check domain ranking', { error, workspaceId, brandSlug, keyword, domain });
      return null;
    }
  }

  /**
   * Get backlinks for a domain
   */
  async getBacklinks(
    workspaceId: string,
    brandSlug: string,
    targetDomain: string,
    limit: number = 100
  ): Promise<BacklinkData[] | null> {
    try {
      const credentials = await this.getApiCredentials(workspaceId, brandSlug);
      if (!credentials) {
        throw new Error('No DataForSEO credentials found');
      }

      const payload = [
        {
          target: targetDomain,
          limit,
          order_by: ['domain_from_rank,desc'],
        },
      ];

      const result = await this.makeRequest<any>('backlinks/backlinks/live', payload, credentials);

      if (!result || !result[0]?.items) {
        return [];
      }

      const backlinks: BacklinkData[] = result[0].items.map((item: any) => ({
        sourceUrl: item.url_from || '',
        targetUrl: item.url_to || '',
        anchorText: item.anchor || '',
        domainRank: item.domain_from_rank || 0,
        firstSeen: item.first_seen || '',
        lastSeen: item.last_seen || '',
      }));

      logger.info('Backlinks fetched successfully', {
        workspaceId,
        brandSlug,
        targetDomain,
        backlinksCount: backlinks.length,
      });

      return backlinks;
    } catch (error) {
      logger.error('Failed to fetch backlinks', { error, workspaceId, brandSlug, targetDomain });
      return null;
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(
    workspaceId: string,
    brandSlug: string,
    targetDomain: string
  ): Promise<CompetitorData | null> {
    try {
      const credentials = await this.getApiCredentials(workspaceId, brandSlug);
      if (!credentials) {
        throw new Error('No DataForSEO credentials found');
      }

      const payload = [
        {
          target: targetDomain,
        },
      ];

      const result = await this.makeRequest<any>(
        'dataforseo_labs/google/domain_metrics/live',
        payload,
        credentials
      );

      if (!result || !result[0]) {
        return null;
      }

      const data = result[0];

      const competitorData: CompetitorData = {
        domain: targetDomain,
        organicTraffic: data.organic?.etv || 0,
        organicKeywords: data.organic?.count || 0,
        paidKeywords: data.paid?.count || 0,
        domainRank: data.rank || 0,
        backlinks: data.backlinks || 0,
      };

      logger.info('Competitor analysis fetched successfully', {
        workspaceId,
        brandSlug,
        targetDomain,
        competitorData,
      });

      return competitorData;
    } catch (error) {
      logger.error('Failed to fetch competitor analysis', { error, workspaceId, brandSlug, targetDomain });
      return null;
    }
  }

  /**
   * Cache keyword data to database
   */
  private async cacheKeywordData(
    workspaceId: string,
    brandSlug: string,
    keywords: KeywordData[],
    locationCode: number,
    languageCode: string
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const cacheEntries = keywords.map((kw) => ({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        data_source: 'dataforseo',
        api_endpoint: 'keywords_data/google_ads/search_volume/live',
        keyword: kw.keyword,
        location_code: locationCode,
        language_code: languageCode,
        search_volume: kw.searchVolume,
        keyword_difficulty: kw.keywordDifficulty,
        cpc: kw.cpc,
        competition: kw.competition,
        date_start: today,
        date_end: today,
        raw_response: { trends: kw.trends },
        uncertainty_notes:
          'Search volume data from DataForSEO (Google Ads API). Volumes are averages and may vary.',
      }));

      const { error } = await supabaseAdmin.from('dataforseo_cache').insert(cacheEntries);

      if (error) {
        logger.error('Failed to cache keyword data', { error, workspaceId, brandSlug });
      }
    } catch (error) {
      logger.error('Error caching keyword data', { error, workspaceId, brandSlug });
    }
  }

  /**
   * Cache SERP data to database
   */
  private async cacheSerpData(
    workspaceId: string,
    brandSlug: string,
    keyword: string,
    serpResults: SerpResult[],
    locationCode: number,
    device: string
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const cacheEntries = serpResults.map((result) => ({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        data_source: 'dataforseo',
        api_endpoint: 'serp/google/organic/live/regular',
        keyword,
        location_code: locationCode,
        device,
        ranking_position: result.position,
        ranking_url: result.url,
        date_start: today,
        date_end: today,
        raw_response: {
          title: result.title,
          description: result.description,
          domain: result.domain,
        },
        uncertainty_notes: 'SERP data from DataForSEO. Rankings fluctuate frequently.',
      }));

      const { error } = await supabaseAdmin.from('dataforseo_cache').insert(cacheEntries);

      if (error) {
        logger.error('Failed to cache SERP data', { error, workspaceId, brandSlug });
      }
    } catch (error) {
      logger.error('Error caching SERP data', { error, workspaceId, brandSlug });
    }
  }

  /**
   * Get cached keyword data
   */
  async getCachedKeywordData(
    workspaceId: string,
    brandSlug?: string,
    keyword?: string
  ): Promise<KeywordData[] | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_dataforseo_cache', {
        p_workspace_id: workspaceId,
        p_brand_slug: brandSlug || null,
        p_keyword: keyword || null,
        p_api_endpoint: 'keywords_data/google_ads/search_volume/live',
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      const keywordsMap = new Map<string, KeywordData>();

      data.forEach((row: any) => {
        if (!keywordsMap.has(row.keyword)) {
          keywordsMap.set(row.keyword, {
            keyword: row.keyword,
            searchVolume: row.search_volume,
            keywordDifficulty: row.keyword_difficulty,
            cpc: row.cpc,
            competition: row.competition,
            trends: row.raw_response?.trends || [],
          });
        }
      });

      return Array.from(keywordsMap.values());
    } catch (error) {
      logger.error('Error getting cached keyword data', { error, workspaceId, brandSlug });
      return null;
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

      logger.info('DataForSEO cache invalidated', { workspaceId, brandSlug });
    } catch (error) {
      logger.error('Failed to invalidate DataForSEO cache', { error, workspaceId, brandSlug });
    }
  }
}

export const dataForSEOWrapper = new DataForSEOWrapper();
