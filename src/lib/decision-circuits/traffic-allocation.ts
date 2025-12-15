/**
 * Traffic Allocation Engine (Phase 3)
 * Guarded control layer for applying CX09 A/B testing outcomes to live workflows
 * All changes are reversible, rate-limited, and fully auditable
 */

/**
 * Guardrail configuration
 */
export interface AllocationGuardrails {
  minimum_confidence: number; // Default: 0.95 (95%)
  max_allocation_step_percent: number; // Default: 20%
  cooldown_hours_between_changes: number; // Default: 24
  max_daily_changes_per_workspace: number; // Default: 2
}

export const DEFAULT_GUARDRAILS: AllocationGuardrails = {
  minimum_confidence: 0.95,
  max_allocation_step_percent: 20,
  cooldown_hours_between_changes: 24,
  max_daily_changes_per_workspace: 2,
};

/**
 * Traffic allocation request (from CX09 winner)
 */
export interface ApplyAllocationInput {
  workspace_id: string;
  ab_test_id: string;
  winning_variant_id: string;
  losing_variant_id: string;
  evaluation_id: string; // Links to circuit_ab_test_winners.id
  confidence_score: number; // 0-1
  performance_delta: number; // Percentage points
}

/**
 * Current allocation state for a variant
 */
export interface AllocationState {
  id: string;
  ab_test_id: string;
  variant_id: string;
  allocation_percent: number;
  is_active: boolean;
  applied_at: string;
  rolled_back_at?: string;
}

/**
 * Allocation event (audit trail entry)
 */
export interface AllocationEvent {
  id: string;
  event_type: 'allocation_applied' | 'allocation_rolled_back' | 'health_check_passed' | 'health_check_failed';
  ab_test_id: string;
  variant_id?: string;
  allocation_percent?: number;
  confidence_score?: number;
  performance_delta?: number;
  health_metrics?: {
    success_rate: number;
    error_rate: number;
    retry_rate: number;
  };
  rollback_reason?: string;
  triggered_at: string;
}

/**
 * Allocation result (success or failure)
 */
export interface AllocationResult {
  success: boolean;
  allocation_id?: string;
  previous_allocation_percent?: number;
  new_allocation_percent?: number;
  reason: string; // Why it succeeded or failed
  error?: string;
}

/**
 * Health metrics snapshot
 */
export interface HealthMetrics {
  success_rate: number; // 0-100%
  error_rate: number; // 0-100%
  retry_rate: number; // 0-100%
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allocations_today: number;
  last_allocation_at?: string;
  can_allocate: boolean;
  reason: string; // Why it can or cannot allocate
}

/**
 * Guardrail validation result
 */
export interface GuardrailValidation {
  valid: boolean;
  violations: string[]; // Array of guardrail violations
  reason?: string; // Human-readable explanation
}

/**
 * Rollback event
 */
export interface RollbackEvent {
  allocation_id: string;
  variant_id: string;
  previous_allocation_percent: number;
  reason: string;
  health_metrics_trigger: {
    metric: string; // 'success_rate_drop' | 'error_rate_increase'
    threshold: number;
    actual: number;
  };
  rolled_back_at: string;
}
