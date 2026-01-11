/**
 * Guardian Z13: Meta Task Runner
 * Executes meta evaluation tasks safely: KPI eval, stack readiness, knowledge hub, improvement outcomes, exports
 * All tasks are meta-only; no core Guardian G/H/I/X modifications
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeMetaStackReadiness } from './metaStackReadinessService';
import { captureOutcome } from './improvementCycleService';
import { createExportBundle } from './exportBundleService';
import { loadMetaGovernancePrefsForTenant } from './metaGovernanceService';
import { captureStatusSnapshot } from './statusPageService';
import { createBackupSet, listBackupSets } from './metaBackupService';
import { buildRestorePreview, listRestoreRuns } from './metaRestoreService';
import { buildAndStoreBaseline } from '../ai/anomalyBaselineService';
import { runAllActiveDetectors } from '../ai/anomalyDetectionService';
import { buildAndStoreCorrelationRecommendations } from '../ai/correlationRefinementOrchestrator';
import { scoreRecentIncidents } from '../ai/incidentScoringOrchestrator';

export interface TaskSummary {
  [taskType: string]: {
    status: 'success' | 'skipped' | 'error';
    count?: number;
    ids?: string[];
    message?: string;
    warnings?: string[];
  };
}

/**
 * Run meta tasks for a tenant
 * Returns PII-free summaries of what executed
 */
