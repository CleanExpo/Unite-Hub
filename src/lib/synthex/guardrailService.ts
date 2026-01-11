/**
 * Synthex Global Guardrails Service
 *
 * Phase: D49 - Global Guardrails & Kill Switch
 * Tables: synthex_guardrail_policies, synthex_guardrail_violations, synthex_kill_switch_states
 *
 * Features:
 * - Policy management and enforcement
 * - Violation tracking and blocking
 * - Emergency kill switch controls
 * - Designed to be called from orchestrator, agents, delivery, automation
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type GuardrailScope = 'global' | 'agent' | 'delivery' | 'automation' | 'campaign';
export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ViolationSourceType = 'agent' | 'delivery' | 'automation' | 'campaign' | 'workflow';

export interface GuardrailPolicy {
  id: string;
  tenant_id: string;
  scope: GuardrailScope;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  config: Record<string, unknown>;
  severity: GuardrailSeverity;
  created_at: string;
  updated_at: string;
}

export interface GuardrailViolation {
  id: string;
  tenant_id: string;
  policy_id?: string;
  source_type: ViolationSourceType;
  source_ref?: string;
  severity: GuardrailSeverity;
  message: string;
  context: Record<string, unknown>;
  blocked: boolean;
  created_at: string;
}

export interface KillSwitchState {
  id: string;
  tenant_id: string;
  scope: GuardrailScope;
  target: string;
  enabled: boolean;
  reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyInput {
  scope: GuardrailScope;
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  severity?: GuardrailSeverity;
}

export interface CreateViolationInput {
  policy_id?: string;
  source_type: ViolationSourceType;
  source_ref?: string;
  severity: GuardrailSeverity;
  message: string;
  context?: Record<string, unknown>;
  blocked?: boolean;
}

export interface SetKillSwitchInput {
  scope: GuardrailScope;
  target: string;
  enabled: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckGuardrailInput {
  scope: GuardrailScope;
  key: string;
  value: unknown;
  source_type: ViolationSourceType;
  source_ref?: string;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Guardrail Policies
// =============================================================================

/**
 * Create a guardrail policy
 */
