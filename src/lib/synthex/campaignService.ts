/**
 * Campaign Service Layer
 *
 * Encapsulates all database operations for synthex_campaigns table.
 * Used by API routes for campaign management functionality.
 *
 * Phase: B3 - Synthex Campaigns
 *
 * @deprecated MIGRATING TO STANDALONE SYNTHEX
 * This service is being extracted to: github.com/CleanExpo/Synthex
 * New location: lib/services/campaigns/campaignService.ts
 *
 * DO NOT add new features here. All new development should happen in Synthex repo.
 * This file will be removed once Unite-Hub fully delegates to Synthex via webhooks.
 *
 * Migration date: 2026-01-24
 * Target removal: After Synthex V1 launch
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type CampaignType = 'email' | 'drip' | 'automation' | 'sequence';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export interface CampaignStep {
  id: string;
  type: 'email' | 'delay' | 'condition' | 'action';
  name: string;
  config: Record<string, unknown>;
  order: number;
}

export interface SynthexCampaign {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  steps: CampaignStep[];
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  target_audience: Record<string, unknown> | null;
  recipient_count: number | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  emails_unsubscribed: number;
  settings: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  name: string;
  description?: string | null;
  type?: CampaignType;
  status?: CampaignStatus;
  steps?: CampaignStep[];
  scheduledAt?: string | null;
  targetAudience?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

export interface ListCampaignsParams {
  tenantId: string;
  brandId?: string | null;
  type?: CampaignType;
  status?: CampaignStatus;
  limit?: number;
  offset?: number;
}

export interface ListCampaignsResult {
  campaigns: SynthexCampaign[];
  total: number;
  hasMore: boolean;
}

export interface CampaignStats {
  total: number;
  active: number;
  drafts: number;
  completed: number;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Create a new campaign
 */
export async function createCampaign(params: CreateCampaignParams): Promise<SynthexCampaign> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: params.tenantId,
    brand_id: params.brandId || null,
    user_id: params.userId,
    name: params.name,
    description: params.description || null,
    type: params.type || 'email',
    status: params.status || 'draft',
    steps: JSON.stringify(params.steps || []),
    scheduled_at: params.scheduledAt || null,
    target_audience: params.targetAudience ? JSON.stringify(params.targetAudience) : null,
    settings: params.settings ? JSON.stringify(params.settings) : null,
    meta: params.meta ? JSON.stringify(params.meta) : null,
  };

  const { data, error } = await supabase
    .from('synthex_campaigns')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[campaignService] Failed to create campaign:', error);
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return parseCampaignRow(data);
}

/**
 * List campaigns with filters and pagination
 */
export async function listCampaigns(params: ListCampaignsParams): Promise<ListCampaignsResult> {
  const { tenantId, brandId, type, status, limit = 20, offset = 0 } = params;

  const supabase = await createClient();

  let query = supabase
    .from('synthex_campaigns')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[campaignService] Failed to list campaigns:', error);
    throw new Error(`Failed to list campaigns: ${error.message}`);
  }

  const campaigns = (data || []).map(parseCampaignRow);
  const total = count || 0;
  const hasMore = offset + campaigns.length < total;

  return { campaigns, total, hasMore };
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(campaignId: string, tenantId: string): Promise<SynthexCampaign | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[campaignService] Failed to get campaign:', error);
    throw new Error(`Failed to get campaign: ${error.message}`);
  }

  return data ? parseCampaignRow(data) : null;
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: string,
  tenantId: string,
  updates: Partial<CreateCampaignParams>
): Promise<SynthexCampaign> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) {
updateData.name = updates.name;
}
  if (updates.description !== undefined) {
updateData.description = updates.description;
}
  if (updates.type !== undefined) {
updateData.type = updates.type;
}
  if (updates.status !== undefined) {
updateData.status = updates.status;
}
  if (updates.steps !== undefined) {
updateData.steps = JSON.stringify(updates.steps);
}
  if (updates.scheduledAt !== undefined) {
updateData.scheduled_at = updates.scheduledAt;
}
  if (updates.targetAudience !== undefined) {
    updateData.target_audience = updates.targetAudience ? JSON.stringify(updates.targetAudience) : null;
  }
  if (updates.settings !== undefined) {
    updateData.settings = updates.settings ? JSON.stringify(updates.settings) : null;
  }
  if (updates.meta !== undefined) {
    updateData.meta = updates.meta ? JSON.stringify(updates.meta) : null;
  }

  const { data, error } = await supabase
    .from('synthex_campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[campaignService] Failed to update campaign:', error);
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  return parseCampaignRow(data);
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  tenantId: string,
  status: CampaignStatus
): Promise<SynthexCampaign> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'active') {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('synthex_campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[campaignService] Failed to update campaign status:', error);
    throw new Error(`Failed to update campaign status: ${error.message}`);
  }

  return parseCampaignRow(data);
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('synthex_campaigns')
    .delete({ count: 'exact' })
    .eq('id', campaignId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[campaignService] Failed to delete campaign:', error);
    throw new Error(`Failed to delete campaign: ${error.message}`);
  }

  return (count || 0) > 0;
}

