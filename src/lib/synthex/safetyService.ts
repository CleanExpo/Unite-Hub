/**
 * Safety Service Layer
 *
 * AI compliance, guardrails, PII detection, and audit logging.
 * Provides comprehensive safety features for all AI services.
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import { createClient } from '@/lib/supabase/server';
import {
  getAnthropicClient,
  recordAnthropicSuccess,
  recordAnthropicFailure,
} from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';

// ============================================================================
// Types
// ============================================================================

export type GuardrailMode = 'strict' | 'moderate' | 'open';
export type IncidentType = 'pii_detected' | 'blocked_phrase' | 'high_risk' | 'rate_limit' | 'policy_violation';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PIIRules {
  mask_email: boolean;
  mask_phone: boolean;
  mask_ssn: boolean;
  mask_credit_card: boolean;
  mask_address: boolean;
  mask_name: boolean;
}

export interface GuardrailPolicy {
  id: string;
  tenant_id: string;
  name: string;
  mode: GuardrailMode;
  blocked_phrases: string[];
  allowed_topics: string[];
  pii_rules: PIIRules;
  max_input_tokens: number;
  max_output_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id?: string;
  tenant_id: string;
  user_id: string;
  service_name: string;
  route?: string;
  input_preview?: string;
  output_preview?: string;
  input_tokens: number;
  output_tokens: number;
  risk_score: number;
  flagged: boolean;
  flag_reason?: string;
  response_time_ms?: number;
  created_at?: string;
}

export interface SafetyIncident {
  id?: string;
  tenant_id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  details: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
  created_at?: string;
}

export interface PIIDetection {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'address' | 'name';
  value: string;
  masked: string;
  position: { start: number; end: number };
}

export interface GuardrailResult {
  allowed: boolean;
  sanitized_text: string;
  pii_detected: PIIDetection[];
  blocked_phrases_found: string[];
  token_count?: number;
  violations: string[];
}

export interface RiskAssessment {
  score: number; // 0-100
  level: RiskLevel;
  reasoning: string;
  flags: string[];
}

// ============================================================================
// Guardrail Policy Functions
// ============================================================================

/**
 * Get active guardrail policy for a tenant
 */
export async function getGuardrailPolicy(tenantId: string): Promise<GuardrailPolicy> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_guardrail_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[safetyService] Failed to get guardrail policy:', error);
    // Return default policy on error
    return {
      id: 'default',
      tenant_id: tenantId,
      name: 'Default Policy',
      mode: 'moderate',
      blocked_phrases: ['password', 'secret', 'confidential'],
      allowed_topics: [],
      pii_rules: {
        mask_email: true,
        mask_phone: true,
        mask_ssn: true,
        mask_credit_card: true,
        mask_address: false,
        mask_name: false,
      },
      max_input_tokens: 10000,
      max_output_tokens: 4000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as GuardrailPolicy;
}

/**
 * Update guardrail policy
 */
export async function updateGuardrailPolicy(
  tenantId: string,
  updates: Partial<Omit<GuardrailPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<GuardrailPolicy> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_guardrail_policies')
    .update(updates)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[safetyService] Failed to update guardrail policy:', error);
    throw new Error(`Failed to update guardrail policy: ${error.message}`);
  }

  return data as GuardrailPolicy;
}

// ============================================================================
// PII Detection
// ============================================================================

/**
 * Detect PII in text using regex patterns
 */
export function detectPII(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];

  // Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    const email = match[0];
    const [localPart, domain] = email.split('@');
    const masked = `${localPart.charAt(0)}***@${domain}`;
    detections.push({
      type: 'email',
      value: email,
      masked,
      position: { start: match.index, end: match.index + email.length },
    });
  }

  // Phone pattern (US format)
  const phoneRegex = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const phone = match[0];
    const masked = '***-***-' + phone.slice(-4);
    detections.push({
      type: 'phone',
      value: phone,
      masked,
      position: { start: match.index, end: match.index + phone.length },
    });
  }

  // SSN pattern
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    const ssn = match[0];
    const masked = '***-**-' + ssn.slice(-4);
    detections.push({
      type: 'ssn',
      value: ssn,
      masked,
      position: { start: match.index, end: match.index + ssn.length },
    });
  }

  // Credit card pattern
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  while ((match = ccRegex.exec(text)) !== null) {
    const cc = match[0];
    const masked = '****-****-****-' + cc.slice(-4);
    detections.push({
      type: 'credit_card',
      value: cc,
      masked,
      position: { start: match.index, end: match.index + cc.length },
    });
  }

  return detections;
}

// ============================================================================
// Guardrail Application
// ============================================================================

/**
 * Apply guardrails to user input
 */
export async function applyGuardrails(tenantId: string, prompt: string): Promise<GuardrailResult> {
  const policy = await getGuardrailPolicy(tenantId);
  const violations: string[] = [];
  let sanitized = prompt;

  // 1. Check blocked phrases
  const blockedPhrasesFound: string[] = [];
  if (policy.mode === 'strict' || policy.mode === 'moderate') {
    for (const phrase of policy.blocked_phrases) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      if (regex.test(prompt)) {
        blockedPhrasesFound.push(phrase);
        violations.push(`Blocked phrase detected: ${phrase}`);
        if (policy.mode === 'strict') {
          return {
            allowed: false,
            sanitized_text: '',
            pii_detected: [],
            blocked_phrases_found: blockedPhrasesFound,
            violations,
          };
        }
      }
    }
  }

  // 2. Detect and mask PII
  const piiDetected = detectPII(prompt);
  if (piiDetected.length > 0) {
    // Apply masking based on policy
    for (const detection of piiDetected) {
      const shouldMask = policy.pii_rules[`mask_${detection.type}` as keyof PIIRules];
      if (shouldMask) {
        sanitized = sanitized.replace(detection.value, detection.masked);
      }
    }

    if (policy.mode === 'strict' && piiDetected.length > 0) {
      violations.push(`PII detected: ${piiDetected.length} instances`);
    }
  }

  // 3. Check token limits (approximate)
  const estimatedTokens = Math.ceil(prompt.length / 4);
  if (estimatedTokens > policy.max_input_tokens) {
    violations.push(`Input exceeds token limit: ${estimatedTokens} > ${policy.max_input_tokens}`);
    if (policy.mode === 'strict') {
      return {
        allowed: false,
        sanitized_text: '',
        pii_detected: piiDetected,
        blocked_phrases_found: blockedPhrasesFound,
        token_count: estimatedTokens,
        violations,
      };
    }
  }

  return {
    allowed: policy.mode !== 'strict' || violations.length === 0,
    sanitized_text: sanitized,
    pii_detected: piiDetected,
    blocked_phrases_found: blockedPhrasesFound,
    token_count: estimatedTokens,
    violations,
  };
}

