/**
 * Founder Cognitive Twin Kernel Service
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * Manages founder identity, principles, preferences, playbooks, and settings.
 * This is the core data layer for AI personalization and automation.
 *
 * @module founder/founderTwinService
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAnthropicClient, recordAnthropicSuccess, recordAnthropicFailure } from '@/lib/anthropic/client';

// =====================================================
// Types
// =====================================================

export type CompanyStage =
  | 'idea'
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'growth'
  | 'mature'
  | 'exit';

export type CommunicationStyle =
  | 'formal'
  | 'casual'
  | 'direct'
  | 'diplomatic'
  | 'technical'
  | 'storytelling';

export type DecisionStyle =
  | 'data_driven'
  | 'intuitive'
  | 'collaborative'
  | 'autonomous';

export type PrincipleCategory =
  | 'leadership'
  | 'product'
  | 'culture'
  | 'customer'
  | 'growth'
  | 'operations'
  | 'finance'
  | 'marketing'
  | 'sales'
  | 'general';

export type PreferenceCategory =
  | 'communication'
  | 'notifications'
  | 'ai_behavior'
  | 'automation'
  | 'reporting'
  | 'privacy'
  | 'integrations'
  | 'ui'
  | 'general';

export type PreferenceValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum';

export type PlaybookCategory =
  | 'hiring'
  | 'sales'
  | 'marketing'
  | 'product'
  | 'customer_success'
  | 'operations'
  | 'crisis'
  | 'growth'
  | 'partnerships'
  | 'general';

export type PlaybookDifficulty = 'simple' | 'moderate' | 'complex';

export type AIGuidanceLevel = 'suggest' | 'guide' | 'execute' | 'disabled';

export type AIAutonomyLevel = 'disabled' | 'suggest' | 'confirm' | 'autonomous';

export type AIPersonalizationLevel = 'none' | 'low' | 'medium' | 'high';

// =====================================================
// Interfaces
// =====================================================

export interface FounderProfile {
  id: string;
  tenant_id: string;
  // Core Identity
  name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  // Business Context
  company_name: string | null;
  company_stage: CompanyStage | null;
  industry: string | null;
  target_market: string | null;
  // Vision & Mission
  vision_statement: string | null;
  mission_statement: string | null;
  core_values: string[];
  // Communication Style
  communication_style: CommunicationStyle | null;
  preferred_tone: string | null;
  // AI Personalization
  ai_context: Record<string, unknown>;
  learning_preferences: Record<string, unknown>;
  decision_style: DecisionStyle | null;
  // Status
  is_active: boolean;
  onboarding_completed: boolean;
  // Metadata
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderPrinciple {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: PrincipleCategory;
  priority: number;
  applies_to: string[];
  example: string | null;
  rationale: string | null;
  use_in_ai_responses: boolean;
  ai_weight: number;
  is_active: boolean;
  source: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderPreference {
  id: string;
  tenant_id: string;
  key: string;
  value: unknown;
  category: PreferenceCategory;
  label: string | null;
  description: string | null;
  value_type: PreferenceValueType;
  allowed_values: unknown[] | null;
  default_value: unknown;
  is_sensitive: boolean;
  requires_restart: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  actions: string[];
  required_inputs?: string[];
  expected_outputs?: string[];
  estimated_duration?: string;
  ai_can_assist: boolean;
}

export interface TriggerCondition {
  type: string;
  field?: string;
  operator?: string;
  value?: unknown;
}

export interface SuccessCriterion {
  metric: string;
  target: unknown;
  comparison: string;
}

export interface FounderPlaybook {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: PlaybookCategory;
  trigger_conditions: TriggerCondition[];
  steps: PlaybookStep[];
  success_criteria: SuccessCriterion[];
  when_to_use: string | null;
  when_not_to_use: string | null;
  estimated_duration: string | null;
  difficulty: PlaybookDifficulty | null;
  ai_can_execute: boolean;
  ai_guidance_level: AIGuidanceLevel;
  times_used: number;
  last_used_at: string | null;
  average_success_score: number | null;
  is_active: boolean;
  is_template: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderSettings {
  id: string;
  tenant_id: string;
  // Synthex Automation Controls
  synthex_automation_enabled: boolean;
  ai_content_generation_enabled: boolean;
  predictive_send_time_enabled: boolean;
  auto_segmentation_enabled: boolean;
  // Notification Controls
  daily_digest_enabled: boolean;
  weekly_report_enabled: boolean;
  real_time_alerts_enabled: boolean;
  alert_channels: string[];
  // AI Behavior Controls
  ai_autonomy_level: AIAutonomyLevel;
  ai_learning_enabled: boolean;
  ai_personalization_level: AIPersonalizationLevel;
  // Research Fabric Controls
  research_auto_run: boolean;
  research_sources: string[];
  // Extended Settings
  extended_settings: Record<string, unknown>;
  // Metadata
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderProfileInput {
  name?: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
  company_name?: string;
  company_stage?: CompanyStage;
  industry?: string;
  target_market?: string;
  vision_statement?: string;
  mission_statement?: string;
  core_values?: string[];
  communication_style?: CommunicationStyle;
  preferred_tone?: string;
  ai_context?: Record<string, unknown>;
  learning_preferences?: Record<string, unknown>;
  decision_style?: DecisionStyle;
  onboarding_completed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FounderPrincipleInput {
  title: string;
  description?: string;
  category?: PrincipleCategory;
  priority?: number;
  applies_to?: string[];
  example?: string;
  rationale?: string;
  use_in_ai_responses?: boolean;
  ai_weight?: number;
  is_active?: boolean;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface FounderPreferenceInput {
  key: string;
  value: unknown;
  category?: PreferenceCategory;
  label?: string;
  description?: string;
  value_type?: PreferenceValueType;
  allowed_values?: unknown[];
  default_value?: unknown;
  is_sensitive?: boolean;
  requires_restart?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FounderPlaybookInput {
  name: string;
  slug: string;
  description?: string;
  category?: PlaybookCategory;
  trigger_conditions?: TriggerCondition[];
  steps: PlaybookStep[];
  success_criteria?: SuccessCriterion[];
  when_to_use?: string;
  when_not_to_use?: string;
  estimated_duration?: string;
  difficulty?: PlaybookDifficulty;
  ai_can_execute?: boolean;
  ai_guidance_level?: AIGuidanceLevel;
  is_active?: boolean;
  is_template?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface FounderSettingsInput {
  synthex_automation_enabled?: boolean;
  ai_content_generation_enabled?: boolean;
  predictive_send_time_enabled?: boolean;
  auto_segmentation_enabled?: boolean;
  daily_digest_enabled?: boolean;
  weekly_report_enabled?: boolean;
  real_time_alerts_enabled?: boolean;
  alert_channels?: string[];
  ai_autonomy_level?: AIAutonomyLevel;
  ai_learning_enabled?: boolean;
  ai_personalization_level?: AIPersonalizationLevel;
  research_auto_run?: boolean;
  research_sources?: string[];
  extended_settings?: Record<string, unknown>;
}

// =====================================================
// Profile Functions (Singleton per tenant)
// =====================================================

/**
 * Get founder profile for a tenant
 */
