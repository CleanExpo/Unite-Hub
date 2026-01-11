/**
 * Risk, Compliance & Guardrail Center Service
 *
 * Phase: D56 - Risk, Compliance & Guardrail Center
 * Tables: unite_risk_events, unite_policies, unite_policy_violations
 *
 * Features:
 * - Risk event tracking and management
 * - Policy definition and enforcement
 * - Compliance violation detection
 * - AI-powered risk assessment
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'compliance' | 'security' | 'performance' | 'quality' | 'data' | 'operational';
export type PolicyStatus = 'active' | 'draft' | 'archived';

export interface RiskEvent {
  id: string;
  tenant_id?: string;
  source: string;
  category: RiskCategory;
  severity: RiskSeverity;
  code?: string;
  message?: string;
  context?: Record<string, unknown>;
  ai_assessment?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Policy {
  id: string;
  tenant_id?: string;
  slug: string;
  name: string;
  description?: string;
  scope: string;
  status: PolicyStatus;
  rules: Record<string, unknown>;
  ai_profile?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PolicyViolation {
  id: string;
  tenant_id?: string;
  policy_id: string;
  source: string;
  reference_id?: string;
  severity: RiskSeverity;
  details?: Record<string, unknown>;
  ai_summary?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CreateRiskEventInput {
  source: string;
  category: RiskCategory;
  severity: RiskSeverity;
  code?: string;
  message?: string;
  context?: Record<string, unknown>;
}

export interface CreatePolicyInput {
  slug: string;
  name: string;
  description?: string;
  scope: string;
  rules: Record<string, unknown>;
}

export interface CreateViolationInput {
  policy_id: string;
  source: string;
  reference_id?: string;
  severity: RiskSeverity;
  details?: Record<string, unknown>;
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
// Risk Events
// =============================================================================

/**
 * Create a risk event
 */
