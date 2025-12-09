/**
 * Usage Telemetry Service
 * Phase: D64 - Unified Usage & Cost Telemetry Engine
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
// DIMENSIONS
// ============================================================================

export interface UsageDimension {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  aggregation: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createDimension(
  input: Omit<UsageDimension, 'id' | 'created_at' | 'updated_at'>
): Promise<UsageDimension> {
  const { data, error } = await supabaseAdmin
    .from('unite_usage_dimensions')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create dimension: ${error.message}`);
  return data as UsageDimension;
}

export async function listDimensions(filters?: {
  category?: string;
  limit?: number;
}): Promise<UsageDimension[]> {
  let query = supabaseAdmin.from('unite_usage_dimensions').select('*').order('category');

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list dimensions: ${error.message}`);
  return data as UsageDimension[];
}

// ============================================================================
// USAGE EVENTS
// ============================================================================

export interface UsageEvent {
  id: string;
  tenant_id: string;
  source: string;
  dimension_key: string;
  value: number;
  unit: string;
  meta?: Record<string, unknown>;
  occurred_at: string;
  ingested_at: string;
  trace_id?: string;
  external_id?: string;
}

export async function ingestUsageEvent(
  tenantId: string,
  input: Omit<UsageEvent, 'id' | 'tenant_id' | 'ingested_at'>
): Promise<UsageEvent> {
  const { data, error } = await supabaseAdmin
    .from('unite_usage_events')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to ingest event: ${error.message}`);
  return data as UsageEvent;
}

export async function ingestBatch(
  tenantId: string,
  events: Array<Omit<UsageEvent, 'id' | 'tenant_id' | 'ingested_at'>>
): Promise<number> {
  const records = events.map((e) => ({ tenant_id: tenantId, ...e }));
  const { error, count } = await supabaseAdmin.from('unite_usage_events').insert(records);
  if (error) throw new Error(`Failed to ingest batch: ${error.message}`);
  return count || 0;
}

export async function getUsageEvents(
  tenantId: string,
  filters?: {
    dimension_key?: string;
    source?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<UsageEvent[]> {
  let query = supabaseAdmin
    .from('unite_usage_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false });

  if (filters?.dimension_key) query = query.eq('dimension_key', filters.dimension_key);
  if (filters?.source) query = query.eq('source', filters.source);
  if (filters?.start_date) query = query.gte('occurred_at', filters.start_date);
  if (filters?.end_date) query = query.lte('occurred_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get events: ${error.message}`);
  return data as UsageEvent[];
}

// ============================================================================
// COST BUCKETS
// ============================================================================

export interface CostBucket {
  id: string;
  key: string;
  name: string;
  provider: string;
  description?: string;
  currency: string;
  pricing_model: string;
  unit: string;
  rate_per_unit?: number;
  tiered_pricing?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createCostBucket(
  input: Omit<CostBucket, 'id' | 'created_at' | 'updated_at'>
): Promise<CostBucket> {
  const { data, error } = await supabaseAdmin
    .from('unite_cost_buckets')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create cost bucket: ${error.message}`);
  return data as CostBucket;
}

export async function listCostBuckets(filters?: {
  provider?: string;
  limit?: number;
}): Promise<CostBucket[]> {
  let query = supabaseAdmin.from('unite_cost_buckets').select('*').order('provider');

  if (filters?.provider) query = query.eq('provider', filters.provider);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list cost buckets: ${error.message}`);
  return data as CostBucket[];
}

// ============================================================================
// DAILY USAGE/COST ROLLUP
// ============================================================================

export interface DailyUsageCost {
  id: string;
  tenant_id: string;
  date: string;
  dimension_key: string;
  cost_bucket_key?: string;
  usage_value?: number;
  usage_unit?: string;
  cost_amount?: number;
  currency: string;
  metadata?: Record<string, unknown>;
  computed_at: string;
}

export async function getDailySummary(
  tenantId: string,
  filters?: {
    dimension_key?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<DailyUsageCost[]> {
  let query = supabaseAdmin
    .from('unite_usage_cost_daily')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });

  if (filters?.dimension_key) query = query.eq('dimension_key', filters.dimension_key);
  if (filters?.start_date) query = query.gte('date', filters.start_date);
  if (filters?.end_date) query = query.lte('date', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get daily summary: ${error.message}`);
  return data as DailyUsageCost[];
}

export async function computeDailyRollup(tenantId: string, date: string): Promise<number> {
  // Delete existing rollup for this date
  await supabaseAdmin
    .from('unite_usage_cost_daily')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('date', date);

  // Aggregate events for this date
  const { data: events } = await supabaseAdmin
    .from('unite_usage_events')
    .select('dimension_key, value, unit')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', `${date}T00:00:00Z`)
    .lt('occurred_at', `${date}T23:59:59Z`);

  if (!events || events.length === 0) return 0;

  // Group by dimension_key
  const grouped = events.reduce((acc, event) => {
    const key = event.dimension_key;
    if (!acc[key]) {
      acc[key] = { total: 0, unit: event.unit };
    }
    acc[key].total += event.value;
    return acc;
  }, {} as Record<string, { total: number; unit: string }>);

  // Get cost buckets
  const { data: costBuckets } = await supabaseAdmin.from('unite_cost_buckets').select('*');

  // Create rollup records
  const rollupRecords = Object.entries(grouped).map(([dimension_key, { total, unit }]) => {
    const bucket = costBuckets?.find((b) => b.key === dimension_key);
    const cost_amount = bucket ? total * (bucket.rate_per_unit || 0) : 0;

    return {
      tenant_id: tenantId,
      date,
      dimension_key,
      cost_bucket_key: bucket?.key,
      usage_value: total,
      usage_unit: unit,
      cost_amount,
      currency: bucket?.currency || 'AUD',
    };
  });

  const { error } = await supabaseAdmin.from('unite_usage_cost_daily').insert(rollupRecords);
  if (error) throw new Error(`Failed to compute daily rollup: ${error.message}`);

  return rollupRecords.length;
}

// ============================================================================
// AI INSIGHTS
// ============================================================================

export async function aiGenerateUsageInsights(
  tenantId: string,
  days: number = 30
): Promise<{
  summary: string;
  cost_trend: string;
  anomalies: Array<{ dimension: string; issue: string; severity: string }>;
  recommendations: string[];
}> {
  const client = getAnthropicClient();

  // Get aggregated data (anonymized)
  const dailySummary = await getDailySummary(tenantId, {
    start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    limit: days,
  });

  const totalCost = dailySummary.reduce((sum, d) => sum + (d.cost_amount || 0), 0);
  const avgDailyCost = totalCost / (days || 1);

  // Group by dimension
  const byDimension = dailySummary.reduce((acc, d) => {
    const key = d.dimension_key;
    if (!acc[key]) {
      acc[key] = { cost: 0, usage: 0 };
    }
    acc[key].cost += d.cost_amount || 0;
    acc[key].usage += d.usage_value || 0;
    return acc;
  }, {} as Record<string, { cost: number; usage: number }>);

  const prompt = `Analyze usage & cost telemetry:

**Period**: Last ${days} days

**Aggregate Metrics**:
- Total Cost: $${totalCost.toFixed(2)} AUD
- Avg Daily Cost: $${avgDailyCost.toFixed(2)} AUD
- Dimensions Tracked: ${Object.keys(byDimension).length}

**Cost by Dimension**:
${Object.entries(byDimension)
  .map(([dim, { cost, usage }]) => `- ${dim}: $${cost.toFixed(2)} (${usage.toFixed(0)} units)`)
  .join('\n')}

Provide analysis in JSON:
{
  "summary": "Brief overview",
  "cost_trend": "increasing|stable|decreasing",
  "anomalies": [
    {"dimension": "dimension_key", "issue": "Description", "severity": "high|medium|low"}
  ],
  "recommendations": ["Action 1", "Action 2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No AI response');
  return JSON.parse(textContent.text);
}
