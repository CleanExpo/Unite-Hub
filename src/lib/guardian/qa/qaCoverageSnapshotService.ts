/**
 * Guardian I08: QA Coverage Snapshot Service
 *
 * Creates point-in-time coverage snapshots and persists coverage items.
 * Reads from coverage index, writes only to I08 tables.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { buildCoverageIndex, getCoverageStatistics } from './qaCoverageIndexBuilder';
import { generateCoverageSnapshot } from './qaCoverageModel';
import type { CoverageSnapshot } from './qaCoverageModel';

/**
 * Create and persist a new coverage snapshot
 */
export async function createCoverageSnapshot(tenantId: string): Promise<CoverageSnapshot> {
  const supabase = getSupabaseServer();

  // Get current timestamp
  const now = new Date();

  // Build coverage index from I01-I07 artifacts
  const items = await buildCoverageIndex(tenantId);

  // Generate snapshot data
  const snapshot = generateCoverageSnapshot(
    items.map((item) => item.entity),
    now
  );

  // Enrich snapshot with statistics
  const stats = await getCoverageStatistics(tenantId);

  // Insert snapshot
  const { data: snapshotData, error: snapshotError } = await supabase
    .from('guardian_qa_coverage_snapshots')
    .insert({
      tenant_id: tenantId,
      snapshot_date: now,
      rules_coverage: snapshot.rulesCoverage,
      playbooks_coverage: snapshot.playbooksCoverage,
      scenarios_coverage: snapshot.scenariosCoverage,
      regression_packs_coverage: snapshot.regressionPacksCoverage,
      playbook_sims_coverage: snapshot.playbookSimsCoverage,
      drills_coverage: snapshot.drillsCoverage,
      overall_coverage: snapshot.overallCoverage,
      critical_blind_spots_count: snapshot.criticalBlindSpots,
      high_blind_spots_count: snapshot.highBlindSpots,
      medium_blind_spots_count: snapshot.mediumBlindSpots,
      total_rules: stats.totalRules,
      total_playbooks: stats.totalPlaybooks,
      total_scenarios: stats.totalScenarios,
      total_regression_packs: stats.totalRegressionPacks,
      total_playbook_sims: stats.totalPlaybookSims,
      total_drills: stats.totalDrills,
      metadata: {},
    })
    .select()
    .single();

  if (snapshotError || !snapshotData) {
    throw new Error(`Failed to create coverage snapshot: ${snapshotError?.message || 'Unknown error'}`);
  }

  // Insert coverage items
  const itemsToInsert = snapshot.items.map((item) => ({
    tenant_id: tenantId,
    snapshot_id: snapshotData.id,
    entity_type: item.entity.type,
    entity_id: item.entity.id,
    entity_name: item.entity.name,
    risk_level: item.riskLevel,
    coverage_score: item.coverageScore,
    is_blind_spot: item.isBlindSpot,
    tested_by_scenarios: item.testCoverage.scenarios,
    tested_by_regression_packs: item.testCoverage.regressionPacks,
    tested_by_playbook_sims: item.testCoverage.playbookSims,
    tested_by_drills: item.testCoverage.drills,
    total_test_instances:
      item.testCoverage.scenarios +
      item.testCoverage.regressionPacks +
      item.testCoverage.playbookSims +
      item.testCoverage.drills,
    metadata: {},
  }));

  const { error: itemsError } = await supabase
    .from('guardian_qa_coverage_items')
    .insert(itemsToInsert);

  if (itemsError) {
    throw new Error(`Failed to insert coverage items: ${itemsError.message}`);
  }

  return snapshot;
}

/**
 * Get latest coverage snapshot for tenant
 */