export async function getFounderProfile(tenantId: string): Promise<FounderProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_profile')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
} // Not found
    throw new Error(`Failed to get founder profile: ${error.message}`);
  }

  return data;
}

/**
 * Create or update founder profile (upsert)
 */
export async function upsertFounderProfile(
  tenantId: string,
  input: FounderProfileInput,
  userId?: string
): Promise<FounderProfile> {
  const existingProfile = await getFounderProfile(tenantId);

  if (existingProfile) {
    // Update existing profile
    const { data, error } = await supabaseAdmin
      .from('founder_profile')
      .update({
        ...input,
        updated_by: userId || null,
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update founder profile: ${error.message}`);
    }

    return data;
  } else {
    // Create new profile
    const { data, error } = await supabaseAdmin
      .from('founder_profile')
      .insert({
        tenant_id: tenantId,
        ...input,
        core_values: input.core_values || [],
        ai_context: input.ai_context || {},
        learning_preferences: input.learning_preferences || {},
        metadata: input.metadata || {},
        created_by: userId || null,
        updated_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create founder profile: ${error.message}`);
    }

    return data;
  }
}

// =====================================================
// Principles Functions
// =====================================================

/**
 * List all principles for a tenant
 */
export async function listPrinciples(
  tenantId: string,
  options: {
    category?: PrincipleCategory;
    activeOnly?: boolean;
    limit?: number;
  } = {}
): Promise<FounderPrinciple[]> {
  const { category, activeOnly = true, limit = 100 } = options;

  let query = supabaseAdmin
    .from('founder_principles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list principles: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single principle by ID
 */
export async function getPrinciple(principleId: string): Promise<FounderPrinciple | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_principles')
    .select('*')
    .eq('id', principleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get principle: ${error.message}`);
  }

  return data;
}

/**
 * Create or update a principle
 */
export async function upsertPrinciple(
  tenantId: string,
  input: FounderPrincipleInput,
  userId?: string,
  principleId?: string
): Promise<FounderPrinciple> {
  if (principleId) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('founder_principles')
      .update({
        ...input,
        updated_by: userId || null,
      })
      .eq('id', principleId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update principle: ${error.message}`);
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabaseAdmin
      .from('founder_principles')
      .insert({
        tenant_id: tenantId,
        title: input.title,
        description: input.description || null,
        category: input.category || 'general',
        priority: input.priority || 50,
        applies_to: input.applies_to || [],
        example: input.example || null,
        rationale: input.rationale || null,
        use_in_ai_responses: input.use_in_ai_responses !== false,
        ai_weight: input.ai_weight || 1.0,
        is_active: input.is_active !== false,
        source: input.source || null,
        metadata: input.metadata || {},
        created_by: userId || null,
        updated_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create principle: ${error.message}`);
    }

    return data;
  }
}

/**
 * Delete a principle
 */
export async function deletePrinciple(principleId: string, tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('founder_principles')
    .delete()
    .eq('id', principleId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to delete principle: ${error.message}`);
  }
}

// =====================================================
// Preferences Functions
// =====================================================

/**
 * List all preferences for a tenant
 */
export async function listPreferences(
  tenantId: string,
  options: {
    category?: PreferenceCategory;
    limit?: number;
  } = {}
): Promise<FounderPreference[]> {
  const { category, limit = 200 } = options;

  let query = supabaseAdmin
    .from('founder_preferences')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('category')
    .order('key')
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list preferences: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single preference by key
 */
export async function getPreference(
  tenantId: string,
  key: string
): Promise<FounderPreference | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_preferences')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get preference: ${error.message}`);
  }

  return data;
}

