/**
 * Guardian H05: H-Series Rollout State Collector
 * Gathers current state from Z10 governance, Z13 automation, Z14 status, Z16 validation, and H01-H04 presence
 * Returns PII-free aggregate state for enablement planning
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface HSeriesRolloutState {
  guardianVersion: string;
  z10Governance: {
    aiUsagePolicy: boolean;
    externalSharingPolicy: boolean;
    backupPolicy: boolean;
    validationGatePolicy: boolean;
  };
  z13Automation: {
    schedulesCount: number;
    activeSchedulesCount: number;
    tasksAvailable: string[];
  };
  z14Status: {
    statusPageEnabled: boolean;
    stakeholderViewsCount: number;
    lastSnapshotAt?: string;
  };
  z16Validation: {
    validationEnabled: boolean;
    lastValidationAt?: string;
    validationStatus: 'pass' | 'fail' | 'pending' | 'unknown';
  };
  hSeriesPresence: {
    h01RuleSuggestion: boolean;
    h02AnomalyDetection: boolean;
    h03CorrelationRefinement: boolean;
    h04IncidentScoring: boolean;
  };
  hSeriesDataMetrics: {
    h01RulesCount?: number;
    h02BaselinesCount?: number;
    h03ClustersCount?: number;
    h04ScoresCount?: number;
  };
  recommendedNextStage: string;
  warnings: string[];
  timestamp: string;
}

/**
 * Collect current rollout state (PII-free aggregates only)
 */
