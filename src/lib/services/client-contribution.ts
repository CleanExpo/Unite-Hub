import { getSupabaseServer } from '@/lib/supabase';

// Contribution status and types
export type ContributionType = 'video' | 'photo' | 'voice' | 'text' | 'review' | 'faq';
export type ContributionStatus = 'pending' | 'approved' | 'published' | 'rejected';
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected';
export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ClientContribution {
  id: string;
  workspace_id: string;
  client_user_id: string;
  media_file_id?: string;
  contribution_type: ContributionType;
  content_text?: string;
  points_awarded: number;
  status: ContributionStatus;
  moderation_status: ModerationStatus;
  moderation_reason?: string;
  schema_generated?: Record<string, any>;
  published_url?: string;
  impressions: number;
  engagement_score: number;
  created_at: string;
  published_at?: string;
  updated_at: string;
}

export interface ClientGamification {
  id: string;
  workspace_id: string;
  client_user_id: string;
  points_balance: number;
  points_lifetime: number;
  tier: TierLevel;
  tier_unlocked_at?: string;
  leaderboard_rank?: number;
  monthly_rank?: number;
  last_contribution_at?: string;
  contribution_streak: number;
  total_contributions: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  quiet_hours_timezone: string;
  updated_at: string;
}

export interface ClientContributionImpact {
  id: string;
  workspace_id: string;
  client_user_id: string;
  total_contributions: number;
  total_impressions: number;
  total_clicks: number;
  avg_engagement_rate: number;
  seo_score_delta: number;
  keywords_ranked: number;
  month_year?: string;
  updated_at: string;
}

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3500,
} as const;

// Points per contribution type
const POINTS_MAP: Record<ContributionType, number> = {
  video: 100,
  photo: 50,
  voice: 40,
  text: 25,
  review: 30,
  faq: 35,
} as const;

/**
 * Calculate points based on contribution type
 */
export function calculatePoints(type: ContributionType): number {
  return POINTS_MAP[type] || 20;
}

/**
 * Determine tier based on lifetime points
 */
