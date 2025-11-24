/**
 * Mesh Aggregation Service
 * Phase 94: Compute composite intelligence metrics
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  RegionIntelligence,
  TenantIntelligence,
  GlobalMeshOverview
} from './meshTypes';

/**
 * Aggregate intelligence for a region
 */
export async function aggregateRegionIntelligence(
  regionId: string
): Promise<RegionIntelligence | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('aggregate_region_intelligence', {
    p_region_id: regionId,
  });

  if (!data) {
    return null;
  }

  return {
    regionId: data.region_id,
    nodeCount: data.node_count || 0,
    avgWeight: data.avg_weight || 0,
    avgConfidence: data.avg_confidence || 0,
    byType: data.by_type || {},
    highWeightNodes: data.high_weight_nodes || [],
  };
}

/**
 * Aggregate intelligence for a tenant
 */
export async function aggregateTenantIntelligence(
  tenantId: string
): Promise<TenantIntelligence | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('aggregate_tenant_intelligence', {
    p_tenant_id: tenantId,
  });

  if (!data) {
    return null;
  }

  return {
    tenantId: data.tenant_id,
    nodeCount: data.node_count || 0,
    avgWeight: data.avg_weight || 0,
    avgConfidence: data.avg_confidence || 0,
    byType: data.by_type || {},
  };
}

/**
 * Get global mesh overview
 */
export async function globalMeshOverview(): Promise<GlobalMeshOverview> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_global_mesh_overview');

  if (!data) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      avgConfidence: 0,
      byNodeType: {},
      byRelationship: {},
      regionsWithNodes: 0,
      tenantsWithNodes: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    totalNodes: data.total_nodes || 0,
    totalEdges: data.total_edges || 0,
    avgConfidence: data.avg_confidence || 0,
    byNodeType: data.by_node_type || {},
    byRelationship: data.by_relationship || {},
    regionsWithNodes: data.regions_with_nodes || 0,
    tenantsWithNodes: data.tenants_with_nodes || 0,
    generatedAt: data.generated_at || new Date().toISOString(),
  };
}

/**
 * Get top weighted nodes across the mesh
 */
export async function getTopWeightedNodes(
  limit: number = 20
): Promise<Array<{
  id: string;
  label: string;
  nodeType: string;
  weight: number;
  confidence: number;
  regionId: string | null;
  tenantId: string | null;
}>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_nodes')
    .select('id, label, node_type, weight, confidence, region_id, tenant_id')
    .order('weight', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    label: row.label,
    nodeType: row.node_type,
    weight: row.weight,
    confidence: row.confidence,
    regionId: row.region_id,
    tenantId: row.tenant_id,
  }));
}

/**
 * Get strongest edges in the mesh
 */
export async function getStrongestEdges(
  limit: number = 20
): Promise<Array<{
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
  strength: number;
  confidence: number;
}>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_edges')
    .select('id, from_node_id, to_node_id, relationship, strength, confidence')
    .order('strength', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    relationship: row.relationship,
    strength: row.strength,
    confidence: row.confidence,
  }));
}

/**
 * Get mesh health metrics
 */
export async function getMeshHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  metrics: Record<string, number>;
}> {
  const overview = await globalMeshOverview();
  const issues: string[] = [];

  // Check for potential issues
  if (overview.totalNodes === 0) {
    issues.push('No intelligence nodes in the mesh');
  }

  if (overview.avgConfidence < 0.3) {
    issues.push('Low average confidence across nodes');
  }

  if (overview.totalEdges === 0 && overview.totalNodes > 1) {
    issues.push('Nodes exist but no connections between them');
  }

  const edgeNodeRatio = overview.totalNodes > 0
    ? overview.totalEdges / overview.totalNodes
    : 0;

  if (edgeNodeRatio < 0.5 && overview.totalNodes > 10) {
    issues.push('Low connectivity in the mesh (few edges per node)');
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics: {
      totalNodes: overview.totalNodes,
      totalEdges: overview.totalEdges,
      avgConfidence: overview.avgConfidence,
      edgeNodeRatio,
      regionsWithNodes: overview.regionsWithNodes,
      tenantsWithNodes: overview.tenantsWithNodes,
    },
  };
}
