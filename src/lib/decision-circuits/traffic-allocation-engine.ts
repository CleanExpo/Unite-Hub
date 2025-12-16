/**
 * Traffic Allocation Engine (Phase 3) - Service Layer
 * Applies CX09 A/B testing outcomes to live workflows with safeguards
 */

import { createClient } from '@/lib/supabase/server';
import {
  ApplyAllocationInput,
  AllocationResult,
  GuardrailValidation,
  RateLimitStatus,
  HealthMetrics,
  DEFAULT_GUARDRAILS,
} from './traffic-allocation';

/**
 * Validate guardrails before applying allocation
 */
export async function validateGuardrails(
  workspaceId: string,
  input: ApplyAllocationInput
): Promise<GuardrailValidation> {
  const violations: string[] = [];

  // Check 1: Minimum confidence threshold
  if (input.confidence_score < DEFAULT_GUARDRAILS.minimum_confidence) {
    violations.push(
      `Confidence score (${(input.confidence_score * 100).toFixed(0)}%) below threshold (${(DEFAULT_GUARDRAILS.minimum_confidence * 100).toFixed(0)}%)`
    );
  }

  // Check 2: Performance delta > 0 (winner must be positive)
  if (input.performance_delta <= 0) {
    violations.push(`Performance delta (${input.performance_delta.toFixed(2)}%) must be positive`);
  }

  // Check 3: Rate limiting (daily change limit)
  const rateLimitStatus = await checkRateLimit(workspaceId);
  if (!rateLimitStatus.can_allocate) {
    violations.push(`Rate limit exceeded: ${rateLimitStatus.reason}`);
  }

  // Check 4: Cooldown between changes for same test
  const lastAllocation = await getLastAllocationTime(workspaceId, input.ab_test_id);
  if (lastAllocation) {
    const hoursSinceLastAllocation = (Date.now() - new Date(lastAllocation).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAllocation < DEFAULT_GUARDRAILS.cooldown_hours_between_changes) {
      violations.push(
        `Cooldown period required: ${(DEFAULT_GUARDRAILS.cooldown_hours_between_changes - hoursSinceLastAllocation).toFixed(1)} hours remaining`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    reason: violations.length > 0 ? violations.join('; ') : undefined,
  };
}

/**
 * Check rate limiting status
 */
export async function checkRateLimit(workspaceId: string): Promise<RateLimitStatus> {
  const supabase = await createClient();

  try {
    const { data: limitData } = await supabase
      .from('traffic_allocation_limits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (!limitData) {
      // Create new limit record
      await supabase.from('traffic_allocation_limits').insert([
        {
          workspace_id: workspaceId,
          allocations_today: 0,
          reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      return {
        allocations_today: 0,
        can_allocate: true,
        reason: 'Rate limit available',
      };
    }

    // Check if reset period has passed
    const now = new Date();
    const resetAt = new Date(limitData.reset_at);

    if (now > resetAt) {
      // Reset the counter
      await supabase
        .from('traffic_allocation_limits')
        .update({
          allocations_today: 0,
          reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('workspace_id', workspaceId);

      return {
        allocations_today: 0,
        can_allocate: true,
        reason: 'Rate limit available',
      };
    }

    // Check if at limit
    const can_allocate = limitData.allocations_today < DEFAULT_GUARDRAILS.max_daily_changes_per_workspace;

    return {
      allocations_today: limitData.allocations_today,
      last_allocation_at: limitData.last_allocation_at,
      can_allocate,
      reason: can_allocate
        ? `${DEFAULT_GUARDRAILS.max_daily_changes_per_workspace - limitData.allocations_today} allocations remaining today`
        : `Daily limit reached (${DEFAULT_GUARDRAILS.max_daily_changes_per_workspace}/${DEFAULT_GUARDRAILS.max_daily_changes_per_workspace})`,
    };
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    return {
      allocations_today: 0,
      can_allocate: false,
      reason: 'Rate limit check failed',
    };
  }
}

/**
 * Get last allocation time for a test
 */
async function getLastAllocationTime(workspaceId: string, abTestId: string): Promise<string | null> {
  const supabase = await createClient();

  try {
    const { data } = await supabase
      .from('traffic_allocation_events')
      .select('triggered_at')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', abTestId)
      .eq('event_type', 'allocation_applied')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .single();

    return data?.triggered_at || null;
  } catch {
    return null;
  }
}

/**
 * Apply traffic allocation based on CX09 winner
 */
export async function applyAllocation(input: ApplyAllocationInput): Promise<AllocationResult> {
  const supabase = await createClient();

  try {
    // Step 1: Validate guardrails
    const guardRailValidation = await validateGuardrails(input.workspace_id, input);
    if (!guardRailValidation.valid) {
      return {
        success: false,
        reason: 'Guardrails validation failed',
        error: guardRailValidation.reason,
      };
    }

    // Step 2: Get current allocations
    const { data: currentAllocations } = await supabase
      .from('traffic_allocation_state')
      .select('*')
      .eq('ab_test_id', input.ab_test_id)
      .eq('is_active', true);

    const winnerAllocation = currentAllocations?.find((a) => a.variant_id === input.winning_variant_id);
    const loserAllocations = currentAllocations?.filter((a) => a.variant_id !== input.winning_variant_id) || [];

    // Step 3: Calculate new allocations (progressive promotion)
    const current_winner_percent = winnerAllocation?.allocation_percent || 50;
    const step_increase = Math.min(
      DEFAULT_GUARDRAILS.max_allocation_step_percent,
      100 - current_winner_percent
    );
    const new_winner_percent = Math.min(100, current_winner_percent + step_increase);

    // Distribute remaining allocation to losers
    const remaining_percent = 100 - new_winner_percent;
    const loser_count = loserAllocations.length;
    const per_loser_percent = loser_count > 0 ? remaining_percent / loser_count : 0;

    // Step 4: Update allocations
    // Deactivate old allocation states
    if (currentAllocations && currentAllocations.length > 0) {
      await supabase
        .from('traffic_allocation_state')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('ab_test_id', input.ab_test_id)
        .eq('is_active', true);
    }

    // Insert new allocation states
    const newAllocations = [
      {
        workspace_id: input.workspace_id,
        ab_test_id: input.ab_test_id,
        variant_id: input.winning_variant_id,
        allocation_percent: new_winner_percent,
        applied_at: new Date().toISOString(),
        applied_from_evaluation_id: input.evaluation_id,
        is_active: true,
      },
      ...loserAllocations.map((loser) => ({
        workspace_id: input.workspace_id,
        ab_test_id: input.ab_test_id,
        variant_id: loser.variant_id,
        allocation_percent: per_loser_percent,
        applied_at: new Date().toISOString(),
        applied_from_evaluation_id: input.evaluation_id,
        is_active: true,
      })),
    ];

    const { data: inserted, error: insertError } = await supabase
      .from('traffic_allocation_state')
      .insert(newAllocations)
      .select()
      .limit(1)
      .single();

    if (insertError || !inserted) {
      return {
        success: false,
        reason: 'Failed to insert allocation state',
        error: insertError?.message,
      };
    }

    // Step 5: Log allocation event
    await supabase.from('traffic_allocation_events').insert([
      {
        workspace_id: input.workspace_id,
        ab_test_id: input.ab_test_id,
        event_type: 'allocation_applied',
        variant_id: input.winning_variant_id,
        allocation_percent: new_winner_percent,
        triggered_by_evaluation_id: input.evaluation_id,
        confidence_score: input.confidence_score,
        performance_delta: input.performance_delta,
        triggered_at: new Date().toISOString(),
      },
    ]);

    // Step 6: Increment rate limit counter
    const { data: limitData } = await supabase
      .from('traffic_allocation_limits')
      .select('allocations_today')
      .eq('workspace_id', input.workspace_id)
      .single();

    if (limitData) {
      await supabase
        .from('traffic_allocation_limits')
        .update({
          allocations_today: limitData.allocations_today + 1,
          last_allocation_at: new Date().toISOString(),
        })
        .eq('workspace_id', input.workspace_id);
    }

    return {
      success: true,
      allocation_id: inserted.id,
      previous_allocation_percent: current_winner_percent,
      new_allocation_percent: new_winner_percent,
      reason: `Successfully applied allocation: ${input.winning_variant_id} increased from ${current_winner_percent}% to ${new_winner_percent}%`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      reason: 'Failed to apply allocation',
      error: errorMessage,
    };
  }
}

/**
 * Check health metrics and trigger automatic rollback if needed
 */
export async function checkHealthAndRollback(
  workspaceId: string,
  abTestId: string,
  healthMetrics: HealthMetrics
): Promise<{ rolled_back: boolean; reason?: string }> {
  const supabase = await createClient();

  try {
    // Check against rollback thresholds
    const ROLLBACK_THRESHOLDS = {
      success_rate_drop: 5, // Percent points
      error_rate_increase: 3, // Percent points
    };

    // Get baseline metrics from allocation event before current
    const { data: priorEvent } = await supabase
      .from('traffic_allocation_events')
      .select('health_metrics')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', abTestId)
      .eq('event_type', 'allocation_applied')
      .order('triggered_at', { ascending: false })
      .limit(2)
      .offset(1)
      .single();

    if (!priorEvent?.health_metrics) {
      // No baseline, skip rollback check
      return { rolled_back: false, reason: 'No baseline metrics for comparison' };
    }

    const baseline = priorEvent.health_metrics;
    const successRateDrop = baseline.success_rate - healthMetrics.success_rate;
    const errorRateIncrease = healthMetrics.error_rate - baseline.error_rate;

    // Check rollback conditions
    if (successRateDrop > ROLLBACK_THRESHOLDS.success_rate_drop) {
      await performRollback(workspaceId, abTestId, 'success_rate_drop', successRateDrop, ROLLBACK_THRESHOLDS.success_rate_drop);
      return { rolled_back: true, reason: `Success rate dropped by ${successRateDrop.toFixed(2)}%` };
    }

    if (errorRateIncrease > ROLLBACK_THRESHOLDS.error_rate_increase) {
      await performRollback(workspaceId, abTestId, 'error_rate_increase', errorRateIncrease, ROLLBACK_THRESHOLDS.error_rate_increase);
      return { rolled_back: true, reason: `Error rate increased by ${errorRateIncrease.toFixed(2)}%` };
    }

    // Log health check passed
    await supabase.from('traffic_allocation_events').insert([
      {
        workspace_id: workspaceId,
        ab_test_id: abTestId,
        event_type: 'health_check_passed',
        health_metrics: healthMetrics,
        triggered_at: new Date().toISOString(),
      },
    ]);

    return { rolled_back: false };
  } catch (error) {
    console.error('Failed to check health:', error);
    return { rolled_back: false, reason: 'Health check failed' };
  }
}

/**
 * Perform automatic rollback
 */
async function performRollback(
  workspaceId: string,
  abTestId: string,
  metricType: string,
  actualValue: number,
  threshold: number
): Promise<void> {
  const supabase = await createClient();

  try {
    // Get current allocation
    const { data: currentAllocation } = await supabase
      .from('traffic_allocation_state')
      .select('*')
      .eq('ab_test_id', abTestId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!currentAllocation) {
      return;
    }

    // Deactivate current
    await supabase
      .from('traffic_allocation_state')
      .update({
        is_active: false,
        rolled_back_at: new Date().toISOString(),
        rollback_reason: `${metricType}: ${actualValue.toFixed(2)}% (threshold: ${threshold}%)`,
      })
      .eq('id', currentAllocation.id);

    // Log rollback event
    await supabase.from('traffic_allocation_events').insert([
      {
        workspace_id: workspaceId,
        ab_test_id: abTestId,
        event_type: 'allocation_rolled_back',
        variant_id: currentAllocation.variant_id,
        allocation_percent: currentAllocation.allocation_percent,
        rollback_reason: `${metricType}: ${actualValue.toFixed(2)}% (threshold: ${threshold}%)`,
        triggered_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Failed to perform rollback:', error);
  }
}

/**
 * Get current allocation state for a test
 */
export async function getAllocationState(workspaceId: string, abTestId: string) {
  const supabase = await createClient();

  try {
    const { data } = await supabase
      .from('traffic_allocation_current')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', abTestId);

    return data || [];
  } catch (error) {
    console.error('Failed to get allocation state:', error);
    return [];
  }
}

/**
 * Get allocation history for a test
 */
export async function getAllocationHistory(workspaceId: string, abTestId: string, limit: number = 50) {
  const supabase = await createClient();

  try {
    const { data } = await supabase
      .from('traffic_allocation_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', abTestId)
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Failed to get allocation history:', error);
    return [];
  }
}
