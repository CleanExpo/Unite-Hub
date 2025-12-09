/**
 * Synthex Experiment Service
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * Full-featured experimentation engine for A/B and
 * multivariate tests across emails, subject lines,
 * CTAs, content, and send-times.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// Types
// =====================================================

export interface Experiment {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  object_type: 'subject_line' | 'email_body' | 'cta' | 'content_block' | 'send_time' | 'landing_page' | 'form';
  object_ref: string;
  primary_metric: string;
  secondary_metrics?: string[];
  hypothesis?: string;
  segment_id?: string;
  traffic_percentage: number;
  start_at?: string;
  end_at?: string;
  winning_variant_id?: string;
  decided_at?: string;
  decision_reason?: string;
  created_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  description?: string;
  is_control: boolean;
  weight: number;
  config: Record<string, unknown>;
  created_at: string;
}

export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  contact_id: string;
  variant_id: string;
  assigned_at: string;
}

export interface ExperimentMetric {
  id: string;
  experiment_id: string;
  variant_id: string;
  event_type: string;
  count: number;
  value_sum: number;
  last_event_at?: string;
  period: string;
}

export interface VariantSummary {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  impressions: number;
  opens: number;
  clicks: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  lift_vs_control: number;
}

export interface ExperimentSummary {
  experiment: Experiment;
  variants: ExperimentVariant[];
  stats: VariantSummary[];
  winner?: {
    variant_id: string;
    variant_name: string;
    confidence: number;
    recommendation: string;
  };
}

export interface CreateExperimentInput {
  name: string;
  description?: string;
  object_type: Experiment['object_type'];
  object_ref: string;
  primary_metric: string;
  secondary_metrics?: string[];
  hypothesis?: string;
  segment_id?: string;
  traffic_percentage?: number;
  start_at?: string;
  end_at?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateExperimentInput {
  name?: string;
  description?: string;
  status?: Experiment['status'];
  primary_metric?: string;
  secondary_metrics?: string[];
  hypothesis?: string;
  segment_id?: string;
  traffic_percentage?: number;
  start_at?: string;
  end_at?: string;
  winning_variant_id?: string;
  decision_reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateVariantInput {
  name: string;
  description?: string;
  is_control?: boolean;
  weight?: number;
  config: Record<string, unknown>;
}

export interface ExperimentFilters {
  status?: Experiment['status'];
  object_type?: Experiment['object_type'];
  limit?: number;
  offset?: number;
}

// =====================================================
// Experiment CRUD
// =====================================================

/**
 * List experiments for a tenant
 */