/**
 * Get campaign stats for a tenant
 */
export async function getCampaignStats(tenantId: string, brandId?: string): Promise<CampaignStats> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_campaigns')
    .select('status, emails_sent, emails_opened, emails_clicked')
    .eq('tenant_id', tenantId);

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[campaignService] Failed to get campaign stats:', error);
    throw new Error(`Failed to get campaign stats: ${error.message}`);
  }

  const stats: CampaignStats = {
    total: 0,
    active: 0,
    drafts: 0,
    completed: 0,
    total_emails_sent: 0,
    total_opens: 0,
    total_clicks: 0,
    avg_open_rate: 0,
    avg_click_rate: 0,
  };

  for (const row of data || []) {
    stats.total++;

    if (row.status === 'active') {
stats.active++;
}
    if (row.status === 'draft') {
stats.drafts++;
}
    if (row.status === 'completed') {
stats.completed++;
}

    stats.total_emails_sent += row.emails_sent || 0;
    stats.total_opens += row.emails_opened || 0;
    stats.total_clicks += row.emails_clicked || 0;
  }

  if (stats.total_emails_sent > 0) {
    stats.avg_open_rate = Math.round((stats.total_opens / stats.total_emails_sent) * 100);
    stats.avg_click_rate = Math.round((stats.total_clicks / stats.total_emails_sent) * 100);
  }

  return stats;
}

/**
 * Increment campaign metrics
 */
export async function incrementCampaignMetric(
  campaignId: string,
  metric: 'emails_sent' | 'emails_opened' | 'emails_clicked' | 'emails_bounced' | 'emails_unsubscribed',
  amount: number = 1
): Promise<void> {
  const supabase = await createClient();

  // Use RPC for atomic increment (or fallback to read-update)
  const { data: campaign, error: fetchError } = await supabase
    .from('synthex_campaigns')
    .select(metric)
    .eq('id', campaignId)
    .single();

  if (fetchError) {
    console.error('[campaignService] Failed to fetch campaign for metric update:', fetchError);
    return;
  }

  const newValue = ((campaign?.[metric] as number) || 0) + amount;

  const { error: updateError } = await supabase
    .from('synthex_campaigns')
    .update({ [metric]: newValue })
    .eq('id', campaignId);

  if (updateError) {
    console.error('[campaignService] Failed to update campaign metric:', updateError);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function parseCampaignRow(row: Record<string, unknown>): SynthexCampaign {
  return {
    ...row,
    steps: row.steps
      ? typeof row.steps === 'string'
        ? JSON.parse(row.steps)
        : row.steps
      : [],
    target_audience: row.target_audience
      ? typeof row.target_audience === 'string'
        ? JSON.parse(row.target_audience)
        : row.target_audience
      : null,
    settings: row.settings
      ? typeof row.settings === 'string'
        ? JSON.parse(row.settings)
        : row.settings
      : null,
    meta: row.meta
      ? typeof row.meta === 'string'
        ? JSON.parse(row.meta)
        : row.meta
      : null,
  } as SynthexCampaign;
}
