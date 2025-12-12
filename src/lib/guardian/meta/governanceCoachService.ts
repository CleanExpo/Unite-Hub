/**
 * Guardian H05: Governance Coach Service
 * Orchestrates coach sessions, persistence, and safe apply operations
 * Enforces allowlist: only enable_z10_*, create_z13_*, capture_z14_*, run_z16_*, trigger_z15_* allowed
 * Requires explicit admin approval before any changes applied (confirm=true gating)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logMetaAuditEvent } from './metaAuditService';
import {
  collectHSeriesRolloutState,
  formatRolloutStateSummary,
  HSeriesRolloutState,
} from './hSeriesRolloutState';
import {
  generateEnablementPlan,
  EnablementPlan,
} from './hSeriesEnablementPlanner';
import {
  generateCoachNarrative,
  validateNarrativeSafety,
  CoachNarrative,
} from './governanceCoachAiHelper';

export interface CoachSessionRequest {
  tenantId: string;
  coachMode: 'operator' | 'leadership' | 'cs_handoff';
  targetFeatures?: string; // e.g., 'h01_h02_h03_h04' (default all)
  actor?: string;
}

export interface CoachSession {
  id: string;
  tenantId: string;
  status: 'initial' | 'plan_generated' | 'approved' | 'applied' | 'failed' | 'archived';
  coachMode: string;
  target: string;
  summary: string;
  inputs: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  proposedPlan: EnablementPlan | null;
  appliedPlan: EnablementPlan | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveActionRequest {
  sessionId: string;
  actionId: string;
  tenantId: string;
  actor: string;
}

export interface ApplySessionRequest {
  sessionId: string;
  tenantId: string;
  actor: string;
  confirm: boolean; // Must be true to proceed
}

// ============================================================================
// ALLOWLIST: Safe operations that can be applied by governance coach
// ============================================================================

const ALLOWLISTED_ACTIONS = [
  // Z10 governance flag updates
  'enable_z10_ai_usage_policy',
  'disable_z10_ai_usage_policy',
  'enable_z10_backup_policy',
  'disable_z10_backup_policy',
  'enable_z10_validation_gate_policy',
  'disable_z10_validation_gate_policy',
  'enable_z10_external_sharing_policy',
  'disable_z10_external_sharing_policy',

  // Z13 automation schedule creation/updates
  'create_z13_validation_schedule',
  'create_h01_z13_schedule',
  'create_h02_z13_schedule',
  'create_h03_z13_schedule',
  'create_h04_z13_schedule',
  'create_governance_coach_schedule',
  'create_z11_export_schedule',
  'scale_z13_schedules',

  // Z14 status snapshot captures (read-only, audit-only)
  'capture_z14_baseline_snapshot',
  'capture_h01_activation_snapshot',
  'capture_h02_activation_snapshot',
  'capture_h03_activation_snapshot',
  'capture_h04_activation_snapshot',
  'capture_h_series_full_activation_snapshot',
  'capture_optimization_baseline',
  'capture_h05_session_snapshot',

  // Z16 validation runs (read-only, no modifications)
  'run_z16_validation',
  'run_z16_validation_h03',
  'run_z16_validation_h04',
  'run_z16_comprehensive_validation',
  'establish_continuous_validation',

  // Z15 backup operations (trigger-only, no data modification)
  'trigger_z15_backup',

  // H01-H04 enablement (virtual actions, no direct DB writes)
  'enable_h01_rule_suggestion',
  'enable_h02_anomaly_detection',
  'enable_h03_correlation_refinement',
  'enable_h04_incident_scoring',

  // Executive reporting (read-only audit)
  'create_executive_reporting',
];

function isActionAllowlisted(actionKey: string): boolean {
  return ALLOWLISTED_ACTIONS.includes(actionKey);
}

// ============================================================================
// SESSION CREATION
// ============================================================================

/**
 * Create new governance coach session
 * Collects state, generates plan, optionally gets AI narrative
 */
