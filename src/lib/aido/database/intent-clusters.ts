/**
 * AIDO Intent Clusters Database Access Layer
 * AI-optimized search intent mapping for topics
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface IntentCluster {
  id: string;
  topic_id: string;
  client_id: string;
  workspace_id: string;
  primary_intent: string;
  secondary_intents: string[];
  searcher_mindset: string | null;
  pain_points: string[];
  desired_outcomes: string[];
  risk_concerns: string[];
  purchase_stage: string | null;
  example_queries: string[];
  follow_up_questions: string[];
  local_modifiers: string[];
  business_impact_score: number;
  difficulty_score: number;
  alignment_score: number;
  last_refreshed_at: string;
  created_at: string;
}

export interface IntentClusterInput {
  topicId: string;
  clientId: string;
  workspaceId: string;
  primaryIntent: string;
  secondaryIntents?: string[];
  searcherMindset?: string;
  painPoints?: string[];
  desiredOutcomes?: string[];
  riskConcerns?: string[];
  purchaseStage?: string;
  exampleQueries?: string[];
  followUpQuestions?: string[];
  localModifiers?: string[];
  businessImpactScore?: number;
  difficultyScore?: number;
  alignmentScore?: number;
}

/**
 * Create a new intent cluster
 */
export async function createIntentCluster(data: IntentClusterInput): Promise<IntentCluster> {
  const supabase = await getSupabaseServer();

  const { data: cluster, error } = await supabase
    .from('intent_clusters')
    .insert({
      topic_id: data.topicId,
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      primary_intent: data.primaryIntent,
      secondary_intents: data.secondaryIntents || [],
      searcher_mindset: data.searcherMindset || null,
      pain_points: data.painPoints || [],
      desired_outcomes: data.desiredOutcomes || [],
      risk_concerns: data.riskConcerns || [],
      purchase_stage: data.purchaseStage || null,
      example_queries: data.exampleQueries || [],
      follow_up_questions: data.followUpQuestions || [],
      local_modifiers: data.localModifiers || [],
      business_impact_score: data.businessImpactScore || 0.5,
      difficulty_score: data.difficultyScore || 0.5,
      alignment_score: data.alignmentScore || 0.5,
      last_refreshed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create intent cluster:', error);
    throw new Error(`Failed to create intent cluster: ${error.message}`);
  }

  return cluster;
}

/**
 * Get all intent clusters for a workspace
 * Optionally filter by client or topic
 */
export async function getIntentClusters(
  workspaceId: string,
  filters?: { clientId?: string; topicId?: string }
): Promise<IntentCluster[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intent_clusters')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.topicId) {
    query = query.eq('topic_id', filters.topicId);
  }

  const { data, error } = await query.order('business_impact_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch intent clusters:', error);
    throw new Error(`Failed to fetch intent clusters: ${error.message}`);
  }

  return data || [];
}

/**
 * Get intent clusters by topic
 * Ordered by business impact score
 */
export async function getIntentClustersByTopic(
  topicId: string,
  workspaceId: string
): Promise<IntentCluster[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intent_clusters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('topic_id', topicId)
    .order('business_impact_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch intent clusters by topic:', error);
    throw new Error(`Failed to fetch intent clusters: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single intent cluster by ID
 */
export async function getIntentCluster(id: string, workspaceId: string): Promise<IntentCluster> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intent_clusters')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Intent cluster not found or access denied');
    }
    console.error('[AIDO] Failed to fetch intent cluster:', error);
    throw new Error(`Failed to fetch intent cluster: ${error.message}`);
  }

  return data;
}

/**
 * Update an intent cluster
 */
export async function updateIntentCluster(
  id: string,
  workspaceId: string,
  updates: Partial<Omit<IntentClusterInput, 'clientId' | 'workspaceId'>>
): Promise<IntentCluster> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    last_refreshed_at: new Date().toISOString(),
  };

  if (updates.topicId !== undefined) updateData.topic_id = updates.topicId;
  if (updates.primaryIntent !== undefined) updateData.primary_intent = updates.primaryIntent;
  if (updates.secondaryIntents !== undefined) updateData.secondary_intents = updates.secondaryIntents;
  if (updates.searcherMindset !== undefined) updateData.searcher_mindset = updates.searcherMindset;
  if (updates.painPoints !== undefined) updateData.pain_points = updates.painPoints;
  if (updates.desiredOutcomes !== undefined) updateData.desired_outcomes = updates.desiredOutcomes;
  if (updates.riskConcerns !== undefined) updateData.risk_concerns = updates.riskConcerns;
  if (updates.purchaseStage !== undefined) updateData.purchase_stage = updates.purchaseStage;
  if (updates.exampleQueries !== undefined) updateData.example_queries = updates.exampleQueries;
  if (updates.followUpQuestions !== undefined) updateData.follow_up_questions = updates.followUpQuestions;
  if (updates.localModifiers !== undefined) updateData.local_modifiers = updates.localModifiers;
  if (updates.businessImpactScore !== undefined) updateData.business_impact_score = updates.businessImpactScore;
  if (updates.difficultyScore !== undefined) updateData.difficulty_score = updates.difficultyScore;
  if (updates.alignmentScore !== undefined) updateData.alignment_score = updates.alignmentScore;

  const { data, error } = await supabase
    .from('intent_clusters')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Intent cluster not found or access denied');
    }
    console.error('[AIDO] Failed to update intent cluster:', error);
    throw new Error(`Failed to update intent cluster: ${error.message}`);
  }

  return data;
}

/**
 * Delete an intent cluster
 */
export async function deleteIntentCluster(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('intent_clusters')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete intent cluster:', error);
    throw new Error(`Failed to delete intent cluster: ${error.message}`);
  }
}

/**
 * Get high-priority intent clusters
 * Business impact score >= 0.7
 */
export async function getHighPriorityIntentClusters(
  clientId: string,
  workspaceId: string
): Promise<IntentCluster[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intent_clusters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .gte('business_impact_score', 0.7)
    .order('business_impact_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch high-priority intent clusters:', error);
    throw new Error(`Failed to fetch intent clusters: ${error.message}`);
  }

  return data || [];
}

/**
 * Get intent clusters by purchase stage
 */
export async function getIntentClustersByPurchaseStage(
  purchaseStage: string,
  workspaceId: string,
  clientId?: string
): Promise<IntentCluster[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intent_clusters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('purchase_stage', purchaseStage);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('business_impact_score', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch intent clusters by purchase stage:', error);
    throw new Error(`Failed to fetch intent clusters: ${error.message}`);
  }

  return data || [];
}
