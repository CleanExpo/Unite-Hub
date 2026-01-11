/**
 * Knowledge Graph Service
 * Phase: D70 - Unite Knowledge Graph Core
 *
 * Cross-system entity relationships and semantic search.
 * Vector embeddings for similarity queries.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface Entity {
  id: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  metadata?: Record<string, unknown>;
  tenant_id?: string;
  created_at: string;
}

export interface GraphEmbedding {
  id: string;
  entity_id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
  tenant_id?: string;
  updated_at: string;
}

// ============================================================================
// ENTITY MANAGEMENT
// ============================================================================

export async function createEntity(
  input: Omit<Entity, 'id' | 'created_at' | 'updated_at'>
): Promise<Entity> {
  const { data, error } = await supabaseAdmin
    .from('unite_entities')
    .insert(input)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create entity: ${error.message}`);
}
  return data as Entity;
}

export async function listEntities(filters?: {
  tenant_id?: string;
  type?: string;
  name?: string;
  limit?: number;
}): Promise<Entity[]> {
  let query = supabaseAdmin
    .from('unite_entities')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) {
query = query.eq('tenant_id', filters.tenant_id);
}
  if (filters?.type) {
query = query.eq('type', filters.type);
}
  if (filters?.name) {
query = query.ilike('name', `%${filters.name}%`);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list entities: ${error.message}`);
}
  return data as Entity[];
}

export async function getEntity(entityId: string): Promise<Entity | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_entities')
    .select('*')
    .eq('id', entityId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get entity: ${error.message}`);
  }

  return data as Entity;
}

export async function updateEntity(
  entityId: string,
  updates: Partial<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>
): Promise<Entity> {
  const { data, error } = await supabaseAdmin
    .from('unite_entities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entityId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update entity: ${error.message}`);
}
  return data as Entity;
}

export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_entities')
    .delete()
    .eq('id', entityId);

  if (error) {
throw new Error(`Failed to delete entity: ${error.message}`);
}
}

// ============================================================================
// RELATIONSHIP MANAGEMENT
// ============================================================================

export async function createRelationship(
  input: Omit<Relationship, 'id' | 'created_at'>
): Promise<Relationship> {
  const { data, error } = await supabaseAdmin
    .from('unite_relationships')
    .insert(input)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create relationship: ${error.message}`);
}
  return data as Relationship;
}

export async function listRelationships(filters?: {
  tenant_id?: string;
  source_id?: string;
  target_id?: string;
  type?: string;
  limit?: number;
}): Promise<Relationship[]> {
  let query = supabaseAdmin
    .from('unite_relationships')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) {
query = query.eq('tenant_id', filters.tenant_id);
}
  if (filters?.source_id) {
query = query.eq('source_id', filters.source_id);
}
  if (filters?.target_id) {
query = query.eq('target_id', filters.target_id);
}
  if (filters?.type) {
query = query.eq('type', filters.type);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list relationships: ${error.message}`);
}
  return data as Relationship[];
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_relationships')
    .delete()
    .eq('id', relationshipId);

  if (error) {
throw new Error(`Failed to delete relationship: ${error.message}`);
}
}

// ============================================================================
// GRAPH TRAVERSAL
// ============================================================================

export async function getEntityNeighbors(
  entityId: string,
  options?: {
    depth?: number;
    relationship_types?: string[];
  }
): Promise<{
  entities: Entity[];
  relationships: Relationship[];
}> {
  const depth = options?.depth || 1;
  const types = options?.relationship_types;

  // Start with direct relationships
  let relationshipsQuery = supabaseAdmin
    .from('unite_relationships')
    .select('*')
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

  if (types && types.length > 0) {
    relationshipsQuery = relationshipsQuery.in('type', types);
  }

  const { data: relationships } = await relationshipsQuery;

  if (!relationships || relationships.length === 0) {
    return { entities: [], relationships: [] };
  }

  // Get connected entity IDs
  const connectedIds = new Set<string>();
  relationships.forEach((rel) => {
    if (rel.source_id !== entityId) {
connectedIds.add(rel.source_id);
}
    if (rel.target_id !== entityId) {
connectedIds.add(rel.target_id);
}
  });

  // Fetch connected entities
  const { data: entities } = await supabaseAdmin
    .from('unite_entities')
    .select('*')
    .in('id', Array.from(connectedIds));

  return {
    entities: (entities || []) as Entity[],
    relationships: relationships as Relationship[],
  };
}

// ============================================================================
// VECTOR EMBEDDINGS & SIMILARITY SEARCH
// ============================================================================

export async function createEmbedding(
  entityId: string,
  tenantId: string | null,
  text: string
): Promise<GraphEmbedding> {
  // Generate embedding using placeholder approach
  // In production, use OpenAI's embedding API
  const vector = generatePlaceholderEmbedding(text);

  const { data, error } = await supabaseAdmin
    .from('unite_graph_embeddings')
    .insert({
      entity_id: entityId,
      vector: JSON.stringify(vector),
      tenant_id: tenantId,
      metadata: { text_length: text.length },
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create embedding: ${error.message}`);
}
  return data as GraphEmbedding;
}

export async function findSimilarEntities(
  entityId: string,
  options?: {
    limit?: number;
    threshold?: number;
  }
): Promise<Array<{ entity: Entity; similarity: number }>> {
  const limit = options?.limit || 10;

  // Get embedding for source entity
  const { data: sourceEmbedding } = await supabaseAdmin
    .from('unite_graph_embeddings')
    .select('vector, tenant_id')
    .eq('entity_id', entityId)
    .single();

  if (!sourceEmbedding) {
    return [];
  }

  // Find similar embeddings
  const { data: similarEmbeddings } = await supabaseAdmin
    .from('unite_graph_embeddings')
    .select('entity_id, vector')
    .eq('tenant_id', sourceEmbedding.tenant_id)
    .neq('entity_id', entityId)
    .limit(limit);

  if (!similarEmbeddings || similarEmbeddings.length === 0) {
    return [];
  }

  // Get entities for similar embeddings
  const entityIds = similarEmbeddings.map((e) => e.entity_id);
  const { data: entities } = await supabaseAdmin
    .from('unite_entities')
    .select('*')
    .in('id', entityIds);

  if (!entities) {
    return [];
  }

  // Placeholder similarity scores
  return entities.map((entity, index) => ({
    entity: entity as Entity,
    similarity: 1 - index * 0.1,
  }));
}

// ============================================================================
// AI-POWERED GRAPH INSIGHTS
// ============================================================================

export async function aiAnalyzeGraph(
  tenantId: string | null,
  focus?: {
    entity_type?: string;
    relationship_type?: string;
  }
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
}> {
  try {
    const { data: entityStats } = await supabaseAdmin
      .from('unite_entities')
      .select('type')
      .eq('tenant_id', tenantId || '');

    const { data: relationshipStats } = await supabaseAdmin
      .from('unite_relationships')
      .select('type')
      .eq('tenant_id', tenantId || '');

    const entityCounts = (entityStats || []).reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const relationshipCounts = (relationshipStats || []).reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const anthropic = getAnthropicClient();

    const prompt = `Analyze this knowledge graph structure:

Entity Counts:
${JSON.stringify(entityCounts, null, 2)}

Relationship Counts:
${JSON.stringify(relationshipCounts, null, 2)}

${focus?.entity_type ? `Focus on entity type: ${focus.entity_type}` : ''}
${focus?.relationship_type ? `Focus on relationship type: ${focus.relationship_type}` : ''}

Provide analysis in JSON format:
{
  "summary": "Overall graph structure summary",
  "insights": [
    "Key pattern or observation",
    "Notable connection type"
  ],
  "recommendations": [
    "Suggested graph improvements",
    "Missing relationship types to consider"
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);
    return result;
  } catch (error) {
    console.error('[Knowledge Graph] AI analysis failed:', error);
    return {
      summary: 'AI analysis unavailable',
      insights: [],
      recommendations: [],
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generatePlaceholderEmbedding(text: string): number[] {
  // Placeholder: Generate a simple hash-based vector
  // In production, use OpenAI's embedding API
  const vector = new Array(1536).fill(0);
  for (let i = 0; i < text.length && i < 1536; i++) {
    vector[i] = (text.charCodeAt(i) % 256) / 256;
  }
  return vector;
}

// Placeholder implementations for legacy imports expecting edge-level functions
export async function getEdge(id: string) {
  const { data } = await supabaseAdmin.from('unite_relationships').select('*').eq('id', id).single();
  return data;
}

export async function getNeighbors(entityId: string) {
  const { data } = await supabaseAdmin
    .from('unite_relationships')
    .select('*')
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
  return data || [];
}

export async function getGraphStats(tenantId?: string) {
  const { data } = await supabaseAdmin
    .from('unite_relationships')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId || '');
  return { total_edges: data };
}

export async function listEdges(tenantId?: string) {
  const { data } = await supabaseAdmin
    .from('unite_relationships')
    .select('*')
    .maybeSingle();
  return data ? (Array.isArray(data) ? data : [data]) : [];
}

export async function deleteEdge(id: string) {
  const { error } = await supabaseAdmin.from('unite_relationships').delete().eq('id', id);
  if (error) {
throw error;
}
  return true;
}

export async function aiDiscoverRelationships(_: string) {
  // Placeholder AI discovery stub
  return [];
}

export async function createEdge(input: Partial<Relationship>) {
  const { data, error } = await supabaseAdmin.from('unite_relationships').insert(input).select().single();
  if (error) {
throw error;
}
  return data;
}
