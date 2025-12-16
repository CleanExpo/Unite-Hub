/**
 * Decision Circuits Enforcement Layer v1.1.0
 * Mandatory circuit execution governance and production observability
 * Block all direct model invocations, route through circuits only
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Enforcement configuration
 */
export const ENFORCEMENT_CONFIG = {
  // Mandatory circuit execution for all AI calls
  require_decision_circuit_for_ai_calls: true,
  block_direct_model_invocation: true,

  // Only allowed entrypoints for AI execution
  allowed_entrypoints: [
    'DecisionCircuitExecutor.execute',
    'DecisionCircuitExecutor.executeChain',
  ],

  // Violation behavior
  violation_behavior: 'hard_fail_with_audit_log' as const,

  // Synthex integration requirements
  synthex_integration: {
    replace_legacy_generation_paths: true,
    generation_must_reference_circuit_id: true,
    disallowed_patterns: [
      'openai.chat.completions.create',
      'anthropic.messages.create',
      'direct_prompt_execution',
    ],
  },
} as const;

/**
 * Production health check definitions
 */
export interface HealthCheck {
  check_id: string;
  description: string;
  threshold: {
    min_success_rate?: number;
    max_recovery_cycles?: number;
    max_violation_rate?: number;
    window?: string;
  };
  on_fail: 'trigger_autocorrection_review' | 'freeze_strategy_rotation' | 'tighten_guard_constraints';
}

export const PRODUCTION_HEALTH_CHECKS: HealthCheck[] = [
  {
    check_id: 'DC_HEALTH_01',
    description: 'Decision circuit execution success rate',
    threshold: {
      min_success_rate: 0.92,
      window: '24h',
    },
    on_fail: 'trigger_autocorrection_review',
  },
  {
    check_id: 'DC_HEALTH_02',
    description: 'Self-correction recovery effectiveness',
    threshold: {
      max_recovery_cycles: 2,
    },
    on_fail: 'freeze_strategy_rotation',
  },
  {
    check_id: 'DC_HEALTH_03',
    description: 'Brand guard violation rate',
    threshold: {
      max_violation_rate: 0.01,
      window: '7d',
    },
    on_fail: 'tighten_guard_constraints',
  },
];

/**
 * Autonomy lock configuration for production
 */
export const AUTONOMY_LOCK = {
  manual_override_required: false,
  self_healing_authority: ['CX08_SELF_CORRECTION'],
  escalation_policy: {
    escalate_only_if: [
      'autocorrection_failed',
      'systemic_metric_regression',
    ],
    escalation_target: 'admin_dashboard_only',
  },
} as const;

/**
 * Enforcement violation error
 */
export class EnforcementViolationError extends Error {
  constructor(
    public violation_type: string,
    public details: Record<string, unknown>,
    message: string
  ) {
    super(message);
    this.name = 'EnforcementViolationError';
  }
}

/**
 * Validate that a call comes from allowed entrypoint
 * Throws if violated
 */
export function validateEntrypoint(callStack: string): void {
  const isAllowedEntrypoint = ENFORCEMENT_CONFIG.allowed_entrypoints.some(
    (entrypoint) => callStack.includes(entrypoint)
  );

  if (!isAllowedEntrypoint && ENFORCEMENT_CONFIG.block_direct_model_invocation) {
    throw new EnforcementViolationError(
      'INVALID_ENTRYPOINT',
      { callStack },
      'AI calls must go through DecisionCircuitExecutor. Direct model invocation blocked.'
    );
  }
}

/**
 * Detect disallowed direct model call patterns
 */
export function detectDisallowedModelCalls(code: string): string[] {
  const violations: string[] = [];

  for (const pattern of ENFORCEMENT_CONFIG.synthex_integration
    .disallowed_patterns) {
    if (code.includes(pattern)) {
      violations.push(pattern);
    }
  }

  return violations;
}

/**
 * Validate generation calls have circuit reference
 */
export function validateGenerationCircuitReference(
  generationConfig: Record<string, unknown>
): { valid: boolean; error?: string } {
  const circuitId = generationConfig.circuit_id ||
    generationConfig.circuitId || (generationConfig as Record<string, unknown>)
    ?.['circuit_id'];

  if (!circuitId) {
    return {
      valid: false,
      error: 'Generation calls must include circuit_id reference',
    };
  }

  return { valid: true };
}

/**
 * Check production health metrics
 */