export async function collectHSeriesRolloutState(tenantId: string): Promise<HSeriesRolloutState> {
  const supabase = getSupabaseServer();
  const warnings: string[] = [];
  const timestamp = new Date().toISOString();

  // Collect Z10 governance flags
  const { data: z10Data } = await supabase
    .from('guardian_meta_governance_prefs')
    .select('ai_usage_policy, external_sharing_policy, backup_policy, validation_gate_policy')
    .eq('tenant_id', tenantId)
    .single();

  const z10Governance = {
    aiUsagePolicy: z10Data?.ai_usage_policy ?? false,
    externalSharingPolicy: z10Data?.external_sharing_policy ?? false,
    backupPolicy: z10Data?.backup_policy ?? true,
    validationGatePolicy: z10Data?.validation_gate_policy ?? true,
  };

  // Collect Z13 automation schedules
  const { data: z13Schedules, error: z13Error } = await supabase
    .from('guardian_meta_automation_schedules')
    .select('id, status', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (z13Error) {
    warnings.push(`Failed to collect Z13 automation state: ${z13Error.message}`);
  }

  const z13Automation = {
    schedulesCount: z13Schedules?.length ?? 0,
    activeSchedulesCount: (z13Schedules?.filter((s: any) => s.status === 'active') ?? []).length,
    tasksAvailable: [
      'readiness_evaluation',
      'uplift_planning',
      'incident_scoring_run',
      'governance_coach_audit_session',
      'export_bundle_generation',
    ],
  };

  // Collect Z14 status page state
  const { data: z14Data } = await supabase
    .from('guardian_meta_status_pages')
    .select('id, created_at', { count: 'exact' })
    .eq('tenant_id', tenantId);

  const { data: z14Snapshots } = await supabase
    .from('guardian_meta_status_snapshots')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const z14Status = {
    statusPageEnabled: (z14Data?.length ?? 0) > 0,
    stakeholderViewsCount: (z14Data?.length ?? 0) * 3, // Rough estimate (operator, leadership, cs)
    lastSnapshotAt: z14Snapshots?.created_at,
  };

  // Collect Z16 validation state
  const { data: z16Validations } = await supabase
    .from('guardian_meta_validation_results')
    .select('id, status, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const z16Validation = {
    validationEnabled: (z16Validations?.id) ? true : false,
    lastValidationAt: z16Validations?.created_at,
    validationStatus: (z16Validations?.status ?? 'unknown') as 'pass' | 'fail' | 'pending' | 'unknown',
  };

  // Collect H01-H04 presence and data metrics
  const [h01, h02, h03, h04] = await Promise.all([
    supabase.from('guardian_ai_rules').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('guardian_anomaly_baselines').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('guardian_correlation_clusters').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
    supabase.from('guardian_incident_scores').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
  ]);

  const hSeriesPresence = {
    h01RuleSuggestion: h01.count !== null && h01.count > 0,
    h02AnomalyDetection: h02.count !== null && h02.count > 0,
    h03CorrelationRefinement: h03.count !== null && h03.count > 0,
    h04IncidentScoring: h04.count !== null && h04.count > 0,
  };

  const hSeriesDataMetrics = {
    h01RulesCount: h01.count ?? undefined,
    h02BaselinesCount: h02.count ?? undefined,
    h03ClustersCount: h03.count ?? undefined,
    h04ScoresCount: h04.count ?? undefined,
  };

  // Determine recommended next stage
  const recommendedNextStage = determineRecommendedStage(hSeriesPresence, z10Governance, warnings);

  return {
    guardianVersion: '1.0.0',
    z10Governance,
    z13Automation,
    z14Status,
    z16Validation,
    hSeriesPresence,
    hSeriesDataMetrics,
    recommendedNextStage,
    warnings,
    timestamp,
  };
}

/**
 * Determine recommended enablement stage based on current state
 */
function determineRecommendedStage(
  hSeriesPresence: { h01RuleSuggestion: boolean; h02AnomalyDetection: boolean; h03CorrelationRefinement: boolean; h04IncidentScoring: boolean },
  z10Governance: { aiUsagePolicy: boolean; externalSharingPolicy: boolean; backupPolicy: boolean; validationGatePolicy: boolean },
  warnings: string[]
): string {
  const { h01RuleSuggestion, h02AnomalyDetection, h03CorrelationRefinement, h04IncidentScoring } = hSeriesPresence;
  const activeFeatureCount = [h01RuleSuggestion, h02AnomalyDetection, h03CorrelationRefinement, h04IncidentScoring].filter(Boolean).length;

  if (!z10Governance.backupPolicy) {
    warnings.push('Z10 backup policy disabled: consider enabling before H-series rollout');
  }

  if (!z10Governance.validationGatePolicy) {
    warnings.push('Z10 validation gate disabled: recommend enabling for safety');
  }

  // Stage progression logic
  if (activeFeatureCount === 0) {
    if (!z10Governance.aiUsagePolicy) {
      return 'stage_1_governance_baseline';
    }
    return 'stage_2_h01_rules_only';
  }

  if (activeFeatureCount === 1 && h01RuleSuggestion) {
    if (!h02AnomalyDetection) {
      return 'stage_3_h01_h02_anomalies';
    }
  }

  if (activeFeatureCount === 2 && h01RuleSuggestion && h02AnomalyDetection) {
    if (!h03CorrelationRefinement) {
      return 'stage_4_h03_correlation';
    }
  }

  if (activeFeatureCount === 3 && h01RuleSuggestion && h02AnomalyDetection && h03CorrelationRefinement) {
    if (!h04IncidentScoring) {
      return 'stage_5_h04_incident_scoring';
    }
  }

  if (activeFeatureCount === 4) {
    return 'stage_6_full_h_series_active';
  }

  return 'stage_7_optimization_and_scaling';
}

/**
 * Get brief readability description of current state
 */
export function formatRolloutStateSummary(state: HSeriesRolloutState): string {
  const { hSeriesPresence, z10Governance, recommendedNextStage } = state;
  const activeCount = [
    hSeriesPresence.h01RuleSuggestion,
    hSeriesPresence.h02AnomalyDetection,
    hSeriesPresence.h03CorrelationRefinement,
    hSeriesPresence.h04IncidentScoring,
  ].filter(Boolean).length;

  const features = [
    hSeriesPresence.h01RuleSuggestion && 'H01 Rules',
    hSeriesPresence.h02AnomalyDetection && 'H02 Anomalies',
    hSeriesPresence.h03CorrelationRefinement && 'H03 Correlation',
    hSeriesPresence.h04IncidentScoring && 'H04 Scoring',
  ]
    .filter(Boolean)
    .join(', ');

  const policyStatus = z10Governance.aiUsagePolicy ? 'AI enabled' : 'AI disabled';

  if (activeCount === 0) {
    return `No H-series features active. Governance: ${policyStatus}. Next: ${recommendedNextStage}`;
  }

  return `${activeCount}/4 H-series features active (${features}). Governance: ${policyStatus}. Next: ${recommendedNextStage}`;
}
