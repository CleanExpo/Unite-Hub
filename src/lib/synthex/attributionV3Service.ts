/**
 * Synthex Attribution Engine v3 Service
 * Phase: D35 - Cross-Channel + Multi-Touch LTV
 *
 * Provides:
 * - Touchpoint tracking
 * - Conversion attribution
 * - Path analysis
 * - Credit allocation
 * - LTV calculation
 * - AI-powered insights
 */

import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// =====================================================
// Types
// =====================================================

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven'
  | 'custom'
  | 'ai_optimized';

export type TouchpointType =
  | 'impression'
  | 'click'
  | 'view'
  | 'engagement'
  | 'form_submit'
  | 'email_open'
  | 'email_click'
  | 'call'
  | 'chat'
  | 'meeting'
  | 'demo'
  | 'trial_start'
  | 'purchase'
  | 'referral'
  | 'organic_search'
  | 'paid_search'
  | 'social_organic'
  | 'social_paid'
  | 'direct'
  | 'affiliate'
  | 'custom';

export type ConversionType =
  | 'lead'
  | 'mql'
  | 'sql'
  | 'opportunity'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'expansion'
  | 'renewal'
  | 'churn'
  | 'custom';

export type AttributionStatus = 'pending' | 'processing' | 'attributed' | 'validated' | 'adjusted' | 'archived';