/**
 * Create or update a preference (upsert by key)
 */
export async function upsertPreference(
  tenantId: string,
  input: FounderPreferenceInput,
  userId?: string
): Promise<FounderPreference> {
  const existingPref = await getPreference(tenantId, input.key);

  if (existingPref) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('founder_preferences')
      .update({
        value: input.value,
        category: input.category || existingPref.category,
        label: input.label ?? existingPref.label,
        description: input.description ?? existingPref.description,
        value_type: input.value_type || existingPref.value_type,
        allowed_values: input.allowed_values ?? existingPref.allowed_values,
        default_value: input.default_value ?? existingPref.default_value,
        is_sensitive: input.is_sensitive ?? existingPref.is_sensitive,
        requires_restart: input.requires_restart ?? existingPref.requires_restart,
        metadata: input.metadata ?? existingPref.metadata,
        updated_by: userId || null,
      })
      .eq('tenant_id', tenantId)
      .eq('key', input.key)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update preference: ${error.message}`);
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabaseAdmin
      .from('founder_preferences')
      .insert({
        tenant_id: tenantId,
        key: input.key,
        value: input.value,
        category: input.category || 'general',
        label: input.label || null,
        description: input.description || null,
        value_type: input.value_type || 'string',
        allowed_values: input.allowed_values || null,
        default_value: input.default_value ?? null,
        is_sensitive: input.is_sensitive || false,
        requires_restart: input.requires_restart || false,
        metadata: input.metadata || {},
        created_by: userId || null,
        updated_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create preference: ${error.message}`);
    }

    return data;
  }
}

