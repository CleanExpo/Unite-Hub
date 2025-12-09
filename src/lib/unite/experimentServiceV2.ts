/**
 * Experiment Service V2
 * Phase: D62 - Enhanced Experimentation Framework
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export interface Experiment {
  id: string;
  tenant_id?: string;
  slug: string;
  name: string;
  description?: string;
  status: string;
  target_area: string;
  hypothesis?: string;
  primary_metric: string;
  secondary_metrics?: string[];
  traffic_allocation?: Record<string, unknown>;
  start_at?: string;
  end_at?: string;
  ai_design?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export async function createExperiment(tenantId: string | null, input: Omit<Experiment, 'id' | 'created_at' | 'updated_at'>): Promise<Experiment> {
  const { data, error } = await supabaseAdmin.from('unite_exp_experiments').insert({ tenant_id: tenantId, ...input }).select().single();
  if (error) throw new Error(`Failed to create experiment: ${error.message}`);
  return data as Experiment;
}

export async function listExperiments(tenantId: string | null, filters?: { status?: string; limit?: number }): Promise<Experiment[]> {
  let query = supabaseAdmin.from('unite_exp_experiments').select('*').order('created_at', { ascending: false });
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list experiments: ${error.message}`);
  return data as Experiment[];
}

export async function aiDesignExperiment(goal: string, targetArea: string): Promise<{ name: string; hypothesis: string; variants: Array<{ key: string; name: string; description: string }> }> {
  const client = getAnthropicClient();
  const prompt = `Design an A/B test experiment:

**Goal**: ${goal}
**Target Area**: ${targetArea}

Provide experiment design in JSON:
{
  "name": "Experiment Name",
  "hypothesis": "Clear hypothesis",
  "variants": [
    {"key": "control", "name": "Control", "description": "Baseline"},
    {"key": "variant_a", "name": "Variant A", "description": "Test change"}
  ]
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

// ============================================================================
// VARIANTS
// ============================================================================

export interface Variant {
  id: string;
  experiment_id: string;
  key: string;
  name: string;
  description?: string;
  allocation_percent: number;
  config?: Record<string, unknown>;
  ai_profile?: Record<string, unknown>;
}

export async function createVariant(experimentId: string, input: Omit<Variant, 'id'>): Promise<Variant> {
  const { data, error } = await supabaseAdmin
    .from('unite_exp_variants')
    .insert({ experiment_id: experimentId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create variant: ${error.message}`);
  return data as Variant;
}

export async function listVariants(experimentId: string): Promise<Variant[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_exp_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('allocation_percent', { ascending: false });
  if (error) throw new Error(`Failed to list variants: ${error.message}`);
  return data as Variant[];
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export interface Assignment {
  id: string;
  tenant_id?: string;
  experiment_id: string;
  variant_id: string;
  subject_type: string;
  subject_id: string;
  assigned_at: string;
  metadata?: Record<string, unknown>;
}

export async function assignSubject(
  tenantId: string | null,
  experimentId: string,
  subjectType: string,
  subjectId: string
): Promise<Assignment> {
  // Check if already assigned
  const { data: existing } = await supabaseAdmin
    .from('unite_exp_assignments')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('subject_type', subjectType)
    .eq('subject_id', subjectId)
    .single();

  if (existing) return existing as Assignment;

  // Get variants and their allocation
  const variants = await listVariants(experimentId);
  if (!variants.length) throw new Error('No variants available');

  // Simple random allocation based on allocation_percent
  const rand = Math.random() * 100;
  let cumulative = 0;
  let selectedVariant = variants[0];

  for (const variant of variants) {
    cumulative += variant.allocation_percent;
    if (rand <= cumulative) {
      selectedVariant = variant;
      break;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('unite_exp_assignments')
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      variant_id: selectedVariant.id,
      subject_type: subjectType,
      subject_id: subjectId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to assign subject: ${error.message}`);
  return data as Assignment;
}

export async function getAssignment(
  experimentId: string,
  subjectType: string,
  subjectId: string
): Promise<Assignment | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_exp_assignments')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('subject_type', subjectType)
    .eq('subject_id', subjectId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to get assignment: ${error.message}`);
  return data as Assignment | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface ExperimentEvent {
  id: string;
  tenant_id?: string;
  experiment_id: string;
  variant_id: string;
  event_type: string;
  value?: number;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

export async function trackEvent(
  tenantId: string | null,
  experimentId: string,
  variantId: string,
  eventType: string,
  value?: number,
  metadata?: Record<string, unknown>
): Promise<ExperimentEvent> {
  const { data, error } = await supabaseAdmin
    .from('unite_exp_events')
    .insert({
      tenant_id: tenantId,
      experiment_id: experimentId,
      variant_id: variantId,
      event_type: eventType,
      value,
      metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to track event: ${error.message}`);
  return data as ExperimentEvent;
}

export async function getExperimentStats(experimentId: string): Promise<{
  variants: Array<{
    variant_id: string;
    variant_name: string;
    total_events: number;
    unique_subjects: number;
    avg_value: number;
  }>;
}> {
  const { data: variants } = await supabaseAdmin
    .from('unite_exp_variants')
    .select('id, name')
    .eq('experiment_id', experimentId);

  if (!variants) return { variants: [] };

  const stats = await Promise.all(
    variants.map(async (variant) => {
      const { data: events } = await supabaseAdmin
        .from('unite_exp_events')
        .select('value')
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id);

      const { count: assignmentCount } = await supabaseAdmin
        .from('unite_exp_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id);

      const totalEvents = events?.length || 0;
      const avgValue = events?.reduce((sum, e) => sum + (e.value || 0), 0) / totalEvents || 0;

      return {
        variant_id: variant.id,
        variant_name: variant.name,
        total_events: totalEvents,
        unique_subjects: assignmentCount || 0,
        avg_value: avgValue,
      };
    })
  );

  return { variants: stats };
}
