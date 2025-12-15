/**
 * Content Regeneration Engine Service (Phase 4)
 * Safely regenerates underperforming variants based on CX09 outcomes
 * with CX08 approval, CX06 generation, and CX05 brand validation
 */

import { createClient } from '@/lib/supabase/server';
import {
  type RegenerationInput,
  type RegenerationResult,
  type RegenerationEligibility,
  type RegenerationGuardrailState,
  type VariantLineageRecord,
  type RegenerationEventRecord,
} from './content-regeneration-types';

/**
 * Check if a variant is eligible for regeneration
 * Must be terminated loser with sufficient confidence
 */
export async function checkEligibility(
  workspaceId: string,
  abTestId: string,
  losingVariantId: string
): Promise<RegenerationEligibility> {
  const supabase = await createClient();
  const violations: string[] = [];

  // Check 1: Test exists
  const { data: testData } = await supabase
    .from('circuit_ab_tests')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('id', abTestId)
    .single();

  if (!testData) {
    return {
      eligible: false,
      reason: 'Test not found',
      violations: ['A/B test does not exist'],
      variant_exists: false,
      cx09_termination_found: false,
      confidence_meets_threshold: false,
      delta_negative: false,
      regenerations_count: 0,
      max_regenerations_per_test: 2,
      cooldown_remaining_hours: 0,
      cooldown_hours_required: 48,
    };
  }

  // Check 2: Losing variant exists in test definition
  const variants = (testData.variants as Array<{ variant_id: string }>) || [];
  const variantExists = variants.some((v) => v.variant_id === losingVariantId);

  if (!variantExists) {
    violations.push(`Variant '${losingVariantId}' not found in test`);
  }

  // Check 3: CX09 termination decision exists for this variant
  const { data: terminationData } = await supabase
    .from('circuit_ab_test_winners')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .eq('decision', 'terminate')
    .eq('winning_variant_id', losingVariantId)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .single();

  const cx09TerminationFound = !!terminationData;
  const confidenceMeetsThreshold = terminationData ? terminationData.confidence_score >= 0.95 : false;
  const deltaNegative = terminationData ? terminationData.performance_delta < 0 : false;

  if (!cx09TerminationFound) {
    violations.push('No CX09 termination decision found for this variant');
  } else {
    if (!confidenceMeetsThreshold) {
      violations.push(
        `Confidence score (${(terminationData.confidence_score * 100).toFixed(0)}%) below threshold (95%)`
      );
    }
    if (!deltaNegative) {
      violations.push('Performance delta must be negative (variant underperforming)');
    }
  }

  // Check 4: Guardrails (regeneration count, cooldown)
  const guardrails = await enforceGuardrails(workspaceId, abTestId);

  if (!guardrails.can_regenerate) {
    violations.push(...guardrails.violations);
  }

  return {
    eligible:
      variantExists &&
      cx09TerminationFound &&
      confidenceMeetsThreshold &&
      deltaNegative &&
      guardrails.can_regenerate,
    reason: violations.length === 0 ? 'Eligible for regeneration' : violations.join('; '),
    violations,
    variant_exists: variantExists,
    cx09_termination_found: cx09TerminationFound,
    confidence_meets_threshold: confidenceMeetsThreshold,
    delta_negative: deltaNegative,
    regenerations_count: guardrails.total_regenerations_for_test,
    max_regenerations_per_test: guardrails.max_regenerations_per_test,
    cooldown_remaining_hours: Math.max(0, guardrails.cooldown_hours_between_regenerations - guardrails.hours_since_last_regeneration),
    cooldown_hours_required: guardrails.cooldown_hours_between_regenerations,
  };
}

/**
 * Enforce regeneration guardrails
 */
