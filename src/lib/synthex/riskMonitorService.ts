/**
 * Synthex Risk Monitor Service
 *
 * Phase: D47 - Risk & Incident Center
 * Tables: synthex_risk_events, synthex_incidents, synthex_incident_actions
 *
 * Features:
 * - Track risk events from agents and delivery systems
 * - Create and manage incidents
 * - Define remediation actions with ownership
 * - AI-powered root cause analysis
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'agent_failure' | 'delivery_error' | 'rate_limit' | 'data_quality' | 'security' | 'compliance' | 'performance' | 'other';
export type IncidentStatus = 'open' | 'investigating' | 'mitigating' | 'resolved' | 'closed';
export type ActionStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface RiskEvent {
  id: string;
  tenant_id: string;
  business_id?: string;
  source_type: string;
  source_ref?: string;
  severity: RiskSeverity;
  category: RiskCategory;
  message: string;
  context: Record<string, unknown>;
  detected_by?: string;
  created_at: string;
  acknowledged_at?: string;
}

export interface Incident {
  id: string;
  tenant_id: string;
  business_id?: string;
  title: string;
  status: IncidentStatus;
  severity: RiskSeverity;
  root_cause?: string;
  impact_summary?: string;
  ai_analysis: Record<string, unknown>;
  opened_at: string;
  closed_at?: string;
}

export interface IncidentAction {
  id: string;
  tenant_id: string;
  incident_id: string;
  action_type: string;
  description: string;
  owner_user_id?: string;
  status: ActionStatus;
  due_at?: string;
  completed_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateRiskEventInput {
  source_type: string;
  source_ref?: string;
  severity: RiskSeverity;
  category: RiskCategory;
  message: string;
  context?: Record<string, unknown>;
  detected_by?: string;
  business_id?: string;
}

export interface CreateIncidentInput {
  title: string;
  severity: RiskSeverity;
  impact_summary?: string;
  business_id?: string;
}

export interface CreateActionInput {
  incident_id: string;
  action_type: string;
  description: string;
  owner_user_id?: string;
  due_at?: string;
  metadata?: Record<string, unknown>;
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
  tenantId: string,
  input: CreateRiskEventInput
): Promise<RiskEvent> {
  const { data, error } = await supabaseAdmin
    .from('synthex_risk_events')
    .insert({
      tenant_id: tenantId,
      source_type: input.source_type,
      source_ref: input.source_ref,
      severity: input.severity,
      category: input.category,
      message: input.message,
      context: input.context ?? {},
      detected_by: input.detected_by,
      business_id: input.business_id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create risk event: ${error.message}`);
  return data as RiskEvent;
}

/**
 * List risk events
 */
