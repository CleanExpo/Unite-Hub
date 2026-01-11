/**
 * AI Governance Service
 * Phase: D63 - AI Governance, Policy & Audit Center
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

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

// ============================================================================
// POLICIES
// ============================================================================

export interface AIPolicy {
  id: string;
  tenant_id?: string;
  policy_key: string;
  name: string;
  description?: string;
  category: string;
  rules: Record<string, unknown>;
  enforcement_level: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export async function createPolicy(
  tenantId: string | null,
  input: Omit<AIPolicy, 'id' | 'created_at' | 'updated_at'>
): Promise<AIPolicy> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_policies')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create policy: ${error.message}`);
  return data as AIPolicy;
}

export async function listPolicies(
  tenantId: string | null,
  filters?: { category?: string; is_active?: boolean; limit?: number }
): Promise<AIPolicy[]> {
  let query = supabaseAdmin
    .from('unite_ai_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list policies: ${error.message}`);
  return data as AIPolicy[];
}

export async function updatePolicy(
  policyId: string,
  updates: Partial<AIPolicy>
): Promise<AIPolicy> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_policies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', policyId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update policy: ${error.message}`);
  return data as AIPolicy;
}

// ============================================================================
// USAGE LOGS
// ============================================================================

export interface AIUsageLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  model_name: string;
  provider: string;
  operation: string;
  input_tokens?: number;
  output_tokens?: number;
  total_cost?: number;
  latency_ms?: number;
  status: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

export async function logAIUsage(
  tenantId: string | null,
  input: Omit<AIUsageLog, 'id' | 'occurred_at'>
): Promise<AIUsageLog> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_usage_logs')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to log AI usage: ${error.message}`);
  return data as AIUsageLog;
}

export async function getUsageLogs(
  tenantId: string | null,
  filters?: {
    user_id?: string;
    model_name?: string;
    provider?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<AIUsageLog[]> {
  let query = supabaseAdmin
    .from('unite_ai_usage_logs')
    .select('*')
    .order('occurred_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.user_id) query = query.eq('user_id', filters.user_id);
  if (filters?.model_name) query = query.eq('model_name', filters.model_name);
  if (filters?.provider) query = query.eq('provider', filters.provider);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.start_date) query = query.gte('occurred_at', filters.start_date);
  if (filters?.end_date) query = query.lte('occurred_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get usage logs: ${error.message}`);
  return data as AIUsageLog[];
}

// ============================================================================
// VIOLATIONS
// ============================================================================

export interface AIViolation {
  id: string;
  tenant_id?: string;
  policy_id: string;
  usage_log_id?: string;
  violation_type: string;
  severity: string;
  description?: string;
  resolution_status: string;
  resolved_by?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  detected_at: string;
}

export async function createViolation(
  tenantId: string | null,
  input: Omit<AIViolation, 'id' | 'detected_at'>
): Promise<AIViolation> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_violations')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create violation: ${error.message}`);
  return data as AIViolation;
}

export async function listViolations(
  tenantId: string | null,
  filters?: {
    policy_id?: string;
    severity?: string;
    resolution_status?: string;
    limit?: number;
  }
): Promise<AIViolation[]> {
  let query = supabaseAdmin
    .from('unite_ai_violations')
    .select('*')
    .order('detected_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.policy_id) query = query.eq('policy_id', filters.policy_id);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.resolution_status) query = query.eq('resolution_status', filters.resolution_status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list violations: ${error.message}`);
  return data as AIViolation[];
}

export async function resolveViolation(
  violationId: string,
  resolvedBy: string
): Promise<AIViolation> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_violations')
    .update({
      resolution_status: 'resolved',
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', violationId)
    .select()
    .single();
  if (error) throw new Error(`Failed to resolve violation: ${error.message}`);
  return data as AIViolation;
}

// ============================================================================
// AUDITS
// ============================================================================

export interface AIAudit {
  id: string;
  tenant_id?: string;
  audit_type: string;
  scope: string;
  findings?: Record<string, unknown>;
  recommendations?: Record<string, unknown>;
  compliance_score?: number;
  auditor?: string;
  status: string;
  started_at: string;
  completed_at?: string;
}

export async function createAudit(
  tenantId: string | null,
  input: Omit<AIAudit, 'id' | 'started_at'>
): Promise<AIAudit> {
  const { data, error } = await supabaseAdmin
    .from('unite_ai_audits')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create audit: ${error.message}`);
  return data as AIAudit;
}

export async function listAudits(
  tenantId: string | null,
  filters?: { audit_type?: string; status?: string; limit?: number }
): Promise<AIAudit[]> {
  let query = supabaseAdmin
    .from('unite_ai_audits')
    .select('*')
    .order('started_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.audit_type) query = query.eq('audit_type', filters.audit_type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list audits: ${error.message}`);
  return data as AIAudit[];
}

// ============================================================================
// AI REVIEW
// ============================================================================

export async function aiReviewCompliance(
  tenantId: string | null,
  scope: string
): Promise<{
  compliance_score: number;
  findings: Array<{ category: string; issue: string; severity: string }>;
  recommendations: string[];
}> {
  const client = getAnthropicClient();

  // Get recent usage logs and violations
  const usageLogs = await getUsageLogs(tenantId, { limit: 100 });
  const violations = await listViolations(tenantId, { resolution_status: 'open', limit: 50 });
  const policies = await listPolicies(tenantId, { is_active: true });

  // Calculate aggregate metrics (anonymized)
  const totalCost = usageLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0);
  const avgLatency =
    usageLogs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / (usageLogs.length || 1);
  const errorRate = usageLogs.filter((log) => log.status === 'error').length / (usageLogs.length || 1);

  const prompt = `Review AI governance compliance:

**Scope**: ${scope}

**Metrics** (last 100 calls):
- Total Cost: $${totalCost.toFixed(2)}
- Avg Latency: ${avgLatency.toFixed(0)}ms
- Error Rate: ${(errorRate * 100).toFixed(1)}%
- Open Violations: ${violations.length}
- Active Policies: ${policies.length}

**Open Violations**:
${violations.map((v) => `- ${v.violation_type} (${v.severity}): ${v.description}`).join('\n')}

Provide compliance review in JSON:
{
  "compliance_score": 85,
  "findings": [
    {"category": "Cost", "issue": "Description", "severity": "high|medium|low"}
  ],
  "recommendations": ["Action item 1", "Action item 2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No AI response');
  return JSON.parse(textContent.text);
}
