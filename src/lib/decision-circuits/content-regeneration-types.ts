/**
 * Content Regeneration Engine - Type Definitions (Phase 4)
 * Safe variant regeneration for underperforming losers based on CX09 outcomes
 */

/**
 * Input to regeneration engine
 * Triggered after CX09 termination decision on losing variant
 */
export interface RegenerationInput {
  // Required: Circuit and test context
  workspace_id: string;
  circuit_execution_id: string;
  ab_test_id: string;
  losing_variant_id: string;

  // Required: CX09 termination details
  termination_reason: string; // e.g., "engagement_rate_too_low"
  confidence_score: number; // >= 0.95 required
  performance_delta: number; // < 0 (loser underperformed)

  // Optional: Additional context for CX06 generation
  regeneration_instructions?: string;
  preserve_elements?: string[];
  target_improvements?: string[];

  // Optional: Override defaults
  max_regeneration_attempts?: number;
  generated_by?: 'automated' | 'manual'; // default: automated
}

/**
 * Result of regeneration attempt
 */
export interface RegenerationResult {
  success: boolean;
  regeneration_event_id: string;

  // If successful
  new_variant_id?: string;
  new_variant_content?: Record<string, unknown>;

  // Outcome tracking
  status: RegenerationStatus;
  reason: string;
  error?: string;

  // Timing
  completed_at: string;
  duration_ms: number;

  // What happened at each stage
  cx08_approved?: boolean;
  cx06_generated?: boolean;
  cx05_passed?: boolean;
  cx05_score?: number; // Brand alignment score 0-1

  // Lineage info
  lineage_id?: string;
}

/**
 * Status of a regeneration attempt
 */
export type RegenerationStatus =
  | 'initiated'
  | 'cx08_approved'
  | 'cx08_rejected'
  | 'cx06_generated'
  | 'cx05_passed'
  | 'cx05_failed'
  | 'registered'
  | 'failed';

/**
 * Reason for regeneration failure
 */
export type RegenerationFailureReason =
  | 'not_eligible'
  | 'guardrail_violation'
  | 'cx08_rejection'
  | 'cx06_generation_failed'
  | 'cx05_validation_failed'
  | 'variant_not_found'
  | 'test_not_found'
  | 'max_regenerations_exceeded'
  | 'cooldown_active'
  | 'unknown';

/**
 * Eligibility check result
 */
export interface RegenerationEligibility {
  eligible: boolean;
  reason: string;
  violations: string[];

  // Details
  variant_exists: boolean;
  cx09_termination_found: boolean;
  confidence_meets_threshold: boolean;
  delta_negative: boolean;
  regenerations_count: number;
  max_regenerations_per_test: number;
  cooldown_remaining_hours: number;
  cooldown_hours_required: number;
}

/**
 * Guardrail state for regeneration
 */
export interface RegenerationGuardrailState {
  // Thresholds (defaults from spec)
  minimum_confidence: number; // 0.95
  max_regenerations_per_test: number; // 2
  cooldown_hours_between_regenerations: number; // 48

  // Current state
  total_regenerations_for_test: number;
  last_regeneration_at: string | null;
  hours_since_last_regeneration: number;

  // Compliance
  can_regenerate: boolean;
  violations: string[];
}

/**
 * Variant lineage record
 */
export interface VariantLineageRecord {
  id: string;
  ab_test_id: string;
  parent_variant_id: string;
  child_variant_id: string;
  regeneration_event_id: string;
  depth: number;
  is_active: boolean;
  created_at: string;

  // Parent event details
  event?: RegenerationEventRecord;
}

/**
 * Complete regeneration event record
 */
export interface RegenerationEventRecord {
  id: string;
  workspace_id: string;
  ab_test_id: string;
  parent_variant_id: string;
  circuit_execution_id: string;

  // Context
  regeneration_reason: string;
  performance_delta: number;
  confidence_score: number;

  // Status
  status: RegenerationStatus;
  failure_reason?: RegenerationFailureReason;
  failure_details?: string;

  // Results
  new_variant_id?: string;
  new_variant_content?: Record<string, unknown>;

  // Signals and validations
  cx08_approval_signal?: Record<string, unknown>;
  cx08_approved_at?: string;
  cx06_generation_result?: Record<string, unknown>;
  cx06_generated_at?: string;
  cx05_validation_result?: Record<string, unknown>;
  cx05_validated_at?: string;
  cx05_validation_score?: number;

  // Timing
  initiated_at: string;
  completed_at?: string;
  duration_ms?: number;

  // Metadata
  user_id?: string;
  triggered_by: 'automated' | 'manual' | 'cron';
  created_at: string;
  updated_at: string;
}

/**
 * CX08 Self-Correction approval signal
 */
export interface CX08RegenerationSignal {
  approved: boolean;
  confidence: number;
  recommendation: string;
  constraints?: Record<string, unknown>;
  reasoning?: string;
}

/**
 * CX06 generation result
 */
export interface CX06GenerationOutput {
  variant_id: string;
  content: Record<string, unknown>;
  metadata: {
    prompt_used: string;
    model: string;
    temperature: number;
    tokens_used: number;
    generation_time_ms: number;
  };
  quality_score?: number;
}

/**
 * CX05 Brand Guard validation result
 */
export interface CX05ValidationResult {
  passed: boolean;
  score: number; // 0-1 brand alignment
  violations: string[];
  warnings: string[];
  compliance_report: {
    brand_consistency: number;
    message_alignment: number;
    tone_consistency: number;
    tone_voice_confidence: number;
  };
  recommendation: 'approve' | 'reject' | 'revise';
}

/**
 * Regeneration lineage response
 */
export interface RegenerationLineageResponse {
  ab_test_id: string;
  variant_id: string;
  lineage: {
    parents: VariantLineageRecord[];
    children: VariantLineageRecord[];
    depth: number;
  };
  recent_regenerations: RegenerationEventRecord[];
  regeneration_count: number;
}

/**
 * Default guardrail configuration
 */
export const DEFAULT_REGENERATION_GUARDRAILS: RegenerationGuardrailState = {
  minimum_confidence: 0.95,
  max_regenerations_per_test: 2,
  cooldown_hours_between_regenerations: 48,
  total_regenerations_for_test: 0,
  last_regeneration_at: null,
  hours_since_last_regeneration: 0,
  can_regenerate: true,
  violations: [],
};

/**
 * Regeneration workflow events
 */
export interface RegenerationWorkflowEvent {
  event_type:
    | 'eligibility_check_passed'
    | 'eligibility_check_failed'
    | 'guardrails_validated'
    | 'guardrails_violated'
    | 'cx08_approval_requested'
    | 'cx08_approval_received'
    | 'cx08_approval_rejected'
    | 'cx06_generation_started'
    | 'cx06_generation_completed'
    | 'cx06_generation_failed'
    | 'cx05_validation_started'
    | 'cx05_validation_passed'
    | 'cx05_validation_failed'
    | 'variant_registered'
    | 'lineage_created';

  timestamp: string;
  details: Record<string, unknown>;
  status: 'success' | 'failure' | 'warning';
}
