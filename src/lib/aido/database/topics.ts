/**
 * AIDO Topics Database Access Layer
 * Handles content pillar topics for client profiles
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface Topic {
  id: string;
  client_id: string;
  workspace_id: string;
  pillar_id: string;
  name: string;
  slug: string;
  problem_statement: string | null;
  audience_segment: string | null;
  priority_level: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TopicInput {
  clientId: string;
  workspaceId: string;
  pillarId: string;
  name: string;
  slug: string;
  problemStatement?: string;
  audienceSegment?: string;
  priorityLevel?: number;
  status?: string;
}

/**
 * Create a new topic
 * @throws Error if creation fails or slug already exists for client
 */
export async function createTopic(data: TopicInput): Promise<Topic> {
  const supabase = await getSupabaseServer();

  const { data: topic, error } = await supabase
    .from('topics')
    .insert({
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      pillar_id: data.pillarId,
      name: data.name,
      slug: data.slug,
      problem_statement: data.problemStatement || null,
      audience_segment: data.audienceSegment || null,
      priority_level: data.priorityLevel || 5,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('A topic with this slug already exists for this client');
    }
    console.error('[AIDO] Failed to create topic:', error);
    throw new Error(`Failed to create topic: ${error.message}`);
  }

  return topic;
}

/**
 * Get all topics for a workspace
 * Optionally filter by client
 */
export async function getTopics(workspaceId: string, clientId?: string): Promise<Topic[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('topics')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('priority_level', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch topics:', error);
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return data || [];
}

/**
 * Get topics by pillar ID
 * Groups topics within a content pillar
 */
export async function getTopicsByPillar(
  pillarId: string,
  workspaceId: string
): Promise<Topic[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('pillar_id', pillarId)
    .order('priority_level', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch topics by pillar:', error);
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single topic by ID
 * Enforces workspace isolation
 */
export async function getTopic(id: string, workspaceId: string): Promise<Topic> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Topic not found or access denied');
    }
    console.error('[AIDO] Failed to fetch topic:', error);
    throw new Error(`Failed to fetch topic: ${error.message}`);
  }

  return data;
}

/**
 * Update a topic
 * Enforces workspace isolation
 */
export async function updateTopic(
  id: string,
  workspaceId: string,
  updates: Partial<Omit<TopicInput, 'clientId' | 'workspaceId'>>
): Promise<Topic> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.pillarId !== undefined) updateData.pillar_id = updates.pillarId;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.problemStatement !== undefined) updateData.problem_statement = updates.problemStatement;
  if (updates.audienceSegment !== undefined) updateData.audience_segment = updates.audienceSegment;
  if (updates.priorityLevel !== undefined) updateData.priority_level = updates.priorityLevel;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('topics')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Topic not found or access denied');
    }
    if (error.code === '23505') {
      throw new Error('A topic with this slug already exists for this client');
    }
    console.error('[AIDO] Failed to update topic:', error);
    throw new Error(`Failed to update topic: ${error.message}`);
  }

  return data;
}

/**
 * Delete a topic
 * Cascades to related intent clusters and content
 */
export async function deleteTopic(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete topic:', error);
    throw new Error(`Failed to delete topic: ${error.message}`);
  }
}

/**
 * Get topic by slug within a client
 */
export async function getTopicBySlug(
  clientId: string,
  slug: string,
  workspaceId: string
): Promise<Topic | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[AIDO] Failed to fetch topic by slug:', error);
    throw new Error(`Failed to fetch topic: ${error.message}`);
  }

  return data;
}

/**
 * Get active topics for a client
 * Filters by status = 'active'
 */
export async function getActiveTopics(clientId: string, workspaceId: string): Promise<Topic[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('priority_level', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch active topics:', error);
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return data || [];
}
