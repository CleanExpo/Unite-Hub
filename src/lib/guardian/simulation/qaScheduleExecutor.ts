/**
 * Guardian I05: QA Schedule Executor
 *
 * Purpose:
 * Execute QA schedules: trigger regression runs, manage baselines, generate drift reports
 * Acts as orchestration layer over regression orchestrator (I03)
 *
 * Workflow:
 * 1. Load schedule (ensure active, tenant match)
 * 2. Call regression orchestrator to execute pack
 * 3. Extract or create baseline
 * 4. Compute drift and store report
 * 5. Update schedule last_run tracking
 */

import { getSupabaseServer } from '@/lib/supabase';
import { extractMetricsFromRegressionRun, type GuardianQaMetrics } from './qaMetrics';
import {
  findReferenceBaseline,
  createBaselineFromRegressionRun,
  type GuardianQaBaseline,
} from './qaBaselineManager';
import { createDriftReportForRegressionRun, type GuardianQaDriftReport } from './qaDriftEngine';

/**
 * QA schedule execution context
 */
export interface GuardianQaScheduleExecutionContext {
  tenantId: string;
  scheduleId: string;
  now: Date;
  actorId?: string;
}

/**
 * Execution result
 */
export interface GuardianQaScheduleExecutionResult {
  scheduleId: string;
  regressionRunId: string;
  baselineId?: string;
  driftReportId?: string;
  baseline?: GuardianQaBaseline;
  currentMetrics?: GuardianQaMetrics;
  driftReport?: GuardianQaDriftReport;
}

/**
 * Schedule record
 */
export interface GuardianQaSchedule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  schedule_cron: string;
  timezone: string;
  pack_id: string;
  chaos_profile_id?: string;
  simulate_playbooks: boolean;
  max_runtime_minutes: number;
  last_run_id?: string;
  last_run_at?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  metadata: Record<string, unknown>;
}

/**
 * Execute a QA schedule
 *
 * Steps:
 * 1. Load and validate schedule
 * 2. Execute regression pack (mock for now; would call real orchestrator in production)
 * 3. Create or find baseline
 * 4. Extract current metrics
 * 5. Compute drift and store report
 * 6. Update schedule last_run tracking
 */
export async function runQaSchedule(
  context: GuardianQaScheduleExecutionContext
): Promise<GuardianQaScheduleExecutionResult> {
  const supabase = getSupabaseServer();
  const { tenantId, scheduleId, now, actorId } = context;

  // Step 1: Load schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('guardian_qa_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', scheduleId)
    .single();

  if (scheduleError || !schedule) {
    throw new Error(
      `QA schedule ${scheduleId} not found in tenant ${tenantId}: ${scheduleError?.message}`
    );
  }

  const qaSchedule = schedule as GuardianQaSchedule;

  if (!qaSchedule.is_active) {
    throw new Error(`QA schedule ${scheduleId} is not active`);
  }

  // Step 2: Execute regression pack
  // In production, this would call regressionOrchestrator.executeRegressionRun()
  // For now, we mock it by creating a guardian_regression_runs entry
  const regressionRunId = await executeRegressionPackMock(
    tenantId,
    qaSchedule.pack_id,
    qaSchedule.chaos_profile_id,
    qaSchedule.simulate_playbooks,
    actorId
  );

  // Step 3: Determine baseline
  // Try to find existing reference baseline for this pack
  let baseline: GuardianQaBaseline | null = await findReferenceBaseline(
    tenantId,
    'regression_pack'
  );

  let baselineId: string | undefined;

  if (!baseline) {
    // Create new baseline from this run if none exists
    baseline = await createBaselineFromRegressionRun(
      tenantId,
      `baseline_${qaSchedule.pack_id}`,
      regressionRunId,
      {
        description: `Auto-created baseline from schedule ${qaSchedule.name}`,
        isReference: true,
        createdBy: actorId || 'qaSchedule',
      }
    );
  }

  baselineId = baseline.id;

  // Step 4: Extract current metrics
  const currentMetrics = await extractMetricsFromRegressionRun(tenantId, regressionRunId);

  // Step 5: Compute drift and store report
  let driftReportId: string | undefined;
  let driftReport: GuardianQaDriftReport | undefined;

  if (baseline && baselineId) {
    driftReport = await createDriftReportForRegressionRun(
      tenantId,
      baselineId,
      regressionRunId,
      scheduleId,
      baseline.metrics,
      currentMetrics,
      undefined,
      actorId || 'qaSchedule'
    );
    driftReportId = driftReport.id;
  }

  // Step 6: Update schedule last_run tracking
  await supabase
    .from('guardian_qa_schedules')
    .update({
      last_run_id: regressionRunId,
      last_run_at: now.toISOString(),
      updated_at: now.toISOString(),
      updated_by: actorId || 'qaSchedule',
    })
    .eq('tenant_id', tenantId)
    .eq('id', scheduleId);

  return {
    scheduleId,
    regressionRunId,
    baselineId,
    driftReportId,
    baseline,
    currentMetrics,
    driftReport,
  };
}

