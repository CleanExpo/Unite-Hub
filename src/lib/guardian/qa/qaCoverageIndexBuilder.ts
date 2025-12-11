/**
 * Guardian I08: QA Coverage Index Builder
 *
 * Extracts metadata from I01-I07 artifacts and builds comprehensive coverage index.
 * Reads from: guardian_rules, guardian_playbooks, guardian_simulation_runs,
 *             guardian_regression_runs, guardian_playbook_sim_runs,
 *             guardian_incident_drills
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  CoverageItem,
  EntityType,
  QACoverageEntity,
  TestCoverageBreakdown,
} from './qaCoverageModel';
import { classifyRisk, calculateCoverageScore, isBlindSpot } from './qaCoverageModel';

export interface CoverageIndexOptions {
  includeInactiveRules?: boolean;
  lookbackDays?: number;
}

/**
 * Extract rules and their metadata
 */
async function extractRules(
  tenantId: string,
  options?: CoverageIndexOptions
): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const query = supabase.from('guardian_rules').select('id, name, metadata').eq('tenant_id', tenantId);

  if (options?.includeInactiveRules === false) {
    query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to extract rules: ${error.message}`);
  }

  return (data || []).map((rule) => ({
    id: rule.id,
    name: rule.name,
    type: 'rule' as EntityType,
    metadata: rule.metadata || {},
  }));
}

/**
 * Extract playbooks and their metadata
 */
async function extractPlaybooks(
  tenantId: string,
  options?: CoverageIndexOptions
): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const query = supabase.from('guardian_playbooks').select('id, name, metadata').eq('tenant_id', tenantId);

  if (options?.includeInactiveRules === false) {
    query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to extract playbooks: ${error.message}`);
  }

  return (data || []).map((pb) => ({
    id: pb.id,
    name: pb.name,
    type: 'playbook' as EntityType,
    metadata: pb.metadata || {},
  }));
}

/**
 * Extract scenarios from I02 simulation runs
 */
async function extractScenarios(tenantId: string): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_simulation_runs')
    .select('id, name, metadata')
    .eq('tenant_id', tenantId)
    .eq('simulation_type', 'scenario');

  if (error) {
    throw new Error(`Failed to extract scenarios: ${error.message}`);
  }

  return (data || []).map((sim) => ({
    id: sim.id,
    name: sim.name,
    type: 'scenario' as EntityType,
    metadata: sim.metadata || {},
  }));
}

/**
 * Extract regression packs from I03 regression runs
 */
async function extractRegressionPacks(tenantId: string): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_regression_runs')
    .select('id, name, metadata')
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to extract regression packs: ${error.message}`);
  }

  return (data || []).map((reg) => ({
    id: reg.id,
    name: reg.name,
    type: 'regression_pack' as EntityType,
    metadata: reg.metadata || {},
  }));
}

/**
 * Extract playbook simulations from I04 playbook sim runs
 */
async function extractPlaybookSims(tenantId: string): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_playbook_sim_runs')
    .select('id, name, metadata')
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to extract playbook simulations: ${error.message}`);
  }

  return (data || []).map((sim) => ({
    id: sim.id,
    name: sim.name,
    type: 'playbook_sim' as EntityType,
    metadata: sim.metadata || {},
  }));
}

/**
 * Extract drills from I07 incident drills
 */
async function extractDrills(tenantId: string): Promise<QACoverageEntity[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_incident_drills')
    .select('id, name, metadata')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to extract drills: ${error.message}`);
  }

  return (data || []).map((drill) => ({
    id: drill.id,
    name: drill.name,
    type: 'drill' as EntityType,
    metadata: drill.metadata || {},
  }));
}

/**
 * Count test instances for each rule (coverage by rule)
 */
async function countRuleCoverage(
  tenantId: string,
  ruleId: string
): Promise<TestCoverageBreakdown> {
  const supabase = getSupabaseServer();

  // Count references in simulation runs
  const { count: scenarioCount } = await supabase
    .from('guardian_simulation_rule_executions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('rule_id', ruleId);

  // Count references in regression runs
  const { count: regressionCount } = await supabase
    .from('guardian_regression_rule_executions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('rule_id', ruleId);

  // Count references in playbook sims
  const { count: playbookSimCount } = await supabase
    .from('guardian_playbook_sim_rule_executions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('rule_id', ruleId);

  // Count references in drills
  const { count: drillCount } = await supabase
    .from('guardian_incident_drill_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .match({ details: `{"rule_id":"${ruleId}"}` });

  return {
    scenarios: scenarioCount || 0,
    regressionPacks: regressionCount || 0,
    playbookSims: playbookSimCount || 0,
    drills: drillCount || 0,
  };
}

/**
 * Build comprehensive coverage index
 */
export async function buildCoverageIndex(
  tenantId: string,
  options?: CoverageIndexOptions
): Promise<CoverageItem[]> {

  // Extract all entities
  const [rules, playbooks, scenarios, regressionPacks, playbookSims, drills] = await Promise.all([
    extractRules(tenantId, options),
    extractPlaybooks(tenantId, options),
    extractScenarios(tenantId),
    extractRegressionPacks(tenantId),
    extractPlaybookSims(tenantId),
    extractDrills(tenantId),
  ]);

  const allEntities = [...rules, ...playbooks, ...scenarios, ...regressionPacks, ...playbookSims, ...drills];

  // Build coverage items
  const items: CoverageItem[] = [];

  for (const entity of allEntities) {
    let testCoverage: TestCoverageBreakdown = {
      scenarios: 0,
      regressionPacks: 0,
      playbookSims: 0,
      drills: 0,
    };

    // Only count coverage for rules and playbooks
    if (entity.type === 'rule') {
      testCoverage = await countRuleCoverage(tenantId, entity.id);
    }

    const riskLevel = classifyRisk(entity);
    const coverageScore = calculateCoverageScore(testCoverage);
    const blind = isBlindSpot(entity, testCoverage, riskLevel);

    items.push({
      entity,
      riskLevel,
      coverageScore,
      testCoverage,
      isBlindSpot: blind,
    });
  }

  return items;
}

/**
 * Get coverage statistics for a tenant
 */
export async function getCoverageStatistics(tenantId: string): Promise<{
  totalRules: number;
  totalPlaybooks: number;
  totalScenarios: number;
  totalRegressionPacks: number;
  totalPlaybookSims: number;
  totalDrills: number;
}> {
  const supabase = getSupabaseServer();

  const [
    { count: rulesCount },
    { count: playbooksCount },
    { count: scenariosCount },
    { count: regressionCount },
    { count: playbookSimCount },
    { count: drillCount },
  ] = await Promise.all([
    supabase
      .from('guardian_rules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('guardian_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('guardian_simulation_runs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('simulation_type', 'scenario'),
    supabase
      .from('guardian_regression_runs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('guardian_playbook_sim_runs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('guardian_incident_drills')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
  ]);

  return {
    totalRules: rulesCount || 0,
    totalPlaybooks: playbooksCount || 0,
    totalScenarios: scenariosCount || 0,
    totalRegressionPacks: regressionCount || 0,
    totalPlaybookSims: playbookSimCount || 0,
    totalDrills: drillCount || 0,
  };
}
