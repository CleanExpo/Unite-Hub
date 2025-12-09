import { getSupabaseServer } from '@/lib/supabase';

/**
 * Business Identity Vault Service for Founder OS (AI Phill)
 *
 * Manages per-business identity profiles, channels, and AI snapshots
 * using Google Leak doctrine signals (NavBoost, Q*, E-E-A-T, sandbox, etc.)
 */

// Types for Business Identity Vault
export interface BusinessIdentityProfile {
  id: string;
  owner_profile_id: string;
  business_key: string;
  display_name: string;
  legal_name: string | null;
  primary_domain: string | null;
  primary_gmb_location: string | null;
  primary_region: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessIdentityChannel {
  id: string;
  business_id: string;
  channel_type: string;
  provider: string;
  account_label: string | null;
  external_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BusinessIdentityAISnapshot {
  id: string;
  business_id: string;
  snapshot_type: string;
  summary_markdown: string;
  navboost_risk_score: number | null;
  q_star_proxy_score: number | null;
  eeat_strength_score: number | null;
  sandbox_risk_score: number | null;
  behaviour_signal_opportunity_score: number | null;
  gap_opportunities: Record<string, unknown>;
  created_at: string;
}

export interface BusinessWithDetails {
  business: BusinessIdentityProfile;
  channels: BusinessIdentityChannel[];
  snapshots: BusinessIdentityAISnapshot[];
}

/**
 * List all businesses for the current founder
 */
export async function listFounderBusinesses(): Promise<BusinessIdentityProfile[]> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
return [];
}

  const { data, error } = await supabase
    .from('business_identity_profiles')
    .select('*')
    .eq('owner_profile_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[businessVaultService] Error listing businesses:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Get a single business with its channels and recent snapshots
 */
export async function getBusinessWithChannels(businessKey: string): Promise<BusinessWithDetails | null> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
return null;
}

  // Get the business profile
  const { data: business, error: businessError } = await supabase
    .from('business_identity_profiles')
    .select('*')
    .eq('owner_profile_id', user.id)
    .eq('business_key', businessKey)
    .single();

  if (businessError || !business) {
    console.error('[businessVaultService] Error fetching business:', businessError);
    return null;
  }

  // Get channels for this business
  const { data: channels } = await supabase
    .from('business_identity_channels')
    .select('*')
    .eq('business_id', business.id);

  // Get recent AI snapshots (last 5)
  const { data: snapshots } = await supabase
    .from('business_identity_ai_snapshots')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    business,
    channels: channels ?? [],
    snapshots: snapshots ?? []
  };
}

/**
 * Create or update a business profile
 */
export async function upsertBusinessProfile(input: {
  business_key: string;
  display_name: string;
  legal_name?: string;
  primary_domain?: string;
  primary_gmb_location?: string;
  primary_region?: string;
  industry?: string;
  notes?: string;
}): Promise<BusinessIdentityProfile> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
throw new Error('Not authenticated');
}

  const payload = {
    owner_profile_id: user.id,
    business_key: input.business_key,
    display_name: input.display_name,
    legal_name: input.legal_name ?? null,
    primary_domain: input.primary_domain ?? null,
    primary_gmb_location: input.primary_gmb_location ?? null,
    primary_region: input.primary_region ?? null,
    industry: input.industry ?? null,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('business_identity_profiles')
    .upsert(payload, { onConflict: 'business_key' })
    .select('*')
    .single();

  if (error) {
    console.error('[businessVaultService] Error upserting business:', error);
    throw error;
  }

  return data;
}

/**
 * Create an AI snapshot for a business
 * Uses Google Leak doctrine signals (NavBoost, Q*, E-E-A-T, sandbox, etc.)
 */