export async function enforceGuardrails(
  workspaceId: string,
  abTestId: string
): Promise<RegenerationGuardrailState> {
  const supabase = await createClient();
  const violations: string[] = [];

  // Get count of successful regenerations for this test
  const { data: regenerationCount } = await supabase
    .from('content_regeneration_events')
    .select('count', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .eq('status', 'registered');

  const totalCount = regenerationCount?.[0]?.count || 0;

  // Get last regeneration timestamp
  const { data: lastRegeneration } = await supabase
    .from('content_regeneration_events')
    .select('completed_at')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .eq('status', 'registered')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const lastRegenerationAt = lastRegeneration?.completed_at ? new Date(lastRegeneration.completed_at) : null;
  const now = new Date();
  const hoursSinceLastRegen = lastRegenerationAt ? (now.getTime() - lastRegenerationAt.getTime()) / (1000 * 60 * 60) : 999;

  const maxRegenerationsPerTest = 2;
  const cooldownHours = 48;

  if (totalCount >= maxRegenerationsPerTest) {
    violations.push(`Max regenerations (${maxRegenerationsPerTest}) reached for this test`);
  }

  if (hoursSinceLastRegen < cooldownHours) {
    violations.push(
      `Cooldown required: ${(cooldownHours - hoursSinceLastRegen).toFixed(1)} hours remaining`
    );
  }

  return {
    minimum_confidence: 0.95,
    max_regenerations_per_test: maxRegenerationsPerTest,
    cooldown_hours_between_regenerations: cooldownHours,
    total_regenerations_for_test: totalCount,
    last_regeneration_at: lastRegenerationAt?.toISOString() || null,
    hours_since_last_regeneration: hoursSinceLastRegen,
    can_regenerate: violations.length === 0,
    violations,
  };
}

/**
 * Main regeneration workflow
 */
export async function runContentRegeneration(
  input: RegenerationInput
): Promise<RegenerationResult> {
  const startTime = Date.now();
  const eventId = crypto.getRandomValues(new Uint8Array(16)).toString();

  try {
    // Step 1: Check eligibility
    const eligibility = await checkEligibility(
      input.workspace_id,
      input.ab_test_id,
      input.losing_variant_id
    );

    if (!eligibility.eligible) {
      await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
        ...input,
        status: 'failed',
        failure_reason: 'not_eligible',
        failure_details: eligibility.reason,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        triggered_by: input.generated_by || 'automated',
      });

      return {
        success: false,
        regeneration_event_id: eventId,
        status: 'failed',
        reason: `Not eligible for regeneration: ${eligibility.reason}`,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        cx08_approved: false,
        cx06_generated: false,
        cx05_passed: false,
      };
    }

    // Step 2: Request CX08 Self-Correction approval
    const cx08Signal = await requestCX08Approval(input);

    if (!cx08Signal.approved) {
      await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
        ...input,
        status: 'cx08_rejected',
        failure_reason: 'cx08_rejection',
        failure_details: `CX08 rejected: ${cx08Signal.recommendation}`,
        cx08_approval_signal: cx08Signal,
        cx08_approved_at: new Date().toISOString(),
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        triggered_by: input.generated_by || 'automated',
      });

      return {
        success: false,
        regeneration_event_id: eventId,
        status: 'cx08_rejected',
        reason: `CX08 Self-Correction rejected regeneration: ${cx08Signal.recommendation}`,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        cx08_approved: false,
        cx06_generated: false,
        cx05_passed: false,
      };
    }

    // Step 3: Generate variant via CX06
    const cx06Result = await generateViaCX06(input);

    if (!cx06Result.success || !cx06Result.content) {
      await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
        ...input,
        status: 'cx06_generated',
        failure_reason: 'cx06_generation_failed',
        failure_details: cx06Result.error || 'CX06 generation failed',
        cx08_approval_signal: cx08Signal,
        cx08_approved_at: new Date().toISOString(),
        cx06_generation_result: { error: cx06Result.error },
        cx06_generated_at: new Date().toISOString(),
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        triggered_by: input.generated_by || 'automated',
      });

      return {
        success: false,
        regeneration_event_id: eventId,
        status: 'cx06_generated',
        reason: `CX06 generation failed: ${cx06Result.error}`,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        cx08_approved: true,
        cx06_generated: false,
        cx05_passed: false,
      };
    }

    // Step 4: Validate with CX05 Brand Guard
    const cx05Result = await validateViaCX05(cx06Result.content);

    if (!cx05Result.passed) {
      await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
        ...input,
        status: 'cx05_failed',
        failure_reason: 'cx05_validation_failed',
        failure_details: `CX05: ${cx05Result.violations.join('; ')}`,
        new_variant_id: cx06Result.variant_id,
        new_variant_content: cx06Result.content,
        cx08_approval_signal: cx08Signal,
        cx08_approved_at: new Date().toISOString(),
        cx06_generation_result: { variant_id: cx06Result.variant_id },
        cx06_generated_at: new Date().toISOString(),
        cx05_validation_result: cx05Result,
        cx05_validated_at: new Date().toISOString(),
        cx05_validation_score: cx05Result.score,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        triggered_by: input.generated_by || 'automated',
      });

      return {
        success: false,
        regeneration_event_id: eventId,
        status: 'cx05_failed',
        reason: `Brand validation failed: ${cx05Result.violations.join('; ')}`,
        new_variant_id: cx06Result.variant_id,
        new_variant_content: cx06Result.content,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        cx08_approved: true,
        cx06_generated: true,
        cx05_passed: false,
        cx05_score: cx05Result.score,
      };
    }

    // Step 5: Register new variant and create lineage
    const lineageId = await registerNewVariant(
      input.workspace_id,
      input.ab_test_id,
      input.losing_variant_id,
      cx06Result.variant_id,
      eventId
    );

    // Step 6: Log successful regeneration
    await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
      ...input,
      status: 'registered',
      new_variant_id: cx06Result.variant_id,
      new_variant_content: cx06Result.content,
      cx08_approval_signal: cx08Signal,
      cx08_approved_at: new Date().toISOString(),
      cx06_generation_result: { variant_id: cx06Result.variant_id },
      cx06_generated_at: new Date().toISOString(),
      cx05_validation_result: cx05Result,
      cx05_validated_at: new Date().toISOString(),
      cx05_validation_score: cx05Result.score,
      initiated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      triggered_by: input.generated_by || 'automated',
    });

    return {
      success: true,
      regeneration_event_id: eventId,
      new_variant_id: cx06Result.variant_id,
      new_variant_content: cx06Result.content,
      status: 'registered',
      reason: `Successfully regenerated ${input.losing_variant_id} → ${cx06Result.variant_id}`,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      cx08_approved: true,
      cx06_generated: true,
      cx05_passed: true,
      cx05_score: cx05Result.score,
      lineage_id: lineageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logRegenerationEvent(input.workspace_id, input.ab_test_id, {
      ...input,
      status: 'failed',
      failure_reason: 'unknown',
      failure_details: errorMessage,
      initiated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      triggered_by: input.generated_by || 'automated',
    });

    return {
      success: false,
      regeneration_event_id: eventId,
      status: 'failed',
      reason: 'Regeneration failed',
      error: errorMessage,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Request CX08 Self-Correction approval before regeneration
 */
async function requestCX08Approval(input: RegenerationInput): Promise<{
  approved: boolean;
  confidence: number;
  recommendation: string;
}> {
  // Placeholder: In production, this would call CX08 Self-Correction circuit
  // For now, approve automatically if confidence >= 0.95
  return {
    approved: input.confidence_score >= 0.95,
    confidence: input.confidence_score,
    recommendation: input.confidence_score >= 0.95
      ? 'Regenerate underperforming variant'
      : 'Insufficient confidence for regeneration',
  };
}

/**
 * Generate new variant via CX06
 */
async function generateViaCX06(input: RegenerationInput): Promise<{
  success: boolean;
  variant_id?: string;
  content?: Record<string, unknown>;
  error?: string;
}> {
  // Placeholder: In production, this would call CX06 Content Generation
  // For MVP, return a mock generated variant
  try {
    const newVariantId = `${input.losing_variant_id}_regen_${Date.now()}`;

    return {
      success: true,
      variant_id: newVariantId,
      content: {
        subject_line: '[REGENERATED] Improved offer',
        body: 'This is a regenerated variant based on performance analysis',
        cta_text: 'Learn More',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown generation error',
    };
  }
}

/**
 * Validate regenerated variant with CX05 Brand Guard
 */
async function validateViaCX05(
  _content: Record<string, unknown>
): Promise<{
  passed: boolean;
  score: number;
  violations: string[];
  warnings: string[];
}> {
  // Placeholder: In production, this would call CX05 Brand Guard
  // For MVP, return successful validation

  const score = 0.92; // Mock score

  return {
    passed: score >= 0.8,
    score,
    violations: [],
    warnings: score < 0.95 ? ['Minor brand alignment issue'] : [],
  };
}

/**
 * Register new variant and create lineage record
 */
async function registerNewVariant(
  workspaceId: string,
  abTestId: string,
  parentVariantId: string,
  childVariantId: string,
  regenerationEventId: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('content_variant_lineage')
    .insert([
      {
        workspace_id: workspaceId,
        ab_test_id: abTestId,
        parent_variant_id: parentVariantId,
        child_variant_id: childVariantId,
        regeneration_event_id: regenerationEventId,
        depth: 1,
        is_active: true,
      },
    ])
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create lineage: ${error.message}`);
  }

  return data.id;
}

/**
 * Log regeneration event
 */
async function logRegenerationEvent(
  workspaceId: string,
  abTestId: string,
  event: {
    workspace_id: string;
    ab_test_id: string;
    losing_variant_id: string;
    circuit_execution_id: string;
    termination_reason: string;
    confidence_score: number;
    performance_delta: number;
    status: string;
    failure_reason?: string;
    failure_details?: string;
    new_variant_id?: string;
    new_variant_content?: Record<string, unknown>;
    cx08_approval_signal?: Record<string, unknown>;
    cx08_approved_at?: string;
    cx06_generation_result?: Record<string, unknown>;
    cx06_generated_at?: string;
    cx05_validation_result?: Record<string, unknown>;
    cx05_validated_at?: string;
    cx05_validation_score?: number;
    initiated_at: string;
    completed_at: string;
    duration_ms: number;
    triggered_by: string;
  }
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('content_regeneration_events').insert([
    {
      workspace_id: workspaceId,
      ab_test_id: abTestId,
      parent_variant_id: event.losing_variant_id,
      circuit_execution_id: event.circuit_execution_id,
      regeneration_reason: event.termination_reason,
      performance_delta: event.performance_delta,
      confidence_score: event.confidence_score,
      status: event.status,
      failure_reason: event.failure_reason,
      failure_details: event.failure_details,
      new_variant_id: event.new_variant_id,
      new_variant_content: event.new_variant_content,
      cx08_approval_signal: event.cx08_approval_signal,
      cx08_approved_at: event.cx08_approved_at,
      cx06_generation_result: event.cx06_generation_result,
      cx06_generated_at: event.cx06_generated_at,
      cx05_validation_result: event.cx05_validation_result,
      cx05_validated_at: event.cx05_validated_at,
      cx05_validation_score: event.cx05_validation_score,
      initiated_at: event.initiated_at,
      completed_at: event.completed_at,
      duration_ms: event.duration_ms,
      triggered_by: event.triggered_by as 'automated' | 'manual' | 'cron',
    },
  ]);
}

/**
 * Get variant lineage and regeneration history
 */
export async function getContentLineage(
  workspaceId: string,
  abTestId: string,
  variantId: string
): Promise<{
  parents: VariantLineageRecord[];
  children: VariantLineageRecord[];
  recent_events: RegenerationEventRecord[];
}> {
  const supabase = await createClient();

  // Get parents (who replaced this variant)
  const { data: parents } = await supabase
    .from('content_variant_lineage')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .eq('child_variant_id', variantId);

  // Get children (what this variant replaced)
  const { data: children } = await supabase
    .from('content_variant_lineage')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .eq('parent_variant_id', variantId);

  // Get recent regeneration events for this variant
  const { data: events } = await supabase
    .from('content_regeneration_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('ab_test_id', abTestId)
    .or(`parent_variant_id.eq.${variantId},new_variant_id.eq.${variantId}`)
    .order('initiated_at', { ascending: false })
    .limit(10);

  return {
    parents: (parents || []) as VariantLineageRecord[],
    children: (children || []) as VariantLineageRecord[],
    recent_events: (events || []) as RegenerationEventRecord[],
  };
}
