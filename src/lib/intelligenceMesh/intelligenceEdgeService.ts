/**
 * Intelligence Edge Service
 * Phase 94: Create and manage graph edges
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  IntelligenceEdge,
  CreateEdgePayload,
  RelationshipType
} from './meshTypes';

/**
 * Link two nodes with an edge
 */
export async function linkNodes(
  payload: CreateEdgePayload
): Promise<IntelligenceEdge> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .insert({
      from_node_id: payload.fromNodeId,
      to_node_id: payload.toNodeId,
      relationship: payload.relationship,
      strength: payload.strength,
      confidence: payload.confidence,
      is_bidirectional: payload.isBidirectional || false,
      metadata: payload.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create edge: ${error.message}`);
  }

  return mapEdgeFromDb(data);
}

/**
 * Get edge by ID
 */
export async function getEdgeById(
  edgeId: string
): Promise<IntelligenceEdge | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .select('*')
    .eq('id', edgeId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapEdgeFromDb(data);
}

/**
 * List edges for a node (both directions)
 */
export async function listEdgesForNode(
  nodeId: string
): Promise<{
  outgoing: IntelligenceEdge[];
  incoming: IntelligenceEdge[];
}> {
  const supabase = await getSupabaseServer();

  const [outgoing, incoming] = await Promise.all([
    supabase
      .from('intelligence_edges')
      .select('*')
      .eq('from_node_id', nodeId),
    supabase
      .from('intelligence_edges')
      .select('*')
      .eq('to_node_id', nodeId),
  ]);

  return {
    outgoing: (outgoing.data || []).map(mapEdgeFromDb),
    incoming: (incoming.data || []).map(mapEdgeFromDb),
  };
}

/**
 * Find edge between two nodes
 */
export async function findEdgeBetween(
  fromNodeId: string,
  toNodeId: string
): Promise<IntelligenceEdge | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .select('*')
    .eq('from_node_id', fromNodeId)
    .eq('to_node_id', toNodeId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapEdgeFromDb(data);
}

/**
 * List edges by relationship type
 */
export async function listEdgesByRelationship(
  relationship: RelationshipType,
  limit: number = 100
): Promise<IntelligenceEdge[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .select('*')
    .eq('relationship', relationship)
    .order('strength', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(mapEdgeFromDb);
}

/**
 * Update edge strength and confidence
 */
export async function updateEdgeMetrics(
  edgeId: string,
  metrics: { strength?: number; confidence?: number }
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updates: any = {};
  if (metrics.strength !== undefined) {
    updates.strength = metrics.strength;
  }
  if (metrics.confidence !== undefined) {
    updates.confidence = metrics.confidence;
  }

  await supabase
    .from('intelligence_edges')
    .update(updates)
    .eq('id', edgeId);
}

/**
 * Delete an edge
 */
export async function deleteEdge(edgeId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('intelligence_edges')
    .delete()
    .eq('id', edgeId);
}

/**
 * Get or create edge between nodes
 */
export async function getOrCreateEdge(
  payload: CreateEdgePayload
): Promise<IntelligenceEdge> {
  const existing = await findEdgeBetween(payload.fromNodeId, payload.toNodeId);
  if (existing) {
    // Update if new metrics are stronger
    if (payload.strength > existing.strength) {
      await updateEdgeMetrics(existing.id, {
        strength: payload.strength,
        confidence: payload.confidence,
      });
    }
    return existing;
  }

  return linkNodes(payload);
}

/**
 * Get strongly connected nodes (edges with high strength)
 */
export async function getStrongConnections(
  nodeId: string,
  minStrength: number = 0.7
): Promise<IntelligenceEdge[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .select('*')
    .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`)
    .gte('strength', minStrength)
    .order('strength', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapEdgeFromDb);
}

function mapEdgeFromDb(row: any): IntelligenceEdge {
  return {
    id: row.id,
    createdAt: row.created_at,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    relationship: row.relationship,
    strength: row.strength,
    confidence: row.confidence,
    isBidirectional: row.is_bidirectional,
    metadata: row.metadata || {},
  };
}
