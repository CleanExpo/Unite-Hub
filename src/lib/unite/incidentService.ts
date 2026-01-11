/**
 * Incident Service
 * Phase: D59 - Notification & Incident Center
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export interface Incident {
  id: string;
  tenant_id?: string;
  source: string;
  category: string;
  status: string;
  severity: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ai_summary?: Record<string, unknown>;
  opened_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

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

export async function createIncident(
  tenantId: string | null,
  input: Omit<Incident, 'id' | 'opened_at' | 'resolved_at' | 'resolved_by'>
): Promise<Incident> {
  const { data, error } = await supabaseAdmin
    .from('unite_incidents')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create incident: ${error.message}`);
  return data as Incident;
}

export async function listIncidents(
  tenantId: string | null,
  filters?: { status?: string; severity?: string; limit?: number }
): Promise<Incident[]> {
  let query = supabaseAdmin
    .from('unite_incidents')
    .select('*')
    .order('opened_at', { ascending: false });

  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list incidents: ${error.message}`);
  return data as Incident[];
}

export async function resolveIncident(
  incidentId: string,
  resolvedBy: string
): Promise<Incident> {
  const { data, error } = await supabaseAdmin
    .from('unite_incidents')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', incidentId)
    .select()
    .single();
  if (error) throw new Error(`Failed to resolve incident: ${error.message}`);
  return data as Incident;
}

export async function aiTriageIncident(
  incident: Incident
): Promise<{ severity_assessment: string; recommended_actions: string[]; priority: number }> {
  const client = getAnthropicClient();
  const prompt = `Triage this incident:

**Title**: ${incident.title}
**Category**: ${incident.category}
**Description**: ${incident.description || 'N/A'}

Provide triage in JSON:
{
  "severity_assessment": "Analysis of severity",
  "recommended_actions": ["Action 1", "Action 2"],
  "priority": 1-10
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No AI response');

  return JSON.parse(textContent.text);
}