/**
 * Delete a preference
 */
export async function deletePreference(tenantId: string, key: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('founder_preferences')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('key', key);

  if (error) {
    throw new Error(`Failed to delete preference: ${error.message}`);
  }
}

/**
 * Get multiple preferences by keys (batch)
 */
export async function getPreferencesByKeys(
  tenantId: string,
  keys: string[]
): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin
    .from('founder_preferences')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .in('key', keys);

  if (error) {
    throw new Error(`Failed to get preferences: ${error.message}`);
  }

  const result: Record<string, unknown> = {};
  for (const pref of data || []) {
    result[pref.key] = pref.value;
  }

  return result;
}

// =====================================================
// Playbooks Functions
// =====================================================

/**
 * List all playbooks for a tenant
 */
export async function listPlaybooks(
  tenantId: string,
  options: {
    category?: PlaybookCategory;
    activeOnly?: boolean;
    includeTemplates?: boolean;
    limit?: number;
  } = {}
): Promise<FounderPlaybook[]> {
  const { category, activeOnly = true, includeTemplates = true, limit = 100 } = options;

  let query = supabaseAdmin
    .from('founder_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('times_used', { ascending: false })
    .order('name')
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (!includeTemplates) {
    query = query.eq('is_template', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list playbooks: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single playbook by ID
 */
export async function getPlaybook(playbookId: string): Promise<FounderPlaybook | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get playbook: ${error.message}`);
  }

  return data;
}

/**
 * Get playbook by slug
 */
export async function getPlaybookBySlug(
  tenantId: string,
  slug: string
): Promise<FounderPlaybook | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get playbook by slug: ${error.message}`);
  }

  return data;
}

/**
 * Create or update a playbook
 */
export async function upsertPlaybook(
  tenantId: string,
  input: FounderPlaybookInput,
  userId?: string,
  playbookId?: string
): Promise<FounderPlaybook> {
  if (playbookId) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('founder_playbooks')
      .update({
        ...input,
        updated_by: userId || null,
      })
      .eq('id', playbookId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update playbook: ${error.message}`);
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabaseAdmin
      .from('founder_playbooks')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        category: input.category || 'general',
        trigger_conditions: input.trigger_conditions || [],
        steps: input.steps,
        success_criteria: input.success_criteria || [],
        when_to_use: input.when_to_use || null,
        when_not_to_use: input.when_not_to_use || null,
        estimated_duration: input.estimated_duration || null,
        difficulty: input.difficulty || 'moderate',
        ai_can_execute: input.ai_can_execute || false,
        ai_guidance_level: input.ai_guidance_level || 'suggest',
        is_active: input.is_active !== false,
        is_template: input.is_template || false,
        tags: input.tags || [],
        metadata: input.metadata || {},
        created_by: userId || null,
        updated_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create playbook: ${error.message}`);
    }

    return data;
  }
}

/**
 * Delete a playbook
 */