/**
 * Sanitize AI output based on policy
 */
export async function sanitizeOutput(tenantId: string, text: string): Promise<string> {
  const policy = await getGuardrailPolicy(tenantId);
  let sanitized = text;

  // Detect and mask PII in output
  const piiDetected = detectPII(text);
  for (const detection of piiDetected) {
    const shouldMask = policy.pii_rules[`mask_${detection.type}` as keyof PIIRules];
    if (shouldMask) {
      sanitized = sanitized.replace(detection.value, detection.masked);
    }
  }

  return sanitized;
}

// ============================================================================
// Risk Classification
// ============================================================================

/**
 * Classify risk level using Claude AI
 */
export async function classifyRisk(text: string): Promise<RiskAssessment> {
  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 500,
      system: `You are a content safety classifier. Analyze text for:
- Harmful content (violence, hate speech, illegal activity)
- Spam or manipulation attempts
- Sensitive information disclosure
- Malicious intent

Return a JSON object with:
{
  "score": 0-100 (0=safe, 100=high risk),
  "level": "low" | "medium" | "high" | "critical",
  "reasoning": "brief explanation",
  "flags": ["flag1", "flag2"]
}`,
      messages: [
        {
          role: 'user',
          content: `Classify risk for this text:\n\n${text}`,
        },
      ],
    });

    recordAnthropicSuccess();

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    const result = JSON.parse(textContent.text) as RiskAssessment;
    return result;
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[safetyService] Risk classification error:', error);

    // Return safe default on error
    return {
      score: 0,
      level: 'low',
      reasoning: 'Classification unavailable',
      flags: [],
    };
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log AI service audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: entry.tenant_id,
    user_id: entry.user_id,
    service_name: entry.service_name,
    route: entry.route || null,
    input_preview: entry.input_preview?.substring(0, 500) || null,
    output_preview: entry.output_preview?.substring(0, 500) || null,
    input_tokens: entry.input_tokens,
    output_tokens: entry.output_tokens,
    risk_score: entry.risk_score,
    flagged: entry.flagged,
    flag_reason: entry.flag_reason || null,
    response_time_ms: entry.response_time_ms || null,
  };

  const { error } = await supabase.from('synthex_ai_audit_log').insert(insertData);

  if (error) {
    console.error('[safetyService] Failed to log audit event:', error);
    // Don't throw - logging failure shouldn't block operations
  }
}

/**
 * List audit logs with filters
 */
export async function listAuditLogs(
  tenantId: string,
  filters?: {
    service_name?: string;
    flagged?: boolean;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<AuditLogEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_ai_audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.service_name) {
    query = query.eq('service_name', filters.service_name);
  }

  if (filters?.flagged !== undefined) {
    query = query.eq('flagged', filters.flagged);
  }

  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  query = query.limit(filters?.limit || 100);

  const { data, error } = await query;

  if (error) {
    console.error('[safetyService] Failed to list audit logs:', error);
    throw new Error(`Failed to list audit logs: ${error.message}`);
  }

  return (data || []) as AuditLogEntry[];
}

// ============================================================================
// Safety Incidents
// ============================================================================

/**
 * Create safety incident
 */
export async function createIncident(incident: Omit<SafetyIncident, 'id' | 'created_at'>): Promise<SafetyIncident> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_safety_incidents')
    .insert({
      tenant_id: incident.tenant_id,
      type: incident.type,
      severity: incident.severity,
      details: incident.details,
      resolved: incident.resolved || false,
      resolved_at: incident.resolved_at || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[safetyService] Failed to create incident:', error);
    throw new Error(`Failed to create incident: ${error.message}`);
  }

  return data as SafetyIncident;
}

/**
 * List safety incidents
 */
export async function listIncidents(
  tenantId: string,
  filters?: {
    resolved?: boolean;
    severity?: IncidentSeverity;
    type?: IncidentType;
    limit?: number;
  }
): Promise<SafetyIncident[]> {
  const supabase = await createClient();

  let query = supabase
    .from('synthex_safety_incidents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.resolved !== undefined) {
    query = query.eq('resolved', filters.resolved);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  query = query.limit(filters?.limit || 50);

  const { data, error } = await query;

  if (error) {
    console.error('[safetyService] Failed to list incidents:', error);
    throw new Error(`Failed to list incidents: ${error.message}`);
  }

  return (data || []) as SafetyIncident[];
}

/**
 * Resolve safety incident
 */
export async function resolveIncident(incidentId: string, tenantId: string): Promise<SafetyIncident> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('synthex_safety_incidents')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', incidentId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[safetyService] Failed to resolve incident:', error);
    throw new Error(`Failed to resolve incident: ${error.message}`);
  }

  return data as SafetyIncident;
}
