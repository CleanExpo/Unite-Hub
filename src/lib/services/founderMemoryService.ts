/**
 * Founder Memory Graph Service
 * Phase 51: AI memory graph for tracking all context
 */

import { getSupabaseServer } from '@/lib/supabase';

export type MemoryNodeType =
  | 'client'
  | 'project'
  | 'invoice'
  | 'receipt'
  | 'task'
  | 'event'
  | 'staff_member'
  | 'email_thread'
  | 'voice_command'
  | 'financial_entry';

export interface MemoryNode {
  id: string;
  founder_id: string;
  node_type: MemoryNodeType;
  entity_id: string;
  title: string;
  summary?: string;
  context_data: Record<string, any>;
  importance_score: number;
  related_nodes: string[];
  last_accessed: string;
  created_at: string;
}

// Create or update a memory node
export async function upsertMemoryNode(
  founderId: string,
  organizationId: string,
  node: {
    node_type: MemoryNodeType;
    entity_id: string;
    title: string;
    summary?: string;
    context_data?: Record<string, any>;
    importance_score?: number;
    related_nodes?: string[];
  }
): Promise<MemoryNode | null> {
  const supabase = await getSupabaseServer();

  // Check if node exists
  const { data: existing } = await supabase
    .from('founder_memory_nodes')
    .select('id')
    .eq('founder_id', founderId)
    .eq('entity_id', node.entity_id)
    .eq('node_type', node.node_type)
    .single();

  if (existing) {
    // Update existing node
    const { data, error } = await supabase
      .from('founder_memory_nodes')
      .update({
        title: node.title,
        summary: node.summary,
        context_data: node.context_data || {},
        importance_score: node.importance_score || 50,
        related_nodes: node.related_nodes || [],
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory node:', error);
      return null;
    }

    return data as MemoryNode;
  }

  // Create new node
  const { data, error } = await supabase
    .from('founder_memory_nodes')
    .insert({
      founder_id: founderId,
      organization_id: organizationId,
      node_type: node.node_type,
      entity_id: node.entity_id,
      title: node.title,
      summary: node.summary,
      context_data: node.context_data || {},
      importance_score: node.importance_score || 50,
      related_nodes: node.related_nodes || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating memory node:', error);
    return null;
  }

  return data as MemoryNode;
}

// Get memory nodes by type
export async function getMemoryNodes(
  founderId: string,
  options: {
    node_type?: MemoryNodeType;
    min_importance?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<MemoryNode[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_memory_nodes')
    .select('*')
    .eq('founder_id', founderId)
    .order('importance_score', { ascending: false });

  if (options.node_type) {
    query = query.eq('node_type', options.node_type);
  }

  if (options.min_importance) {
    query = query.gte('importance_score', options.min_importance);
  }

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching memory nodes:', error);
    return [];
  }

  return data as MemoryNode[];
}

// Get related nodes
export async function getRelatedNodes(
  founderId: string,
  nodeId: string
): Promise<MemoryNode[]> {
  const supabase = await getSupabaseServer();

  // Get the source node
  const { data: sourceNode } = await supabase
    .from('founder_memory_nodes')
    .select('related_nodes')
    .eq('id', nodeId)
    .eq('founder_id', founderId)
    .single();

  if (!sourceNode || !sourceNode.related_nodes?.length) {
    return [];
  }

  // Get related nodes
  const { data, error } = await supabase
    .from('founder_memory_nodes')
    .select('*')
    .in('id', sourceNode.related_nodes);

  if (error) {
    console.error('Error fetching related nodes:', error);
    return [];
  }

  return data as MemoryNode[];
}

// Link two nodes together
export async function linkNodes(
  founderId: string,
  nodeId1: string,
  nodeId2: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Get both nodes
  const { data: nodes } = await supabase
    .from('founder_memory_nodes')
    .select('id, related_nodes')
    .eq('founder_id', founderId)
    .in('id', [nodeId1, nodeId2]);

  if (!nodes || nodes.length !== 2) {
    return false;
  }

  // Update both nodes with bidirectional links
  const node1 = nodes.find((n) => n.id === nodeId1);
  const node2 = nodes.find((n) => n.id === nodeId2);

  if (!node1 || !node2) {
return false;
}

  const node1Related = [...new Set([...(node1.related_nodes || []), nodeId2])];
  const node2Related = [...new Set([...(node2.related_nodes || []), nodeId1])];

  await supabase
    .from('founder_memory_nodes')
    .update({ related_nodes: node1Related })
    .eq('id', nodeId1);

  await supabase
    .from('founder_memory_nodes')
    .update({ related_nodes: node2Related })
    .eq('id', nodeId2);

  return true;
}

// Update importance score
export async function updateImportance(
  founderId: string,
  nodeId: string,
  importance: number
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('founder_memory_nodes')
    .update({
      importance_score: Math.max(0, Math.min(100, importance)),
      last_accessed: new Date().toISOString(),
    })
    .eq('id', nodeId)
    .eq('founder_id', founderId);

  return !error;
}

// Get memory graph stats
export async function getMemoryStats(founderId: string): Promise<{
  totalNodes: number;
  byType: Record<string, number>;
  avgImportance: number;
  recentlyAccessed: number;
}> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_memory_nodes')
    .select('node_type, importance_score, last_accessed')
    .eq('founder_id', founderId);

  if (!data || data.length === 0) {
    return {
      totalNodes: 0,
      byType: {},
      avgImportance: 0,
      recentlyAccessed: 0,
    };
  }

  const byType: Record<string, number> = {};
  let totalImportance = 0;
  let recentlyAccessed = 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  data.forEach((node) => {
    byType[node.node_type] = (byType[node.node_type] || 0) + 1;
    totalImportance += node.importance_score || 0;
    if (new Date(node.last_accessed) > oneWeekAgo) {
      recentlyAccessed++;
    }
  });

  return {
    totalNodes: data.length,
    byType,
    avgImportance: Math.round(totalImportance / data.length),
    recentlyAccessed,
  };
}

// Search memory graph
export async function searchMemory(
  founderId: string,
  query: string
): Promise<MemoryNode[]> {
  return getMemoryNodes(founderId, { search: query, limit: 20 });
}

// Get high importance nodes
export async function getImportantNodes(
  founderId: string,
  limit: number = 10
): Promise<MemoryNode[]> {
  return getMemoryNodes(founderId, { min_importance: 70, limit });
}

export default {
  upsertMemoryNode,
  getMemoryNodes,
  getRelatedNodes,
  linkNodes,
  updateImportance,
  getMemoryStats,
  searchMemory,
  getImportantNodes,
};