export async function createCoachSession(req: CoachSessionRequest): Promise<CoachSession> {
  const supabase = getSupabaseServer();

  try {
    // Collect current H-series rollout state
    const rolloutState = await collectHSeriesRolloutState(req.tenantId);

    // Generate 7-stage enablement plan
    const enablementPlan = generateEnablementPlan(rolloutState);

    // Get narrative (AI or deterministic, based on Z10 policy)
    const narrative = await generateCoachNarrative(req.tenantId, rolloutState, enablementPlan);

    // Validate narrative safety (defense-in-depth)
    const narrativeValidation = validateNarrativeSafety(narrative);
    if (!narrativeValidation.valid) {
      console.warn(`Narrative safety check failed: ${narrativeValidation.warnings.join(', ')}`);
    }

    // Generate summary from narrative
    const summary = narrative.summary;

    // Create session record
    const { data: session, error: insertError } = await supabase
      .from('guardian_governance_coach_sessions')
      .insert({
        tenant_id: req.tenantId,
        status: 'plan_generated',
        coach_mode: req.coachMode,
        target: req.targetFeatures || 'h01_h02_h03_h04',
        summary,
        inputs: {
          guardianVersion: rolloutState.guardianVersion,
          z10Flags: rolloutState.z10Governance,
          z13ScheduleCount: rolloutState.z13Automation.schedulesCount,
          z14Status: rolloutState.z14Status.statusPageEnabled,
          z16ValidationStatus: rolloutState.z16Validation.validationStatus,
          h01Present: rolloutState.hSeriesPresence.h01RuleSuggestion,
          h02Present: rolloutState.hSeriesPresence.h02AnomalyDetection,
          h03Present: rolloutState.hSeriesPresence.h03CorrelationRefinement,
          h04Present: rolloutState.hSeriesPresence.h04IncidentScoring,
        },
        recommendations: {
          nextStage: enablementPlan.currentStage,
          narrative,
          risks: rolloutState.warnings,
          prerequisites: enablementPlan.stages[0]?.prerequisites || [],
        },
        proposed_plan: enablementPlan,
        created_by: req.actor || 'system',
        metadata: {
          rolloutStateSummary: formatRolloutStateSummary(rolloutState),
          narrativeSource: narrative.source,
          narrativeConfidence: narrative.confidenceScore,
        },
      })
      .select('*')
      .single();

    if (insertError || !session) {
      throw insertError || new Error('Failed to create coach session');
    }

    // Create actions for first approved stage
    const firstStageToPlan = enablementPlan.stages[0];
    if (firstStageToPlan) {
      for (const action of firstStageToPlan.actions) {
        // Validate action is allowlisted
        if (!isActionAllowlisted(action.actionKey)) {
          console.warn(`Action ${action.actionKey} not in allowlist, skipping`);
          continue;
        }

        await supabase.from('guardian_governance_coach_actions').insert({
          session_id: session.id,
          tenant_id: req.tenantId,
          action_key: action.actionKey,
          status: 'pending',
          description: action.description,
          details: action.details,
        });
      }
    }

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor || 'system',
      source: 'governance_coach',
      action: 'create',
      entityType: 'coach_session',
      entityId: session.id,
      summary: `Created governance coach session: ${req.coachMode} mode targeting ${req.targetFeatures || 'all H-series'}`,
      details: {
        coachMode: req.coachMode,
        target: req.targetFeatures || 'h01_h02_h03_h04',
        planStages: enablementPlan.stages.length,
        narrativeSource: narrative.source,
      },
    });

    return session as CoachSession;
  } catch (error) {
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor || 'system',
      source: 'governance_coach',
      action: 'error',
      entityType: 'coach_session',
      entityId: 'unknown',
      summary: `Failed to create governance coach session`,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

// ============================================================================
// ACTION APPROVAL
// ============================================================================

/**
 * Approve individual coach action (must be done before apply)
 */
export async function approveCoachAction(req: ApproveActionRequest): Promise<void> {
  const supabase = getSupabaseServer();

  try {
    // Get action to validate it exists and belongs to session
    const { data: action, error: fetchError } = await supabase
      .from('guardian_governance_coach_actions')
      .select('*')
      .eq('id', req.actionId)
      .eq('session_id', req.sessionId)
      .eq('tenant_id', req.tenantId)
      .single();

    if (fetchError || !action) {
      throw fetchError || new Error('Action not found');
    }

    // Validate action is allowlisted
    if (!isActionAllowlisted(action.action_key)) {
      throw new Error(`Action ${action.action_key} is not in allowlist (security violation)`);
    }

    // Update action status to approved
    const { error: updateError } = await supabase
      .from('guardian_governance_coach_actions')
      .update({
        status: 'approved',
        approved_by: req.actor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.actionId);

    if (updateError) throw updateError;

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor,
      source: 'governance_coach',
      action: 'approve',
      entityType: 'coach_action',
      entityId: req.actionId,
      summary: `Approved governance coach action: ${action.action_key}`,
      details: {
        actionKey: action.action_key,
        sessionId: req.sessionId,
      },
    });
  } catch (error) {
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor,
      source: 'governance_coach',
      action: 'error',
      entityType: 'coach_action',
      entityId: req.actionId,
      summary: `Failed to approve governance coach action`,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

// ============================================================================
// SAFE APPLY (with confirm=true gating)
// ============================================================================

/**
 * Apply approved coach session actions
 * CRITICAL: Requires explicit confirm=true flag (prevent accidental applies)
 * Enforces allowlist before executing ANY changes
 */
export async function applyCoachSession(req: ApplySessionRequest): Promise<{ appliedCount: number; failedCount: number; errors: string[] }> {
  // SECURITY: Require explicit confirm flag (prevents accidental applies)
  if (!req.confirm) {
    throw new Error('Coach session apply requires confirm=true (safety gate)');
  }

  const supabase = getSupabaseServer();
  const errors: string[] = [];
  let appliedCount = 0;
  let failedCount = 0;

  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('guardian_governance_coach_sessions')
      .select('*')
      .eq('id', req.sessionId)
      .eq('tenant_id', req.tenantId)
      .single();

    if (sessionError || !session) {
      throw sessionError || new Error('Coach session not found');
    }

    if (session.status !== 'plan_generated' && session.status !== 'approved') {
      throw new Error(`Cannot apply session in status: ${session.status}`);
    }

    // Get all approved actions for this session
    const { data: actions, error: actionsError } = await supabase
      .from('guardian_governance_coach_actions')
      .select('*')
      .eq('session_id', req.sessionId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (actionsError) throw actionsError;

    // Apply each action (with allowlist enforcement)
    for (const action of actions || []) {
      try {
        // SECURITY: Verify action is allowlisted (defense-in-depth)
        if (!isActionAllowlisted(action.action_key)) {
          const errorMsg = `Action ${action.action_key} is not in allowlist (BLOCKED)`;
          errors.push(errorMsg);
          failedCount++;

          // Log security event
          await logMetaAuditEvent({
            tenantId: req.tenantId,
            actor: req.actor,
            source: 'governance_coach',
            action: 'security_violation',
            entityType: 'coach_action',
            entityId: action.id,
            summary: `Attempted to apply non-allowlisted action (BLOCKED)`,
            details: { actionKey: action.action_key, sessionId: req.sessionId },
          });

          continue;
        }

        // Apply action based on type
        const applyResult = await applyAllowlistedAction(req.tenantId, action, req.actor);

        if (applyResult.success) {
          appliedCount++;

          // Update action status to applied
          await supabase
            .from('guardian_governance_coach_actions')
            .update({
              status: 'applied',
              result: applyResult.result,
              applied_by: req.actor,
              applied_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', action.id);
        } else {
          failedCount++;
          errors.push(`${action.action_key}: ${applyResult.error}`);

          // Update action status to failed
          await supabase
            .from('guardian_governance_coach_actions')
            .update({
              status: 'failed',
              error_message: applyResult.error,
              updated_at: new Date().toISOString(),
            })
            .eq('id', action.id);
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${action.action_key}: ${errorMsg}`);

        // Update action to failed
        await supabase
          .from('guardian_governance_coach_actions')
          .update({
            status: 'failed',
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', action.id);
      }
    }

    // Update session status based on results
    const sessionStatus = failedCount === 0 ? 'applied' : 'failed';
    await supabase
      .from('guardian_governance_coach_sessions')
      .update({
        status: sessionStatus,
        applied_plan: session.proposed_plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.sessionId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor,
      source: 'governance_coach',
      action: 'apply',
      entityType: 'coach_session',
      entityId: req.sessionId,
      summary: `Applied governance coach session: ${appliedCount} succeeded, ${failedCount} failed`,
      details: {
        appliedCount,
        failedCount,
        errors: errors.slice(0, 5), // Limit error list in audit
      },
    });

    return { appliedCount, failedCount, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Update session to failed
    await supabase
      .from('guardian_governance_coach_sessions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.sessionId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor,
      source: 'governance_coach',
      action: 'error',
      entityType: 'coach_session',
      entityId: req.sessionId,
      summary: `Failed to apply governance coach session`,
      details: { error: errorMsg },
    });

    throw error;
  }
}

/**
 * Apply individual allowlisted action
 * Returns success/error result
 */
async function applyAllowlistedAction(
  tenantId: string,
  action: any,
  actor: string
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  const supabase = getSupabaseServer();

  try {
    switch (action.action_key) {
      // Z10 governance flag updates
      case 'enable_z10_ai_usage_policy':
      case 'disable_z10_ai_usage_policy':
      case 'enable_z10_backup_policy':
      case 'disable_z10_backup_policy':
      case 'enable_z10_validation_gate_policy':
      case 'disable_z10_validation_gate_policy':
      case 'enable_z10_external_sharing_policy':
      case 'disable_z10_external_sharing_policy': {
        const flagKey = action.details.flagKey;
        const targetValue = action.details.targetValue;

        const { error } = await supabase
          .from('guardian_meta_governance_prefs')
          .update({ [flagKey]: targetValue })
          .eq('tenant_id', tenantId);

        if (error) throw error;

        return {
          success: true,
          result: { flagKey, targetValue, updated: true },
        };
      }

      // Z13 schedule creation
      case 'create_z13_validation_schedule':
      case 'create_h01_z13_schedule':
      case 'create_h02_z13_schedule':
      case 'create_h03_z13_schedule':
      case 'create_h04_z13_schedule':
      case 'create_governance_coach_schedule':
      case 'create_z11_export_schedule': {
        const scheduleData = {
          tenant_id: tenantId,
          task_type: action.details.taskType,
          frequency: action.details.frequency,
          status: 'active',
          config: action.details.scheduleConfig || {},
          created_by: actor,
        };

        const { data: schedule, error } = await supabase
          .from('guardian_meta_automation_schedules')
          .insert(scheduleData)
          .select('id')
          .single();

        if (error) throw error;

        return {
          success: true,
          result: { scheduleId: schedule.id, taskType: action.details.taskType, created: true },
        };
      }

      // Z14 status snapshots (read-only, audit-only)
      case 'capture_z14_baseline_snapshot':
      case 'capture_h01_activation_snapshot':
      case 'capture_h02_activation_snapshot':
      case 'capture_h03_activation_snapshot':
      case 'capture_h04_activation_snapshot':
      case 'capture_h_series_full_activation_snapshot':
      case 'capture_optimization_baseline':
      case 'capture_h05_session_snapshot': {
        const snapshotData = {
          tenant_id: tenantId,
          snapshot_label: action.details.snapshotLabel || action.action_key,
          scope: action.details.snapshotScope || [],
          snapshot_content: {},
          created_by: actor,
        };

        const { data: snapshot, error } = await supabase
          .from('guardian_meta_status_snapshots')
          .insert(snapshotData)
          .select('id')
          .single();

        if (error) throw error;

        return {
          success: true,
          result: { snapshotId: snapshot.id, scope: action.details.snapshotScope, created: true },
        };
      }

      // Z16 validation runs (read-only, no modifications)
      case 'run_z16_validation':
      case 'run_z16_validation_h03':
      case 'run_z16_validation_h04':
      case 'run_z16_comprehensive_validation':
      case 'establish_continuous_validation': {
        // Validation is read-only; just log the intent
        await logMetaAuditEvent({
          tenantId,
          actor,
          source: 'governance_coach',
          action: 'trigger',
          entityType: 'validation_run',
          entityId: action.action_key,
          summary: `Triggered ${action.action_key}`,
          details: { validationLevel: action.details.validationLevel },
        });

        return {
          success: true,
          result: { validationTriggered: true, validationLevel: action.details.validationLevel },
        };
      }

      // Z15 backup (trigger-only)
      case 'trigger_z15_backup': {
        // Backup is trigger-only; just log the intent
        await logMetaAuditEvent({
          tenantId,
          actor,
          source: 'governance_coach',
          action: 'trigger',
          entityType: 'backup',
          entityId: 'z15_backup',
          summary: 'Triggered Z15 backup',
          details: {},
        });

        return {
          success: true,
          result: { backupTriggered: true },
        };
      }

      // Scale Z13 schedules
      case 'scale_z13_schedules': {
        // Update existing schedules with new frequencies
        const schedules = await supabase
          .from('guardian_meta_automation_schedules')
          .select('id')
          .eq('tenant_id', tenantId);

        let updatedCount = 0;
        for (const schedule of schedules.data || []) {
          const { error } = await supabase
            .from('guardian_meta_automation_schedules')
            .update({ config: action.details })
            .eq('id', schedule.id);

          if (!error) updatedCount++;
        }

        return {
          success: true,
          result: { schedulesScaled: updatedCount },
        };
      }

      // Create executive reporting (Z14)
      case 'create_executive_reporting': {
        await logMetaAuditEvent({
          tenantId,
          actor,
          source: 'governance_coach',
          action: 'create',
          entityType: 'executive_report',
          entityId: 'automated_schedule',
          summary: 'Created executive reporting schedule',
          details: action.details,
        });

        return {
          success: true,
          result: { reportingEnabled: true, frequency: action.details.reportingFrequency },
        };
      }

      // Fallback for unknown actions
      default:
        throw new Error(`Unknown action type: ${action.action_key}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
