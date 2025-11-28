/**
 * Ads Ingestion Service
 *
 * Service pulling ad performance stats and storing them in the database.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AdProvider,
  AdAccount,
  AdCampaign,
  AdPerformanceSnapshot,
  AdSyncLog,
} from './adsProviderTypes';
import { createAdsClient, AdsClientConfig } from './adsClients';
import { adsAutomationConfig } from '../../../config/adsAutomation.config';
import { tokenVault } from '@/lib/connectedApps/tokenVault';

export interface SyncOptions {
  fullSync?: boolean;
  startDate?: Date;
  endDate?: Date;
}

class AdsIngestionService {
  /**
   * Get all connected ad accounts for a workspace
   */
  async getConnectedAccounts(workspaceId: string): Promise<AdAccount[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdsIngestion] Error fetching accounts:', error);
      throw error;
    }

    return (data || []).map(this.mapAccountFromDb);
  }

  /**
   * Connect a new ad account
   */
  async connectAccount(
    workspaceId: string,
    provider: AdProvider,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    },
    accountInfo: {
      externalAccountId: string;
      name: string;
      currency?: string;
      timezone?: string;
    }
  ): Promise<AdAccount> {
    const supabase = await getSupabaseServer();

    // Encrypt tokens
    const encryptedTokens = await tokenVault.encryptTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    const { data, error } = await supabase
      .from('ad_accounts')
      .upsert({
        workspace_id: workspaceId,
        provider,
        external_account_id: accountInfo.externalAccountId,
        name: accountInfo.name,
        currency: accountInfo.currency || 'USD',
        timezone: accountInfo.timezone || 'UTC',
        access_token_encrypted: encryptedTokens.encryptedAccessToken,
        refresh_token_encrypted: encryptedTokens.encryptedRefreshToken,
        token_iv: encryptedTokens.iv,
        token_auth_tag: encryptedTokens.authTag,
        token_expires_at: tokens.expiresAt?.toISOString(),
        status: 'active',
      }, {
        onConflict: 'workspace_id,provider,external_account_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[AdsIngestion] Error connecting account:', error);
      throw error;
    }

    return this.mapAccountFromDb(data);
  }

  /**
   * Sync campaigns and metrics from an ad account
   */
  async syncAccount(
    accountId: string,
    options: SyncOptions = {}
  ): Promise<AdSyncLog> {
    const supabase = await getSupabaseServer();

    // Get account with decrypted tokens
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) {
      throw new Error('Account not found');
    }

    // Decrypt tokens
    const tokens = await tokenVault.decryptTokens({
      encryptedAccessToken: account.access_token_encrypted,
      encryptedRefreshToken: account.refresh_token_encrypted,
      iv: account.token_iv,
      authTag: account.token_auth_tag,
    });

    // Create sync log
    const syncType = options.fullSync ? 'full' : 'incremental';
    const { data: syncLog, error: syncLogError } = await supabase
      .from('ad_sync_logs')
      .insert({
        ad_account_id: accountId,
        workspace_id: account.workspace_id,
        sync_type: syncType,
        status: 'in_progress',
      })
      .select()
      .single();

    if (syncLogError) {
      throw syncLogError;
    }

    try {
      // Create platform client
      const clientConfig: AdsClientConfig = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountId: account.external_account_id,
        provider: account.provider as AdProvider,
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      };

      const client = createAdsClient(clientConfig);

      // Sync campaigns
      let campaignsSynced = 0;
      let snapshotsCreated = 0;
      let hasMore = true;
      let cursor: string | undefined;

      while (hasMore) {
        const result = await client.fetchCampaigns({ cursor, limit: 50 });

        for (const campaign of result.campaigns) {
          // Upsert campaign
          const { data: savedCampaign } = await supabase
            .from('ad_campaigns')
            .upsert({
              ad_account_id: accountId,
              workspace_id: account.workspace_id,
              external_campaign_id: campaign.externalId,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              daily_budget: campaign.dailyBudget,
              lifetime_budget: campaign.lifetimeBudget,
              start_date: campaign.startDate?.toISOString().split('T')[0],
              end_date: campaign.endDate?.toISOString().split('T')[0],
              last_sync_at: new Date().toISOString(),
            }, {
              onConflict: 'ad_account_id,external_campaign_id',
            })
            .select()
            .single();

          campaignsSynced++;

          // Fetch metrics for the campaign
          if (savedCampaign) {
            const endDate = options.endDate || new Date();
            const startDate = options.startDate ||
              new Date(Date.now() - adsAutomationConfig.syncSettings.snapshotRetentionDays * 24 * 60 * 60 * 1000);

            try {
              const metrics = await client.fetchMetrics({
                campaignId: campaign.externalId,
                startDate,
                endDate,
                granularity: adsAutomationConfig.syncSettings.metricsGranularity,
              });

              for (const metric of metrics) {
                // Create performance snapshot
                await supabase
                  .from('ad_performance_snapshots')
                  .upsert({
                    ad_campaign_id: savedCampaign.id,
                    workspace_id: account.workspace_id,
                    snapshot_date: endDate.toISOString().split('T')[0],
                    granularity: adsAutomationConfig.syncSettings.metricsGranularity,
                    impressions: metric.impressions,
                    reach: metric.reach,
                    clicks: metric.clicks,
                    ctr: metric.ctr,
                    cpc: metric.cpc,
                    cpm: metric.cpm,
                    conversions: metric.conversions,
                    conversion_value: metric.conversionValue,
                    cost: metric.cost,
                    revenue: metric.conversionValue || 0,
                    roas: metric.cost > 0 ? (metric.conversionValue || 0) / metric.cost : null,
                    raw_metrics: metric.rawData,
                  }, {
                    onConflict: 'ad_campaign_id,ad_set_id,snapshot_date,granularity',
                  });

                snapshotsCreated++;
              }
            } catch (metricError) {
              console.error(`[AdsIngestion] Error fetching metrics for campaign ${campaign.externalId}:`, metricError);
            }
          }
        }

        cursor = result.nextCursor;
        hasMore = result.hasMore;
      }

      // Update account sync state
      await supabase
        .from('ad_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      // Update sync log
      const { data: updatedLog } = await supabase
        .from('ad_sync_logs')
        .update({
          status: 'completed',
          campaigns_synced: campaignsSynced,
          snapshots_created: snapshotsCreated,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)
        .select()
        .single();

      return this.mapSyncLogFromDb(updatedLog);
    } catch (error) {
      // Update sync log with error
      await supabase
        .from('ad_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [{ code: 'SYNC_ERROR', message: String(error), timestamp: new Date().toISOString() }],
        })
        .eq('id', syncLog.id);

      throw error;
    }
  }

  /**
   * Get campaigns for a workspace
   */
  async getCampaigns(
    workspaceId: string,
    filters?: {
      accountId?: string;
      provider?: AdProvider;
      status?: string[];
    }
  ): Promise<AdCampaign[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ad_campaigns')
      .select('*, ad_accounts(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.accountId) {
      query = query.eq('ad_account_id', filters.accountId);
    }

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AdsIngestion] Error fetching campaigns:', error);
      throw error;
    }

    return (data || []).map(this.mapCampaignFromDb);
  }

  /**
   * Get performance snapshots for a campaign
   */
  async getCampaignPerformance(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      granularity?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<AdPerformanceSnapshot[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ad_performance_snapshots')
      .select('*')
      .eq('ad_campaign_id', campaignId)
      .order('snapshot_date', { ascending: false });

    if (options?.startDate) {
      query = query.gte('snapshot_date', options.startDate.toISOString().split('T')[0]);
    }

    if (options?.endDate) {
      query = query.lte('snapshot_date', options.endDate.toISOString().split('T')[0]);
    }

    if (options?.granularity) {
      query = query.eq('granularity', options.granularity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AdsIngestion] Error fetching performance:', error);
      throw error;
    }

    return (data || []).map(this.mapSnapshotFromDb);
  }

  /**
   * Get aggregated performance stats
   */
  async getPerformanceStats(
    workspaceId: string,
    options?: {
      accountId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCtr: number;
    avgCpc: number;
    avgRoas: number;
  }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ad_performance_snapshots')
      .select('cost, impressions, clicks, conversions, conversion_value, ctr, cpc, roas')
      .eq('workspace_id', workspaceId);

    if (options?.startDate) {
      query = query.gte('snapshot_date', options.startDate.toISOString().split('T')[0]);
    }

    if (options?.endDate) {
      query = query.lte('snapshot_date', options.endDate.toISOString().split('T')[0]);
    }

    const { data } = await query;

    const stats = {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgRoas: 0,
    };

    if (!data?.length) return stats;

    let ctrSum = 0;
    let cpcSum = 0;
    let roasSum = 0;
    let ctrCount = 0;
    let cpcCount = 0;
    let roasCount = 0;

    for (const snapshot of data) {
      stats.totalSpend += snapshot.cost || 0;
      stats.totalImpressions += snapshot.impressions || 0;
      stats.totalClicks += snapshot.clicks || 0;
      stats.totalConversions += snapshot.conversions || 0;

      if (snapshot.ctr !== null) {
        ctrSum += snapshot.ctr;
        ctrCount++;
      }
      if (snapshot.cpc !== null) {
        cpcSum += snapshot.cpc;
        cpcCount++;
      }
      if (snapshot.roas !== null) {
        roasSum += snapshot.roas;
        roasCount++;
      }
    }

    stats.avgCtr = ctrCount > 0 ? ctrSum / ctrCount : 0;
    stats.avgCpc = cpcCount > 0 ? cpcSum / cpcCount : 0;
    stats.avgRoas = roasCount > 0 ? roasSum / roasCount : 0;

    return stats;
  }

  // Helper methods
  private mapAccountFromDb(data: Record<string, unknown>): AdAccount {
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      provider: data.provider as AdProvider,
      externalAccountId: data.external_account_id as string,
      name: data.name as string,
      currency: data.currency as string,
      timezone: data.timezone as string,
      status: data.status as AdAccount['status'],
      accountType: data.account_type as AdAccount['accountType'],
      parentAccountId: data.parent_account_id as string | undefined,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at as string) : undefined,
      permissions: data.permissions as string[] | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapCampaignFromDb(data: Record<string, unknown>): AdCampaign {
    return {
      id: data.id as string,
      adAccountId: data.ad_account_id as string,
      workspaceId: data.workspace_id as string,
      externalCampaignId: data.external_campaign_id as string,
      name: data.name as string,
      objective: data.objective as AdCampaign['objective'],
      status: data.status as AdCampaign['status'],
      buyingType: data.buying_type as AdCampaign['buyingType'],
      dailyBudget: data.daily_budget as number | undefined,
      lifetimeBudget: data.lifetime_budget as number | undefined,
      budgetRemaining: data.budget_remaining as number | undefined,
      spendCap: data.spend_cap as number | undefined,
      startDate: data.start_date ? new Date(data.start_date as string) : undefined,
      endDate: data.end_date ? new Date(data.end_date as string) : undefined,
      bidStrategy: data.bid_strategy as string | undefined,
      bidAmount: data.bid_amount as number | undefined,
      targeting: data.targeting as Record<string, unknown> | undefined,
      placements: data.placements as unknown[] | undefined,
      optimizationGoal: data.optimization_goal as string | undefined,
      adSetsCount: data.ad_sets_count as number,
      adsCount: data.ads_count as number,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at as string) : undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapSnapshotFromDb(data: Record<string, unknown>): AdPerformanceSnapshot {
    return {
      id: data.id as string,
      adCampaignId: data.ad_campaign_id as string,
      adSetId: data.ad_set_id as string | undefined,
      workspaceId: data.workspace_id as string,
      snapshotDate: new Date(data.snapshot_date as string),
      granularity: data.granularity as AdPerformanceSnapshot['granularity'],
      impressions: data.impressions as number,
      reach: data.reach as number,
      frequency: data.frequency as number | undefined,
      clicks: data.clicks as number,
      ctr: data.ctr as number | undefined,
      cpc: data.cpc as number | undefined,
      cpm: data.cpm as number | undefined,
      conversions: data.conversions as number,
      conversionRate: data.conversion_rate as number | undefined,
      costPerConversion: data.cost_per_conversion as number | undefined,
      conversionValue: data.conversion_value as number | undefined,
      cost: data.cost as number,
      revenue: data.revenue as number,
      roas: data.roas as number | undefined,
      profit: data.profit as number | undefined,
      videoViews: data.video_views as number | undefined,
      likes: data.likes as number | undefined,
      comments: data.comments as number | undefined,
      shares: data.shares as number | undefined,
      saves: data.saves as number | undefined,
      appInstalls: data.app_installs as number | undefined,
      leads: data.leads as number | undefined,
      costPerLead: data.cost_per_lead as number | undefined,
      qualityScore: data.quality_score as number | undefined,
      relevanceScore: data.relevance_score as number | undefined,
      rawMetrics: data.raw_metrics as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapSyncLogFromDb(data: Record<string, unknown>): AdSyncLog {
    return {
      id: data.id as string,
      adAccountId: data.ad_account_id as string,
      workspaceId: data.workspace_id as string,
      syncType: data.sync_type as AdSyncLog['syncType'],
      status: data.status as AdSyncLog['status'],
      campaignsSynced: data.campaigns_synced as number,
      adSetsSynced: data.ad_sets_synced as number,
      snapshotsCreated: data.snapshots_created as number,
      opportunitiesDetected: data.opportunities_detected as number,
      errors: data.errors as AdSyncLog['errors'],
      startedAt: new Date(data.started_at as string),
      completedAt: data.completed_at ? new Date(data.completed_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const adsIngestionService = new AdsIngestionService();
