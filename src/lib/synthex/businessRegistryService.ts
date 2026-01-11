/**
 * Synthex Business Registry Service
 *
 * Phase: D40 - Multi-Business Registry + Brand Graph
 * Tables: synthex_br_*
 *
 * Features:
 * - Business CRUD operations
 * - Channel management
 * - Settings management
 * - Business relationships
 * - Asset management
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type BRBusinessStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type BRChannelType = 'website' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'google_business' | 'email' | 'sms' | 'whatsapp' | 'custom';
export type BRIndustry = 'retail' | 'ecommerce' | 'saas' | 'healthcare' | 'finance' | 'education' | 'hospitality' | 'real_estate' | 'manufacturing' | 'professional_services' | 'media' | 'nonprofit' | 'other';

export interface BRBusiness {
  id: string;
  tenant_id: string;
  external_id?: string;
  legal_name: string;
  display_name?: string;
  slug?: string;
  industry: BRIndustry;
  business_type?: string;
  region?: string;
  country_code?: string;
  timezone: string;
  currency: string;
  fiscal_year_start: number;
  website_url?: string;
  primary_email?: string;
  primary_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  status: BRBusinessStatus;
  is_primary: boolean;
  logo_url?: string;
  brand_color?: string;
  brand_guidelines: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tags: string[];
  owner_user_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BRChannel {
  id: string;
  tenant_id: string;
  business_id: string;
  channel_type: BRChannelType;
  channel_name?: string;
  channel_handle?: string;
  channel_url?: string;
  connection_id?: string;
  is_primary: boolean;
  is_connected: boolean;
  is_verified: boolean;
  last_sync_at?: string;
  follower_count?: number;
  engagement_rate?: number;
  last_metric_update?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BRSetting {
  id: string;
  tenant_id: string;
  business_id: string;
  setting_key: string;
  setting_value: unknown;
  setting_type: string;
  description?: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export interface BRRelationship {
  id: string;
  tenant_id: string;
  source_business_id: string;
  target_business_id: string;
  relationship_type: string;
  relationship_details: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BRAsset {
  id: string;
  tenant_id: string;
  business_id: string;
  asset_type: string;
  asset_name: string;
  asset_url: string;
  file_size?: number;
  mime_type?: string;
  usage_context?: string;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BRStats {
  total_businesses: number;
  active_businesses: number;
  total_channels: number;
  connected_channels: number;
  businesses_by_industry: Record<string, number>;
  businesses_by_region: Record<string, number>;
}

export interface CreateBusinessInput {
  external_id?: string;
  legal_name: string;
  display_name?: string;
  slug?: string;
  industry?: BRIndustry;
  business_type?: string;
  region?: string;
  country_code?: string;
  timezone?: string;
  currency?: string;
  website_url?: string;
  primary_email?: string;
  primary_phone?: string;
  is_primary?: boolean;
  logo_url?: string;
  brand_color?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateChannelInput {
  channel_type: BRChannelType;
  channel_name?: string;
  channel_handle?: string;
  channel_url?: string;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60-second TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Business CRUD Operations
// =============================================================================

/**
 * Create a new business
 */
