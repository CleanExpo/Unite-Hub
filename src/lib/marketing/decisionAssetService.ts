/**
 * Decision Asset Service
 *
 * CRUD operations for decision assets within maps.
 * Each asset represents a specific moment in the customer journey.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface DecisionAsset {
  id: string;
  workspace_id: string;
  map_id: string;
  moment_key: string;
  problem_statement: string | null;
  objection: string | null;
  required_proof: string | null;
  recommended_asset_type: string | null;
  linked_asset_id: string | null;
  channel: 'email' | 'social' | 'landing_page' | 'ad' | 'sms' | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateDecisionAssetInput {
  workspace_id: string;
  map_id: string;
  moment_key: string;
  problem_statement?: string;
  objection?: string;
  required_proof?: string;
  recommended_asset_type?: string;
  linked_asset_id?: string;
  channel?: DecisionAsset['channel'];
  metadata?: Record<string, unknown>;
}

export interface UpdateDecisionAssetInput {
  moment_key?: string;
  problem_statement?: string;
  objection?: string;
  required_proof?: string;
  recommended_asset_type?: string;
  linked_asset_id?: string;
  channel?: DecisionAsset['channel'];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MOMENT KEY CONSTANTS
// ============================================================================

export const MOMENT_KEYS = {
  awareness: {
    unaware: 'awareness_unaware',
    problem_aware: 'awareness_problem_aware',
    solution_aware: 'awareness_solution_aware',
  },
  consideration: {
    comparing: 'consideration_comparing',
    evaluating: 'consideration_evaluating',
    researching: 'consideration_researching',
  },
  conversion: {
    deciding: 'conversion_deciding',
    objecting: 'conversion_objecting',
    purchasing: 'conversion_purchasing',
  },
  retention: {
    onboarding: 'retention_onboarding',
    using: 'retention_using',
    advocating: 'retention_advocating',
  },
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export async function listDecisionAssets(mapId: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .select('*')
    .eq('map_id', mapId)
    .order('moment_key');
}

export async function listAssetsByChannel(workspaceId: string, channel: DecisionAsset['channel']) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('channel', channel)
    .order('created_at', { ascending: false });
}

export async function getDecisionAsset(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createDecisionAsset(data: CreateDecisionAssetInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .insert({
      ...data,
      metadata: data.metadata || {},
    })
    .select()
    .single();
}

export async function updateDecisionAsset(id: string, data: UpdateDecisionAssetInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteDecisionAsset(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .delete()
    .eq('id', id);
}

export async function linkSocialAsset(id: string, socialAssetId: string) {
  return updateDecisionAsset(id, { linked_asset_id: socialAssetId });
}

export async function unlinkSocialAsset(id: string) {
  return updateDecisionAsset(id, { linked_asset_id: null });
}

export async function bulkCreateAssets(assets: CreateDecisionAssetInput[]) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .insert(assets.map((a) => ({ ...a, metadata: a.metadata || {} })))
    .select();
}

export async function getAssetsByMomentKeys(mapId: string, momentKeys: string[]) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('decision_assets')
    .select('*')
    .eq('map_id', mapId)
    .in('moment_key', momentKeys);
}