export async function listExperiments(
  tenantId: string,
  filters?: ExperimentFilters
): Promise<Experiment[]> {
  let query = supabaseAdmin
    .from('synthex_experiments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.object_type) {
    query = query.eq('object_type', filters.object_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list experiments: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single experiment with variants
 */
export async function getExperiment(
  tenantId: string,
  experimentId: string
): Promise<{ experiment: Experiment; variants: ExperimentVariant[] } | null> {
  const { data: experiment, error } = await supabaseAdmin
    .from('synthex_experiments')
    .select('*')
    .eq('id', experimentId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get experiment: ${error.message}`);
  }

  const { data: variants } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('is_control', { ascending: false })
    .order('created_at', { ascending: true });

  return {
    experiment,
    variants: variants || [],
  };
}

/**
 * Create a new experiment
 */
export async function createExperiment(
  tenantId: string,
  userId: string,
  input: CreateExperimentInput
): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('synthex_experiments')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description,
      status: 'draft',
      object_type: input.object_type,
      object_ref: input.object_ref,
      primary_metric: input.primary_metric,
      secondary_metrics: input.secondary_metrics,
      hypothesis: input.hypothesis,
      segment_id: input.segment_id,
      traffic_percentage: input.traffic_percentage || 100,
      start_at: input.start_at,
      end_at: input.end_at,
      created_by: userId,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create experiment: ${error.message}`);
  }

  return data;
}

/**
 * Update an experiment
 */
export async function updateExperiment(
  tenantId: string,
  experimentId: string,
  patch: UpdateExperimentInput
): Promise<Experiment> {
  // Build update object, removing undefined values
  const updateData: Record<string, unknown> = {};
  if (patch.name !== undefined) {
updateData.name = patch.name;
}
  if (patch.description !== undefined) {
updateData.description = patch.description;
}
  if (patch.status !== undefined) {
    updateData.status = patch.status;
    if (patch.status === 'completed' && patch.winning_variant_id) {
      updateData.decided_at = new Date().toISOString();
    }
  }
  if (patch.primary_metric !== undefined) {
updateData.primary_metric = patch.primary_metric;
}
  if (patch.secondary_metrics !== undefined) {
updateData.secondary_metrics = patch.secondary_metrics;
}
  if (patch.hypothesis !== undefined) {
updateData.hypothesis = patch.hypothesis;
}
  if (patch.segment_id !== undefined) {
updateData.segment_id = patch.segment_id;
}
  if (patch.traffic_percentage !== undefined) {
updateData.traffic_percentage = patch.traffic_percentage;
}
  if (patch.start_at !== undefined) {
updateData.start_at = patch.start_at;
}
  if (patch.end_at !== undefined) {
updateData.end_at = patch.end_at;
}
  if (patch.winning_variant_id !== undefined) {
updateData.winning_variant_id = patch.winning_variant_id;
}
  if (patch.decision_reason !== undefined) {
updateData.decision_reason = patch.decision_reason;
}
  if (patch.metadata !== undefined) {
updateData.metadata = patch.metadata;
}

  const { data, error } = await supabaseAdmin
    .from('synthex_experiments')
    .update(updateData)
    .eq('id', experimentId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update experiment: ${error.message}`);
  }

  return data;
}

// =====================================================
// Variant Management
// =====================================================

/**
 * Add a variant to an experiment
 */
export async function addVariant(
  tenantId: string,
  experimentId: string,
  input: CreateVariantInput
): Promise<ExperimentVariant> {
  // Verify experiment belongs to tenant
  const result = await getExperiment(tenantId, experimentId);
  if (!result) {
    throw new Error('Experiment not found');
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .insert({
      experiment_id: experimentId,
      name: input.name,
      description: input.description,
      is_control: input.is_control || false,
      weight: input.weight || 1,
      config: input.config,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add variant: ${error.message}`);
  }

  return data;
}

/**
 * Update a variant
 */
export async function updateVariant(
  tenantId: string,
  variantId: string,
  patch: Partial<CreateVariantInput>
): Promise<ExperimentVariant> {
  // Verify variant belongs to tenant's experiment
  const { data: variant } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .select('*, synthex_experiments!inner(tenant_id)')
    .eq('id', variantId)
    .single();

  if (!variant || (variant as { synthex_experiments: { tenant_id: string } }).synthex_experiments.tenant_id !== tenantId) {
    throw new Error('Variant not found');
  }

  const updateData: Record<string, unknown> = {};
  if (patch.name !== undefined) {
updateData.name = patch.name;
}
  if (patch.description !== undefined) {
updateData.description = patch.description;
}
  if (patch.is_control !== undefined) {
updateData.is_control = patch.is_control;
}
  if (patch.weight !== undefined) {
updateData.weight = patch.weight;
}
  if (patch.config !== undefined) {
updateData.config = patch.config;
}

  const { data, error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .update(updateData)
    .eq('id', variantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update variant: ${error.message}`);
  }

  return data;
}

/**
 * Delete a variant
 */
export async function deleteVariant(
  tenantId: string,
  variantId: string
): Promise<void> {
  // Verify variant belongs to tenant's experiment
  const { data: variant } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .select('*, synthex_experiments!inner(tenant_id)')
    .eq('id', variantId)
    .single();

  if (!variant || (variant as { synthex_experiments: { tenant_id: string } }).synthex_experiments.tenant_id !== tenantId) {
    throw new Error('Variant not found');
  }

  const { error } = await supabaseAdmin
    .from('synthex_experiment_variants')
    .delete()
    .eq('id', variantId);

  if (error) {
    throw new Error(`Failed to delete variant: ${error.message}`);
  }
}

// =====================================================
// Assignment & Tracking
// =====================================================

/**
 * Assign a contact to a variant (idempotent)
 * Uses weighted random selection if not already assigned
 */
export async function assignVariantForContact(
  tenantId: string,
  experimentId: string,
  contactId: string
): Promise<{ variant_id: string; variant_name: string; is_new: boolean }> {
  // Check for existing assignment
  const { data: existing } = await supabaseAdmin
    .from('synthex_experiment_assignments')
    .select('variant_id, synthex_experiment_variants(name)')
    .eq('experiment_id', experimentId)
    .eq('contact_id', contactId)
    .single();

  if (existing) {
    return {
      variant_id: existing.variant_id,
      variant_name: (existing as { synthex_experiment_variants: { name: string } }).synthex_experiment_variants.name,
      is_new: false,
    };
  }

  // Get experiment and variants
  const result = await getExperiment(tenantId, experimentId);
  if (!result) {
    throw new Error('Experiment not found');
  }

  if (result.experiment.status !== 'running') {
    throw new Error('Experiment is not running');
  }

  if (result.variants.length === 0) {
    throw new Error('Experiment has no variants');
  }

  // Weighted random selection
  const totalWeight = result.variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedVariant = result.variants[0];

  for (const variant of result.variants) {
    random -= variant.weight;
    if (random <= 0) {
      selectedVariant = variant;
      break;
    }
  }

  // Create assignment
  const { error } = await supabaseAdmin
    .from('synthex_experiment_assignments')
    .insert({
      experiment_id: experimentId,
      contact_id: contactId,
      variant_id: selectedVariant.id,
    });

  if (error) {
    // Handle race condition - another request might have assigned
    if (error.code === '23505') {
      const { data: retryExisting } = await supabaseAdmin
        .from('synthex_experiment_assignments')
        .select('variant_id, synthex_experiment_variants(name)')
        .eq('experiment_id', experimentId)
        .eq('contact_id', contactId)
        .single();

      if (retryExisting) {
        return {
          variant_id: retryExisting.variant_id,
          variant_name: (retryExisting as { synthex_experiment_variants: { name: string } }).synthex_experiment_variants.name,
          is_new: false,
        };
      }
    }
    throw new Error(`Failed to assign variant: ${error.message}`);
  }

  return {
    variant_id: selectedVariant.id,
    variant_name: selectedVariant.name,
    is_new: true,
  };
}

/**
 * Record an experiment event (updates aggregated metrics)
 */
export async function recordExperimentEvent(
  tenantId: string,
  experimentId: string,
  variantId: string,
  eventType: string,
  occurredAt?: string,
  value?: number
): Promise<void> {
  // Verify experiment belongs to tenant
  const result = await getExperiment(tenantId, experimentId);
  if (!result) {
    throw new Error('Experiment not found');
  }

  const eventDate = occurredAt ? new Date(occurredAt) : new Date();
  const period = eventDate.toISOString().split('T')[0];

  // Upsert metric
  const { error } = await supabaseAdmin
    .from('synthex_experiment_metrics')
    .upsert(
      {
        experiment_id: experimentId,
        variant_id: variantId,
        event_type: eventType,
        period,
        count: 1,
        value_sum: value || 0,
        last_event_at: eventDate.toISOString(),
      },
      {
        onConflict: 'experiment_id,variant_id,event_type,period',
      }
    );

  if (error) {
    // If upsert fails, try increment approach
    const { error: updateError } = await supabaseAdmin.rpc('increment_experiment_metric', {
      p_experiment_id: experimentId,
      p_variant_id: variantId,
      p_event_type: eventType,
      p_period: period,
      p_value: value || 0,
    });

    if (updateError) {
      console.error('Failed to record experiment event:', updateError);
      // Don't throw - logging is fire-and-forget
    }
  }
}

/**
 * Batch record experiment events
 */
export async function recordExperimentEventsBatch(
  tenantId: string,
  events: Array<{
    experimentId: string;
    variantId: string;
    eventType: string;
    occurredAt?: string;
    value?: number;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const event of events) {
    try {
      await recordExperimentEvent(
        tenantId,
        event.experimentId,
        event.variantId,
        event.eventType,
        event.occurredAt,
        event.value
      );
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

// =====================================================
// Summary & Analysis
// =====================================================

/**
 * Get experiment summary with per-variant stats
 */
export async function summarizeExperiment(
  tenantId: string,
  experimentId: string
): Promise<ExperimentSummary> {
  const result = await getExperiment(tenantId, experimentId);
  if (!result) {
    throw new Error('Experiment not found');
  }

  // Get stats using SQL function
  const { data: stats, error } = await supabaseAdmin.rpc('get_experiment_summary', {
    p_experiment_id: experimentId,
  });

  if (error) {
    console.error('Failed to get experiment summary:', error);
  }

  const variantStats: VariantSummary[] = (stats || []).map((s: {
    variant_id: string;
    variant_name: string;
    is_control: boolean;
    impressions: number;
    opens: number;
    clicks: number;
    conversions: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    lift_vs_control: number;
  }) => ({
    variant_id: s.variant_id,
    variant_name: s.variant_name,
    is_control: s.is_control,
    impressions: Number(s.impressions) || 0,
    opens: Number(s.opens) || 0,
    clicks: Number(s.clicks) || 0,
    conversions: Number(s.conversions) || 0,
    open_rate: Number(s.open_rate) || 0,
    click_rate: Number(s.click_rate) || 0,
    conversion_rate: Number(s.conversion_rate) || 0,
    lift_vs_control: Number(s.lift_vs_control) || 0,
  }));

  // Determine winner recommendation
  let winner: ExperimentSummary['winner'];
  const nonControlVariants = variantStats.filter((v) => !v.is_control);

  if (nonControlVariants.length > 0) {
    const bestVariant = nonControlVariants.reduce((best, current) =>
      current.conversion_rate > best.conversion_rate ? current : best
    );

    const control = variantStats.find((v) => v.is_control);
    const hasEnoughData = bestVariant.impressions >= 100 && (control?.impressions || 0) >= 100;

    if (hasEnoughData && bestVariant.lift_vs_control > 5) {
      winner = {
        variant_id: bestVariant.variant_id,
        variant_name: bestVariant.variant_name,
        confidence: Math.min(95, 50 + bestVariant.lift_vs_control * 2),
        recommendation: `Variant "${bestVariant.variant_name}" shows ${bestVariant.lift_vs_control.toFixed(1)}% lift vs control. Consider declaring as winner.`,
      };
    }
  }

  return {
    experiment: result.experiment,
    variants: result.variants,
    stats: variantStats,
    winner,
  };
}

// =====================================================
// AI-Assisted Variant Suggestions
// =====================================================

// Lazy-load Anthropic client
let anthropicClient: Awaited<ReturnType<typeof import('@anthropic-ai/sdk').default['prototype']['constructor']>> | null = null;

async function getAnthropicClient() {
  if (!anthropicClient) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * AI-assisted variant suggestion
 */
export async function suggestExperimentVariants(
  goalDescription: string,
  objectType: Experiment['object_type'],
  baselineContent: string
): Promise<Array<{ name: string; description: string; config: Record<string, unknown> }>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return [
      {
        name: 'Control',
        description: 'Original baseline version',
        config: { content: baselineContent },
      },
      {
        name: 'Variant A',
        description: 'Alternative version',
        config: { content: baselineContent },
      },
    ];
  }

  try {
    const client = await getAnthropicClient();
    const objectTypeLabel = objectType.replace('_', ' ');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are an A/B testing expert. Generate 3-4 variant suggestions for a ${objectTypeLabel} experiment.

Goal: ${goalDescription}

Baseline content:
${baselineContent}

Return a JSON array with this structure:
[
  {
    "name": "Control",
    "description": "Original version",
    "config": { "content": "..." }
  },
  {
    "name": "Variant A",
    "description": "...",
    "config": { "content": "..." }
  }
]

The first should be the Control (baseline). Other variants should test specific hypotheses.
Return ONLY the JSON array, no other text.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed.map((v: { name?: string; description?: string; config?: Record<string, unknown> }, i: number) => ({
        name: v.name || `Variant ${i}`,
        description: v.description || '',
        config: v.config || { content: baselineContent },
      }));
    }
  } catch (error) {
    console.error('AI variant suggestion failed:', error);
  }

  // Fallback
  return [
    {
      name: 'Control',
      description: 'Original baseline version',
      config: { content: baselineContent },
    },
    {
      name: 'Variant A',
      description: 'Alternative version for testing',
      config: { content: baselineContent },
    },
  ];
}