export function calculateTier(lifetimePoints: number): TierLevel {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Create new contribution and award points
 */
export async function createContribution(
  workspaceId: string,
  clientUserId: string,
  data: {
    media_file_id?: string;
    contribution_type: ContributionType;
    content_text?: string;
  }
): Promise<ClientContribution> {
  const supabase = getSupabaseServer();
  const points = calculatePoints(data.contribution_type);

  const { data: contribution, error } = await supabase
    .from('client_contributions')
    .insert({
      workspace_id: workspaceId,
      client_user_id: clientUserId,
      media_file_id: data.media_file_id,
      contribution_type: data.contribution_type,
      content_text: data.content_text,
      points_awarded: points,
      status: 'pending',
      moderation_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Award points immediately
  await awardPoints(workspaceId, clientUserId, points);

  return contribution;
}

/**
 * Award points to client and update tier if needed
 * Uses atomic RPC function to prevent race conditions
 */
export async function awardPoints(
  workspaceId: string,
  clientUserId: string,
  points: number
): Promise<{ balance: number; lifetime: number; tier: TierLevel; tierChanged: boolean }> {
  const supabase = getSupabaseServer();

  // Ensure gamification record exists
  const { data: existing } = await supabase
    .from('client_gamification')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .single();

  if (!existing) {
    // Create default record
    const { error } = await supabase.from('client_gamification').insert({
      workspace_id: workspaceId,
      client_user_id: clientUserId,
      points_balance: 0,
      points_lifetime: 0,
      tier: 'bronze',
    });

    if (error) throw error;
  }

  // Call RPC function for atomic increment
  const { data, error } = await supabase.rpc('increment_client_points', {
    p_workspace_id: workspaceId,
    p_client_user_id: clientUserId,
    p_points: points,
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Failed to increment points');

  const result = data[0];
  return {
    balance: result.new_balance,
    lifetime: result.new_lifetime,
    tier: result.new_tier,
    tierChanged: result.tier_changed,
  };
}

/**
 * Get client gamification status
 */
export async function getClientGamification(
  workspaceId: string,
  clientUserId: string
): Promise<ClientGamification | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_gamification')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data || null;
}

/**
 * Get workspace leaderboard
 */
export async function getLeaderboard(
  workspaceId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_gamification')
    .select(
      `
      id,
      client_user_id,
      points_balance,
      points_lifetime,
      tier,
      leaderboard_rank,
      contribution_streak,
      total_contributions,
      client_users!inner (
        id,
        email,
        user_metadata
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('points_balance', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Get monthly leaderboard
 */
export async function getMonthlyLeaderboard(
  workspaceId: string,
  limit: number = 10
): Promise<any[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_gamification')
    .select(
      `
      id,
      client_user_id,
      points_balance,
      tier,
      monthly_rank,
      client_users!inner (
        id,
        email,
        user_metadata
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('monthly_rank', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Publish contribution and update status
 */
export async function publishContribution(
  workspaceId: string,
  contributionId: string,
  publishedUrl?: string,
  schemaGenerated?: Record<string, any>
): Promise<ClientContribution> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_contributions')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_url: publishedUrl,
      schema_generated: schemaGenerated,
    })
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Approve contribution (moderation)
 */
export async function approveContribution(
  workspaceId: string,
  contributionId: string
): Promise<ClientContribution> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_contributions')
    .update({
      moderation_status: 'approved',
      status: 'approved',
    })
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject contribution with reason
 */
export async function rejectContribution(
  workspaceId: string,
  contributionId: string,
  reason: string
): Promise<ClientContribution> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_contributions')
    .update({
      moderation_status: 'rejected',
      status: 'rejected',
      moderation_reason: reason,
    })
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get client contributions with optional filtering
 */
export async function getContributions(
  workspaceId: string,
  clientUserId: string,
  filters?: {
    status?: ContributionStatus;
    type?: ContributionType;
    limit?: number;
    offset?: number;
  }
): Promise<ClientContribution[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('client_contributions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('contribution_type', filters.type);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get contribution impact metrics
 */
export async function getContributionImpact(
  workspaceId: string,
  clientUserId: string
): Promise<ClientContributionImpact | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_contribution_impact')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .is('month_year', null)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Update impression count for contribution
 * Called asynchronously from analytics pipeline
 */
export async function updateContributionImpression(
  workspaceId: string,
  contributionId: string,
  impressions: number,
  clicks: number = 0
): Promise<ClientContribution> {
  const supabase = getSupabaseServer();

  // Calculate engagement score
  const engagementScore = clicks > 0 ? Math.round((clicks / impressions) * 100) : 0;

  const { data, error } = await supabase
    .from('client_contributions')
    .update({
      impressions,
      engagement_score: engagementScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Initialize or get client gamification record
 */
export async function ensureClientGamification(
  workspaceId: string,
  clientUserId: string
): Promise<ClientGamification> {
  const existing = await getClientGamification(workspaceId, clientUserId);
  if (existing) return existing;

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('client_gamification')
    .insert({
      workspace_id: workspaceId,
      client_user_id: clientUserId,
      points_balance: 0,
      points_lifetime: 0,
      tier: 'bronze',
      contribution_streak: 0,
      total_contributions: 0,
      quiet_hours_enabled: false,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      quiet_hours_timezone: 'UTC',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update quiet hours preference
 */
export async function updateQuietHours(
  workspaceId: string,
  clientUserId: string,
  config: {
    enabled: boolean;
    startHour?: number;
    endHour?: number;
    timezone?: string;
  }
): Promise<ClientGamification> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('client_gamification')
    .update({
      quiet_hours_enabled: config.enabled,
      quiet_hours_start: config.startHour ?? 22,
      quiet_hours_end: config.endHour ?? 8,
      quiet_hours_timezone: config.timezone ?? 'UTC',
    })
    .eq('workspace_id', workspaceId)
    .eq('client_user_id', clientUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
