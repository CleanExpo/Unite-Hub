/**
 * AIDO Client Profiles Database Access Layer
 * Handles all database operations for client profile management
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ClientProfile {
  id: string;
  workspace_id: string;
  org_id: string;
  name: string;
  primary_domain: string;
  niches: string[];
  locations: string[];
  brand_tone: string | null;
  expertise_tags: string[];
  value_props: string[];
  gmb_listing_ids: string[];
  social_channels: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ClientProfileInput {
  workspaceId: string;
  orgId: string;
  name: string;
  primaryDomain: string;
  niches?: string[];
  locations?: string[];
  brandTone?: string;
  expertiseTags?: string[];
  valueProps?: string[];
  gmbListingIds?: string[];
  socialChannels?: Record<string, string>;
}

/**
 * Create a new client profile
 * @throws Error if creation fails
 */
export async function createClientProfile(data: ClientProfileInput): Promise<ClientProfile> {
  const supabase = await getSupabaseServer();

  const { data: profile, error } = await supabase
    .from('client_profiles')
    .insert({
      workspace_id: data.workspaceId,
      org_id: data.orgId,
      name: data.name,
      primary_domain: data.primaryDomain,
      niches: data.niches || [],
      locations: data.locations || [],
      brand_tone: data.brandTone || null,
      expertise_tags: data.expertiseTags || [],
      value_props: data.valueProps || [],
      gmb_listing_ids: data.gmbListingIds || [],
      social_channels: data.socialChannels || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create client profile:', error);
    throw new Error(`Failed to create client profile: ${error.message}`);
  }

  return profile;
}

/**
 * Get all client profiles for a workspace
 * Returns profiles ordered by creation date (newest first)
 */
export async function getClientProfiles(workspaceId: string): Promise<ClientProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch client profiles:', error);
    throw new Error(`Failed to fetch client profiles: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single client profile by ID
 * Enforces workspace isolation
 * @throws Error if not found or access denied
 */
export async function getClientProfile(id: string, workspaceId: string): Promise<ClientProfile> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Client profile not found or access denied');
    }
    console.error('[AIDO] Failed to fetch client profile:', error);
    throw new Error(`Failed to fetch client profile: ${error.message}`);
  }

  return data;
}

/**
 * Update a client profile
 * Enforces workspace isolation
 * @throws Error if update fails or access denied
 */
export async function updateClientProfile(
  id: string,
  workspaceId: string,
  updates: Partial<Omit<ClientProfileInput, 'workspaceId' | 'orgId'>>
): Promise<ClientProfile> {
  const supabase = await getSupabaseServer();

  // Build update object with camelCase to snake_case conversion
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.primaryDomain !== undefined) updateData.primary_domain = updates.primaryDomain;
  if (updates.niches !== undefined) updateData.niches = updates.niches;
  if (updates.locations !== undefined) updateData.locations = updates.locations;
  if (updates.brandTone !== undefined) updateData.brand_tone = updates.brandTone;
  if (updates.expertiseTags !== undefined) updateData.expertise_tags = updates.expertiseTags;
  if (updates.valueProps !== undefined) updateData.value_props = updates.valueProps;
  if (updates.gmbListingIds !== undefined) updateData.gmb_listing_ids = updates.gmbListingIds;
  if (updates.socialChannels !== undefined) updateData.social_channels = updates.socialChannels;

  const { data, error } = await supabase
    .from('client_profiles')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Client profile not found or access denied');
    }
    console.error('[AIDO] Failed to update client profile:', error);
    throw new Error(`Failed to update client profile: ${error.message}`);
  }

  return data;
}

/**
 * Delete a client profile
 * Enforces workspace isolation
 * Cascades to all related topics, intents, content, etc.
 * @throws Error if deletion fails or access denied
 */
export async function deleteClientProfile(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('client_profiles')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete client profile:', error);
    throw new Error(`Failed to delete client profile: ${error.message}`);
  }
}

/**
 * Get client profile by domain
 * Useful for domain-based lookups
 */
export async function getClientProfileByDomain(
  domain: string,
  workspaceId: string
): Promise<ClientProfile | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('primary_domain', domain)
    .maybeSingle();

  if (error) {
    console.error('[AIDO] Failed to fetch client profile by domain:', error);
    throw new Error(`Failed to fetch client profile: ${error.message}`);
  }

  return data;
}

/**
 * Search client profiles by niche
 * Uses GIN index on niches array for fast lookups
 */
export async function searchClientProfilesByNiche(
  niche: string,
  workspaceId: string
): Promise<ClientProfile[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .contains('niches', [niche])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to search client profiles by niche:', error);
    throw new Error(`Failed to search client profiles: ${error.message}`);
  }

  return data || [];
}