export interface Touchpoint {
  id: string;
  tenant_id: string;
  unified_profile_id?: string;
  identity_node_id?: string;
  anonymous_id?: string;
  touchpoint_type: TouchpointType;
  touchpoint_timestamp: string;
  channel: string;
  sub_channel?: string;
  campaign_id?: string;
  campaign_name?: string;
  ad_group_id?: string;
  ad_id?: string;
  source?: string;
  medium?: string;
  engagement_score?: number;
  cost?: number;
  attributes?: Record<string, unknown>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversion {
  id: string;
  tenant_id: string;
  unified_profile_id?: string;
  conversion_type: ConversionType;
  conversion_name?: string;
  conversion_timestamp: string;
  conversion_value: number;
  conversion_currency: string;
  opportunity_id?: string;
  deal_id?: string;
  status: AttributionStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AttributionPath {
  id: string;
  tenant_id: string;
  conversion_id: string;
  unified_profile_id?: string;
  path_name?: string;
  path_length: number;
  time_to_conversion_hours?: number;
  unique_channels: number;
  touchpoint_sequence: string[];
  channel_sequence: string[];
  total_cost: number;
  ai_path_analysis?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AttributionCredit {
  id: string;
  tenant_id: string;
  path_id: string;
  touchpoint_id: string;
  conversion_id: string;
  attribution_model: AttributionModel;
  credit_percentage: number;
  credit_value: number;
  position_in_path: number;
  is_first_touch: boolean;
  is_last_touch: boolean;
  confidence_score: number;
  created_at: string;
}

export interface LTV {
  id: string;
  tenant_id: string;
  unified_profile_id: string;
  total_revenue: number;
  ltv_30_days: number;
  ltv_90_days: number;
  ltv_365_days: number;
  ltv_lifetime: number;
  predicted_ltv_1yr?: number;
  predicted_ltv_3yr?: number;
  purchase_count: number;
  avg_order_value?: number;
  acquisition_channel?: string;
  acquisition_cost?: number;
  cac_ltv_ratio?: number;
  cohort_month?: string;
  ai_recommendations?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface ChannelPerformance {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  channel: string;
  sub_channel?: string;
  attribution_model: AttributionModel;
  touchpoint_count: number;
  unique_users: number;
  conversion_count: number;
  attributed_revenue: number;
  total_cost: number;
  roas?: number;
  cpa?: number;
  conversion_rate?: number;
  channel_effectiveness_score?: number;
}

export interface PathPattern {
  id: string;
  tenant_id: string;
  pattern_name: string;
  channel_sequence: string[];
  occurrence_count: number;
  conversion_count: number;
  total_revenue: number;
  conversion_rate?: number;
  effectiveness_score?: number;
  ai_pattern_insights?: Record<string, unknown>;
}

export interface AttributionReport {
  id: string;
  tenant_id: string;
  report_name: string;
  period_start: string;
  period_end: string;
  summary_metrics: Record<string, unknown>;
  channel_breakdown: Record<string, unknown>[];
  model_comparison: Record<string, unknown>[];
  ai_executive_summary?: string;
  ai_recommendations?: Record<string, unknown>[];
  created_at: string;
}

export interface AttributionStats {
  total_touchpoints: number;
  total_conversions: number;
  total_paths: number;
  total_revenue: number;
  avg_path_length: number;
  avg_time_to_conversion: number;
  touchpoints_by_channel: Record<string, number>;
  conversions_by_type: Record<string, number>;
  total_ltv_profiles: number;
  avg_ltv: number;
  total_acquisition_cost: number;
}

// =====================================================
// Lazy Anthropic Client
// =====================================================

let anthropicClient: Anthropic | null = null;
let lastClientCreation = 0;
const CLIENT_TTL = 60_000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - lastClientCreation > CLIENT_TTL) {
    anthropicClient = new Anthropic();
    lastClientCreation = now;
  }
  return anthropicClient;
}

// =====================================================
// Touchpoint Functions
// =====================================================

export async function createTouchpoint(
  tenantId: string,
  data: {
    unified_profile_id?: string;
    identity_node_id?: string;
    anonymous_id?: string;
    touchpoint_type: TouchpointType;
    touchpoint_timestamp?: string;
    channel: string;
    sub_channel?: string;
    campaign_id?: string;
    campaign_name?: string;
    ad_group_id?: string;
    ad_id?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
    referrer_url?: string;
    landing_page?: string;
    session_id?: string;
    page_views?: number;
    time_on_site?: number;
    engagement_score?: number;
    device_type?: string;
    browser?: string;
    country?: string;
    cost?: number;
    attributes?: Record<string, unknown>;
    tags?: string[];
  }
): Promise<Touchpoint> {
  const supabase = await createClient();

  const { data: touchpoint, error } = await supabase
    .from('synthex_attr_v3_touchpoints')
    .insert({
      tenant_id: tenantId,
      unified_profile_id: data.unified_profile_id,
      identity_node_id: data.identity_node_id,
      anonymous_id: data.anonymous_id,
      tp_type: data.touchpoint_type,
      touchpoint_timestamp: data.touchpoint_timestamp || new Date().toISOString(),
      channel: data.channel,
      sub_channel: data.sub_channel,
      campaign_id: data.campaign_id,
      campaign_name: data.campaign_name,
      ad_group_id: data.ad_group_id,
      ad_id: data.ad_id,
      source: data.source,
      medium: data.medium,
      content: data.content,
      term: data.term,
      referrer_url: data.referrer_url,
      landing_page: data.landing_page,
      session_id: data.session_id,
      page_views: data.page_views,
      time_on_site: data.time_on_site,
      engagement_score: data.engagement_score,
      device_type: data.device_type,
      browser: data.browser,
      country: data.country,
      cost: data.cost,
      attributes: data.attributes || {},
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create touchpoint: ${error.message}`);
}
  return touchpoint;
}

export async function getTouchpoint(touchpointId: string): Promise<Touchpoint | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_touchpoints')
    .select('*')
    .eq('id', touchpointId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get touchpoint: ${error.message}`);
  }
  return data;
}

export async function listTouchpoints(
  tenantId: string,
  filters?: {
    unified_profile_id?: string;
    channel?: string;
    touchpoint_type?: TouchpointType;
    campaign_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<Touchpoint[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_touchpoints')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('touchpoint_timestamp', { ascending: false });

  if (filters?.unified_profile_id) {
    query = query.eq('unified_profile_id', filters.unified_profile_id);
  }
  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }
  if (filters?.touchpoint_type) {
    query = query.eq('tp_type', filters.touchpoint_type);
  }
  if (filters?.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id);
  }
  if (filters?.start_date) {
    query = query.gte('touchpoint_timestamp', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('touchpoint_timestamp', filters.end_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list touchpoints: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Conversion Functions
// =====================================================

export async function createConversion(
  tenantId: string,
  data: {
    unified_profile_id?: string;
    identity_node_id?: string;
    conversion_type: ConversionType;
    conversion_name?: string;
    conversion_timestamp?: string;
    conversion_value?: number;
    conversion_currency?: string;
    quantity?: number;
    opportunity_id?: string;
    deal_id?: string;
    order_id?: string;
    product_ids?: string[];
    lookback_window_days?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<Conversion> {
  const supabase = await createClient();

  const conversionTimestamp = data.conversion_timestamp || new Date().toISOString();
  const lookbackDays = data.lookback_window_days || 30;
  const windowStart = new Date(conversionTimestamp);
  windowStart.setDate(windowStart.getDate() - lookbackDays);

  const { data: conversion, error } = await supabase
    .from('synthex_attr_v3_conversions')
    .insert({
      tenant_id: tenantId,
      unified_profile_id: data.unified_profile_id,
      identity_node_id: data.identity_node_id,
      conv_type: data.conversion_type,
      conversion_name: data.conversion_name,
      conversion_timestamp: conversionTimestamp,
      conversion_value: data.conversion_value || 0,
      conversion_currency: data.conversion_currency || 'AUD',
      quantity: data.quantity || 1,
      opportunity_id: data.opportunity_id,
      deal_id: data.deal_id,
      order_id: data.order_id,
      product_ids: data.product_ids,
      lookback_window_days: lookbackDays,
      attribution_window_start: windowStart.toISOString(),
      attribution_window_end: conversionTimestamp,
      conv_status: 'pending',
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create conversion: ${error.message}`);
}
  return conversion;
}

export async function getConversion(conversionId: string): Promise<Conversion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_conversions')
    .select('*')
    .eq('id', conversionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get conversion: ${error.message}`);
  }
  return data;
}

export async function listConversions(
  tenantId: string,
  filters?: {
    unified_profile_id?: string;
    conversion_type?: ConversionType;
    status?: AttributionStatus;
    start_date?: string;
    end_date?: string;
    min_value?: number;
    limit?: number;
  }
): Promise<Conversion[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_conversions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('conversion_timestamp', { ascending: false });

  if (filters?.unified_profile_id) {
    query = query.eq('unified_profile_id', filters.unified_profile_id);
  }
  if (filters?.conversion_type) {
    query = query.eq('conv_type', filters.conversion_type);
  }
  if (filters?.status) {
    query = query.eq('conv_status', filters.status);
  }
  if (filters?.start_date) {
    query = query.gte('conversion_timestamp', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('conversion_timestamp', filters.end_date);
  }
  if (filters?.min_value !== undefined) {
    query = query.gte('conversion_value', filters.min_value);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list conversions: ${error.message}`);
}
  return data || [];
}

export async function updateConversionStatus(
  conversionId: string,
  status: AttributionStatus
): Promise<Conversion> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_conversions')
    .update({ conv_status: status })
    .eq('id', conversionId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update conversion status: ${error.message}`);
}
  return data;
}

// =====================================================
// Path Functions
// =====================================================

export async function createAttributionPath(
  tenantId: string,
  conversionId: string,
  touchpoints: Touchpoint[]
): Promise<AttributionPath> {
  const supabase = await createClient();

  // Build path data
  const touchpointSequence = touchpoints.map((t) => t.id);
  const channelSequence = touchpoints.map((t) => t.channel);
  const uniqueChannels = [...new Set(channelSequence)].length;
  const totalCost = touchpoints.reduce((sum, t) => sum + (t.cost || 0), 0);

  // Calculate time to conversion
  let timeToConversionHours: number | undefined;
  if (touchpoints.length > 0) {
    const firstTouch = new Date(touchpoints[0].touchpoint_timestamp);
    const lastTouch = new Date(touchpoints[touchpoints.length - 1].touchpoint_timestamp);
    timeToConversionHours = (lastTouch.getTime() - firstTouch.getTime()) / (1000 * 60 * 60);
  }

  // Get conversion for profile ID
  const conversion = await getConversion(conversionId);

  const { data: path, error } = await supabase
    .from('synthex_attr_v3_paths')
    .insert({
      tenant_id: tenantId,
      conversion_id: conversionId,
      unified_profile_id: conversion?.unified_profile_id,
      path_length: touchpoints.length,
      time_to_conversion_hours: timeToConversionHours,
      unique_channels: uniqueChannels,
      unique_touchpoints: touchpoints.length,
      touchpoint_sequence: touchpointSequence,
      channel_sequence: channelSequence,
      first_touchpoint_id: touchpoints[0]?.id,
      last_touchpoint_id: touchpoints[touchpoints.length - 1]?.id,
      total_cost: totalCost,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create attribution path: ${error.message}`);
}
  return path;
}

export async function getPath(pathId: string): Promise<AttributionPath | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_paths')
    .select('*')
    .eq('id', pathId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get path: ${error.message}`);
  }
  return data;
}

export async function listPaths(
  tenantId: string,
  filters?: {
    conversion_id?: string;
    unified_profile_id?: string;
    min_path_length?: number;
    max_path_length?: number;
    limit?: number;
  }
): Promise<AttributionPath[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_paths')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.conversion_id) {
    query = query.eq('conversion_id', filters.conversion_id);
  }
  if (filters?.unified_profile_id) {
    query = query.eq('unified_profile_id', filters.unified_profile_id);
  }
  if (filters?.min_path_length !== undefined) {
    query = query.gte('path_length', filters.min_path_length);
  }
  if (filters?.max_path_length !== undefined) {
    query = query.lte('path_length', filters.max_path_length);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list paths: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Credit Functions
// =====================================================

export async function calculateCredits(
  tenantId: string,
  pathId: string,
  model: AttributionModel = 'linear'
): Promise<AttributionCredit[]> {
  const supabase = await createClient();

  // Use database function to calculate credits
  const { data, error } = await supabase.rpc('calculate_attribution_credits', {
    p_path_id: pathId,
    p_model_type: model,
  });

  if (error) {
throw new Error(`Failed to calculate credits: ${error.message}`);
}
  return data || [];
}

export async function listCredits(
  tenantId: string,
  filters?: {
    path_id?: string;
    touchpoint_id?: string;
    conversion_id?: string;
    attribution_model?: AttributionModel;
    limit?: number;
  }
): Promise<AttributionCredit[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_credits')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position_in_path', { ascending: true });

  if (filters?.path_id) {
    query = query.eq('path_id', filters.path_id);
  }
  if (filters?.touchpoint_id) {
    query = query.eq('touchpoint_id', filters.touchpoint_id);
  }
  if (filters?.conversion_id) {
    query = query.eq('conversion_id', filters.conversion_id);
  }
  if (filters?.attribution_model) {
    query = query.eq('attr_model', filters.attribution_model);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list credits: ${error.message}`);
}
  return data || [];
}

// =====================================================
// LTV Functions
// =====================================================

export async function calculateLTV(tenantId: string, profileId: string): Promise<LTV> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('calculate_profile_ltv', {
    p_tenant_id: tenantId,
    p_profile_id: profileId,
  });

  if (error) {
throw new Error(`Failed to calculate LTV: ${error.message}`);
}
  return data;
}

export async function getLTV(ltvId: string): Promise<LTV | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_ltv')
    .select('*')
    .eq('id', ltvId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get LTV: ${error.message}`);
  }
  return data;
}

export async function getLTVByProfile(
  tenantId: string,
  profileId: string
): Promise<LTV | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_attr_v3_ltv')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('unified_profile_id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get LTV by profile: ${error.message}`);
  }
  return data;
}

export async function listLTVs(
  tenantId: string,
  filters?: {
    min_ltv?: number;
    max_ltv?: number;
    acquisition_channel?: string;
    cohort_month?: string;
    limit?: number;
  }
): Promise<LTV[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_ltv')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ltv_lifetime', { ascending: false });

  if (filters?.min_ltv !== undefined) {
    query = query.gte('ltv_lifetime', filters.min_ltv);
  }
  if (filters?.max_ltv !== undefined) {
    query = query.lte('ltv_lifetime', filters.max_ltv);
  }
  if (filters?.acquisition_channel) {
    query = query.eq('acquisition_channel', filters.acquisition_channel);
  }
  if (filters?.cohort_month) {
    query = query.eq('cohort_month', filters.cohort_month);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list LTVs: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Channel Performance Functions
// =====================================================

export async function getChannelPerformance(
  tenantId: string,
  filters?: {
    period_start?: string;
    period_end?: string;
    channel?: string;
    attribution_model?: AttributionModel;
    limit?: number;
  }
): Promise<ChannelPerformance[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_channel_perf')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('attributed_revenue', { ascending: false });

  if (filters?.period_start) {
    query = query.gte('period_start', filters.period_start);
  }
  if (filters?.period_end) {
    query = query.lte('period_end', filters.period_end);
  }
  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }
  if (filters?.attribution_model) {
    query = query.eq('attr_model', filters.attribution_model);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get channel performance: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Path Pattern Functions
// =====================================================

export async function listPathPatterns(
  tenantId: string,
  filters?: {
    min_occurrences?: number;
    min_conversion_rate?: number;
    limit?: number;
  }
): Promise<PathPattern[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_path_patterns')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('effectiveness_score', { ascending: false });

  if (filters?.min_occurrences !== undefined) {
    query = query.gte('occurrence_count', filters.min_occurrences);
  }
  if (filters?.min_conversion_rate !== undefined) {
    query = query.gte('conversion_rate', filters.min_conversion_rate);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list path patterns: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Model Functions
// =====================================================

export async function createAttributionModel(
  tenantId: string,
  data: {
    model_name: string;
    model_description?: string;
    model_type: AttributionModel;
    is_default?: boolean;
    lookback_window_days?: number;
    time_decay_half_life_days?: number;
    position_weights?: Record<string, number>;
    channel_weights?: Record<string, number>;
    custom_rules?: Record<string, unknown>[];
  },
  createdBy?: string
): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data: model, error } = await supabase
    .from('synthex_attr_v3_models')
    .insert({
      tenant_id: tenantId,
      model_name: data.model_name,
      model_description: data.model_description,
      model_type: data.model_type,
      is_default: data.is_default || false,
      is_active: true,
      lookback_window_days: data.lookback_window_days || 30,
      time_decay_half_life_days: data.time_decay_half_life_days,
      position_weights: data.position_weights || { first: 0.4, middle: 0.2, last: 0.4 },
      channel_weights: data.channel_weights || {},
      custom_rules: data.custom_rules || [],
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) {
throw new Error(`Failed to create attribution model: ${error.message}`);
}
  return model;
}

export async function listAttributionModels(
  tenantId: string,
  filters?: {
    model_type?: AttributionModel;
    is_active?: boolean;
  }
): Promise<{ id: string; model_name: string; model_type: AttributionModel; is_default: boolean }[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_models')
    .select('id, model_name, model_type, is_default, is_active')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false });

  if (filters?.model_type) {
    query = query.eq('model_type', filters.model_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list attribution models: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Report Functions
// =====================================================

export async function createReport(
  tenantId: string,
  data: {
    report_name: string;
    report_description?: string;
    period_start: string;
    period_end: string;
    attribution_models?: AttributionModel[];
    channels?: string[];
    conversion_types?: ConversionType[];
  },
  createdBy?: string
): Promise<AttributionReport> {
  const supabase = await createClient();

  const { data: report, error } = await supabase
    .from('synthex_attr_v3_reports')
    .insert({
      tenant_id: tenantId,
      report_name: data.report_name,
      report_description: data.report_description,
      period_start: data.period_start,
      period_end: data.period_end,
      attribution_models: data.attribution_models || [],
      channels: data.channels,
      conversion_types: data.conversion_types,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create report: ${error.message}`);
}
  return report;
}

export async function listReports(
  tenantId: string,
  filters?: { limit?: number }
): Promise<AttributionReport[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_attr_v3_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list reports: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Stats Function
// =====================================================

export async function getAttributionStats(tenantId: string): Promise<AttributionStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_attribution_stats', {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get attribution stats: ${error.message}`);
}
  return data;
}

// =====================================================
// AI Functions
// =====================================================

export async function aiAnalyzeAttribution(
  tenantId: string,
  analysisData: {
    paths: AttributionPath[];
    conversions: Conversion[];
    touchpoints: Touchpoint[];
    channelPerformance?: ChannelPerformance[];
  }
): Promise<{
  optimal_model: AttributionModel;
  model_confidence: number;
  channel_insights: Array<{ channel: string; insight: string; recommendation: string }>;
  path_insights: Array<{ pattern: string; insight: string }>;
  ltv_predictions: Array<{ segment: string; predicted_ltv: number; confidence: number }>;
  executive_summary: string;
  recommendations: string[];
}> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Analyze this attribution data and provide insights:

Paths: ${JSON.stringify(analysisData.paths.slice(0, 20), null, 2)}
Conversions: ${JSON.stringify(analysisData.conversions.slice(0, 20), null, 2)}
Channel Performance: ${JSON.stringify(analysisData.channelPerformance?.slice(0, 10), null, 2)}

Provide:
1. Optimal attribution model recommendation
2. Channel-specific insights
3. Path pattern insights
4. LTV predictions by segment
5. Executive summary
6. Strategic recommendations

Return as JSON with keys: optimal_model, model_confidence, channel_insights, path_insights, ltv_predictions, executive_summary, recommendations`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    return {
      optimal_model: 'linear',
      model_confidence: 0.7,
      channel_insights: [],
      path_insights: [],
      ltv_predictions: [],
      executive_summary: 'Unable to generate AI analysis.',
      recommendations: [],
    };
  }
}

export async function aiPredictLTV(
  tenantId: string,
  profileData: {
    purchase_history: Array<{ date: string; value: number }>;
    touchpoint_count: number;
    channels_used: string[];
    acquisition_channel: string;
    months_active: number;
  }
): Promise<{
  predicted_ltv_1yr: number;
  predicted_ltv_3yr: number;
  predicted_ltv_lifetime: number;
  confidence: number;
  factors: Array<{ factor: string; impact: string }>;
  recommendations: string[];
}> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Predict LTV for this customer:

Purchase History: ${JSON.stringify(profileData.purchase_history)}
Touchpoint Count: ${profileData.touchpoint_count}
Channels Used: ${profileData.channels_used.join(', ')}
Acquisition Channel: ${profileData.acquisition_channel}
Months Active: ${profileData.months_active}

Predict LTV for 1 year, 3 years, and lifetime. Include confidence score, key factors, and recommendations.

Return as JSON with keys: predicted_ltv_1yr, predicted_ltv_3yr, predicted_ltv_lifetime, confidence, factors, recommendations`,
      },
    ],
  });

  try {
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock?.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    return {
      predicted_ltv_1yr: 0,
      predicted_ltv_3yr: 0,
      predicted_ltv_lifetime: 0,
      confidence: 0.5,
      factors: [],
      recommendations: [],
    };
  }
}

