/**
 * AIDO Strategy Recommendations Database Access Layer
 * AI-generated action items for Google curve adaptation
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface StrategyRecommendation {
  id: string;
  client_id: string;
  workspace_id: string;
  pillar_id: string;
  title: string;
  description: string;
  priority: string;
  actions: Array<{ step: number; action: string; assignee?: string }>;
  estimated_impact: string | null;
  assigned_to_user_id: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  implemented_at: string | null;
  updated_at: string;
}

export interface StrategyRecommendationInput {
  clientId: string;
  workspaceId: string;
  pillarId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{ step: number; action: string; assignee?: string }>;
  estimatedImpact?: string;
  assignedToUserId?: string;
  dueDate?: string;
}

/**
 * Create a new strategy recommendation
 */
export async function createStrategyRecommendation(
  data: StrategyRecommendationInput
): Promise<StrategyRecommendation> {
  const supabase = await getSupabaseServer();

  const { data: recommendation, error } = await supabase
    .from('strategy_recommendations')
    .insert({
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      pillar_id: data.pillarId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      actions: data.actions || [],
      estimated_impact: data.estimatedImpact || null,
      assigned_to_user_id: data.assignedToUserId || null,
      due_date: data.dueDate || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create strategy recommendation:', error);
    throw new Error(`Failed to create strategy recommendation: ${error.message}`);
  }

  return recommendation;
}

/**
 * Get strategy recommendations for a workspace
 * Optionally filter by client, priority, or status
 */
export async function getStrategyRecommendations(
  workspaceId: string,
  filters?: { clientId?: string; priority?: string; status?: string; pillarId?: string }
): Promise<StrategyRecommendation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.pillarId) {
    query = query.eq('pillar_id', filters.pillarId);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch strategy recommendations:', error);
    throw new Error(`Failed to fetch strategy recommendations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single strategy recommendation by ID
 */
export async function getStrategyRecommendation(
  id: string,
  workspaceId: string
): Promise<StrategyRecommendation> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Strategy recommendation not found or access denied');
    }
    console.error('[AIDO] Failed to fetch strategy recommendation:', error);
    throw new Error(`Failed to fetch strategy recommendation: ${error.message}`);
  }

  return data;
}

/**
 * Update a strategy recommendation
 */
export async function updateStrategyRecommendation(
  id: string,
  workspaceId: string,
  updates: Partial<Omit<StrategyRecommendationInput, 'clientId' | 'workspaceId'>>
): Promise<StrategyRecommendation> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.pillarId !== undefined) {
updateData.pillar_id = updates.pillarId;
}
  if (updates.title !== undefined) {
updateData.title = updates.title;
}
  if (updates.description !== undefined) {
updateData.description = updates.description;
}
  if (updates.priority !== undefined) {
updateData.priority = updates.priority;
}
  if (updates.actions !== undefined) {
updateData.actions = updates.actions;
}
  if (updates.estimatedImpact !== undefined) {
updateData.estimated_impact = updates.estimatedImpact;
}
  if (updates.assignedToUserId !== undefined) {
updateData.assigned_to_user_id = updates.assignedToUserId;
}
  if (updates.dueDate !== undefined) {
updateData.due_date = updates.dueDate;
}

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Strategy recommendation not found or access denied');
    }
    console.error('[AIDO] Failed to update strategy recommendation:', error);
    throw new Error(`Failed to update strategy recommendation: ${error.message}`);
  }

  return data;
}

/**
 * Update strategy recommendation status
 */
export async function updateStrategyRecommendationStatus(
  id: string,
  workspaceId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled'
): Promise<StrategyRecommendation> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.implemented_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Strategy recommendation not found or access denied');
    }
    console.error('[AIDO] Failed to update strategy recommendation:', error);
    throw new Error(`Failed to update strategy recommendation: ${error.message}`);
  }

  return data;
}

/**
 * Delete a strategy recommendation
 */
export async function deleteStrategyRecommendation(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('strategy_recommendations')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete strategy recommendation:', error);
    throw new Error(`Failed to delete strategy recommendation: ${error.message}`);
  }
}

/**
 * Get pending strategy recommendations
 * status = 'pending'
 */
export async function getPendingStrategyRecommendations(
  workspaceId: string,
  clientId?: string
): Promise<StrategyRecommendation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch pending strategy recommendations:', error);
    throw new Error(`Failed to fetch strategy recommendations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get high-priority strategy recommendations
 * priority = 'high' or 'critical'
 */
export async function getHighPriorityStrategyRecommendations(
  workspaceId: string,
  clientId?: string
): Promise<StrategyRecommendation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('priority', ['high', 'critical']);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch high-priority strategy recommendations:', error);
    throw new Error(`Failed to fetch strategy recommendations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get strategy recommendations assigned to a user
 */
export async function getStrategyRecommendationsByUser(
  userId: string,
  workspaceId: string
): Promise<StrategyRecommendation[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('strategy_recommendations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('assigned_to_user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (error) {
    console.error('[AIDO] Failed to fetch strategy recommendations by user:', error);
    throw new Error(`Failed to fetch strategy recommendations: ${error.message}`);
  }

  return data || [];
}