export async function listRiskEvents(
  tenantId: string,
  filters?: {
    businessId?: string;
    severity?: RiskSeverity;
    category?: RiskCategory;
    acknowledged?: boolean;
    limit?: number;
  }
): Promise<RiskEvent[]> {
  let query = supabaseAdmin
    .from('synthex_risk_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.acknowledged !== undefined) {
    if (filters.acknowledged) {
      query = query.not('acknowledged_at', 'is', null);
    } else {
      query = query.is('acknowledged_at', null);
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
 * Acknowledge a risk event
 */
export async function acknowledgeRiskEvent(eventId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_risk_events')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) throw new Error(`Failed to acknowledge risk event: ${error.message}`);
}

// =============================================================================
// Incidents
// =============================================================================

/**
 * Create an incident
 */
export async function createIncident(
  tenantId: string,
  input: CreateIncidentInput
): Promise<Incident> {
  const { data, error } = await supabaseAdmin
    .from('synthex_incidents')
    .insert({
      tenant_id: tenantId,
      title: input.title,
      severity: input.severity,
      impact_summary: input.impact_summary,
      business_id: input.business_id,
      ai_analysis: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create incident: ${error.message}`);
  return data as Incident;
}

/**
 * Get incident by ID
 */
export async function getIncident(incidentId: string): Promise<Incident | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_incidents')
    .select('*')
    .eq('id', incidentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get incident: ${error.message}`);
  return data as Incident | null;
}

/**
 * List incidents
 */
export async function listIncidents(
  tenantId: string,
  filters?: {
    businessId?: string;
    status?: IncidentStatus;
    severity?: RiskSeverity;
    limit?: number;
  }
): Promise<Incident[]> {
  let query = supabaseAdmin
    .from('synthex_incidents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('opened_at', { ascending: false });

  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list incidents: ${error.message}`);
  return data as Incident[];
}

/**
 * Update incident status
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: IncidentStatus
): Promise<Incident> {
  const updates: { status: IncidentStatus; closed_at?: string } = { status };

  if (status === 'closed') {
    updates.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_incidents')
    .update(updates)
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update incident status: ${error.message}`);
  return data as Incident;
}

/**
 * Update incident with AI analysis
 */
export async function updateIncidentAnalysis(
  incidentId: string,
  rootCause: string,
  aiAnalysis: Record<string, unknown>
): Promise<Incident> {
  const { data, error } = await supabaseAdmin
    .from('synthex_incidents')
    .update({
      root_cause: rootCause,
      ai_analysis: aiAnalysis,
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update incident analysis: ${error.message}`);
  return data as Incident;
}

// =============================================================================
// Incident Actions
// =============================================================================

/**
 * Create an action for an incident
 */
export async function createAction(
  tenantId: string,
  input: CreateActionInput
): Promise<IncidentAction> {
  const { data, error } = await supabaseAdmin
    .from('synthex_incident_actions')
    .insert({
      tenant_id: tenantId,
      incident_id: input.incident_id,
      action_type: input.action_type,
      description: input.description,
      owner_user_id: input.owner_user_id,
      due_at: input.due_at,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create action: ${error.message}`);
  return data as IncidentAction;
}

/**
 * List actions for an incident
 */
export async function listActions(
  tenantId: string,
  incidentId: string
): Promise<IncidentAction[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_incident_actions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list actions: ${error.message}`);
  return data as IncidentAction[];
}

/**
 * Update action status
 */
export async function updateActionStatus(
  actionId: string,
  status: ActionStatus
): Promise<IncidentAction> {
  const updates: { status: ActionStatus; completed_at?: string } = { status };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_incident_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update action status: ${error.message}`);
  return data as IncidentAction;
}

// =============================================================================
// AI-Powered Analysis
// =============================================================================

/**
 * Generate AI root cause analysis for an incident
 */
export async function aiAnalyzeIncident(
  incident: Incident,
  relatedEvents: RiskEvent[]
): Promise<{
  root_cause: string;
  recommended_actions: Array<{ action_type: string; description: string; priority: string }>;
  risk_mitigation: string;
}> {
  const client = getAnthropicClient();

  const prompt = `You are an incident response analyst. Analyze this incident and provide root cause analysis with actionable recommendations.

Incident:
- Title: ${incident.title}
- Severity: ${incident.severity}
- Impact: ${incident.impact_summary || 'N/A'}
- Opened: ${new Date(incident.opened_at).toISOString()}

Related Risk Events (${relatedEvents.length}):
${relatedEvents.map((e) => `- [${e.severity}] ${e.category}: ${e.message}`).join('\n')}

Provide:
1. Root cause analysis
2. Recommended actions (with priority: critical/high/medium/low)
3. Risk mitigation strategy

Respond in JSON format:
{
  "root_cause": "string",
  "recommended_actions": [{"action_type": "fix|monitor|rollback|investigate|escalate", "description": "string", "priority": "critical|high|medium|low"}],
  "risk_mitigation": "string"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
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
      root_cause: textContent.text,
      recommended_actions: [],
      risk_mitigation: 'Unable to parse structured response',
    };
  }
}

/**
 * Get incident summary statistics
 */
export async function getIncidentSummary(
  tenantId: string,
  days = 7
): Promise<{
  total_incidents: number;
  critical_incidents: number;
  open_incidents: number;
  avg_resolution_time_hours: number;
}> {
  const { data, error } = await supabaseAdmin.rpc('synthex_get_incident_summary', {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get incident summary: ${error.message}`);
  return data[0];
}