// =====================================================
// Full Attribution Flow
// =====================================================

export async function attributeConversion(
  tenantId: string,
  conversionId: string,
  model: AttributionModel = 'linear'
): Promise<{
  path: AttributionPath;
  credits: AttributionCredit[];
}> {
  // Get the conversion
  const conversion = await getConversion(conversionId);
  if (!conversion) {
    throw new Error(`Conversion not found: ${conversionId}`);
  }

  // Update status to processing
  await updateConversionStatus(conversionId, 'processing');

  // Get touchpoints within the attribution window
  const touchpoints = await listTouchpoints(tenantId, {
    unified_profile_id: conversion.unified_profile_id || undefined,
    start_date: conversion.metadata?.attribution_window_start as string,
    end_date: conversion.conversion_timestamp,
    limit: 100,
  });

  if (touchpoints.length === 0) {
    await updateConversionStatus(conversionId, 'attributed');
    throw new Error('No touchpoints found in attribution window');
  }

  // Sort touchpoints by timestamp
  const sortedTouchpoints = touchpoints.sort(
    (a, b) =>
      new Date(a.touchpoint_timestamp).getTime() -
      new Date(b.touchpoint_timestamp).getTime()
  );

  // Create attribution path
  const path = await createAttributionPath(tenantId, conversionId, sortedTouchpoints);

  // Calculate credits
  const credits = await calculateCredits(tenantId, path.id, model);

  // Update conversion status
  await updateConversionStatus(conversionId, 'attributed');

  return { path, credits };
}