export async function createBusinessSnapshot(businessKey: string, snapshot: {
  snapshot_type: string;
  summary_markdown: string;
  navboost_risk_score?: number;
  q_star_proxy_score?: number;
  eeat_strength_score?: number;
  sandbox_risk_score?: number;
  behaviour_signal_opportunity_score?: number;
  gap_opportunities?: Record<string, unknown>;
}): Promise<BusinessIdentityAISnapshot> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
throw new Error('Not authenticated');
}

  // Get the business ID first
  const { data: business, error: businessError } = await supabase
    .from('business_identity_profiles')
    .select('id')
    .eq('owner_profile_id', user.id)
    .eq('business_key', businessKey)
    .single();

  if (businessError || !business) {
    throw new Error('Business not found');
  }

  const insertPayload = {
    business_id: business.id,
    snapshot_type: snapshot.snapshot_type,
    summary_markdown: snapshot.summary_markdown,
    navboost_risk_score: snapshot.navboost_risk_score ?? null,
    q_star_proxy_score: snapshot.q_star_proxy_score ?? null,
    eeat_strength_score: snapshot.eeat_strength_score ?? null,
    sandbox_risk_score: snapshot.sandbox_risk_score ?? null,
    behaviour_signal_opportunity_score: snapshot.behaviour_signal_opportunity_score ?? null,
    gap_opportunities: snapshot.gap_opportunities ?? {}
  };

  const { data: created, error } = await supabase
    .from('business_identity_ai_snapshots')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('[businessVaultService] Error creating snapshot:', error);
    throw error;
  }

  return created;
}

/**
 * Add a channel to a business
 */
export async function addBusinessChannel(businessKey: string, channel: {
  channel_type: string;
  provider: string;
  account_label?: string;
  external_id?: string;
  meta?: Record<string, unknown>;
}): Promise<BusinessIdentityChannel> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
throw new Error('Not authenticated');
}

  // Get the business ID first
  const { data: business, error: businessError } = await supabase
    .from('business_identity_profiles')
    .select('id')
    .eq('owner_profile_id', user.id)
    .eq('business_key', businessKey)
    .single();

  if (businessError || !business) {
    throw new Error('Business not found');
  }

  const insertPayload = {
    business_id: business.id,
    channel_type: channel.channel_type,
    provider: channel.provider,
    account_label: channel.account_label ?? null,
    external_id: channel.external_id ?? null,
    meta: channel.meta ?? {}
  };

  const { data: created, error } = await supabase
    .from('business_identity_channels')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('[businessVaultService] Error adding channel:', error);
    throw error;
  }

  return created;
}

/**
 * Get portfolio-wide statistics for all businesses
 */
export async function getPortfolioStats(): Promise<{
  totalBusinesses: number;
  totalChannels: number;
  totalSnapshots: number;
  businesses: Array<{
    business_key: string;
    display_name: string;
    channel_count: number;
    latest_snapshot_date: string | null;
  }>;
}> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      totalBusinesses: 0,
      totalChannels: 0,
      totalSnapshots: 0,
      businesses: []
    };
  }

  // Get all businesses with channel counts
  const { data: businesses } = await supabase
    .from('business_identity_profiles')
    .select(`
      id,
      business_key,
      display_name,
      business_identity_channels(count),
      business_identity_ai_snapshots(created_at)
    `)
    .eq('owner_profile_id', user.id);

  if (!businesses) {
    return {
      totalBusinesses: 0,
      totalChannels: 0,
      totalSnapshots: 0,
      businesses: []
    };
  }

  let totalChannels = 0;
  let totalSnapshots = 0;

  const businessStats = businesses.map((b: any) => {
    const channelCount = b.business_identity_channels?.[0]?.count ?? 0;
    const snapshots = b.business_identity_ai_snapshots ?? [];
    totalChannels += channelCount;
    totalSnapshots += snapshots.length;

    const latestSnapshot = snapshots.length > 0
      ? snapshots.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at
      : null;

    return {
      business_key: b.business_key,
      display_name: b.display_name,
      channel_count: channelCount,
      latest_snapshot_date: latestSnapshot
    };
  });

  return {
    totalBusinesses: businesses.length,
    totalChannels,
    totalSnapshots,
    businesses: businessStats
  };
}