export async function deletePlaybook(playbookId: string, tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('founder_playbooks')
    .delete()
    .eq('id', playbookId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to delete playbook: ${error.message}`);
  }
}

/**
 * Record playbook usage
 */
export async function recordPlaybookUsage(
  playbookId: string,
  successScore?: number
): Promise<void> {
  const playbook = await getPlaybook(playbookId);
  if (!playbook) {
    throw new Error('Playbook not found');
  }

  const newTimesUsed = (playbook.times_used || 0) + 1;
  let newAvgScore = playbook.average_success_score;

  if (successScore !== undefined) {
    if (newAvgScore === null) {
      newAvgScore = successScore;
    } else {
      // Calculate running average
      newAvgScore = ((newAvgScore * (newTimesUsed - 1)) + successScore) / newTimesUsed;
    }
  }

  const { error } = await supabaseAdmin
    .from('founder_playbooks')
    .update({
      times_used: newTimesUsed,
      last_used_at: new Date().toISOString(),
      average_success_score: newAvgScore,
    })
    .eq('id', playbookId);

  if (error) {
    throw new Error(`Failed to record playbook usage: ${error.message}`);
  }
}

// =====================================================
// Settings Functions (Singleton per tenant)
// =====================================================

/**
 * Get founder settings for a tenant
 */
export async function getFounderSettings(tenantId: string): Promise<FounderSettings | null> {
  const { data, error } = await supabaseAdmin
    .from('founder_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get founder settings: ${error.message}`);
  }

  return data;
}

/**
 * Create or update founder settings (upsert)
 */
export async function upsertFounderSettings(
  tenantId: string,
  input: FounderSettingsInput,
  userId?: string
): Promise<FounderSettings> {
  const existingSettings = await getFounderSettings(tenantId);

  if (existingSettings) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('founder_settings')
      .update({
        ...input,
        updated_by: userId || null,
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update founder settings: ${error.message}`);
    }

    return data;
  } else {
    // Create new with defaults
    const { data, error } = await supabaseAdmin
      .from('founder_settings')
      .insert({
        tenant_id: tenantId,
        synthex_automation_enabled: input.synthex_automation_enabled ?? true,
        ai_content_generation_enabled: input.ai_content_generation_enabled ?? true,
        predictive_send_time_enabled: input.predictive_send_time_enabled ?? true,
        auto_segmentation_enabled: input.auto_segmentation_enabled ?? true,
        daily_digest_enabled: input.daily_digest_enabled ?? true,
        weekly_report_enabled: input.weekly_report_enabled ?? true,
        real_time_alerts_enabled: input.real_time_alerts_enabled ?? true,
        alert_channels: input.alert_channels || ['email', 'in_app'],
        ai_autonomy_level: input.ai_autonomy_level || 'suggest',
        ai_learning_enabled: input.ai_learning_enabled ?? true,
        ai_personalization_level: input.ai_personalization_level || 'high',
        research_auto_run: input.research_auto_run ?? false,
        research_sources: input.research_sources || ['web', 'docs'],
        extended_settings: input.extended_settings || {},
        created_by: userId || null,
        updated_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create founder settings: ${error.message}`);
    }

    return data;
  }
}

// =====================================================
// AI-Powered Helper Functions
// =====================================================

/**
 * Summarize founder profile for AI context injection
 */
export async function getFounderContextForAI(
  tenantId: string
): Promise<string> {
  const [profile, principles, settings] = await Promise.all([
    getFounderProfile(tenantId),
    listPrinciples(tenantId, { activeOnly: true, limit: 20 }),
    getFounderSettings(tenantId),
  ]);

  if (!profile) {
    return 'No founder profile configured.';
  }

  const lines: string[] = [];

  // Core identity
  if (profile.name) {
lines.push(`Founder: ${profile.name}${profile.title ? `, ${profile.title}` : ''}`);
}
  if (profile.company_name) {
lines.push(`Company: ${profile.company_name} (${profile.company_stage || 'unknown stage'})`);
}
  if (profile.industry) {
lines.push(`Industry: ${profile.industry}`);
}

  // Communication style
  if (profile.communication_style) {
    lines.push(`Communication style: ${profile.communication_style}`);
  }
  if (profile.preferred_tone) {
    lines.push(`Preferred tone: ${profile.preferred_tone}`);
  }
  if (profile.decision_style) {
    lines.push(`Decision style: ${profile.decision_style}`);
  }

  // Vision & values
  if (profile.vision_statement) {
    lines.push(`Vision: ${profile.vision_statement}`);
  }
  if (profile.core_values && profile.core_values.length > 0) {
    lines.push(`Core values: ${profile.core_values.join(', ')}`);
  }

  // Active principles
  if (principles.length > 0) {
    lines.push('\nKey Principles:');
    for (const p of principles.slice(0, 10)) {
      lines.push(`- [${p.category}] ${p.title}${p.description ? `: ${p.description}` : ''}`);
    }
  }

  // AI settings
  if (settings) {
    lines.push(`\nAI Settings: Autonomy=${settings.ai_autonomy_level}, Personalization=${settings.ai_personalization_level}`);
  }

  return lines.join('\n');
}

