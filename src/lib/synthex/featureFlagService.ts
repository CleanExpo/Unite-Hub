/**
 * Synthex Feature Flag Service
 *
 * Phase: D46 - Feature Flags & Rollout Control
 * Tables: synthex_feature_flags, synthex_feature_flag_overrides, synthex_rollout_events
 *
 * Features:
 * - Create and manage feature flags
 * - Evaluate flags with scope-based overrides
 * - Track rollout events
 * - Segment-based rollout rules
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type FFScopeType = 'user' | 'business' | 'tenant' | 'segment';
export type FFEventType = 'created' | 'enabled' | 'disabled' | 'override_added' | 'override_removed' | 'rules_updated';

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description?: string;
  default_state: boolean;
  segment_rules?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagOverride {
  id: string;
  tenant_id: string;
  feature_flag_id: string;
  scope_type: FFScopeType;
  scope_ref: string;
  state: boolean;
  reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RolloutEvent {
  id: string;
  tenant_id: string;
  feature_flag_id: string;
  event_type: FFEventType;
  actor_user_id?: string;
  description?: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CreateFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  default_state?: boolean;
  segment_rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateOverrideInput {
  feature_flag_id: string;
  scope_type: FFScopeType;
  scope_ref: string;
  state: boolean;
  reason?: string;
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
// Feature Flag CRUD
// =============================================================================

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(
  tenantId: string,
  input: CreateFeatureFlagInput,
  actorUserId?: string
): Promise<FeatureFlag> {
  const { data, error } = await supabaseAdmin
    .from('synthex_feature_flags')
    .insert({
      tenant_id: tenantId,
      key: input.key,
      name: input.name,
      description: input.description,
      default_state: input.default_state ?? false,
      segment_rules: input.segment_rules ?? {},
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create feature flag: ${error.message}`);

  // Log event
  await logRolloutEvent(tenantId, data.id, 'created', actorUserId, `Feature flag "${input.name}" created`);

  return data as FeatureFlag;
}

/**
 * Get a feature flag by ID
 */
export async function getFeatureFlag(flagId: string): Promise<FeatureFlag | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_feature_flags')
    .select('*')
    .eq('id', flagId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get feature flag: ${error.message}`);
  return data as FeatureFlag | null;
}

/**
 * List feature flags for a tenant
 */
export async function listFeatureFlags(
  tenantId: string,
  filters?: { enabled?: boolean; limit?: number }
): Promise<FeatureFlag[]> {
  let query = supabaseAdmin
    .from('synthex_feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.enabled !== undefined) {
    query = query.eq('default_state', filters.enabled);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list feature flags: ${error.message}`);
  return data as FeatureFlag[];
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  flagId: string,
  updates: Partial<CreateFeatureFlagInput>,
  actorUserId?: string
): Promise<FeatureFlag> {
  const { data, error } = await supabaseAdmin
    .from('synthex_feature_flags')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update feature flag: ${error.message}`);

  // Log event if state changed
  if (updates.default_state !== undefined) {
    const eventType = updates.default_state ? 'enabled' : 'disabled';
    await logRolloutEvent(
      data.tenant_id,
      flagId,
      eventType,
      actorUserId,
      `Feature flag default state changed to ${updates.default_state}`
    );
  }

  return data as FeatureFlag;
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(flagId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_feature_flags')
    .delete()
    .eq('id', flagId);

  if (error) throw new Error(`Failed to delete feature flag: ${error.message}`);
}

// =============================================================================
// Feature Flag Overrides
// =============================================================================

/**
 * Create or update an override
 */
export async function createOverride(
  tenantId: string,
  input: CreateOverrideInput,
  actorUserId?: string
): Promise<FeatureFlagOverride> {
  const { data, error } = await supabaseAdmin
    .from('synthex_feature_flag_overrides')
    .upsert({
      tenant_id: tenantId,
      feature_flag_id: input.feature_flag_id,
      scope_type: input.scope_type,
      scope_ref: input.scope_ref,
      state: input.state,
      reason: input.reason,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create override: ${error.message}`);

  // Log event
  await logRolloutEvent(
    tenantId,
    input.feature_flag_id,
    'override_added',
    actorUserId,
    `Override added for ${input.scope_type}:${input.scope_ref} (state: ${input.state})`
  );

  return data as FeatureFlagOverride;
}

