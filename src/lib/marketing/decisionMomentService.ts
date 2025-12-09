/**
 * Decision Moment Service
 *
 * CRUD operations for decision moment maps.
 * Used by the founder marketing dashboard for funnel design.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface DecisionMomentMap {
  id: string;
  workspace_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  funnel_stage: 'full' | 'awareness' | 'consideration' | 'conversion' | 'retention';
  created_at: string;
  updated_at: string;
}

export interface CreateDecisionMapInput {
  workspace_id: string;
  name: string;
  description?: string;
  funnel_stage?: DecisionMomentMap['funnel_stage'];
  client_id?: string;
}

export interface UpdateDecisionMapInput {
  name?: string;
  description?: string;
  funnel_stage?: DecisionMomentMap['funnel_stage'];
  client_id?: string;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export async function listDecisionMaps(workspaceId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_moment_maps')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
}

export async function getDecisionMap(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_moment_maps')
    .select('*')
    .eq('id', id)
    .single();
}

export async function getDecisionMapWithAssets(id: string) {
  const supabase = await getSupabaseServer();

  const [mapResult, assetsResult] = await Promise.all([
    supabase
      .from('decision_moment_maps')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('decision_assets')
      .select('*')
      .eq('map_id', id)
      .order('moment_key'),
  ]);

  if (mapResult.error) {
return { data: null, error: mapResult.error };
}

  return {
    data: {
      ...mapResult.data,
      assets: assetsResult.data || [],
    },
    error: null,
  };
}

export async function createDecisionMap(data: CreateDecisionMapInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_moment_maps')
    .insert({
      ...data,
      funnel_stage: data.funnel_stage || 'full',
    })
    .select()
    .single();
}

export async function updateDecisionMap(id: string, data: UpdateDecisionMapInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_moment_maps')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteDecisionMap(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_moment_maps')
    .delete()
    .eq('id', id);
}

export async function duplicateDecisionMap(id: string, newName: string) {
  const supabase = await getSupabaseServer();

  // Get original map
  const { data: original, error: fetchError } = await getDecisionMapWithAssets(id);
  if (fetchError || !original) {
return { data: null, error: fetchError };
}

  // Create new map
  const { data: newMap, error: createError } = await supabase
    .from('decision_moment_maps')
    .insert({
      workspace_id: original.workspace_id,
      name: newName,
      description: original.description,
      funnel_stage: original.funnel_stage,
      client_id: original.client_id,
    })
    .select()
    .single();

  if (createError || !newMap) {
return { data: null, error: createError };
}

  // Duplicate assets
  if (original.assets && original.assets.length > 0) {
    const newAssets = original.assets.map((asset: Record<string, unknown>) => ({
      workspace_id: original.workspace_id,
      map_id: newMap.id,
      moment_key: asset.moment_key,
      problem_statement: asset.problem_statement,
      objection: asset.objection,
      required_proof: asset.required_proof,
      recommended_asset_type: asset.recommended_asset_type,
      channel: asset.channel,
      metadata: asset.metadata,
    }));

    await supabase.from('decision_assets').insert(newAssets);
  }

  return { data: newMap, error: null };
}
