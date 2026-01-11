import { getSupabaseServer } from '@/lib/supabase';
import {
  ADOPTION_SCORE_DEFS,
  classifyAdoptionStatus,
  GuardianAdoptionDimensionKey,
  GuardianAdoptionSignal,
  GuardianAdoptionStatus,
  GuardianAdoptionSubDimensionKey,
} from '@/lib/guardian/meta/adoptionModel';

/**
 * Adoption score result for a dimension/subdimension
 */
export interface GuardianAdoptionScore {
  dimension: GuardianAdoptionDimensionKey;
  subDimension: GuardianAdoptionSubDimensionKey;
  label: string;
  score: number; // 0..100
  status: GuardianAdoptionStatus;
  signals: GuardianAdoptionSignal[];
  derivedFrom: Record<string, unknown>; // References to readiness/uplift/edition/recommendation IDs
  metadata?: Record<string, unknown>;
}

/**
 * Load core Guardian adoption metrics (rules, events, playbooks, risk)
 */
export async function loadCoreUsageMetrics(
  tenantId: string,
  windowDays: number = 30
): Promise<Record<string, number>> {
  const supabase = getSupabaseServer();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  try {
    // Count active rules
    const { count: activeRulesCount } = await supabase
      .from('guardian_alert_rules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Count alert events in window
    const { count: alertEventsCount } = await supabase
      .from('guardian_alert_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoffDate.toISOString());

    // Count playbooks
    const { count: playbooksCount } = await supabase
      .from('guardian_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Risk monitoring enabled check
    const { data: riskData } = await supabase
      .from('guardian_risk_scores')
      .select('id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      rules_active: activeRulesCount || 0,
      alerts_last_30d: alertEventsCount || 0,
      playbooks_total: playbooksCount || 0,
      risk_monitoring_enabled: riskData && riskData.length > 0 ? 1 : 0,
    };
  } catch (error) {
    console.error('Failed to load core metrics:', error);
    return {};
  }
}

/**
 * Load QA/Chaos adoption metrics (simulations, coverage, drills)
 */
export async function loadQaUsageMetrics(
  tenantId: string,
  windowDays: number = 30
): Promise<Record<string, number>> {
  const supabase = getSupabaseServer();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  try {
    // Count simulation runs in window
    const { count: simRunsCount } = await supabase
      .from('guardian_simulation_runs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('started_at', cutoffDate.toISOString());

    // Latest QA coverage score
    const { data: coverageData } = await supabase
      .from('guardian_qa_coverage_snapshots')
      .select('overall_coverage, critical_blind_spots_count')
      .eq('tenant_id', tenantId)
      .order('snapshot_date', { ascending: false })
      .limit(1);

    const coverageScore = coverageData && coverageData.length > 0
      ? Math.round((coverageData[0].overall_coverage || 0) * 100)
      : 0;

    const blindSpots = coverageData && coverageData.length > 0
      ? coverageData[0].critical_blind_spots_count || 0
      : 0;

    // Count incident drills in window
    const { count: drillsCount } = await supabase
      .from('guardian_incident_drill_runs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoffDate.toISOString());

    return {
      simulation_runs_window: simRunsCount || 0,
      qa_coverage_score: coverageScore,
      qa_blind_spots_critical: blindSpots,
      incident_drills_window: drillsCount || 0,
    };
  } catch (error) {
    console.error('Failed to load QA metrics:', error);
    return {};
  }
}

/**
 * Load Network Intelligence adoption metrics (features, anomalies, warnings, recommendations)
 */
export async function loadNetworkUsageMetrics(
  tenantId: string,
  windowDays: number = 30
): Promise<Record<string, number>> {
  const supabase = getSupabaseServer();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  try {
    // Network feature flags enabled count
    const { data: featureFlagsData } = await supabase
      .from('guardian_network_feature_flags')
      .select(
        'enable_network_telemetry,enable_network_anomalies,enable_network_early_warnings'
      )
      .eq('tenant_id', tenantId)
      .limit(1);

    let flagsEnabled = 0;
    if (featureFlagsData && featureFlagsData.length > 0) {
      const flags = featureFlagsData[0];
      flagsEnabled = [
        flags.enable_network_telemetry,
        flags.enable_network_anomalies,
        flags.enable_network_early_warnings,
      ].filter(Boolean).length;
    }

    // Count anomalies in window
    const { count: anomaliesCount } = await supabase
      .from('guardian_network_anomaly_signals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('detected_at', cutoffDate.toISOString());

    // Count early warnings (with engagement)
    const { count: warningsCount } = await supabase
      .from('guardian_network_early_warnings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoffDate.toISOString());

    const { count: warningsAcknowledgedCount } = await supabase
      .from('guardian_network_early_warnings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'acknowledged')
      .gte('created_at', cutoffDate.toISOString());

    // Count recommendations by status
    const { count: recsOpenCount } = await supabase
      .from('guardian_network_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'open');

    const { count: recsImplementedCount } = await supabase
      .from('guardian_network_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'implemented');

    return {
      network_features_enabled: flagsEnabled,
      network_anomalies_window: anomaliesCount || 0,
      network_warnings_window: warningsCount || 0,
      network_warnings_acknowledged: warningsAcknowledgedCount || 0,
      network_recommendations_open: recsOpenCount || 0,
      network_recommendations_implemented: recsImplementedCount || 0,
    };
  } catch (error) {
    console.error('Failed to load network metrics:', error);
    return {};
  }
}

/**
 * Load Meta adoption metrics (readiness, uplift, editions, reports)
 */
export async function loadMetaUsageMetrics(
  tenantId: string,
  windowDays: number = 30
): Promise<Record<string, number>> {
  const supabase = getSupabaseServer();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  try {
    // Latest readiness snapshot
    const { data: readinessData } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score, computed_at')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1);

    const readinessScore = readinessData && readinessData.length > 0
      ? readinessData[0].overall_guardian_score || 0
      : 0;

    // Count uplift plans
    const { count: upliftPlansCount } = await supabase
      .from('guardian_tenant_uplift_plans')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Count completed uplift tasks
    const { count: upliftTasksCompletedCount } = await supabase
      .from('guardian_tenant_uplift_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed');

    // Count executive reports
    const { count: reportsCount } = await supabase
      .from('guardian_executive_reports')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoffDate.toISOString());

    return {
      readiness_overall_score: Math.round(readinessScore),
      uplift_plans_total: upliftPlansCount || 0,
      uplift_tasks_completed: upliftTasksCompletedCount || 0,
      executive_reports_window: reportsCount || 0,
    };
  } catch (error) {
    console.error('Failed to load meta metrics:', error);
    return {};
  }
}

/**
 * Derive adoption signals from metric loaders
 * Aggregates raw metrics into signal objects
 */
export async function deriveSignalsForTenant(
  tenantId: string,
  windowDays: number = 30
): Promise<Record<string, GuardianAdoptionSignal>> {
  const [coreMetrics, qaMetrics, networkMetrics, metaMetrics] = await Promise.all([
    loadCoreUsageMetrics(tenantId, windowDays),
    loadQaUsageMetrics(tenantId, windowDays),
    loadNetworkUsageMetrics(tenantId, windowDays),
    loadMetaUsageMetrics(tenantId, windowDays),
  ]);

  const signals: Record<string, GuardianAdoptionSignal> = {};

  // Core signals
  signals['rules_active'] = {
    metricKey: 'rules_active',
    value: coreMetrics['rules_active'] || 0,
    windowDays,
    description: 'Count of active alert rules',
  };
  signals['alerts_recent'] = {
    metricKey: 'alerts_recent',
    value: coreMetrics['alerts_last_30d'] || 0,
    windowDays,
    description: 'Alert events in recent window',
  };
  signals['playbooks_total'] = {
    metricKey: 'playbooks_total',
    value: coreMetrics['playbooks_total'] || 0,
    windowDays,
    description: 'Total playbook count',
  };

  // QA signals
  signals['simulation_runs'] = {
    metricKey: 'simulation_runs',
    value: qaMetrics['simulation_runs_window'] || 0,
    windowDays,
    description: 'Simulation runs in window',
  };
  signals['qa_coverage'] = {
    metricKey: 'qa_coverage',
    value: qaMetrics['qa_coverage_score'] || 0,
    windowDays: 0, // Latest snapshot, not windowed
    description: 'Latest QA coverage score',
  };

  // Network signals
  signals['network_features_enabled'] = {
    metricKey: 'network_features_enabled',
    value: networkMetrics['network_features_enabled'] || 0,
    windowDays: 0, // Current state, not windowed
    description: 'Network feature flags enabled',
  };
  signals['network_anomalies'] = {
    metricKey: 'network_anomalies',
    value: networkMetrics['network_anomalies_window'] || 0,
    windowDays,
    description: 'Network anomalies detected',
  };
  signals['network_recommendations_implemented'] = {
    metricKey: 'network_recommendations_implemented',
    value: networkMetrics['network_recommendations_implemented'] || 0,
    windowDays: 0,
    description: 'Implemented recommendations',
  };

  // Meta signals
  signals['readiness_score'] = {
    metricKey: 'readiness_score',
    value: metaMetrics['readiness_overall_score'] || 0,
    windowDays: 0,
    description: 'Overall readiness score from Z01',
  };
  signals['uplift_tasks_completed'] = {
    metricKey: 'uplift_tasks_completed',
    value: metaMetrics['uplift_tasks_completed'] || 0,
    windowDays: 0,
    description: 'Completed uplift tasks',
  };
  signals['executive_reports'] = {
    metricKey: 'executive_reports',
    value: metaMetrics['executive_reports_window'] || 0,
    windowDays,
    description: 'Executive reports generated',
  };

  return signals;
}

/**
 * Compute adoption scores for a tenant (pure function)
 * Takes signals and produces scores per dimension/subdimension
 */
export function computeAdoptionScoresFromSignals(
  signals: Record<string, GuardianAdoptionSignal>,
  definitions: typeof ADOPTION_SCORE_DEFS = ADOPTION_SCORE_DEFS
): GuardianAdoptionScore[] {
  const scores: GuardianAdoptionScore[] = [];

  // Helper: normalize a metric value to 0..100
  function normalizeScore(value: number, maxExpected: number): number {
    if (maxExpected === 0) return 0;
    return Math.min(100, Math.round((value / maxExpected) * 100));
  }

  // Score each definition
  definitions.forEach((def) => {
    let dimensionScore = 0;
    const relevantSignals: GuardianAdoptionSignal[] = [];

    // Map subdimension to signals
    switch (def.subDimension) {
      case 'rules_usage': {
        const rulesSignal = signals['rules_active'];
        if (rulesSignal) {
          dimensionScore = normalizeScore(rulesSignal.value, 30); // Expect 0-30 rules for 100%
          relevantSignals.push(rulesSignal);
        }
        break;
      }

      case 'incidents_workflow': {
        const alertsSignal = signals['alerts_recent'];
        if (alertsSignal) {
          dimensionScore = normalizeScore(alertsSignal.value, 100); // Expect 100+ events/month
          relevantSignals.push(alertsSignal);
        }
        break;
      }

      case 'risk_usage': {
        // Risk enabled + some usage of risk metrics
        if (signals['alerts_recent'] && signals['alerts_recent'].value > 10) {
          dimensionScore = 70; // Assume risk usage if active alerts
        }
        break;
      }

      case 'ai_features': {
        // Basic adoption if any features enabled
        if (signals['playbooks_total'] && signals['playbooks_total'].value > 0) {
          dimensionScore = 50 + normalizeScore(signals['playbooks_total'].value, 10);
        }
        break;
      }

      case 'playbook_usage': {
        const playbooksSignal = signals['playbooks_total'];
        if (playbooksSignal) {
          dimensionScore = normalizeScore(playbooksSignal.value, 20); // Expect 0-20 playbooks
          relevantSignals.push(playbooksSignal);
        }
        break;
      }

      case 'simulation_runs': {
        const simSignal = signals['simulation_runs'];
        if (simSignal) {
          dimensionScore = normalizeScore(simSignal.value, 50); // Expect 0-50 runs/month
          relevantSignals.push(simSignal);
        }
        break;
      }

      case 'qa_coverage': {
        const coverageSignal = signals['qa_coverage'];
        if (coverageSignal) {
          dimensionScore = coverageSignal.value; // Already 0..100
          relevantSignals.push(coverageSignal);
        }
        break;
      }

      case 'incident_drills': {
        // Derived from uplift tasks if any drills exist
        if (signals['uplift_tasks_completed'] && signals['uplift_tasks_completed'].value > 0) {
          dimensionScore = 60;
        }
        break;
      }

      case 'network_console': {
        // Network enabled + recommendations implemented = usage
        const networkSignal = signals['network_features_enabled'];
        const recsSignal = signals['network_recommendations_implemented'];
        if (networkSignal && networkSignal.value >= 2) {
          dimensionScore = 50;
        }
        if (recsSignal && recsSignal.value > 0) {
          dimensionScore = 75;
          relevantSignals.push(recsSignal);
        }
        break;
      }

      case 'early_warnings': {
        const networkSignal = signals['network_features_enabled'];
        if (networkSignal && networkSignal.value >= 1) {
          dimensionScore = 40; // Just having it enabled
        }
        break;
      }

      case 'recommendations': {
        const recsSignal = signals['network_recommendations_implemented'];
        if (recsSignal) {
          dimensionScore = Math.min(100, 40 + normalizeScore(recsSignal.value, 10));
          relevantSignals.push(recsSignal);
        }
        break;
      }

      case 'uplift_tasks': {
        const tasksSignal = signals['uplift_tasks_completed'];
        if (tasksSignal) {
          dimensionScore = normalizeScore(tasksSignal.value, 20); // Expect 0-20 completed
          relevantSignals.push(tasksSignal);
        }
        break;
      }

      case 'readiness_checks': {
        const readinessSignal = signals['readiness_score'];
        if (readinessSignal) {
          dimensionScore = readinessSignal.value; // Already 0..100
          relevantSignals.push(readinessSignal);
        }
        break;
      }

      case 'executive_reports': {
        const reportsSignal = signals['executive_reports'];
        if (reportsSignal) {
          dimensionScore = normalizeScore(reportsSignal.value, 5); // Expect 0-5 reports/month
          relevantSignals.push(reportsSignal);
        }
        break;
      }

      case 'governance_events': {
        // Assuming at least minimal governance if network enabled
        const networkSignal = signals['network_features_enabled'];
        if (networkSignal && networkSignal.value > 0) {
          dimensionScore = 50;
        }
        break;
      }
    }

    const status = classifyAdoptionStatus(dimensionScore, def.thresholds);

    scores.push({
      dimension: def.dimension,
      subDimension: def.subDimension,
      label: def.label,
      score: Math.round(dimensionScore),
      status,
      signals: relevantSignals,
      derivedFrom: {},
      metadata: { category: def.category },
    });
  });

  return scores;
}

/**
 * Full workflow: compute and persist adoption scores for a tenant
 */
export async function computeAndPersistAdoptionScoresForTenant(
  tenantId: string
): Promise<GuardianAdoptionScore[]> {
  const supabase = getSupabaseServer();
  const now = new Date();

  // Derive signals from existing Guardian data
  const signals = await deriveSignalsForTenant(tenantId, 30);

  // Compute scores (pure function)
  const scores = computeAdoptionScoresFromSignals(signals);

  // Persist to DB
  const rowsToInsert = scores.map((score) => ({
    tenant_id: tenantId,
    computed_at: now.toISOString(),
    dimension: score.dimension,
    sub_dimension: score.subDimension,
    score: score.score,
    status: score.status,
    signals: score.signals,
    derived_from: score.derivedFrom,
    metadata: score.metadata || {},
  }));

  const { error } = await supabase
    .from('guardian_adoption_scores')
    .insert(rowsToInsert);

  if (error) throw error;

  return scores;
}

/**
 * Load latest adoption scores for a tenant
 */
export async function loadLatestAdoptionScoresForTenant(
  tenantId: string
): Promise<GuardianAdoptionScore[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_adoption_scores')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('computed_at', { ascending: false })
    .limit(15); // Last snapshot (max 15 subdimensions)

  if (error) throw error;

  return (data || []).map((row: any) => ({
    dimension: row.dimension,
    subDimension: row.sub_dimension,
    label: row.sub_dimension, // Will be enriched from model
    score: row.score,
    status: row.status,
    signals: row.signals || [],
    derivedFrom: row.derived_from || {},
    metadata: row.metadata,
  }));
}
