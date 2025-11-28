/**
 * Social Asset Service
 *
 * CRUD operations for social media assets (videos, images, scripts, etc.).
 * Used by the founder marketing dashboard and playbook editor.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SocialAsset {
  id: string;
  workspace_id: string;
  playbook_id: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'shorts' | 'reels';
  asset_type: 'video' | 'image' | 'carousel' | 'script' | 'caption' | 'thumbnail';
  title: string | null;
  hook: string | null;
  script_outline: string | null;
  thumbnail_concept: string | null;
  metadata: Record<string, unknown>;
  status: 'draft' | 'ready' | 'scheduled' | 'published';
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetInput {
  workspace_id: string;
  playbook_id: string;
  platform: SocialAsset['platform'];
  asset_type: SocialAsset['asset_type'];
  title?: string;
  hook?: string;
  script_outline?: string;
  thumbnail_concept?: string;
  metadata?: Record<string, unknown>;
  scheduled_at?: string;
}

export interface UpdateAssetInput {
  title?: string;
  hook?: string;
  script_outline?: string;
  thumbnail_concept?: string;
  metadata?: Record<string, unknown>;
  status?: SocialAsset['status'];
  scheduled_at?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export async function listSocialAssets(playbookId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('created_at', { ascending: false });
}

export async function listAssetsByPlatform(workspaceId: string, platform: SocialAsset['platform']) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', platform)
    .order('created_at', { ascending: false });
}

export async function getSocialAsset(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createSocialAsset(data: CreateAssetInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .insert({
      ...data,
      status: 'draft',
      metadata: data.metadata || {},
    })
    .select()
    .single();
}

export async function updateSocialAsset(id: string, data: UpdateAssetInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteSocialAsset(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('social_assets')
    .delete()
    .eq('id', id);
}

export async function scheduleAsset(id: string, scheduledAt: string) {
  return updateSocialAsset(id, { status: 'scheduled', scheduled_at: scheduledAt });
}

export async function publishAsset(id: string) {
  return updateSocialAsset(id, { status: 'published' });
}

export async function countAssetsByType(playbookId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('social_assets')
    .select('asset_type, platform')
    .eq('playbook_id', playbookId);

  if (error) return { data: null, error };

  const counts = {
    byType: {} as Record<string, number>,
    byPlatform: {} as Record<string, number>,
    total: data.length,
  };

  data.forEach((asset) => {
    counts.byType[asset.asset_type] = (counts.byType[asset.asset_type] || 0) + 1;
    counts.byPlatform[asset.platform] = (counts.byPlatform[asset.platform] || 0) + 1;
  });

  return { data: counts, error: null };
}
