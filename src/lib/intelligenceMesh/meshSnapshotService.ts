/**
 * Mesh Snapshot Service
 * Phase 94: Record periodic snapshots of mesh state
 */

import { getSupabaseServer } from '@/lib/supabase';
import { globalMeshOverview, getMeshHealth } from './meshAggregationService';
import type { MeshSnapshot, SnapshotType } from './meshTypes';

/**
 * Create a snapshot of the current mesh state
 */
async function createSnapshot(
  snapshotType: SnapshotType
): Promise<MeshSnapshot> {
  const supabase = await getSupabaseServer();

  // Get current mesh state
  const overview = await globalMeshOverview();
  const health = await getMeshHealth();

  const snapshot = {
    overview,
    health,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('intelligence_mesh_snapshots')
    .insert({
      snapshot_type: snapshotType,
      snapshot,
      node_count: overview.totalNodes,
      edge_count: overview.totalEdges,
      avg_confidence: overview.avgConfidence,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create snapshot: ${error.message}`);
  }

  return {
    id: data.id,
    createdAt: data.created_at,
    snapshotType: data.snapshot_type,
    snapshot: data.snapshot,
    nodeCount: data.node_count,
    edgeCount: data.edge_count,
    avgConfidence: data.avg_confidence,
    metadata: data.metadata || {},
  };
}

/**
 * Create daily snapshot
 */
export async function createDailySnapshot(): Promise<MeshSnapshot> {
  return createSnapshot('daily');
}

/**
 * Create weekly snapshot
 */
export async function createWeeklySnapshot(): Promise<MeshSnapshot> {
  return createSnapshot('weekly');
}

/**
 * Create hourly snapshot
 */
export async function createHourlySnapshot(): Promise<MeshSnapshot> {
  return createSnapshot('hourly');
}

/**
 * Get recent snapshots
 */
export async function getRecentSnapshots(
  limit: number = 10,
  snapshotType?: SnapshotType
): Promise<MeshSnapshot[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('intelligence_mesh_snapshots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (snapshotType) {
    query = query.eq('snapshot_type', snapshotType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    createdAt: row.created_at,
    snapshotType: row.snapshot_type,
    snapshot: row.snapshot,
    nodeCount: row.node_count,
    edgeCount: row.edge_count,
    avgConfidence: row.avg_confidence,
    metadata: row.metadata || {},
  }));
}

/**
 * Get snapshot by ID
 */
export async function getSnapshotById(
  snapshotId: string
): Promise<MeshSnapshot | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('intelligence_mesh_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    createdAt: data.created_at,
    snapshotType: data.snapshot_type,
    snapshot: data.snapshot,
    nodeCount: data.node_count,
    edgeCount: data.edge_count,
    avgConfidence: data.avg_confidence,
    metadata: data.metadata || {},
  };
}

/**
 * Compare two snapshots
 */
export async function compareSnapshots(
  snapshot1Id: string,
  snapshot2Id: string
): Promise<{
  nodeDelta: number;
  edgeDelta: number;
  confidenceDelta: number;
  changes: string[];
}> {
  const [snap1, snap2] = await Promise.all([
    getSnapshotById(snapshot1Id),
    getSnapshotById(snapshot2Id),
  ]);

  if (!snap1 || !snap2) {
    return {
      nodeDelta: 0,
      edgeDelta: 0,
      confidenceDelta: 0,
      changes: ['Unable to compare - snapshot not found'],
    };
  }

  const nodeDelta = snap2.nodeCount - snap1.nodeCount;
  const edgeDelta = snap2.edgeCount - snap1.edgeCount;
  const confidenceDelta = snap2.avgConfidence - snap1.avgConfidence;

  const changes: string[] = [];

  if (nodeDelta !== 0) {
    changes.push(
      `Nodes ${nodeDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(nodeDelta)}`
    );
  }
  if (edgeDelta !== 0) {
    changes.push(
      `Edges ${edgeDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(edgeDelta)}`
    );
  }
  if (Math.abs(confidenceDelta) > 0.05) {
    changes.push(
      `Average confidence ${confidenceDelta > 0 ? 'improved' : 'declined'} by ${(Math.abs(confidenceDelta) * 100).toFixed(1)}%`
    );
  }

  if (changes.length === 0) {
    changes.push('No significant changes detected');
  }

  return {
    nodeDelta,
    edgeDelta,
    confidenceDelta,
    changes,
  };
}

/**
 * Get mesh trend from snapshots
 */
export async function getMeshTrend(
  days: number = 7
): Promise<Array<{
  date: string;
  nodeCount: number;
  edgeCount: number;
  avgConfidence: number;
}>> {
  const supabase = await getSupabaseServer();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('intelligence_mesh_snapshots')
    .select('created_at, node_count, edge_count, avg_confidence')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    date: row.created_at,
    nodeCount: row.node_count,
    edgeCount: row.edge_count,
    avgConfidence: row.avg_confidence,
  }));
}