export async function createRiskEvent(
  tenantId: string | null,
  input: CreateRiskEventInput
): Promise<RiskEvent> {
  const { data, error } = await supabaseAdmin
    .from('unite_risk_events')
    .insert({
      tenant_id: tenantId,
      source: input.source,
      category: input.category,
      severity: input.severity,
      code: input.code,
      message: input.message,
      context: input.context || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create risk event: ${error.message}`);
  return data as RiskEvent;
}

/**
 * Get risk event by ID
 */
export async function getRiskEvent(
  tenantId: string | null,
  eventId: string
): Promise<RiskEvent | null> {
  let query = supabaseAdmin
    .from('unite_risk_events')
    .select('*')
    .eq('id', eventId);

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to get risk event: ${error.message}`);
  return data as RiskEvent | null;
}

/**
 * List risk events
 */
export async function listRiskEvents(
  tenantId: string | null,
  filters?: {
    severity?: RiskSeverity;
    category?: RiskCategory;
    resolved?: boolean;
    limit?: number;
  }
): Promise<RiskEvent[]> {
  let query = supabaseAdmin
    .from('unite_risk_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.resolved !== undefined) {
    if (filters.resolved) {
      query = query.not('resolved_at', 'is', null);
    } else {
      query = query.is('resolved_at', null);
    }
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list risk events: ${error.message}`);
  return data as RiskEvent[];
}

/**
 * Resolve risk event
 */
export async function resolveRiskEvent(
  tenantId: string | null,
  eventId: string,
  resolvedBy: string
): Promise<RiskEvent> {
  const { data, error } = await supabaseAdmin
    .from('unite_risk_events')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to resolve risk event: ${error.message}`);
  return data as RiskEvent;
}

// =============================================================================
// Policies
// =============================================================================

/**
 * Create a policy
 */
export async function createPolicy(
  tenantId: string | null,
  input: CreatePolicyInput
): Promise<Policy> {
  const { data, error } = await supabaseAdmin
    .from('unite_policies')
    .insert({
      tenant_id: tenantId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      scope: input.scope,
      status: 'draft',
      rules: input.rules,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create policy: ${error.message}`);
  return data as Policy;
}

/**
 * Get policy by ID
 */
export async function getPolicy(
  tenantId: string | null,
  policyId: string
): Promise<Policy | null> {
  let query = supabaseAdmin
    .from('unite_policies')
    .select('*')
    .eq('id', policyId);

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to get policy: ${error.message}`);
  return data as Policy | null;
}

/**
 * List policies
 */
export async function listPolicies(
  tenantId: string | null,
  filters?: {
    scope?: string;
    status?: PolicyStatus;
    limit?: number;
  }
): Promise<Policy[]> {
  let query = supabaseAdmin
    .from('unite_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list policies: ${error.message}`);
  return data as Policy[];
}

/**
 * Update policy
 */
export async function updatePolicy(
  tenantId: string | null,
  policyId: string,
  updates: Partial<Policy>
): Promise<Policy> {
  const { data, error } = await supabaseAdmin
    .from('unite_policies')
    .update(updates)
    .eq('id', policyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update policy: ${error.message}`);
  return data as Policy;
}

/**
 * Delete policy
 */
export async function deletePolicy(
  tenantId: string | null,
  policyId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_policies')
    .delete()
    .eq('id', policyId);

  if (error) throw new Error(`Failed to delete policy: ${error.message}`);
}

// =============================================================================
// Policy Violations
// =============================================================================

/**
 * Create a policy violation
 */
export async function createViolation(
  tenantId: string | null,
  input: CreateViolationInput
): Promise<PolicyViolation> {
  const { data, error } = await supabaseAdmin
    .from('unite_policy_violations')
    .insert({
      tenant_id: tenantId,
      policy_id: input.policy_id,
      source: input.source,
      reference_id: input.reference_id,
      severity: input.severity,
      details: input.details || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create violation: ${error.message}`);
  return data as PolicyViolation;
}

/**
 * List violations
 */
export async function listViolations(
  tenantId: string | null,
  filters?: {
    policyId?: string;
    resolved?: boolean;
    limit?: number;
  }
): Promise<PolicyViolation[]> {
  let query = supabaseAdmin
    .from('unite_policy_violations')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) {
    query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  }

  if (filters?.policyId) {
    query = query.eq('policy_id', filters.policyId);
  }

  if (filters?.resolved !== undefined) {
    if (filters.resolved) {
      query = query.not('resolved_at', 'is', null);
    } else {
      query = query.is('resolved_at', null);
    }
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list violations: ${error.message}`);
  return data as PolicyViolation[];
}

/**
 * Resolve violation
 */
export async function resolveViolation(
  tenantId: string | null,
  violationId: string,
  resolvedBy: string
): Promise<PolicyViolation> {
  const { data, error } = await supabaseAdmin
    .from('unite_policy_violations')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', violationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to resolve violation: ${error.message}`);
  return data as PolicyViolation;
}

// =============================================================================
// AI-Powered Features
// =============================================================================

/**
 * AI-assess risk event
 */
export async function aiAssessRiskEvent(
  event: RiskEvent
): Promise<{
  impact_score: number;
  recommended_action: string;
  analysis: string;
  related_patterns: string[];
}> {
  const client = getAnthropicClient();

  // Sanitize context to remove PII
  const sanitizedContext = JSON.stringify(event.context || {})
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

  const prompt = `Assess this risk event:

**Source**: ${event.source}
**Category**: ${event.category}
**Severity**: ${event.severity}
**Message**: ${event.message || 'None'}
**Context**: ${sanitizedContext}

Provide risk assessment in JSON format:
{
  "impact_score": 75,
  "recommended_action": "Immediate action required: ...",
  "analysis": "This event indicates...",
  "related_patterns": ["Pattern 1", "Pattern 2"]
}

Focus on:
- Business impact
- Urgency of response
- Root cause indicators
- Preventive measures`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      impact_score: 50,
      recommended_action: 'Review event manually',
      analysis: 'Unable to assess risk automatically',
      related_patterns: [],
    };
  }
}

/**
 * Get risk summary via DB function
 */
export async function getRiskSummary(
  tenantId: string,
  days: number = 30
): Promise<{
  total_events: number;
  unresolved_events: number;
  critical_events: number;
  events_by_severity: Record<string, number>;
  events_by_category: Record<string, number>;
  total_violations: number;
  unresolved_violations: number;
  violations_by_policy: Record<string, number>;
}> {
  const { data, error } = await supabaseAdmin.rpc('unite_get_risk_summary', {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get risk summary: ${error.message}`);

  if (!data || data.length === 0) {
    return {
      total_events: 0,
      unresolved_events: 0,
      critical_events: 0,
      events_by_severity: {},
      events_by_category: {},
      total_violations: 0,
      unresolved_violations: 0,
      violations_by_policy: {},
    };
  }

  return data[0];
}
