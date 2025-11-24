/**
 * Intelligence Node Service
 * Phase 94: Create and manage intelligence nodes
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  IntelligenceNode,
  CreateNodePayload,
  NodeType
} from './meshTypes';

/**
 * Create a new intelligence node
 */
export async function createNode(
  payload: CreateNodePayload
): Promise<IntelligenceNode> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_nodes')
    .insert({
      node_type: payload.nodeType,
      source_table: payload.sourceTable || null,
      source_id: payload.sourceId || null,
      region_id: payload.regionId || null,
      tenant_id: payload.tenantId || null,
      weight: payload.weight || 1.0,
      confidence: payload.confidence || 0.5,
      label: payload.label || null,
      tags: payload.tags || [],
      payload: payload.payload || {},
      metadata: payload.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create node: ${error.message}`);
  }

  return mapNodeFromDb(data);
}

/**
 * Find node by source reference
 */
export async function findNodeBySource(
  sourceTable: string,
  sourceId: string
): Promise<IntelligenceNode | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('source_table', sourceTable)
    .eq('source_id', sourceId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapNodeFromDb(data);
}

/**
 * Get node by ID
 */
export async function getNodeById(
  nodeId: string
): Promise<IntelligenceNode | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('id', nodeId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapNodeFromDb(data);
}

/**
 * List nodes by region
 */
export async function listNodesByRegion(
  regionId: string,
  options?: {
    nodeType?: NodeType;
    limit?: number;
  }
): Promise<IntelligenceNode[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('region_id', regionId)
    .order('weight', { ascending: false });

  if (options?.nodeType) {
    query = query.eq('node_type', options.nodeType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(mapNodeFromDb);
}

/**
 * List nodes by tenant
 */
export async function listNodesByTenant(
  tenantId: string,
  options?: {
    nodeType?: NodeType;
    limit?: number;
  }
): Promise<IntelligenceNode[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('weight', { ascending: false });

  if (options?.nodeType) {
    query = query.eq('node_type', options.nodeType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(mapNodeFromDb);
}

/**
 * List nodes by type
 */
export async function listNodesByType(
  nodeType: NodeType,
  limit: number = 100
): Promise<IntelligenceNode[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('node_type', nodeType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(mapNodeFromDb);
}

/**
 * Update node weight and confidence
 */
export async function updateNodeMetrics(
  nodeId: string,
  metrics: { weight?: number; confidence?: number }
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updates: any = {};
  if (metrics.weight !== undefined) {
    updates.weight = metrics.weight;
  }
  if (metrics.confidence !== undefined) {
    updates.confidence = metrics.confidence;
  }

  await supabase
    .from('intelligence_nodes')
    .update(updates)
    .eq('id', nodeId);
}

/**
 * Delete a node
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('intelligence_nodes')
    .delete()
    .eq('id', nodeId);
}

/**
 * Get or create node for a source
 */
export async function getOrCreateNode(
  payload: CreateNodePayload
): Promise<IntelligenceNode> {
  if (payload.sourceTable && payload.sourceId) {
    const existing = await findNodeBySource(payload.sourceTable, payload.sourceId);
    if (existing) {
      return existing;
    }
  }

  return createNode(payload);
}

function mapNodeFromDb(row: any): IntelligenceNode {
  return {
    id: row.id,
    createdAt: row.created_at,
    nodeType: row.node_type,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    regionId: row.region_id,
    tenantId: row.tenant_id,
    weight: row.weight,
    confidence: row.confidence,
    label: row.label,
    tags: row.tags || [],
    payload: row.payload || {},
    metadata: row.metadata || {},
  };
}
