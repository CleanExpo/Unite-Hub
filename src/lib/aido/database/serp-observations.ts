/**
 * AIDO SERP Observations Database Access Layer
 * Search result tracking for Google curve monitoring
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface SerpObservation {
  id: string;
  client_id: string;
  workspace_id: string;
  topic_id: string | null;
  keyword: string;
  search_engine: string;
  location: string | null;
  device_type: string | null;
  result_type: string | null;
  position: number | null;
  features_present: string[];
  ai_answer_present: boolean;
  ai_answer_summary: string | null;
  source_domains_used: string[];
  observed_at: string;
}

export interface SerpObservationInput {
  clientId: string;
  workspaceId: string;
  topicId?: string;
  keyword: string;
  searchEngine?: string;
  location?: string;
  deviceType?: string;
  resultType?: string;
  position?: number;
  featuresPresent?: string[];
  aiAnswerPresent?: boolean;
  aiAnswerSummary?: string;
  sourceDomainsUsed?: string[];
}

/**
 * Create a new SERP observation
 */
export async function createSerpObservation(data: SerpObservationInput): Promise<SerpObservation> {
  const supabase = await getSupabaseServer();

  const { data: observation, error } = await supabase
    .from('serp_observations')
    .insert({
      client_id: data.clientId,
      workspace_id: data.workspaceId,
      topic_id: data.topicId || null,
      keyword: data.keyword,
      search_engine: data.searchEngine || 'google',
      location: data.location || null,
      device_type: data.deviceType || null,
      result_type: data.resultType || null,
      position: data.position || null,
      features_present: data.featuresPresent || [],
      ai_answer_present: data.aiAnswerPresent || false,
      ai_answer_summary: data.aiAnswerSummary || null,
      source_domains_used: data.sourceDomainsUsed || [],
      observed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[AIDO] Failed to create SERP observation:', error);
    throw new Error(`Failed to create SERP observation: ${error.message}`);
  }

  return observation;
}

/**
 * Get SERP observations for a workspace
 * Optionally filter by client, keyword, or topic
 */
export async function getSerpObservations(
  workspaceId: string,
  filters?: { clientId?: string; keyword?: string; topicId?: string; aiAnswerPresent?: boolean }
): Promise<SerpObservation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('serp_observations')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters?.keyword) {
    query = query.eq('keyword', filters.keyword);
  }

  if (filters?.topicId) {
    query = query.eq('topic_id', filters.topicId);
  }

  if (filters?.aiAnswerPresent !== undefined) {
    query = query.eq('ai_answer_present', filters.aiAnswerPresent);
  }

  const { data, error } = await query.order('observed_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch SERP observations:', error);
    throw new Error(`Failed to fetch SERP observations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single SERP observation by ID
 */
export async function getSerpObservation(id: string, workspaceId: string): Promise<SerpObservation> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('serp_observations')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('SERP observation not found or access denied');
    }
    console.error('[AIDO] Failed to fetch SERP observation:', error);
    throw new Error(`Failed to fetch SERP observation: ${error.message}`);
  }

  return data;
}

/**
 * Delete a SERP observation
 */
export async function deleteSerpObservation(id: string, workspaceId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('serp_observations')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[AIDO] Failed to delete SERP observation:', error);
    throw new Error(`Failed to delete SERP observation: ${error.message}`);
  }
}

/**
 * Get SERP observations with AI answers
 * For tracking AI integration in search results
 */
export async function getSerpObservationsWithAIAnswers(
  clientId: string,
  workspaceId: string
): Promise<SerpObservation[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('serp_observations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('ai_answer_present', true)
    .order('observed_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch SERP observations with AI answers:', error);
    throw new Error(`Failed to fetch SERP observations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get SERP observations by keyword with history
 */
export async function getSerpObservationsByKeyword(
  keyword: string,
  workspaceId: string,
  clientId?: string,
  limit: number = 50
): Promise<SerpObservation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('serp_observations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('keyword', keyword);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query
    .order('observed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AIDO] Failed to fetch SERP observations by keyword:', error);
    throw new Error(`Failed to fetch SERP observations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get SERP observations by time range
 */
export async function getSerpObservationsByTimeRange(
  workspaceId: string,
  startDate: string,
  endDate: string,
  clientId?: string
): Promise<SerpObservation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('serp_observations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('observed_at', startDate)
    .lte('observed_at', endDate);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('observed_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch SERP observations by time range:', error);
    throw new Error(`Failed to fetch SERP observations: ${error.message}`);
  }

  return data || [];
}

/**
 * Track domain presence in AI answers
 * Useful for monitoring if client's domain appears in AI-generated search results
 */
export async function getDomainPresenceInAIAnswers(
  clientDomain: string,
  workspaceId: string,
  clientId?: string
): Promise<SerpObservation[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('serp_observations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ai_answer_present', true)
    .contains('source_domains_used', [clientDomain]);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.order('observed_at', { ascending: false });

  if (error) {
    console.error('[AIDO] Failed to fetch domain presence in AI answers:', error);
    throw new Error(`Failed to fetch SERP observations: ${error.message}`);
  }

  return data || [];
}