export async function checkProductionHealth(
  workspace_id: string
): Promise<{
  healthy: boolean;
  checks: Array<{
    check_id: string;
    passed: boolean;
    value: number;
    threshold: number;
    action?: string;
  }>;
}> {
  const supabase = createClient();
  const results = [];

  // DC_HEALTH_01: Success rate check
  const { data: execLogs } = await supabase
    .from('circuit_execution_logs')
    .select('success')
    .eq('workspace_id', workspace_id)
    .gte(
      'timestamp',
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  if (execLogs && execLogs.length > 0) {
    const successCount = execLogs.filter((log: { success: boolean }) => log.success).length;
    const successRate = successCount / execLogs.length;
    const threshold = 0.92;

    results.push({
      check_id: 'DC_HEALTH_01',
      passed: successRate >= threshold,
      value: successRate,
      threshold,
      action: successRate < threshold ? 'trigger_autocorrection_review' : undefined,
    });
  }

  // DC_HEALTH_02: Recovery cycles check
  const { data: strategyStates } = await supabase
    .from('circuit_strategy_states')
    .select('decline_cycles')
    .eq('workspace_id', workspace_id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (strategyStates && strategyStates.length > 0) {
    const maxRecoveryCycles = Math.max(
      ...(strategyStates as Array<{ decline_cycles: number }>).map(
        (s) => s.decline_cycles || 0
      )
    );
    const threshold = 2;

    results.push({
      check_id: 'DC_HEALTH_02',
      passed: maxRecoveryCycles <= threshold,
      value: maxRecoveryCycles,
      threshold,
      action: maxRecoveryCycles > threshold ? 'freeze_strategy_rotation' : undefined,
    });
  }

  // DC_HEALTH_03: Brand guard violations
  const { data: execLogsWeek } = await supabase
    .from('circuit_execution_logs')
    .select('outputs')
    .eq('workspace_id', workspace_id)
    .eq('circuit_id', 'CX05_BRAND_GUARD')
    .gte(
      'timestamp',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (execLogsWeek && execLogsWeek.length > 0) {
    const violationCount = (execLogsWeek as Array<{ outputs: Record<string, unknown> }>).filter(
      (log) =>
        log.outputs &&
        (log.outputs as Record<string, unknown>).violations &&
        Array.isArray((log.outputs as Record<string, unknown>).violations) &&
        ((log.outputs as Record<string, unknown>).violations as unknown[]).length > 0
    ).length;

    const violationRate = violationCount / execLogsWeek.length;
    const threshold = 0.01;

    results.push({
      check_id: 'DC_HEALTH_03',
      passed: violationRate <= threshold,
      value: violationRate,
      threshold,
      action: violationRate > threshold ? 'tighten_guard_constraints' : undefined,
    });
  }

  const healthy = results.every((r) => r.passed);

  return {
    healthy,
    checks: results,
  };
}

/**
 * Execute health check action
 */
export async function executeHealthCheckAction(
  workspace_id: string,
  action: 'trigger_autocorrection_review' | 'freeze_strategy_rotation' | 'tighten_guard_constraints'
): Promise<void> {
  const supabase = createClient();

  const actionLog = {
    workspace_id,
    action,
    timestamp: new Date().toISOString(),
    triggered_at: new Date().getTime(),
  };

  if (action === 'trigger_autocorrection_review') {
    // Escalate for admin review
    await supabase
      .from('circuit_autocorrection_logs')
      .insert({
        workspace_id,
        client_id: 'system',
        log_id: `health_check_${Date.now()}`,
        action_type: 'escalate_to_admin',
        reason: 'Health check: Success rate below 92% threshold',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      });
  } else if (action === 'freeze_strategy_rotation') {
    // Prevent strategy rotations until reviewed
    await supabase
      .from('circuit_autocorrection_logs')
      .insert({
        workspace_id,
        client_id: 'system',
        log_id: `health_check_${Date.now()}`,
        action_type: 'escalate_to_admin',
        reason: 'Health check: Recovery cycles exceed threshold (freeze rotation)',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      });
  } else if (action === 'tighten_guard_constraints') {
    // Increase brand guard strictness
    await supabase
      .from('circuit_autocorrection_logs')
      .insert({
        workspace_id,
        client_id: 'system',
        log_id: `health_check_${Date.now()}`,
        action_type: 'escalate_to_admin',
        reason: 'Health check: Brand violations above 1% (tighten constraints)',
        confidence: 0.93,
        timestamp: new Date().toISOString(),
      });
  }
}

/**
 * Verify required tables exist for enforcement
 */
export async function verifyDeploymentRequirements(): Promise<{
  required_tables: string[];
  found_tables: string[];
  all_present: boolean;
  missing_tables: string[];
}> {
  const supabase = createClient();
  const required = [
    'circuit_execution_logs',
    'circuit_strategy_states',
    'circuit_autocorrection_logs',
  ];

  try {
    // Check each table
    const results = await Promise.all(
      required.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        return {
          table,
          exists: !error || error.code !== 'PGRST116',
        };
      })
    );

    const found = results.filter((r) => r.exists).map((r) => r.table);
    const missing = results.filter((r) => !r.exists).map((r) => r.table);

    return {
      required_tables: required,
      found_tables: found,
      all_present: missing.length === 0,
      missing_tables: missing,
    };
  } catch (error) {
    return {
      required_tables: required,
      found_tables: [],
      all_present: false,
      missing_tables: required,
    };
  }
}

/**
 * Deployment pre-flight check
 */
export async function runDeploymentPreflightCheck(): Promise<{
  ready_for_production: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required tables
  const tableCheck = await verifyDeploymentRequirements();
  if (!tableCheck.all_present) {
    issues.push(
      `Missing required tables: ${tableCheck.missing_tables.join(', ')}`
    );
  }

  // Check enforcement config
  if (!ENFORCEMENT_CONFIG.require_decision_circuit_for_ai_calls) {
    warnings.push(
      'Decision circuit enforcement is not enabled - AI calls may bypass governance'
    );
  }

  if (!ENFORCEMENT_CONFIG.block_direct_model_invocation) {
    issues.push('Direct model invocation is not blocked - enforcement disabled');
  }

  // Check autonomy lock
  if (AUTONOMY_LOCK.manual_override_required) {
    warnings.push(
      'Autonomy requires manual override - autonomous operation disabled'
    );
  }

  return {
    ready_for_production: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Log enforcement event
 */
export async function logEnforcementEvent(
  workspace_id: string,
  event_type: 'violation' | 'health_check' | 'override',
  details: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();

  await supabase
    .from('circuit_execution_logs')
    .insert({
      workspace_id,
      client_id: 'enforcement_system',
      circuit_id: `ENFORCEMENT_${event_type.toUpperCase()}`,
      execution_id: `enforcement_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
      inputs: details,
      outputs: { event_type, logged_at: new Date().toISOString() },
      decision_path: ['enforcement_check'],
      success: event_type !== 'violation',
      error:
        event_type === 'violation'
          ? 'Enforcement violation detected'
          : undefined,
      latency_ms: 0,
    });
}