export async function getLatestSnapshot(tenantId: string): Promise<CoverageSnapshot | null> {
  const supabase = getSupabaseServer();

  const { data: snapshot, error: snapshotError } = await supabase
    .from('guardian_qa_coverage_current')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (snapshotError || !snapshot) {
    return null;
  }

  // Load coverage items
  const { data: items, error: itemsError } = await supabase
    .from('guardian_qa_coverage_items')
    .select('*')
    .eq('snapshot_id', snapshot.id)
    .order('risk_level', { ascending: false });

  if (itemsError) {
    throw new Error(`Failed to load coverage items: ${itemsError.message}`);
  }

  return {
    snapshotDate: new Date(snapshot.snapshot_date),
    rulesCoverage: snapshot.rules_coverage,
    playbooksCoverage: snapshot.playbooks_coverage,
    scenariosCoverage: snapshot.scenarios_coverage,
    regressionPacksCoverage: snapshot.regression_packs_coverage,
    playbookSimsCoverage: snapshot.playbook_sims_coverage,
    drillsCoverage: snapshot.drills_coverage,
    overallCoverage: snapshot.overall_coverage,
    criticalBlindSpots: snapshot.critical_blind_spots_count,
    highBlindSpots: snapshot.high_blind_spots_count,
    mediumBlindSpots: snapshot.medium_blind_spots_count,
    items: (items || []).map((item) => ({
      entity: {
        id: item.entity_id,
        name: item.entity_name,
        type: item.entity_type,
        metadata: item.metadata || {},
      },
      riskLevel: item.risk_level,
      coverageScore: item.coverage_score,
      testCoverage: {
        scenarios: item.tested_by_scenarios,
        regressionPacks: item.tested_by_regression_packs,
        playbookSims: item.tested_by_playbook_sims,
        drills: item.tested_by_drills,
      },
      isBlindSpot: item.is_blind_spot,
      lastTestedAt: item.last_tested_at ? new Date(item.last_tested_at) : undefined,
      consecutiveUncoveredDays: item.consecutive_uncovered_days,
    })),
  };
}

/**
 * Get blind spots from latest snapshot
 */
export async function getBlindSpots(
  tenantId: string,
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
): Promise<
  Array<{
    entityType: string;
    entityId: string;
    entityName: string;
    riskLevel: string;
    coverageScore: number;
    lastTestedAt?: Date;
    consecutiveUncoveredDays?: number;
  }>
> {
  const supabase = getSupabaseServer();

  let query = supabase.from('guardian_qa_coverage_blind_spots').select('*').eq('tenant_id', tenantId);

  if (riskLevel) {
    query = query.eq('risk_level', riskLevel);
  }

  const { data, error } = await query.order('risk_level', { ascending: false }).order('consecutive_uncovered_days', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to load blind spots: ${error.message}`);
  }

  return (data || []).map((item) => ({
    entityType: item.entity_type,
    entityId: item.entity_id,
    entityName: item.entity_name,
    riskLevel: item.risk_level,
    coverageScore: item.coverage_score,
    lastTestedAt: item.last_tested_at ? new Date(item.last_tested_at) : undefined,
    consecutiveUncoveredDays: item.consecutive_uncovered_days,
  }));
}

/**
 * Get coverage trend over time (last N snapshots)
 */
export async function getCoverageTrend(
  tenantId: string,
  lookbackDays: number = 30
): Promise<
  Array<{
    snapshotDate: Date;
    overallCoverage: number;
    criticalBlindSpots: number;
  }>
> {
  const supabase = getSupabaseServer();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  const { data, error } = await supabase
    .from('guardian_qa_coverage_snapshots')
    .select('snapshot_date, overall_coverage, critical_blind_spots_count')
    .eq('tenant_id', tenantId)
    .gte('created_at', cutoffDate.toISOString())
    .order('snapshot_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load coverage trend: ${error.message}`);
  }

  return (data || []).map((snap) => ({
    snapshotDate: new Date(snap.snapshot_date),
    overallCoverage: snap.overall_coverage,
    criticalBlindSpots: snap.critical_blind_spots_count,
  }));
}