/**
 * Mock: Execute regression pack
 * In production, this would call the regression orchestrator
 *
 * For now, creates a minimal guardian_regression_runs entry with mock impact_estimate
 */
async function executeRegressionPackMock(
  tenantId: string,
  packId: string,
  chaosProfileId: string | undefined,
  simulatePlaybooks: boolean,
  actorId?: string
): Promise<string> {
  const supabase = getSupabaseServer();

  // Mock impact estimate (would come from real regression execution)
  const mockImpactEstimate = {
    alerts: {
      total: 2500 + Math.random() * 500,
      bySeverity: {
        critical: Math.floor(20 + Math.random() * 10),
        high: Math.floor(80 + Math.random() * 40),
        medium: Math.floor(150 + Math.random() * 100),
        low: Math.floor(250 + Math.random() * 200),
      },
      byRule: {
        'auth_fail_rate_high': Math.floor(100 + Math.random() * 50),
        'cpu_spike_critical': Math.floor(80 + Math.random() * 40),
        'memory_leak_detected': Math.floor(60 + Math.random() * 30),
      },
    },
    incidents: {
      total: 45 + Math.floor(Math.random() * 15),
      byType: {
        security: Math.floor(15 + Math.random() * 5),
        performance: Math.floor(20 + Math.random() * 5),
        reliability: Math.floor(10 + Math.random() * 5),
      },
    },
    risk: {
      avgScore: 6.5 + Math.random() * 2,
      maxScore: 9.2 + Math.random() * 0.8,
    },
    notifications: {
      simulatedTotal: 150 + Math.floor(Math.random() * 50),
      byChannel: {
        slack: Math.floor(60 + Math.random() * 20),
        email: Math.floor(50 + Math.random() * 20),
        pagerduty: Math.floor(30 + Math.random() * 15),
      },
    },
    ...(simulatePlaybooks && {
      playbooks: {
        totalEvaluated: 12,
        totalActions: 18 + Math.floor(Math.random() * 8),
        byPlaybookId: {
          'pb_auto_remediate': {
            actions: 5 + Math.floor(Math.random() * 2),
          },
          'pb_escalate': {
            actions: 8 + Math.floor(Math.random() * 3),
          },
          'pb_notify': {
            actions: 5 + Math.floor(Math.random() * 2),
          },
        },
      },
    }),
  };

  // Insert regression_runs record
  const { data, error } = await supabase
    .from('guardian_regression_runs')
    .insert({
      tenant_id: tenantId,
      pack_id: packId,
      chaos_profile_id: chaosProfileId,
      simulate_playbooks: simulatePlaybooks,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      status: 'completed',
      impact_estimate: mockImpactEstimate,
      created_by: actorId || 'qaSchedule',
      metadata: {
        executedByQaScheduler: true,
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create regression run: ${error.message}`);
  }

  return data.id;
}

/**
 * List QA schedules for a tenant
 */
export async function listQaSchedules(
  tenantId: string,
  filters?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<GuardianQaSchedule[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_qa_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list QA schedules: ${error.message}`);
  }

  return (data || []) as GuardianQaSchedule[];
}

/**
 * Get a single QA schedule
 */
export async function getQaSchedule(
  tenantId: string,
  scheduleId: string
): Promise<GuardianQaSchedule> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', scheduleId)
    .single();

  if (error) {
    throw new Error(`Failed to get QA schedule: ${error.message}`);
  }

  return data as GuardianQaSchedule;
}

/**
 * Create a new QA schedule
 */
export async function createQaSchedule(
  tenantId: string,
  input: {
    name: string;
    description?: string;
    schedule_cron: string;
    timezone?: string;
    pack_id: string;
    chaos_profile_id?: string;
    simulate_playbooks?: boolean;
    max_runtime_minutes?: number;
    createdBy?: string;
  }
): Promise<GuardianQaSchedule> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_schedules')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description,
      schedule_cron: input.schedule_cron,
      timezone: input.timezone || 'UTC',
      pack_id: input.pack_id,
      chaos_profile_id: input.chaos_profile_id,
      simulate_playbooks: input.simulate_playbooks || false,
      max_runtime_minutes: input.max_runtime_minutes || 30,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: input.createdBy,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create QA schedule: ${error.message}`);
  }

  return data as GuardianQaSchedule;
}

/**
 * Update a QA schedule
 */
export async function updateQaSchedule(
  tenantId: string,
  scheduleId: string,
  updates: Partial<{
    name: string;
    description: string;
    schedule_cron: string;
    timezone: string;
    is_active: boolean;
    simulate_playbooks: boolean;
    max_runtime_minutes: number;
    updatedBy: string;
  }>
): Promise<GuardianQaSchedule> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_schedules')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: updates.updatedBy,
    })
    .eq('tenant_id', tenantId)
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update QA schedule: ${error.message}`);
  }

  return data as GuardianQaSchedule;
}

/**
 * Delete a QA schedule
 */
export async function deleteQaSchedule(tenantId: string, scheduleId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_qa_schedules')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', scheduleId);

  if (error) {
    throw new Error(`Failed to delete QA schedule: ${error.message}`);
  }
}
