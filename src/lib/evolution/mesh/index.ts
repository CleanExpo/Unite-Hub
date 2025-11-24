import { getSupabaseServer } from '@/lib/supabase';

export interface MeshNode {
  id: string;
  tenantId: string;
  nodeType: 'engine' | 'region' | 'task' | 'trend' | 'signal' | 'metric';
  nodeLabel: string;
  nodeData: Record<string, unknown>;
  influenceWeight: number;
  temporalDecayFactor?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeshEdge {
  id: string;
  tenantId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: 'influences' | 'depends_on' | 'triggers' | 'correlates' | 'feedback';
  weight: number;
  confidence: number;
  isFeedbackLoop: boolean;
  createdAt: string;
}

export interface MeshSnapshot {
  id: string;
  tenantId: string;
  nodeCount: number;
  edgeCount: number;
  feedbackLoopsDetected: number;
  meshHealthScore?: number;
  uncertaintyNotes?: string;
  createdAt: string;
}

export async function getNodes(tenantId: string, nodeType?: string): Promise<MeshNode[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('evolution_mesh_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('influence_weight', { ascending: false })
    .limit(100);

  if (nodeType) {
    query = query.eq('node_type', nodeType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get mesh nodes:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    nodeType: row.node_type,
    nodeLabel: row.node_label,
    nodeData: row.node_data,
    influenceWeight: row.influence_weight,
    temporalDecayFactor: row.temporal_decay_factor,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function getEdges(tenantId: string): Promise<MeshEdge[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_mesh_edges')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('weight', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Failed to get mesh edges:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    edgeType: row.edge_type,
    weight: row.weight,
    confidence: row.confidence,
    isFeedbackLoop: row.is_feedback_loop,
    createdAt: row.created_at
  }));
}

export async function getMeshOverview(tenantId: string): Promise<MeshSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_mesh_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to get mesh overview:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    nodeCount: data.node_count,
    edgeCount: data.edge_count,
    feedbackLoopsDetected: data.feedback_loops_detected,
    meshHealthScore: data.mesh_health_score,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at
  };
}

export async function createNode(
  tenantId: string,
  nodeType: MeshNode['nodeType'],
  nodeLabel: string,
  nodeData: Record<string, unknown>
): Promise<MeshNode | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_mesh_nodes')
    .insert({
      tenant_id: tenantId,
      node_type: nodeType,
      node_label: nodeLabel,
      node_data: nodeData,
      influence_weight: 0.5
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create mesh node:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    nodeType: data.node_type,
    nodeLabel: data.node_label,
    nodeData: data.node_data,
    influenceWeight: data.influence_weight,
    temporalDecayFactor: data.temporal_decay_factor,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