/**
 * List overrides for a feature flag
 */
export async function listOverrides(
  tenantId: string,
  flagId: string
): Promise<FeatureFlagOverride[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_feature_flag_overrides')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('feature_flag_id', flagId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list overrides: ${error.message}`);
  return data as FeatureFlagOverride[];
}

/**
 * Delete an override
 */
export async function deleteOverride(
  overrideId: string,
  actorUserId?: string
): Promise<void> {
  // Get override details for logging
  const { data: override } = await supabaseAdmin
    .from('synthex_feature_flag_overrides')
    .select('tenant_id, feature_flag_id, scope_type, scope_ref')
    .eq('id', overrideId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('synthex_feature_flag_overrides')
    .delete()
    .eq('id', overrideId);

  if (error) throw new Error(`Failed to delete override: ${error.message}`);

  if (override) {
    await logRolloutEvent(
      override.tenant_id,
      override.feature_flag_id,
      'override_removed',
      actorUserId,
      `Override removed for ${override.scope_type}:${override.scope_ref}`
    );
  }
}

// =============================================================================
// Feature Flag Evaluation
// =============================================================================

/**
 * Evaluate a feature flag for a specific context
 */
export async function evaluateFeatureFlag(
  tenantId: string,
  flagKey: string,
  context?: {
    userId?: string;
    businessId?: string;
  }
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('synthex_evaluate_feature_flag', {
    p_flag_key: flagKey,
    p_tenant_id: tenantId,
    p_user_id: context?.userId || null,
    p_business_id: context?.businessId || null,
  });

  if (error) {
    console.error(`Failed to evaluate feature flag ${flagKey}:`, error);
    return false;
  }

  return data as boolean;
}

/**
 * Bulk evaluate multiple feature flags
 */
export async function evaluateFeatureFlags(
  tenantId: string,
  flagKeys: string[],
  context?: {
    userId?: string;
    businessId?: string;
  }
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    flagKeys.map(async (key) => {
      results[key] = await evaluateFeatureFlag(tenantId, key, context);
    })
  );

  return results;
}

// =============================================================================
// Rollout Events
// =============================================================================

/**
 * Log a rollout event
 */
export async function logRolloutEvent(
  tenantId: string,
  flagId: string,
  eventType: FFEventType,
  actorUserId?: string,
  description?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await supabaseAdmin.from('synthex_rollout_events').insert({
    tenant_id: tenantId,
    feature_flag_id: flagId,
    event_type: eventType,
    actor_user_id: actorUserId,
    description,
    payload: payload ?? {},
  });
}

/**
 * Get rollout event history for a flag
 */
export async function getRolloutHistory(
  tenantId: string,
  flagId: string,
  limit = 50
): Promise<RolloutEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_rollout_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('feature_flag_id', flagId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get rollout history: ${error.message}`);
  return data as RolloutEvent[];
}

// =============================================================================
// AI-Powered Insights
// =============================================================================

/**
 * Generate AI recommendations for feature flag rollout
 */
export async function aiGenerateRolloutPlan(
  flag: FeatureFlag,
  currentOverrides: FeatureFlagOverride[]
): Promise<{
  recommendation: string;
  suggested_segments: Array<{ scope_type: FFScopeType; scope_ref: string; percentage: number }>;
  risk_assessment: string;
}> {
  const client = getAnthropicClient();

  const prompt = `You are a feature rollout strategist. Analyze this feature flag and provide a safe rollout recommendation.

Feature Flag:
- Name: ${flag.name}
- Description: ${flag.description || 'N/A'}
- Current Default State: ${flag.default_state}
- Active Overrides: ${currentOverrides.length}

Current Overrides:
${currentOverrides.map((o) => `- ${o.scope_type}:${o.scope_ref} = ${o.state} (${o.reason || 'no reason'})`).join('\n')}

Provide:
1. A rollout recommendation (canary → staged → full rollout)
2. Suggested segments to enable first (with percentages)
3. Risk assessment for this feature

Respond in JSON format:
{
  "recommendation": "string",
  "suggested_segments": [{"scope_type": "business", "scope_ref": "segment_id", "percentage": 10}],
  "risk_assessment": "string"
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
      recommendation: textContent.text,
      suggested_segments: [],
      risk_assessment: 'Unable to parse structured response',
    };
  }
}
