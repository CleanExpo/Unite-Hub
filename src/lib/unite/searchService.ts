/**
 * Global Search Service
 *
 * Phase: D58 - Global Search & Knowledge Graph
 * Tables: unite_search_index, unite_search_queries
 *
 * Features:
 * - Global search across all entities
 * - Full-text search with ranking
 * - Entity indexing and reindexing
 * - Search analytics
 * - AI-enhanced query expansion
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export interface SearchIndexEntry {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
  embedding?: number[];
  search_meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SearchQuery {
  id: string;
  tenant_id?: string;
  user_id?: string;
  query: string;
  filters?: Record<string, unknown>;
  results_count?: number;
  latency_ms?: number;
  ai_profile?: Record<string, unknown>;
  created_at: string;
}

export interface SearchResult {
  entity_type: string;
  entity_id: string;
  title?: string;
  summary?: string;
  rank: number;
}

export interface IndexEntityInput {
  entity_type: string;
  entity_id: string;
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Search Operations
// =============================================================================

export async function searchEntities(
  tenantId: string,
  query: string,
  filters?: {
    entity_types?: string[];
    tags?: string[];
    limit?: number;
  }
): Promise<SearchResult[]> {
  const startTime = Date.now();

  // Full-text search using helper function
  const { data, error } = await supabaseAdmin.rpc('unite_search_fulltext', {
    p_tenant_id: tenantId,
    p_query: query,
    p_entity_types: filters?.entity_types || null,
    p_limit: filters?.limit || 20,
  });

  if (error) throw new Error(`Failed to search entities: ${error.message}`);

  const latency = Date.now() - startTime;

  // Log query
  await logSearchQuery(tenantId, query, filters, (data as SearchResult[]).length, latency);

  return data as SearchResult[];
}

export async function logSearchQuery(
  tenantId: string,
  query: string,
  filters?: Record<string, unknown>,
  resultsCount?: number,
  latencyMs?: number,
  userId?: string
): Promise<void> {
  await supabaseAdmin.from('unite_search_queries').insert({
    tenant_id: tenantId,
    user_id: userId,
    query,
    filters: filters || {},
    results_count: resultsCount,
    latency_ms: latencyMs,
  });
}

// =============================================================================
// Indexing Operations
// =============================================================================

export async function indexEntity(
  tenantId: string,
  input: IndexEntityInput
): Promise<SearchIndexEntry> {
  const { data, error } = await supabaseAdmin
    .from('unite_search_index')
    .upsert(
      {
        tenant_id: tenantId,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        title: input.title,
        summary: input.summary,
        content: input.content,
        tags: input.tags || [],
        extra: input.extra || {},
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'tenant_id,entity_type,entity_id',
      }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to index entity: ${error.message}`);
  return data as SearchIndexEntry;
}

export async function removeFromIndex(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_search_index')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) throw new Error(`Failed to remove from index: ${error.message}`);
}

export async function reindexAllEntities(
  tenantId: string,
  entityType: string
): Promise<number> {
  // This is a placeholder - actual implementation would iterate through
  // all entities of the given type and re-index them
  // For now, just return count of existing indexed entities

  const { count, error } = await supabaseAdmin
    .from('unite_search_index')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('entity_type', entityType);

  if (error) throw new Error(`Failed to count indexed entities: ${error.message}`);

  return count || 0;
}

// =============================================================================
// Search Analytics
// =============================================================================

export async function getSearchAnalytics(
  tenantId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<{
  total_searches: number;
  avg_latency_ms: number;
  top_queries: Array<{ query: string; count: number }>;
  searches_by_day: Array<{ date: string; count: number }>;
}> {
  let query = supabaseAdmin
    .from('unite_search_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get search analytics: ${error.message}`);

  const queries = data as SearchQuery[];

  // Calculate analytics
  const totalSearches = queries.length;
  const avgLatency = queries.length
    ? queries.reduce((sum, q) => sum + (q.latency_ms || 0), 0) / queries.length
    : 0;

  // Top queries
  const queryCounts: Record<string, number> = {};
  queries.forEach((q) => {
    queryCounts[q.query] = (queryCounts[q.query] || 0) + 1;
  });

  const topQueries = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Searches by day
  const searchesByDay: Record<string, number> = {};
  queries.forEach((q) => {
    const date = q.created_at.split('T')[0];
    searchesByDay[date] = (searchesByDay[date] || 0) + 1;
  });

  const searchesByDayArray = Object.entries(searchesByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_searches: totalSearches,
    avg_latency_ms: Math.round(avgLatency),
    top_queries: topQueries,
    searches_by_day: searchesByDayArray,
  };
}

// =============================================================================
// AI-Enhanced Features
// =============================================================================

export async function aiExpandQuery(
  query: string,
  context?: Record<string, unknown>
): Promise<{
  expanded_query: string;
  suggested_filters: Array<{ field: string; value: string }>;
  search_tips: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `Expand this search query to improve search results:

**Original Query**: ${query}
**Context**: ${JSON.stringify(context || {})}

Provide enhanced search strategy in JSON format:
{
  "expanded_query": "Improved query with synonyms and related terms",
  "suggested_filters": [
    {"field": "entity_type", "value": "contact"},
    {"field": "tags", "value": "important"}
  ],
  "search_tips": [
    "Tip 1: Consider using X filter",
    "Tip 2: Try searching for Y"
  ]
}

Focus on:
- Adding relevant synonyms
- Suggesting useful filters
- Providing helpful search tips`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse AI query expansion response');
  }
}