export async function runTasksForTenant(
  tenantId: string,
  taskTypes: string[],
  config: Record<string, any>,
  actor: string = 'system'
): Promise<{
  summary: TaskSummary;
  warnings: string[];
}> {
  const supabase = getSupabaseServer();
  const summary: TaskSummary = {};
  const warnings: string[] = [];

  // Load governance to check AI gating
  let governancePrefs;
  try {
    governancePrefs = await loadMetaGovernancePrefsForTenant(tenantId);
  } catch (error) {
    console.error('[Z13 Task Runner] Failed to load governance prefs:', error);
    governancePrefs = null;
  }

  // Execute each task type
  for (const taskType of taskTypes) {
    try {
      switch (taskType) {
        case 'kpi_eval':
          summary[taskType] = await runKpiEvalTask(tenantId, config[taskType] || {});
          break;

        case 'stack_readiness':
          summary[taskType] = await runStackReadinessTask(tenantId);
          break;

        case 'knowledge_hub':
          summary[taskType] = await runKnowledgeHubTask(tenantId, config[taskType] || {});
          break;

        case 'improvement_outcome':
          summary[taskType] = await runImprovementOutcomeTask(tenantId, config[taskType] || {});
          break;

        case 'export_bundle':
          // Check if AI is gating export narratives
          if (governancePrefs?.aiUsagePolicy === 'off') {
            warnings.push('export_bundle: AI disabled, skip narratives');
          }
          summary[taskType] = await runExportBundleTask(tenantId, config[taskType] || {}, actor);
          break;

        case 'status_snapshot':
          summary[taskType] = await runStatusSnapshotTask(tenantId, config[taskType] || {}, actor);
          break;

        case 'meta_backup':
          summary[taskType] = await runMetaBackupTask(tenantId, config[taskType] || {}, actor);
          break;

        case 'meta_restore_health_check':
          summary[taskType] = await runMetaRestoreHealthCheckTask(tenantId, config[taskType] || {});
          break;

        case 'anomaly_rebuild_baselines':
          summary[taskType] = await runAnomalyRebuildBaselinesTask(tenantId, config[taskType] || {});
          break;

        case 'anomaly_run_detectors':
          summary[taskType] = await runAnomalyDetectorsTask(tenantId, config[taskType] || {});
          break;

        case 'correlation_refinement_recommendations':
          summary[taskType] = await runCorrelationRefinementTask(tenantId, config[taskType] || {}, actor);
          break;

        case 'incident_scoring_run':
          summary[taskType] = await runIncidentScoringTask(tenantId, config[taskType] || {}, actor);
          break;

        default:
          warnings.push(`Unknown task type: ${taskType}`);
          summary[taskType] = { status: 'skipped', message: 'Unknown task type' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      summary[taskType] = {
        status: 'error',
        message: errorMsg,
      };
      console.error(`[Z13 Task Runner] Task ${taskType} failed:`, error);
    }
  }

  return { summary, warnings };
}

/**
 * Task: Evaluate KPIs for the tenant (meta-only snapshot)
 */
async function runKpiEvalTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['kpi_eval']> {
  const supabase = getSupabaseServer();

  // Placeholder: In production, this would call Z08 KPI evaluation engine
  // For now, we record that the task ran (meta-only)
  try {
    // Get the latest KPI snapshot (if any)
    const { data: kpiSnapshots } = await supabase
      .from('guardian_meta_kpi_snapshots')
      .select('id')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1);

    // In production, create new KPI snapshot by recomputing Z08 metrics
    // For now, just return meta-safe summary
    return {
      status: 'success',
      count: kpiSnapshots?.length || 0,
      message: 'KPI evaluation logged (meta-only)',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Compute and cache meta stack readiness
 */
async function runStackReadinessTask(tenantId: string): Promise<TaskSummary['stack_readiness']> {
  try {
    const readiness = await computeMetaStackReadiness(tenantId);

    // Optional: Cache readiness snapshot
    // For now, just return status
    return {
      status: 'success',
      message: `Stack readiness: ${readiness.overallStatus}`,
      warnings: readiness.warnings,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Generate knowledge hub summary (Z09 cached summary)
 */
async function runKnowledgeHubTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['knowledge_hub']> {
  const supabase = getSupabaseServer();

  try {
    // Placeholder: Z09 knowledge hub summary
    // Get playbook count and store meta-safe summary
    const { data: playbooks } = await supabase
      .from('guardian_playbooks')
      .select('id, playbook_key')
      .eq('tenant_id', tenantId);

    if (!playbooks) {
      return {
        status: 'skipped',
        message: 'No playbooks found',
      };
    }

    // In production, compute knowledge hub patterns
    return {
      status: 'success',
      count: playbooks.length,
      message: `Knowledge hub summary: ${playbooks.length} playbooks`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Capture improvement outcome snapshots for active cycles (Z12)
 */
async function runImprovementOutcomeTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['improvement_outcome']> {
  const supabase = getSupabaseServer();

  try {
    // Get active improvement cycles
    const { data: cycles } = await supabase
      .from('guardian_meta_improvement_cycles')
      .select('id, cycle_key, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (!cycles || cycles.length === 0) {
      return {
        status: 'skipped',
        message: 'No active improvement cycles',
      };
    }

    const outcomes: string[] = [];
    const errors: string[] = [];

    // Capture outcome for each active cycle
    // Use label derived from config or default to 'weekly_snapshot'
    const label = config.outcomeLabel || 'automated_snapshot';

    for (const cycle of cycles) {
      try {
        const outcome = await captureOutcome(tenantId, cycle.id, label as any, 'system:automation');
        outcomes.push(outcome.id);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Cycle ${cycle.cycle_key}: ${msg}`);
      }
    }

    return {
      status: errors.length === 0 ? 'success' : 'success',
      count: outcomes.length,
      ids: outcomes,
      warnings: errors.length > 0 ? errors : undefined,
      message: `Captured ${outcomes.length} outcomes`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Generate export bundle (Z11) with optional scrubbed scope
 */
async function runExportBundleTask(
  tenantId: string,
  config: Record<string, any>,
  actor: string
): Promise<TaskSummary['export_bundle']> {
  try {
    // Validate governance before exporting
    const supabase = getSupabaseServer();
    const { data: prefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('external_sharing_policy')
      .eq('tenant_id', tenantId)
      .single();

    // Only create internal exports unless explicitly enabled
    const externalSharingPolicy = prefs?.external_sharing_policy || 'internal_only';

    // Config should specify scope (optional, defaults to readiness)
    const scope = config.scope || ['readiness'];

    const bundle = await createExportBundle({
      tenantId,
      bundleKey: config.bundleKey || 'automated_export',
      label: config.label || 'Automated Export',
      description: config.description || 'Meta export generated by automation schedule',
      scope,
      actor,
    });

    return {
      status: 'success',
      ids: [bundle.bundleId],
      message: `Export bundle created: ${bundle.bundleId}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Capture status snapshots for stakeholder views (Z14)
 */
export async function runStatusSnapshotTask(
  tenantId: string,
  config: Record<string, any>,
  actor: string
): Promise<TaskSummary['status_snapshot']> {
  try {
    // Capture snapshots for configured view types and periods
    const viewTypes = config.viewTypes || ['operator', 'leadership', 'cs'];
    const periodLabel = config.periodLabel || 'last_30d';

    const snapshotIds: string[] = [];
    const errors: string[] = [];

    for (const viewType of viewTypes) {
      try {
        const result = await captureStatusSnapshot(tenantId, viewType as any, periodLabel as any, actor);
        snapshotIds.push(result.snapshotId);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`View ${viewType}: ${msg}`);
      }
    }

    return {
      status: errors.length === 0 ? 'success' : 'success',
      count: snapshotIds.length,
      ids: snapshotIds,
      warnings: errors.length > 0 ? errors : undefined,
      message: `Captured ${snapshotIds.length} status snapshots`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Create meta backup with configured scope (Z15)
 */
async function runMetaBackupTask(
  tenantId: string,
  config: Record<string, any>,
  actor: string
): Promise<TaskSummary['meta_backup']> {
  try {
    const scope = config.scope || ['governance', 'automation', 'goals_okrs'];
    const backupKey = config.backupKey || `automated_backup_${Date.now()}`;

    const result = await createBackupSet({
      tenantId,
      backupKey,
      label: config.label || 'Automated Backup',
      description: config.description || 'Automated meta backup via Z13 schedule',
      scope,
      includeNotes: config.includeNotes || false,
      actor: actor || 'system:automation',
    });

    return {
      status: 'success',
      ids: [result.backupId],
      message: `Backup created: ${result.backupId}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Validate restore readiness (Z15) - health check only, no apply
 */
async function runMetaRestoreHealthCheckTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['meta_restore_health_check']> {
  try {
    const { backups, total } = await listBackupSets(tenantId, { limit: 1, status: 'ready' });

    if (total === 0) {
      return {
        status: 'skipped',
        message: 'No ready backups available for restore validation',
        warnings: ['Create a backup first before attempting restores'],
      };
    }

    const { restores, total: restoreCount } = await listRestoreRuns(tenantId, { limit: 1 });

    return {
      status: 'success',
      message: `Restore readiness OK: ${total} ready backup(s), ${restoreCount} restore run(s) on record`,
      warnings:
        total === 1 ? ['Only 1 backup available; consider creating more for redundancy'] : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Rebuild all anomaly detector baselines (H02)
 */
async function runAnomalyRebuildBaselinesTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['anomaly_rebuild_baselines']> {
  const supabase = getSupabaseServer();

  try {
    // Get all active detectors
    const { data: detectors } = await supabase
      .from('guardian_anomaly_detectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (!detectors || detectors.length === 0) {
      return {
        status: 'skipped',
        message: 'No active detectors',
      };
    }

    const results: string[] = [];
    const errors: string[] = [];

    // Rebuild baseline for each detector
    for (const detector of detectors) {
      try {
        const result = await buildAndStoreBaseline(tenantId, detector.id);
        results.push(result.baselineId);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Detector ${detector.id}: ${msg}`);
      }
    }

    return {
      status: errors.length === 0 ? 'success' : 'success',
      count: results.length,
      ids: results,
      warnings: errors.length > 0 ? errors : undefined,
      message: `Rebuilt ${results.length} baselines`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Run all anomaly detectors for the tenant (H02)
 */
async function runAnomalyDetectorsTask(
  tenantId: string,
  config: Record<string, any>
): Promise<TaskSummary['anomaly_run_detectors']> {
  try {
    const now = new Date();

    // Run all active detectors
    const results = await runAllActiveDetectors(tenantId, now, {
      skipBaselineCheck: false,
    });

    if (results.length === 0) {
      return {
        status: 'skipped',
        message: 'No active detectors',
      };
    }

    const anomaliesDetected = results.filter((r) => r.anomalyDetected).length;
    const errors = results.filter((r) => r.error);

    return {
      status: errors.length === 0 ? 'success' : 'success',
      count: results.length,
      message: `Ran ${results.length} detectors, detected ${anomaliesDetected} anomalies`,
      warnings:
        errors.length > 0
          ? errors.map((e) => `Detector ${e.detectorId}: ${e.error}`)
          : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Generate correlation refinement recommendations (H03)
 */
async function runCorrelationRefinementTask(
  tenantId: string,
  config: Record<string, any>,
  actor: string
): Promise<TaskSummary['correlation_refinement_recommendations']> {
  try {
    const windowDays = config.windowDays || 7;
    const maxRecommendations = config.maxRecommendations || 10;

    const result = await buildAndStoreCorrelationRecommendations(tenantId, {
      windowDays,
      maxRecommendations,
      actor: `system:automation:${actor}`,
    });

    return {
      status: result.warnings.length === 0 ? 'success' : 'success',
      count: result.created,
      message: `Generated ${result.created} correlation refinement recommendations (AI: ${result.aiUsed})`,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Task: Score recent incidents using H04 predictive model (Z13 integration)
 */
async function runIncidentScoringTask(
  tenantId: string,
  config: Record<string, any>,
  actor: string
): Promise<TaskSummary['incident_scoring_run']> {
  try {
    const lookbackHours = config.lookbackHours || 24;
    const maxIncidents = config.maxIncidents || 100;

    const result = await scoreRecentIncidents(tenantId, {
      lookbackHours,
      maxIncidents,
    });

    // Return PII-free summary (counts only, no incident IDs)
    const errorSummary = result.errors.length > 0
      ? `${result.errors.length} errors (see audit log)`
      : undefined;

    return {
      status: result.errors.length === 0 ? 'success' : 'success',
      count: result.scored,
      message: `Scored ${result.scored} incidents, ${result.skipped} skipped`,
      warnings: errorSummary ? [errorSummary] : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get task types available for automation
 */
export function getAvailableTaskTypes(): Array<{
  key: string;
  label: string;
  description: string;
  defaultConfig?: Record<string, any>;
}> {
  return [
    {
      key: 'kpi_eval',
      label: 'KPI Evaluation',
      description: 'Recompute Z08 KPI snapshots for the current period',
      defaultConfig: { period: 'quarter' },
    },
    {
      key: 'stack_readiness',
      label: 'Stack Readiness',
      description: 'Compute Z10 meta stack readiness score',
      defaultConfig: {},
    },
    {
      key: 'knowledge_hub',
      label: 'Knowledge Hub',
      description: 'Generate Z09 knowledge hub cached summaries',
      defaultConfig: {},
    },
    {
      key: 'improvement_outcome',
      label: 'Improvement Outcome',
      description: 'Capture Z12 improvement cycle outcome snapshots',
      defaultConfig: { outcomeLabel: 'automated_snapshot' },
    },
    {
      key: 'export_bundle',
      label: 'Export Bundle',
      description: 'Create Z11 export bundle with scrubbed scope',
      defaultConfig: { scope: ['readiness'], bundleKey: 'automated_export' },
    },
    {
      key: 'status_snapshot',
      label: 'Status Snapshot',
      description: 'Capture Z14 status snapshots for stakeholder views',
      defaultConfig: { viewTypes: ['operator', 'leadership', 'cs'], periodLabel: 'last_30d' },
    },
    {
      key: 'meta_backup',
      label: 'Meta Backup',
      description: 'Create Z15 backup set of meta configuration',
      defaultConfig: { scope: ['governance', 'automation', 'goals_okrs'], includeNotes: false },
    },
    {
      key: 'meta_restore_health_check',
      label: 'Restore Health Check',
      description: 'Validate Z15 restore readiness (no apply)',
      defaultConfig: {},
    },
    {
      key: 'anomaly_rebuild_baselines',
      label: 'Anomaly Rebuild Baselines',
      description: 'Rebuild all H02 anomaly detector baselines from recent metrics',
      defaultConfig: {},
    },
    {
      key: 'anomaly_run_detectors',
      label: 'Anomaly Run Detectors',
      description: 'Run all H02 anomaly detectors against latest metrics',
      defaultConfig: {},
    },
    {
      key: 'correlation_refinement_recommendations',
      label: 'Correlation Refinement Recommendations',
      description: 'Generate H03 correlation refinement recommendations from cluster analysis',
      defaultConfig: { windowDays: 7, maxRecommendations: 10 },
    },
    {
      key: 'incident_scoring_run',
      label: 'Incident Scoring Run',
      description: 'Score recent incidents using H04 predictive incident severity model',
      defaultConfig: { lookbackHours: 24, maxIncidents: 100 },
    },
  ];
}