export async function createPolicy(
  tenantId: string,
  input: CreatePolicyInput
): Promise<GuardrailPolicy> {
  const { data, error } = await supabaseAdmin
    .from('synthex_guardrail_policies')
    .insert({
      tenant_id: tenantId,
      scope: input.scope,
      key: input.key,
      name: input.name,
      description: input.description,
      enabled: input.enabled ?? true,
      config: input.config ?? {},
      severity: input.severity ?? 'medium',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create policy: ${error.message}`);
  return data as GuardrailPolicy;
}

/**
 * Get policy by ID
 */
export async function getPolicy(policyId: string): Promise<GuardrailPolicy | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_guardrail_policies')
    .select('*')
    .eq('id', policyId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get policy: ${error.message}`);
  return data as GuardrailPolicy | null;
}

/**
 * List policies
 */
export async function listPolicies(
  tenantId: string,
  filters?: {
    scope?: GuardrailScope;
    enabled?: boolean;
  }
): Promise<GuardrailPolicy[]> {
  let query = supabaseAdmin
    .from('synthex_guardrail_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list policies: ${error.message}`);
  return data as GuardrailPolicy[];
}

/**
 * Update policy
 */
export async function updatePolicy(
  policyId: string,
  updates: Partial<Omit<GuardrailPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<GuardrailPolicy> {
  const { data, error } = await supabaseAdmin
    .from('synthex_guardrail_policies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', policyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update policy: ${error.message}`);
  return data as GuardrailPolicy;
}

/**
 * Delete policy
 */
export async function deletePolicy(policyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_guardrail_policies')
    .delete()
    .eq('id', policyId);

  if (error) throw new Error(`Failed to delete policy: ${error.message}`);
}

// =============================================================================
// Guardrail Violations
// =============================================================================

/**
 * Create a violation
 */
export async function createViolation(
  tenantId: string,
  input: CreateViolationInput
): Promise<GuardrailViolation> {
  const { data, error } = await supabaseAdmin
    .from('synthex_guardrail_violations')
    .insert({
      tenant_id: tenantId,
      policy_id: input.policy_id,
      source_type: input.source_type,
      source_ref: input.source_ref,
      severity: input.severity,
      message: input.message,
      context: input.context ?? {},
      blocked: input.blocked ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create violation: ${error.message}`);
  return data as GuardrailViolation;
}

/**
 * List violations
 */
export async function listViolations(
  tenantId: string,
  filters?: {
    policyId?: string;
    severity?: GuardrailSeverity;
    blocked?: boolean;
    limit?: number;
  }
): Promise<GuardrailViolation[]> {
  let query = supabaseAdmin
    .from('synthex_guardrail_violations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.policyId) {
    query = query.eq('policy_id', filters.policyId);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.blocked !== undefined) {
    query = query.eq('blocked', filters.blocked);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list violations: ${error.message}`);
  return data as GuardrailViolation[];
}

/**
 * Get violation summary
 */
export async function getViolationSummary(
  tenantId: string,
  days = 7
): Promise<{
  total_violations: number;
  blocked_violations: number;
  critical_violations: number;
  high_violations: number;
  recent_violations_count: number;
}> {
  const { data, error } = await supabaseAdmin.rpc('synthex_get_violation_summary', {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get violation summary: ${error.message}`);
  return data[0];
}

// =============================================================================
// Kill Switch
// =============================================================================

/**
 * Set kill switch state
 */
export async function setKillSwitch(
  tenantId: string,
  input: SetKillSwitchInput
): Promise<KillSwitchState> {
  // Check if kill switch already exists for this scope/target
  const { data: existing } = await supabaseAdmin
    .from('synthex_kill_switch_states')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scope', input.scope)
    .eq('target', input.target)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('synthex_kill_switch_states')
      .update({
        enabled: input.enabled,
        reason: input.reason,
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update kill switch: ${error.message}`);
    return data as KillSwitchState;
  } else {
    // Create new
    const { data, error } = await supabaseAdmin
      .from('synthex_kill_switch_states')
      .insert({
        tenant_id: tenantId,
        scope: input.scope,
        target: input.target,
        enabled: input.enabled,
        reason: input.reason,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create kill switch: ${error.message}`);
    return data as KillSwitchState;
  }
}

/**
 * Check if kill switch is enabled
 */
export async function checkKillSwitch(
  tenantId: string,
  scope: GuardrailScope,
  target = 'all'
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('synthex_check_kill_switch', {
    p_tenant_id: tenantId,
    p_scope: scope,
    p_target: target,
  });

  if (error) throw new Error(`Failed to check kill switch: ${error.message}`);
  return data as boolean;
}

/**
 * List kill switch states
 */
export async function listKillSwitches(
  tenantId: string,
  filters?: {
    scope?: GuardrailScope;
    enabled?: boolean;
  }
): Promise<KillSwitchState[]> {
  let query = supabaseAdmin
    .from('synthex_kill_switch_states')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list kill switches: ${error.message}`);
  return data as KillSwitchState[];
}

// =============================================================================
// Guardrail Checking (Helper for Other Modules)
// =============================================================================

/**
 * Check a value against a guardrail policy
 * This is the main entry point for other modules to validate actions
 */
export async function checkGuardrail(
  tenantId: string,
  input: CheckGuardrailInput
): Promise<{
  allowed: boolean;
  violation?: GuardrailViolation;
  reason?: string;
}> {
  // First check kill switch
  const killSwitchEnabled = await checkKillSwitch(tenantId, input.scope);
  if (killSwitchEnabled) {
    const violation = await createViolation(tenantId, {
      source_type: input.source_type,
      source_ref: input.source_ref,
      severity: 'critical',
      message: `Kill switch enabled for scope: ${input.scope}`,
      context: { value: input.value },
      blocked: true,
    });

    return {
      allowed: false,
      violation,
      reason: 'Kill switch is enabled',
    };
  }

  // Get the policy
  const policies = await listPolicies(tenantId, {
    scope: input.scope,
    enabled: true,
  });

  const policy = policies.find((p) => p.key === input.key);

  if (!policy) {
    // No policy defined, allow by default
    return { allowed: true };
  }

  // Evaluate the policy
  const evaluation = evaluatePolicy(policy, input.value);

  if (!evaluation.passed) {
    // Create violation
    const violation = await createViolation(tenantId, {
      policy_id: policy.id,
      source_type: input.source_type,
      source_ref: input.source_ref,
      severity: policy.severity,
      message: evaluation.message || `Policy violation: ${policy.name}`,
      context: {
        value: input.value,
        threshold: policy.config.threshold,
        ...evaluation.context,
      },
      blocked: policy.config.action === 'block',
    });

    return {
      allowed: policy.config.action !== 'block',
      violation,
      reason: evaluation.message,
    };
  }

  return { allowed: true };
}

/**
 * Evaluate a policy against a value
 */
function evaluatePolicy(
  policy: GuardrailPolicy,
  value: unknown
): {
  passed: boolean;
  message?: string;
  context?: Record<string, unknown>;
} {
  const config = policy.config;

  // Numeric threshold check
  if (typeof config.threshold === 'number' && typeof value === 'number') {
    const operator = config.operator || 'lte'; // Default: less than or equal

    let passed = false;
    if (operator === 'lte') passed = value <= config.threshold;
    else if (operator === 'gte') passed = value >= config.threshold;
    else if (operator === 'lt') passed = value < config.threshold;
    else if (operator === 'gt') passed = value > config.threshold;
    else if (operator === 'eq') passed = value === config.threshold;

    if (!passed) {
      return {
        passed: false,
        message: `Value ${value} violates threshold ${config.threshold} (${operator})`,
        context: { operator, actual: value, threshold: config.threshold },
      };
    }
  }

  // Pattern matching (for strings)
  if (typeof config.pattern === 'string' && typeof value === 'string') {
    const regex = new RegExp(config.pattern);
    const passed = regex.test(value);

    if (!passed) {
      return {
        passed: false,
        message: `Value does not match pattern: ${config.pattern}`,
        context: { pattern: config.pattern, value },
      };
    }
  }

  // Allowed values list
  if (Array.isArray(config.allowed_values)) {
    const passed = config.allowed_values.includes(value);

    if (!passed) {
      return {
        passed: false,
        message: `Value not in allowed list`,
        context: { allowed: config.allowed_values, value },
      };
    }
  }

  return { passed: true };
}

/**
 * AI-powered guardrail recommendation
 * Suggests guardrails based on recent violations and system behavior
 */
export async function aiRecommendGuardrails(
  tenantId: string,
  recentViolations: GuardrailViolation[]
): Promise<{
  recommended_policies: Array<{
    scope: GuardrailScope;
    key: string;
    name: string;
    description: string;
    severity: GuardrailSeverity;
    config: Record<string, unknown>;
    reasoning: string;
  }>;
}> {
  const client = getAnthropicClient();

  const prompt = `You are a system safety advisor analyzing guardrail violations. Based on the violation patterns, recommend new guardrail policies.

Recent Violations:
${JSON.stringify(recentViolations.slice(0, 20), null, 2)}

Provide recommendations in JSON format:
{
  "recommended_policies": [
    {
      "scope": "agent|delivery|automation|campaign|global",
      "key": "unique_key",
      "name": "Policy Name",
      "description": "What this policy prevents",
      "severity": "low|medium|high|critical",
      "config": {
        "threshold": 100,
        "operator": "lte|gte|lt|gt|eq",
        "action": "block|warn|log",
        "time_window": "24h"
      },
      "reasoning": "Why this policy is needed"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return { recommended_policies: [] };
  }
}
