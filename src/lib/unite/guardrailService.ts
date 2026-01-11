/**
 * Guardrail Service
 * Phase: D68 - Unite Self-Healing & Guardrail Automation
 *
 * Service boundary validation and policy enforcement.
 * Pure evaluation - no side effects.
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface GuardrailPolicy {
  id: string;
  tenant_id?: string;
  policy_key: string;
  name: string;
  description?: string;
  boundary: 'api' | 'agent' | 'database' | 'external' | 'cost';
  rule_type: 'validation' | 'rate_limit' | 'cost_cap' | 'quota' | 'auth';
  rule_config: Record<string, unknown>;
  enforcement: 'warn' | 'block' | 'throttle';
  is_active: boolean;
  violation_count: number;
  last_violation_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface GuardrailEvaluation {
  policy_key: string;
  passed: boolean;
  enforcement: 'warn' | 'block' | 'throttle';
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

export async function createGuardrailPolicy(
  input: Omit<GuardrailPolicy, 'id' | 'created_at' | 'updated_at'>
): Promise<GuardrailPolicy> {
  const { data, error } = await supabaseAdmin
    .from('unite_guardrail_policies')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create guardrail policy: ${error.message}`);
  return data as GuardrailPolicy;
}

export async function listGuardrailPolicies(filters?: {
  tenant_id?: string;
  boundary?: string;
  rule_type?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<GuardrailPolicy[]> {
  let query = supabaseAdmin
    .from('unite_guardrail_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.boundary) query = query.eq('boundary', filters.boundary);
  if (filters?.rule_type) query = query.eq('rule_type', filters.rule_type);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list guardrail policies: ${error.message}`);
  return data as GuardrailPolicy[];
}

export async function updateGuardrailPolicy(
  policyId: string,
  updates: Partial<Omit<GuardrailPolicy, 'id' | 'created_at' | 'updated_at'>>
): Promise<GuardrailPolicy> {
  const { data, error } = await supabaseAdmin
    .from('unite_guardrail_policies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', policyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update guardrail policy: ${error.message}`);
  return data as GuardrailPolicy;
}

export async function deleteGuardrailPolicy(policyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_guardrail_policies')
    .delete()
    .eq('id', policyId);

  if (error) throw new Error(`Failed to delete guardrail policy: ${error.message}`);
}

// ============================================================================
// POLICY EVALUATION (Pure, side-effect-free)
// ============================================================================

export async function evaluateGuardrails(
  tenantId: string | null,
  boundary: 'api' | 'agent' | 'database' | 'external' | 'cost',
  context: Record<string, unknown>
): Promise<{
  passed: boolean;
  violations: GuardrailEvaluation[];
  warnings: GuardrailEvaluation[];
}> {
  // Fetch active policies for this boundary
  const policies = await listGuardrailPolicies({
    tenant_id: tenantId || undefined,
    boundary,
    is_active: true,
  });

  const violations: GuardrailEvaluation[] = [];
  const warnings: GuardrailEvaluation[] = [];

  for (const policy of policies) {
    const evaluation = evaluatePolicy(policy, context);

    if (!evaluation.passed) {
      if (evaluation.enforcement === 'block') {
        violations.push(evaluation);
        // Record violation (async, don't await)
        recordViolation(policy.id).catch(console.error);
      } else {
        warnings.push(evaluation);
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

function evaluatePolicy(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_type, rule_config } = policy;

  try {
    switch (rule_type) {
      case 'validation':
        return evaluateValidation(policy, context);
      case 'rate_limit':
        return evaluateRateLimit(policy, context);
      case 'cost_cap':
        return evaluateCostCap(policy, context);
      case 'quota':
        return evaluateQuota(policy, context);
      case 'auth':
        return evaluateAuth(policy, context);
      default:
        return {
          policy_key: policy.policy_key,
          passed: true,
          enforcement: policy.enforcement,
          message: 'Unknown rule type - defaulting to pass',
        };
    }
  } catch (error) {
    console.error(`[Guardrail] Error evaluating policy ${policy.policy_key}:`, error);
    return {
      policy_key: policy.policy_key,
      passed: true, // Fail open to prevent breaking service
      enforcement: 'warn',
      message: 'Evaluation error - defaulting to pass',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

function evaluateValidation(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_config } = policy;
  const { required_fields, max_size, allowed_values } = rule_config;

  // Check required fields
  if (required_fields && Array.isArray(required_fields)) {
    for (const field of required_fields) {
      if (!context[field]) {
        return {
          policy_key: policy.policy_key,
          passed: false,
          enforcement: policy.enforcement,
          message: `Required field missing: ${field}`,
          details: { missing_field: field },
        };
      }
    }
  }

  // Check max size
  if (max_size && typeof max_size === 'number') {
    const size = JSON.stringify(context).length;
    if (size > max_size) {
      return {
        policy_key: policy.policy_key,
        passed: false,
        enforcement: policy.enforcement,
        message: `Payload too large: ${size} > ${max_size}`,
        details: { size, max_size },
      };
    }
  }

  // Check allowed values
  if (allowed_values && typeof allowed_values === 'object') {
    for (const [field, allowedSet] of Object.entries(allowed_values)) {
      if (context[field] && !allowedSet.includes(context[field])) {
        return {
          policy_key: policy.policy_key,
          passed: false,
          enforcement: policy.enforcement,
          message: `Invalid value for ${field}`,
          details: { field, value: context[field], allowed: allowedSet },
        };
      }
    }
  }

  return {
    policy_key: policy.policy_key,
    passed: true,
    enforcement: policy.enforcement,
    message: 'Validation passed',
  };
}

function evaluateRateLimit(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_config } = policy;
  const { max_requests, window_seconds } = rule_config;

  // STUB: This would check actual rate limit state from cache/database
  // For now, assume rate limit is okay
  const currentRate = context.request_count || 0;

  if (
    typeof max_requests === 'number' &&
    typeof currentRate === 'number' &&
    currentRate > max_requests
  ) {
    return {
      policy_key: policy.policy_key,
      passed: false,
      enforcement: policy.enforcement,
      message: `Rate limit exceeded: ${currentRate} > ${max_requests} per ${window_seconds}s`,
      details: { current_rate: currentRate, max_requests, window_seconds },
    };
  }

  return {
    policy_key: policy.policy_key,
    passed: true,
    enforcement: policy.enforcement,
    message: 'Rate limit okay',
  };
}

function evaluateCostCap(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_config } = policy;
  const { max_cost_usd, period } = rule_config;

  // STUB: This would check actual cost from usage telemetry
  const currentCost = context.current_cost || 0;

  if (typeof max_cost_usd === 'number' && typeof currentCost === 'number' && currentCost > max_cost_usd) {
    return {
      policy_key: policy.policy_key,
      passed: false,
      enforcement: policy.enforcement,
      message: `Cost cap exceeded: $${currentCost} > $${max_cost_usd} for ${period}`,
      details: { current_cost: currentCost, max_cost_usd, period },
    };
  }

  return {
    policy_key: policy.policy_key,
    passed: true,
    enforcement: policy.enforcement,
    message: 'Cost cap okay',
  };
}

function evaluateQuota(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_config } = policy;
  const { max_usage, unit } = rule_config;

  // STUB: This would check actual quota from quota service
  const currentUsage = context.current_usage || 0;

  if (typeof max_usage === 'number' && typeof currentUsage === 'number' && currentUsage > max_usage) {
    return {
      policy_key: policy.policy_key,
      passed: false,
      enforcement: policy.enforcement,
      message: `Quota exceeded: ${currentUsage} > ${max_usage} ${unit}`,
      details: { current_usage: currentUsage, max_usage, unit },
    };
  }

  return {
    policy_key: policy.policy_key,
    passed: true,
    enforcement: policy.enforcement,
    message: 'Quota okay',
  };
}

function evaluateAuth(
  policy: GuardrailPolicy,
  context: Record<string, unknown>
): GuardrailEvaluation {
  const { rule_config } = policy;
  const { required_roles, required_scopes } = rule_config;

  // Check required roles
  if (required_roles && Array.isArray(required_roles)) {
    const userRoles = context.user_roles || [];
    const hasRole = required_roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return {
        policy_key: policy.policy_key,
        passed: false,
        enforcement: policy.enforcement,
        message: `Missing required role: ${required_roles.join(' or ')}`,
        details: { required_roles, user_roles: userRoles },
      };
    }
  }

  // Check required scopes
  if (required_scopes && Array.isArray(required_scopes)) {
    const userScopes = context.user_scopes || [];
    const hasScope = required_scopes.some((scope) => userScopes.includes(scope));
    if (!hasScope) {
      return {
        policy_key: policy.policy_key,
        passed: false,
        enforcement: policy.enforcement,
        message: `Missing required scope: ${required_scopes.join(' or ')}`,
        details: { required_scopes, user_scopes: userScopes },
      };
    }
  }

  return {
    policy_key: policy.policy_key,
    passed: true,
    enforcement: policy.enforcement,
    message: 'Auth check passed',
  };
}

// ============================================================================
// VIOLATION RECORDING
// ============================================================================

async function recordViolation(policyId: string): Promise<void> {
  await supabaseAdmin
    .from('unite_guardrail_policies')
    .update({
      violation_count: supabaseAdmin.rpc('increment', { row_id: policyId }),
      last_violation_at: new Date().toISOString(),
    })
    .eq('id', policyId);
}