/**
 * Use AI to normalize and enhance principle descriptions
 */
export async function normalizePrincipleWithAI(
  title: string,
  description?: string
): Promise<{ normalizedTitle: string; normalizedDescription: string; suggestedCategory: PrincipleCategory }> {
  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      system: 'You are a business advisor helping founders articulate their principles clearly. Respond with JSON only.',
      messages: [
        {
          role: 'user',
          content: `Normalize this business principle:
Title: ${title}
Description: ${description || 'Not provided'}

Return JSON:
{
  "normalizedTitle": "<clear, concise title>",
  "normalizedDescription": "<1-2 sentence description>",
  "suggestedCategory": "<one of: leadership, product, culture, customer, growth, operations, finance, marketing, sales, general>"
}`,
        },
      ],
    });

    recordAnthropicSuccess();

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return JSON.parse(textBlock.text);
  } catch (error) {
    recordAnthropicFailure(error);
    // Return original values on failure
    return {
      normalizedTitle: title,
      normalizedDescription: description || '',
      suggestedCategory: 'general',
    };
  }
}

/**
 * Use AI to suggest playbook steps from a description
 */
export async function suggestPlaybookSteps(
  playbookName: string,
  description: string,
  category: PlaybookCategory
): Promise<PlaybookStep[]> {
  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      system: 'You are a business operations expert helping founders create playbooks. Respond with JSON array only.',
      messages: [
        {
          role: 'user',
          content: `Create steps for this playbook:
Name: ${playbookName}
Description: ${description}
Category: ${category}

Return JSON array of steps:
[
  {
    "id": "step_1",
    "order": 1,
    "title": "<step title>",
    "description": "<what to do>",
    "actions": ["<action 1>", "<action 2>"],
    "estimated_duration": "<e.g., 30 minutes>",
    "ai_can_assist": <true/false>
  }
]

Create 3-7 practical steps.`,
        },
      ],
    });

    recordAnthropicSuccess();

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return JSON.parse(textBlock.text);
  } catch (error) {
    recordAnthropicFailure(error);
    // Return empty array on failure
    return [];
  }
}

// =====================================================
// Bulk Operations
// =====================================================

/**
 * Get full founder twin context (profile + principles + preferences + settings)
 */
export async function getFullFounderContext(tenantId: string): Promise<{
  profile: FounderProfile | null;
  principles: FounderPrinciple[];
  preferences: FounderPreference[];
  playbooks: FounderPlaybook[];
  settings: FounderSettings | null;
}> {
  const [profile, principles, preferences, playbooks, settings] = await Promise.all([
    getFounderProfile(tenantId),
    listPrinciples(tenantId, { activeOnly: true }),
    listPreferences(tenantId),
    listPlaybooks(tenantId, { activeOnly: true }),
    getFounderSettings(tenantId),
  ]);

  return { profile, principles, preferences, playbooks, settings };
}

/**
 * Initialize default founder twin for a new tenant
 */
export async function initializeFounderTwin(
  tenantId: string,
  userId: string,
  companyName?: string
): Promise<{
  profile: FounderProfile;
  settings: FounderSettings;
}> {
  // Create default profile
  const profile = await upsertFounderProfile(
    tenantId,
    {
      company_name: companyName || 'My Company',
      company_stage: 'seed',
      communication_style: 'direct',
      decision_style: 'data_driven',
      core_values: [],
      onboarding_completed: false,
    },
    userId
  );

  // Create default settings
  const settings = await upsertFounderSettings(tenantId, {}, userId);

  return { profile, settings };
}
