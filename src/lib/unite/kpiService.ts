/**
 * KPI Service
 * Phase: D61 - Unified Business Health & KPI Engine
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export interface KPIDefinition {
  id: string;
  tenant_id?: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  source: string;
  config: Record<string, unknown>;
  unit?: string;
  direction: string;
  thresholds?: Record<string, unknown>;
  ai_profile?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPISnapshot {
  id: string;
  tenant_id?: string;
  kpi_id: string;
  period_start: string;
  period_end: string;
  value?: number;
  delta?: number;
  direction?: string;
  source_meta?: Record<string, unknown>;
  ai_summary?: Record<string, unknown>;
  computed_at: string;
}

export interface KPIAlert {
  id: string;
  tenant_id?: string;
  kpi_id: string;
  severity: string;
  title: string;
  message?: string;
  status: string;
  metadata?: Record<string, unknown>;
  ai_recommendation?: Record<string, unknown>;
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

export async function createKPI(tenantId: string | null, input: Omit<KPIDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<KPIDefinition> {
  const { data, error } = await supabaseAdmin.from('unite_kpi_definitions').insert({ tenant_id: tenantId, ...input }).select().single();
  if (error) throw new Error(`Failed to create KPI: ${error.message}`);
  return data as KPIDefinition;
}

export async function listKPIs(tenantId: string | null, filters?: { category?: string; is_active?: boolean; limit?: number }): Promise<KPIDefinition[]> {
  let query = supabaseAdmin.from('unite_kpi_definitions').select('*').order('created_at', { ascending: false });
  if (tenantId) query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list KPIs: ${error.message}`);
  return data as KPIDefinition[];
}

export async function createSnapshot(tenantId: string | null, input: Omit<KPISnapshot, 'id' | 'computed_at'>): Promise<KPISnapshot> {
  const { data, error } = await supabaseAdmin.from('unite_kpi_snapshots').insert({ tenant_id: tenantId, ...input }).select().single();
  if (error) throw new Error(`Failed to create snapshot: ${error.message}`);
  return data as KPISnapshot;
}

export async function listSnapshots(tenantId: string | null, kpiId: string, limit: number = 30): Promise<KPISnapshot[]> {
  let query = supabaseAdmin.from('unite_kpi_snapshots').select('*').eq('kpi_id', kpiId).order('period_start', { ascending: false }).limit(limit);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list snapshots: ${error.message}`);
  return data as KPISnapshot[];
}

export async function createAlert(tenantId: string | null, input: Omit<KPIAlert, 'id' | 'opened_at'>): Promise<KPIAlert> {
  const { data, error } = await supabaseAdmin.from('unite_kpi_alerts').insert({ tenant_id: tenantId, ...input }).select().single();
  if (error) throw new Error(`Failed to create alert: ${error.message}`);
  return data as KPIAlert;
}

export async function listAlerts(tenantId: string | null, filters?: { status?: string; severity?: string; limit?: number }): Promise<KPIAlert[]> {
  let query = supabaseAdmin.from('unite_kpi_alerts').select('*').order('opened_at', { ascending: false });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list alerts: ${error.message}`);
  return data as KPIAlert[];
}

export async function aiGenerateInsights(kpi: KPIDefinition, snapshots: KPISnapshot[]): Promise<{ trend_analysis: string; recommendations: string[]; health_score: number }> {
  const client = getAnthropicClient();
  const values = snapshots.map(s => s.value || 0);
  const prompt = `Analyze this KPI:

**Name**: ${kpi.name}
**Category**: ${kpi.category}
**Direction**: ${kpi.direction}
**Recent Values**: ${values.slice(0, 10).join(', ')}

Provide insights in JSON:
{
  "trend_analysis": "Analysis of the trend",
  "recommendations": ["Action 1", "Action 2"],
  "health_score": 0-100
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