export async function createBusiness(
  tenantId: string,
  input: CreateBusinessInput
): Promise<BRBusiness> {
  const slug = input.slug || input.legal_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const { data, error } = await supabaseAdmin
    .from('synthex_br_businesses')
    .insert({
      tenant_id: tenantId,
      external_id: input.external_id,
      legal_name: input.legal_name,
      display_name: input.display_name || input.legal_name,
      slug,
      industry: input.industry || 'other',
      business_type: input.business_type,
      region: input.region,
      country_code: input.country_code,
      timezone: input.timezone || 'UTC',
      currency: input.currency || 'USD',
      website_url: input.website_url,
      primary_email: input.primary_email,
      primary_phone: input.primary_phone,
      is_primary: input.is_primary ?? false,
      logo_url: input.logo_url,
      brand_color: input.brand_color,
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get business by ID
 */
export async function getBusiness(businessId: string): Promise<BRBusiness | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * List businesses for a tenant
 */
export async function listBusinesses(
  tenantId: string,
  filters?: {
    status?: BRBusinessStatus;
    industry?: BRIndustry;
    region?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<BRBusiness[]> {
  let query = supabaseAdmin
    .from('synthex_br_businesses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }
  if (filters?.region) {
    query = query.eq('region', filters.region);
  }
  if (filters?.search) {
    query = query.or(`legal_name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update business
 */
export async function updateBusiness(
  businessId: string,
  updates: Partial<CreateBusinessInput> & {
    status?: BRBusinessStatus;
  }
): Promise<BRBusiness> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_businesses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete business
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_br_businesses')
    .delete()
    .eq('id', businessId);

  if (error) throw error;
}

/**
 * Set primary business
 */
export async function setPrimaryBusiness(tenantId: string, businessId: string): Promise<BRBusiness> {
  // Clear existing primary
  await supabaseAdmin
    .from('synthex_br_businesses')
    .update({ is_primary: false })
    .eq('tenant_id', tenantId)
    .eq('is_primary', true);

  // Set new primary
  const { data, error } = await supabaseAdmin
    .from('synthex_br_businesses')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// Channel Operations
// =============================================================================

/**
 * Add channel to business
 */
export async function addChannel(
  tenantId: string,
  businessId: string,
  input: CreateChannelInput
): Promise<BRChannel> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_channels')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      channel_type: input.channel_type,
      channel_name: input.channel_name,
      channel_handle: input.channel_handle,
      channel_url: input.channel_url,
      is_primary: input.is_primary ?? false,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List channels for a business
 */
export async function listChannels(businessId: string): Promise<BRChannel[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_channels')
    .select('*')
    .eq('business_id', businessId)
    .order('is_primary', { ascending: false })
    .order('channel_type');

  if (error) throw error;
  return data || [];
}

/**
 * Update channel
 */
export async function updateChannel(
  channelId: string,
  updates: Partial<CreateChannelInput> & {
    is_connected?: boolean;
    is_verified?: boolean;
    follower_count?: number;
    engagement_rate?: number;
  }
): Promise<BRChannel> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_channels')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', channelId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove channel
 */
export async function removeChannel(channelId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_br_channels')
    .delete()
    .eq('id', channelId);

  if (error) throw error;
}

// =============================================================================
// Settings Operations
// =============================================================================

/**
 * Get setting
 */
export async function getSetting(businessId: string, key: string): Promise<BRSetting | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_settings')
    .select('*')
    .eq('business_id', businessId)
    .eq('setting_key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Set setting
 */
export async function setSetting(
  tenantId: string,
  businessId: string,
  key: string,
  value: unknown,
  options?: {
    type?: string;
    description?: string;
    is_sensitive?: boolean;
  }
): Promise<BRSetting> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_settings')
    .upsert({
      tenant_id: tenantId,
      business_id: businessId,
      setting_key: key,
      setting_value: value,
      setting_type: options?.type || 'string',
      description: options?.description,
      is_sensitive: options?.is_sensitive ?? false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'business_id,setting_key',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List settings for a business
 */
export async function listSettings(businessId: string): Promise<BRSetting[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_settings')
    .select('*')
    .eq('business_id', businessId)
    .order('setting_key');

  if (error) throw error;
  return data || [];
}

/**
 * Delete setting
 */
export async function deleteSetting(businessId: string, key: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_br_settings')
    .delete()
    .eq('business_id', businessId)
    .eq('setting_key', key);

  if (error) throw error;
}

// =============================================================================
// Relationship Operations
// =============================================================================

/**
 * Create relationship between businesses
 */
export async function createRelationship(
  tenantId: string,
  sourceBusinessId: string,
  targetBusinessId: string,
  relationshipType: string,
  details?: Record<string, unknown>
): Promise<BRRelationship> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_relationships')
    .insert({
      tenant_id: tenantId,
      source_business_id: sourceBusinessId,
      target_business_id: targetBusinessId,
      relationship_type: relationshipType,
      relationship_details: details || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List relationships for a business
 */
export async function listRelationships(businessId: string): Promise<BRRelationship[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_br_relationships')
    .select('*')
    .or(`source_business_id.eq.${businessId},target_business_id.eq.${businessId}`)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// =============================================================================
// Stats and Analytics
// =============================================================================

/**
 * Get business registry stats
 */
export async function getStats(tenantId: string): Promise<BRStats> {
  const [businessesRes, channelsRes] = await Promise.all([
    supabaseAdmin
      .from('synthex_br_businesses')
      .select('id, status, industry, region')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_br_channels')
      .select('id, is_connected')
      .eq('tenant_id', tenantId),
  ]);

  const businesses = businessesRes.data || [];
  const channels = channelsRes.data || [];

  const businessesByIndustry: Record<string, number> = {};
  const businessesByRegion: Record<string, number> = {};

  businesses.forEach(b => {
    if (b.industry) {
      businessesByIndustry[b.industry] = (businessesByIndustry[b.industry] || 0) + 1;
    }
    if (b.region) {
      businessesByRegion[b.region] = (businessesByRegion[b.region] || 0) + 1;
    }
  });

  return {
    total_businesses: businesses.length,
    active_businesses: businesses.filter(b => b.status === 'active').length,
    total_channels: channels.length,
    connected_channels: channels.filter(c => c.is_connected).length,
    businesses_by_industry: businessesByIndustry,
    businesses_by_region: businessesByRegion,
  };
}

/**
 * Get business with all related data
 */
export async function getBusinessWithDetails(businessId: string): Promise<{
  business: BRBusiness;
  channels: BRChannel[];
  settings: BRSetting[];
  relationships: BRRelationship[];
} | null> {
  const business = await getBusiness(businessId);
  if (!business) return null;

  const [channels, settings, relationships] = await Promise.all([
    listChannels(businessId),
    listSettings(businessId),
    listRelationships(businessId),
  ]);

  return { business, channels, settings, relationships };
}

// =============================================================================
// AI Features
// =============================================================================

/**
 * AI-analyze business profile and suggest improvements
 */
export async function aiAnalyzeBusinessProfile(business: BRBusiness): Promise<{
  completeness_score: number;
  missing_fields: string[];
  suggestions: string[];
  industry_insights: string;
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are a business profile analyst.
Analyze the given business profile and provide:
1. A completeness score (0-100)
2. List of missing or incomplete fields
3. Suggestions for improvement
4. Industry-specific insights

Respond in JSON format:
{
  "completeness_score": number,
  "missing_fields": string[],
  "suggestions": string[],
  "industry_insights": "string"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Business Profile:\n${JSON.stringify(business, null, 2)}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}

/**
 * AI-suggest brand channels based on industry
 */
export async function aiSuggestChannels(
  industry: BRIndustry,
  existingChannels: BRChannel[]
): Promise<{
  recommended_channels: Array<{
    channel_type: BRChannelType;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}> {
  const client = getAnthropicClient();

  const existingTypes = existingChannels.map(c => c.channel_type);

  const systemPrompt = `You are a digital marketing strategist.
Given the industry and existing channels, recommend additional channels.

Available channel types: website, facebook, instagram, twitter, linkedin, youtube, tiktok, google_business, email, sms, whatsapp, custom

Respond in JSON format:
{
  "recommended_channels": [
    {
      "channel_type": "channel_type",
      "reason": "why this channel",
      "priority": "high|medium|low"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Industry: ${industry}\nExisting channels: ${existingTypes.join(', ') || 'none'}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}
