/**
 * Ads Platform Clients
 *
 * Client wrappers for Google Ads, Meta Ads, and TikTok Ads APIs.
 */

import {
  AdProvider,
  NormalizedCampaign,
  NormalizedMetrics,
  CampaignStatus,
  GoogleAdsCampaign,
  GoogleAdsMetrics,
  MetaAdsCampaign,
  MetaAdsInsights,
  TikTokAdsCampaign,
  TikTokAdsMetrics,
} from './adsProviderTypes';
import { getAdProviderConfig } from '../../../config/adsAutomation.config';

export interface AdsClientConfig {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  provider: AdProvider;
  developerToken?: string;
  loginCustomerId?: string;
}

export interface FetchCampaignsOptions {
  status?: CampaignStatus[];
  limit?: number;
  cursor?: string;
}

export interface FetchCampaignsResult {
  campaigns: NormalizedCampaign[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface FetchMetricsOptions {
  campaignId: string;
  startDate: Date;
  endDate: Date;
  granularity?: 'daily' | 'hourly';
}

// Base client class
abstract class BaseAdsClient {
  protected config: AdsClientConfig;

  constructor(config: AdsClientConfig) {
    this.config = config;
  }

  abstract fetchCampaigns(options?: FetchCampaignsOptions): Promise<FetchCampaignsResult>;
  abstract fetchMetrics(options: FetchMetricsOptions): Promise<NormalizedMetrics[]>;
  abstract getAccountInfo(): Promise<{ id: string; name: string; currency: string; timezone: string }>;

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

// Google Ads Client
export class GoogleAdsClient extends BaseAdsClient {
  private baseUrl = 'https://googleads.googleapis.com/v16';

  async fetchCampaigns(options: FetchCampaignsOptions = {}): Promise<FetchCampaignsResult> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.campaign_budget,
        campaign.start_date,
        campaign.end_date
      FROM campaign
      ${options.status?.length ? `WHERE campaign.status IN (${options.status.map(s => `'${s.toUpperCase()}'`).join(',')})` : ''}
      LIMIT ${options.limit || 100}
    `;

    const url = `${this.baseUrl}/customers/${this.config.accountId}/googleAds:searchStream`;
    const response = await this.makeRequest<{ results: Array<{ campaign: GoogleAdsCampaign }> }>(url, {
      method: 'POST',
      headers: {
        'developer-token': this.config.developerToken || '',
        'login-customer-id': this.config.loginCustomerId || this.config.accountId,
      },
      body: JSON.stringify({ query }),
    });

    const campaigns = (response.results || []).map((r) => this.normalizeCampaign(r.campaign));

    return {
      campaigns,
      hasMore: campaigns.length >= (options.limit || 100),
    };
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<NormalizedMetrics[]> {
    const query = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm
      FROM campaign
      WHERE campaign.id = ${options.campaignId}
        AND segments.date >= '${this.formatDate(options.startDate)}'
        AND segments.date <= '${this.formatDate(options.endDate)}'
    `;

    const url = `${this.baseUrl}/customers/${this.config.accountId}/googleAds:searchStream`;
    const response = await this.makeRequest<{
      results: Array<{ segments: { date: string }; metrics: GoogleAdsMetrics }>;
    }>(url, {
      method: 'POST',
      headers: {
        'developer-token': this.config.developerToken || '',
        'login-customer-id': this.config.loginCustomerId || this.config.accountId,
      },
      body: JSON.stringify({ query }),
    });

    return (response.results || []).map((r) => this.normalizeMetrics(r.metrics));
  }

  async getAccountInfo() {
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
    `;

    const url = `${this.baseUrl}/customers/${this.config.accountId}/googleAds:searchStream`;
    const response = await this.makeRequest<{
      results: Array<{
        customer: { id: string; descriptiveName: string; currencyCode: string; timeZone: string };
      }>;
    }>(url, {
      method: 'POST',
      headers: {
        'developer-token': this.config.developerToken || '',
      },
      body: JSON.stringify({ query }),
    });

    const customer = response.results?.[0]?.customer;
    return {
      id: customer?.id || this.config.accountId,
      name: customer?.descriptiveName || '',
      currency: customer?.currencyCode || 'USD',
      timezone: customer?.timeZone || 'UTC',
    };
  }

  private normalizeCampaign(campaign: GoogleAdsCampaign): NormalizedCampaign {
    return {
      externalId: campaign.id,
      provider: 'google',
      name: campaign.name,
      status: this.mapStatus(campaign.status),
      startDate: campaign.startDate ? new Date(campaign.startDate) : undefined,
      endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
      rawData: campaign,
    };
  }

  private normalizeMetrics(metrics: GoogleAdsMetrics): NormalizedMetrics {
    return {
      impressions: parseInt(metrics.impressions) || 0,
      clicks: parseInt(metrics.clicks) || 0,
      cost: (parseInt(metrics.costMicros) || 0) / 1000000,
      conversions: metrics.conversions || 0,
      conversionValue: metrics.conversionValue,
      ctr: metrics.ctr,
      cpc: metrics.averageCpc,
      cpm: metrics.averageCpm,
      rawData: metrics,
    };
  }

  private mapStatus(status: string): CampaignStatus {
    const mapping: Record<string, CampaignStatus> = {
      ENABLED: 'active',
      PAUSED: 'paused',
      REMOVED: 'deleted',
    };
    return mapping[status] || 'draft';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Meta (Facebook/Instagram) Ads Client
export class MetaAdsClient extends BaseAdsClient {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async fetchCampaigns(options: FetchCampaignsOptions = {}): Promise<FetchCampaignsResult> {
    const params = new URLSearchParams({
      fields: 'id,name,status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time',
      limit: String(options.limit || 100),
    });

    if (options.status?.length) {
      params.set('filtering', JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: options.status.map(s => s.toUpperCase()),
      }]));
    }

    if (options.cursor) {
      params.set('after', options.cursor);
    }

    const url = `${this.baseUrl}/act_${this.config.accountId}/campaigns?${params}`;
    const response = await this.makeRequest<{
      data: MetaAdsCampaign[];
      paging?: { cursors: { after: string }; next?: string };
    }>(url);

    const campaigns = (response.data || []).map((c) => this.normalizeCampaign(c));

    return {
      campaigns,
      nextCursor: response.paging?.cursors?.after,
      hasMore: !!response.paging?.next,
    };
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<NormalizedMetrics[]> {
    const params = new URLSearchParams({
      fields: 'impressions,reach,clicks,spend,actions,cost_per_action_type,video_p25_watched_actions',
      time_range: JSON.stringify({
        since: this.formatDate(options.startDate),
        until: this.formatDate(options.endDate),
      }),
      time_increment: options.granularity === 'hourly' ? '1' : 'all_days',
    });

    const url = `${this.baseUrl}/${options.campaignId}/insights?${params}`;
    const response = await this.makeRequest<{ data: MetaAdsInsights[] }>(url);

    return (response.data || []).map((i) => this.normalizeMetrics(i));
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/act_${this.config.accountId}?fields=id,name,currency,timezone_name`;
    const response = await this.makeRequest<{
      id: string;
      name: string;
      currency: string;
      timezone_name: string;
    }>(url);

    return {
      id: response.id,
      name: response.name,
      currency: response.currency,
      timezone: response.timezone_name,
    };
  }

  private normalizeCampaign(campaign: MetaAdsCampaign): NormalizedCampaign {
    return {
      externalId: campaign.id,
      provider: 'meta',
      name: campaign.name,
      status: this.mapStatus(campaign.status),
      objective: campaign.objective as NormalizedCampaign['objective'],
      dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : undefined,
      lifetimeBudget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : undefined,
      startDate: campaign.start_time ? new Date(campaign.start_time) : undefined,
      endDate: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
      rawData: campaign,
    };
  }

  private normalizeMetrics(insights: MetaAdsInsights): NormalizedMetrics {
    const conversions = (insights.actions || [])
      .filter((a) => a.action_type === 'purchase' || a.action_type === 'lead')
      .reduce((sum, a) => sum + parseFloat(a.value), 0);

    return {
      impressions: parseInt(insights.impressions) || 0,
      reach: parseInt(insights.reach) || 0,
      clicks: parseInt(insights.clicks) || 0,
      cost: parseFloat(insights.spend) || 0,
      conversions,
      rawData: insights,
    };
  }

  private mapStatus(status: string): CampaignStatus {
    const mapping: Record<string, CampaignStatus> = {
      ACTIVE: 'active',
      PAUSED: 'paused',
      DELETED: 'deleted',
      ARCHIVED: 'archived',
    };
    return mapping[status] || 'draft';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// TikTok Ads Client
export class TikTokAdsClient extends BaseAdsClient {
  private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';

  async fetchCampaigns(options: FetchCampaignsOptions = {}): Promise<FetchCampaignsResult> {
    const url = `${this.baseUrl}/campaign/get/`;
    const response = await this.makeRequest<{
      data: { list: TikTokAdsCampaign[]; page_info: { page: number; total_page: number } };
    }>(url, {
      method: 'GET',
      headers: {
        'Access-Token': this.config.accessToken,
      },
    });

    const campaigns = (response.data?.list || []).map((c) => this.normalizeCampaign(c));

    return {
      campaigns,
      hasMore: response.data?.page_info?.page < response.data?.page_info?.total_page,
    };
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<NormalizedMetrics[]> {
    const url = `${this.baseUrl}/report/integrated/get/`;
    const response = await this.makeRequest<{
      data: { list: Array<{ dimensions: { stat_time_day: string }; metrics: TikTokAdsMetrics }> };
    }>(url, {
      method: 'POST',
      headers: {
        'Access-Token': this.config.accessToken,
      },
      body: JSON.stringify({
        advertiser_id: this.config.accountId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: 'AUCTION_CAMPAIGN',
        dimensions: ['campaign_id', 'stat_time_day'],
        metrics: ['impression', 'click', 'cost', 'conversion', 'ctr', 'cpm', 'cpc'],
        start_date: this.formatDate(options.startDate),
        end_date: this.formatDate(options.endDate),
        filters: [{ field_name: 'campaign_id', filter_type: 'IN', filter_value: [options.campaignId] }],
      }),
    });

    return (response.data?.list || []).map((r) => this.normalizeMetrics(r.metrics));
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/advertiser/info/`;
    const response = await this.makeRequest<{
      data: { list: Array<{ advertiser_id: string; advertiser_name: string; currency: string; timezone: string }> };
    }>(url, {
      headers: {
        'Access-Token': this.config.accessToken,
      },
    });

    const account = response.data?.list?.[0];
    return {
      id: account?.advertiser_id || this.config.accountId,
      name: account?.advertiser_name || '',
      currency: account?.currency || 'USD',
      timezone: account?.timezone || 'UTC',
    };
  }

  private normalizeCampaign(campaign: TikTokAdsCampaign): NormalizedCampaign {
    return {
      externalId: campaign.campaign_id,
      provider: 'tiktok',
      name: campaign.campaign_name,
      status: this.mapStatus(campaign.campaign_status),
      objective: campaign.objective_type as NormalizedCampaign['objective'],
      dailyBudget: campaign.budget_mode === 'BUDGET_MODE_DAY' ? campaign.budget : undefined,
      lifetimeBudget: campaign.budget_mode === 'BUDGET_MODE_TOTAL' ? campaign.budget : undefined,
      rawData: campaign,
    };
  }

  private normalizeMetrics(metrics: TikTokAdsMetrics): NormalizedMetrics {
    return {
      impressions: metrics.impression || 0,
      clicks: metrics.click || 0,
      cost: metrics.cost || 0,
      conversions: metrics.conversion || 0,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      cpm: metrics.cpm,
      rawData: metrics,
    };
  }

  private mapStatus(status: string): CampaignStatus {
    const mapping: Record<string, CampaignStatus> = {
      CAMPAIGN_STATUS_ENABLE: 'active',
      CAMPAIGN_STATUS_DISABLE: 'paused',
      CAMPAIGN_STATUS_DELETE: 'deleted',
    };
    return mapping[status] || 'draft';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Factory function
export function createAdsClient(config: AdsClientConfig): BaseAdsClient {
  switch (config.provider) {
    case 'google':
      return new GoogleAdsClient(config);
    case 'meta':
      return new MetaAdsClient(config);
    case 'tiktok':
      return new TikTokAdsClient(config);
    default:
      throw new Error(`Unsupported ad provider: ${config.provider}`);
  }
}

export { BaseAdsClient };
