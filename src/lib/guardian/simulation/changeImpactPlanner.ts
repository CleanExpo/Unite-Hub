/**
 * Guardian I06: Change Impact Planner
 *
 * Maps Guardian config changes to appropriate regression packs,
 * chaos profiles, and QA schedules for targeted testing.
 *
 * Selection logic is deterministic and designed for easy future extension.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { GuardianChangeDiff } from './changeDiffCollector';

export interface GuardianImpactPlan {
  changeSetId: string;
  regressionPackIds: string[];
  chaosProfileIds?: string[];
  qaScheduleIds?: string[];
  options?: {
    simulatePlaybooks?: boolean;
    requireDriftCheck?: boolean;
  };
  rationaleMarkdown: string;
}

export interface GuardianRegressionPack {
  id: string;
  name: string;
  description?: string;
  scope?: string; // 'core', 'extended', 'integration'
}

export interface GuardianChaosProfile {
  id: string;
  name: string;
  severity?: string; // 'low', 'medium', 'high', 'critical'
}

export interface GuardianQaSchedule {
  id: string;
  name: string;
  pack_id: string;
}

/**
 * Plan impact assessment for a change set
 * Examines diff to classify the change and select appropriate test artifacts
 */
export async function planImpactForChangeSet(
  tenantId: string,
  changeSetId: string
): Promise<GuardianImpactPlan> {
  const supabase = getSupabaseServer();

  // Load the change set
  const { data: changeSet, error: csError } = await supabase
    .from('guardian_change_sets')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', changeSetId)
    .single();

  if (csError || !changeSet) {
    throw new Error(`Change set ${changeSetId} not found: ${csError?.message}`);
  }

  const diff = (changeSet.diff || {}) as GuardianChangeDiff;

  // Classify the change and build plan
  const packs: string[] = [];
  const profiles: string[] = [];
  const schedules: string[] = [];
  let simulatePlaybooks = false;
  let requireDriftCheck = true;

  const rationaleLines: string[] = [];

  // ===== RULE CHANGES =====
  if (diff.rules && (diff.rules.added?.length || diff.rules.modified?.length)) {
    rationaleLines.push(
      `**Rules Changed**: ${diff.rules.added?.length || 0} added, ${diff.rules.modified?.length || 0} modified`
    );

    // Always include core regression pack for rule changes
    packs.push('guardian_core');
    rationaleLines.push(
      '→ Running `guardian_core` regression pack for rule baseline testing'
    );

    // If high-severity rules added, run with critical chaos profile
    if (diff.rules.added && diff.rules.added.length > 0) {
      profiles.push('chaos_critical');
      rationaleLines.push(
        '→ Running `chaos_critical` profile to stress-test new rules'
      );
    }
  }

  // ===== PLAYBOOK CHANGES =====
  if (
    diff.playbooks &&
    (diff.playbooks.added?.length || diff.playbooks.modified?.length)
  ) {
    rationaleLines.push(
      `**Playbooks Changed**: ${diff.playbooks.added?.length || 0} added, ${diff.playbooks.modified?.length || 0} modified`
    );

    simulatePlaybooks = true;
    rationaleLines.push(
      '→ Enabling playbook simulation to test automated remediation'
    );

    // Include playbook-focused QA schedule
    schedules.push('qa_playbook_validation');
    rationaleLines.push(
      '→ Running `qa_playbook_validation` QA schedule for drift detection'
    );
  }

  // ===== THRESHOLD CHANGES =====
  if (
    diff.thresholds &&
    (diff.thresholds.added?.length || diff.thresholds.modified?.length)
  ) {
    rationaleLines.push(
      `**Thresholds Changed**: ${diff.thresholds.added?.length || 0} added, ${diff.thresholds.modified?.length || 0} modified`
    );

    // Threshold changes affect incident escalation and risk scoring
    if (!packs.includes('guardian_core')) {
      packs.push('guardian_core');
    }

    // Run with medium chaos profile to validate new thresholds
    if (!profiles.includes('chaos_medium')) {
      profiles.push('chaos_medium');
      rationaleLines.push(
        '→ Running `chaos_medium` profile to validate threshold accuracy'
      );
    }

    requireDriftCheck = true;
    rationaleLines.push(
      '→ Drift analysis required for threshold impact assessment'
    );
  }

  // ===== FALLBACK: No specific changes =====
  if (packs.length === 0) {
    packs.push('guardian_core');
    rationaleLines.push('→ Running baseline `guardian_core` regression pack');
  }

  const rationale = rationaleLines.join('\n');

  return {
    changeSetId,
    regressionPackIds: packs,
    chaosProfileIds: profiles.length > 0 ? profiles : undefined,
    qaScheduleIds: schedules.length > 0 ? schedules : undefined,
    options: {
      simulatePlaybooks,
      requireDriftCheck,
    },
    rationaleMarkdown: rationale,
  };
}

/**
 * Validate that regression packs, chaos profiles, and QA schedules exist
 * (optional safety check before execution)
 */
export async function validateImpactPlan(
  tenantId: string,
  plan: GuardianImpactPlan
): Promise<{ valid: boolean; errors: string[] }> {
  const supabase = getSupabaseServer();
  const errors: string[] = [];

  // Check packs
  if (plan.regressionPackIds && plan.regressionPackIds.length > 0) {
    const { data: packs } = await supabase
      .from('guardian_regression_packs')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', plan.regressionPackIds);

    if (!packs || packs.length !== plan.regressionPackIds.length) {
      errors.push('One or more regression packs not found');
    }
  }

  // Check chaos profiles
  if (plan.chaosProfileIds && plan.chaosProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('guardian_chaos_profiles')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', plan.chaosProfileIds);

    if (!profiles || profiles.length !== plan.chaosProfileIds.length) {
      errors.push('One or more chaos profiles not found');
    }
  }

  // Check QA schedules
  if (plan.qaScheduleIds && plan.qaScheduleIds.length > 0) {
    const { data: scheds } = await supabase
      .from('guardian_qa_schedules')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', plan.qaScheduleIds);

    if (!scheds || scheds.length !== plan.qaScheduleIds.length) {
      errors.push('One or more QA schedules not found');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
