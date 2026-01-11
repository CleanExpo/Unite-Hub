/**
 * Synthex Auto-Pilot Playbook Engine Service
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 * Tables: synthex_appe_*
 *
 * Features:
 * - Playbook CRUD operations
 * - Step management
 * - Execution engine
 * - AI decision making
 * - Template management
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type APPEPlaybookStatus = 'draft' | 'active' | 'paused' | 'archived';
export type APPEStepType = 'trigger' | 'condition' | 'action' | 'delay' | 'branch' | 'loop' | 'parallel' | 'webhook' | 'ai_decision';
export type APPEActionCategory = 'email' | 'sms' | 'notification' | 'crm_update' | 'tag_add' | 'tag_remove' | 'score_update' | 'webhook_call' | 'ai_generate' | 'segment_add' | 'segment_remove' | 'campaign_trigger' | 'custom';
export type APPEExecutionStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'timeout';
export type APPETriggerType = 'manual' | 'scheduled' | 'event_based' | 'condition_met' | 'api_call' | 'webhook_received' | 'segment_entry' | 'segment_exit';
export type APPELogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface APPEPlaybook {
  id: string;
  tenant_id: string;
  playbook_key: string;
  playbook_name: string;
  playbook_description?: string;
  playbook_status: APPEPlaybookStatus;
  version_number: number;
  is_template: boolean;
  template_source_id?: string;
  trigger_type: APPETriggerType;
  trigger_config: Record<string, unknown>;
  schedule_cron?: string;
  schedule_timezone: string;
  next_run_at?: string;
  last_run_at?: string;
  max_concurrent_executions: number;
  execution_timeout_seconds: number;
  retry_on_failure: boolean;
  max_retries: number;
  ai_enabled: boolean;
  ai_decision_model: string;
  ai_confidence_threshold: number;
  tags: string[];
  category?: string;
  priority: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms?: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  archived_at?: string;
}

export interface APPEStep {
  id: string;
  tenant_id: string;
  playbook_id: string;
  step_order: number;
  step_key: string;
  step_name: string;
  step_description?: string;
  step_type: APPEStepType;
  action_category?: APPEActionCategory;
  step_config: Record<string, unknown>;
  input_mapping: Record<string, unknown>;
  output_mapping: Record<string, unknown>;
  condition_expression?: string;
  condition_config: Record<string, unknown>;
  next_step_id?: string;
  on_success_step_id?: string;
  on_failure_step_id?: string;
  branch_config: Record<string, unknown>;
  delay_seconds?: number;
  delay_until?: string;
  ai_prompt_template?: string;
  ai_decision_options: unknown[];
  is_required: boolean;
  skip_on_error: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APPEExecution {
  id: string;
  tenant_id: string;
  playbook_id: string;
  execution_key: string;
  execution_status: APPEExecutionStatus;
  triggered_by: APPETriggerType;
  trigger_data: Record<string, unknown>;
  target_entity_type?: string;
  target_entity_id?: string;
  target_context: Record<string, unknown>;
  current_step_id?: string;
  current_step_order: number;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  failed_steps: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  step_results: Record<string, unknown>;
  ai_decisions: unknown[];
  error_message?: string;
  error_details: Record<string, unknown>;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  parent_execution_id?: string;
  created_at: string;
  updated_at: string;
}

export interface APPEExecutionLog {
  id: string;
  tenant_id: string;
  execution_id: string;
  step_id?: string;
  log_level: APPELogLevel;
  log_message: string;
  log_details: Record<string, unknown>;
  step_status?: string;
  step_input: Record<string, unknown>;
  step_output: Record<string, unknown>;
  step_error?: string;
  ai_prompt?: string;
  ai_response?: string;
  ai_confidence?: number;
  ai_decision?: string;
  ai_tokens_used?: number;
  step_started_at?: string;
  step_completed_at?: string;
  step_duration_ms?: number;
  created_at: string;
}

export interface APPETemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_description?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  playbook_definition: Record<string, unknown>;
  required_integrations: string[];
  required_fields: unknown[];
  author?: string;
  version: string;
  is_official: boolean;
  is_public: boolean;
  usage_count: number;
  rating_avg?: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface APPEStats {
  total_playbooks: number;
  active_playbooks: number;
  total_executions: number;
  running_executions: number;
  completed_today: number;
  failed_today: number;
  avg_execution_time_ms: number;
  success_rate: number;
}

export interface CreatePlaybookInput {
  playbook_key: string;
  playbook_name: string;
  playbook_description?: string;
  trigger_type?: APPETriggerType;
  trigger_config?: Record<string, unknown>;
  schedule_cron?: string;
  schedule_timezone?: string;
  ai_enabled?: boolean;
  ai_decision_model?: string;
  ai_confidence_threshold?: number;
  tags?: string[];
  category?: string;
  priority?: number;
}

export interface CreateStepInput {
  step_order: number;
  step_key: string;
  step_name: string;
  step_description?: string;
  step_type: APPEStepType;
  action_category?: APPEActionCategory;
  step_config?: Record<string, unknown>;
  input_mapping?: Record<string, unknown>;
  output_mapping?: Record<string, unknown>;
  condition_expression?: string;
  condition_config?: Record<string, unknown>;
  next_step_id?: string;
  on_success_step_id?: string;
  on_failure_step_id?: string;
  branch_config?: Record<string, unknown>;
  delay_seconds?: number;
  ai_prompt_template?: string;
  ai_decision_options?: unknown[];
  is_required?: boolean;
  skip_on_error?: boolean;
}

export interface StartExecutionInput {
  triggered_by?: APPETriggerType;
  trigger_data?: Record<string, unknown>;
  target_entity_type?: string;
  target_entity_id?: string;
  target_context?: Record<string, unknown>;
  input_data?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60-second TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Playbook CRUD Operations
// =============================================================================

/**
 * Create a new playbook
 */
export async function createPlaybook(
  tenantId: string,
  input: CreatePlaybookInput
): Promise<APPEPlaybook> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .insert({
      tenant_id: tenantId,
      playbook_key: input.playbook_key,
      playbook_name: input.playbook_name,
      playbook_description: input.playbook_description,
      trigger_type: input.trigger_type || 'manual',
      trigger_config: input.trigger_config || {},
      schedule_cron: input.schedule_cron,
      schedule_timezone: input.schedule_timezone || 'UTC',
      ai_enabled: input.ai_enabled ?? true,
      ai_decision_model: input.ai_decision_model || 'claude-sonnet-4-5-20250514',
      ai_confidence_threshold: input.ai_confidence_threshold ?? 0.7,
      tags: input.tags || [],
      category: input.category,
      priority: input.priority ?? 5,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Get playbook by ID
 */
export async function getPlaybook(playbookId: string): Promise<APPEPlaybook | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (error && error.code !== 'PGRST116') {
throw error;
}
  return data;
}

/**
 * List playbooks for a tenant
 */
export async function listPlaybooks(
  tenantId: string,
  filters?: {
    status?: APPEPlaybookStatus;
    trigger_type?: APPETriggerType;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<APPEPlaybook[]> {
  let query = supabaseAdmin
    .from('synthex_appe_playbooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('playbook_status', filters.status);
  }
  if (filters?.trigger_type) {
    query = query.eq('trigger_type', filters.trigger_type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.search) {
    query = query.or(`playbook_name.ilike.%${filters.search}%,playbook_key.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
throw error;
}
  return data || [];
}

/**
 * Update playbook
 */
export async function updatePlaybook(
  playbookId: string,
  updates: Partial<CreatePlaybookInput> & {
    playbook_status?: APPEPlaybookStatus;
  }
): Promise<APPEPlaybook> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playbookId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Activate playbook
 */
export async function activatePlaybook(playbookId: string): Promise<APPEPlaybook> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .update({
      playbook_status: 'active',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', playbookId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Pause playbook
 */
export async function pausePlaybook(playbookId: string): Promise<APPEPlaybook> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .update({
      playbook_status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', playbookId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Archive playbook
 */
export async function archivePlaybook(playbookId: string): Promise<APPEPlaybook> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .update({
      playbook_status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', playbookId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Delete playbook (cascade deletes steps and executions)
 */
export async function deletePlaybook(playbookId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_appe_playbooks')
    .delete()
    .eq('id', playbookId);

  if (error) {
throw error;
}
}

// =============================================================================
// Step Operations
// =============================================================================

/**
 * Create a step
 */
export async function createStep(
  tenantId: string,
  playbookId: string,
  input: CreateStepInput
): Promise<APPEStep> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_steps')
    .insert({
      tenant_id: tenantId,
      playbook_id: playbookId,
      step_order: input.step_order,
      step_key: input.step_key,
      step_name: input.step_name,
      step_description: input.step_description,
      step_type: input.step_type,
      action_category: input.action_category,
      step_config: input.step_config || {},
      input_mapping: input.input_mapping || {},
      output_mapping: input.output_mapping || {},
      condition_expression: input.condition_expression,
      condition_config: input.condition_config || {},
      next_step_id: input.next_step_id,
      on_success_step_id: input.on_success_step_id,
      on_failure_step_id: input.on_failure_step_id,
      branch_config: input.branch_config || {},
      delay_seconds: input.delay_seconds,
      ai_prompt_template: input.ai_prompt_template,
      ai_decision_options: input.ai_decision_options || [],
      is_required: input.is_required ?? true,
      skip_on_error: input.skip_on_error ?? false,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * List steps for a playbook
 */
export async function listSteps(playbookId: string): Promise<APPEStep[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('step_order', { ascending: true });

  if (error) {
throw error;
}
  return data || [];
}

/**
 * Update step
 */
export async function updateStep(
  stepId: string,
  updates: Partial<CreateStepInput>
): Promise<APPEStep> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_steps')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Delete step
 */
export async function deleteStep(stepId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_appe_steps')
    .delete()
    .eq('id', stepId);

  if (error) {
throw error;
}
}

/**
 * Reorder steps
 */
export async function reorderSteps(
  playbookId: string,
  stepOrders: { stepId: string; newOrder: number }[]
): Promise<APPEStep[]> {
  for (const { stepId, newOrder } of stepOrders) {
    await supabaseAdmin
      .from('synthex_appe_steps')
      .update({ step_order: newOrder, updated_at: new Date().toISOString() })
      .eq('id', stepId);
  }

  return listSteps(playbookId);
}

// =============================================================================
// Execution Operations
// =============================================================================

/**
 * Start a playbook execution
 */
export async function startExecution(
  tenantId: string,
  playbookId: string,
  input: StartExecutionInput
): Promise<APPEExecution> {
  const steps = await listSteps(playbookId);
  const executionKey = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .insert({
      tenant_id: tenantId,
      playbook_id: playbookId,
      execution_key: executionKey,
      execution_status: 'queued',
      triggered_by: input.triggered_by || 'manual',
      trigger_data: input.trigger_data || {},
      target_entity_type: input.target_entity_type,
      target_entity_id: input.target_entity_id,
      target_context: input.target_context || {},
      total_steps: steps.length,
      input_data: input.input_data || {},
    })
    .select()
    .single();

  if (error) {
throw error;
}

  // Log execution start
  await createExecutionLog(tenantId, data.id, {
    log_level: 'info',
    log_message: `Playbook execution started: ${executionKey}`,
    log_details: { playbook_id: playbookId, total_steps: steps.length },
  });

  return data;
}

/**
 * Get execution by ID
 */
export async function getExecution(executionId: string): Promise<APPEExecution | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error && error.code !== 'PGRST116') {
throw error;
}
  return data;
}

/**
 * List executions
 */
export async function listExecutions(
  tenantId: string,
  filters?: {
    playbook_id?: string;
    status?: APPEExecutionStatus;
    limit?: number;
    offset?: number;
  }
): Promise<APPEExecution[]> {
  let query = supabaseAdmin
    .from('synthex_appe_executions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.playbook_id) {
    query = query.eq('playbook_id', filters.playbook_id);
  }
  if (filters?.status) {
    query = query.eq('execution_status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) {
throw error;
}
  return data || [];
}

/**
 * Update execution status
 */
export async function updateExecution(
  executionId: string,
  updates: Partial<{
    execution_status: APPEExecutionStatus;
    current_step_id: string;
    current_step_order: number;
    completed_steps: number;
    skipped_steps: number;
    failed_steps: number;
    output_data: Record<string, unknown>;
    step_results: Record<string, unknown>;
    ai_decisions: unknown[];
    error_message: string;
    error_details: Record<string, unknown>;
    started_at: string;
    completed_at: string;
    execution_time_ms: number;
  }>
): Promise<APPEExecution> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Cancel execution
 */
export async function cancelExecution(
  executionId: string,
  cancelledBy: string,
  reason?: string
): Promise<APPEExecution> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .update({
      execution_status: 'cancelled',
      cancelled_by: cancelledBy,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Pause execution
 */
export async function pauseExecution(executionId: string): Promise<APPEExecution> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .update({
      execution_status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * Resume execution
 */
export async function resumeExecution(executionId: string): Promise<APPEExecution> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_executions')
    .update({
      execution_status: 'running',
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

// =============================================================================
// Execution Logs
// =============================================================================

/**
 * Create execution log
 */
export async function createExecutionLog(
  tenantId: string,
  executionId: string,
  input: {
    step_id?: string;
    log_level: APPELogLevel;
    log_message: string;
    log_details?: Record<string, unknown>;
    step_status?: string;
    step_input?: Record<string, unknown>;
    step_output?: Record<string, unknown>;
    step_error?: string;
    ai_prompt?: string;
    ai_response?: string;
    ai_confidence?: number;
    ai_decision?: string;
    ai_tokens_used?: number;
    step_started_at?: string;
    step_completed_at?: string;
    step_duration_ms?: number;
  }
): Promise<APPEExecutionLog> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_execution_logs')
    .insert({
      tenant_id: tenantId,
      execution_id: executionId,
      step_id: input.step_id,
      log_level: input.log_level,
      log_message: input.log_message,
      log_details: input.log_details || {},
      step_status: input.step_status,
      step_input: input.step_input || {},
      step_output: input.step_output || {},
      step_error: input.step_error,
      ai_prompt: input.ai_prompt,
      ai_response: input.ai_response,
      ai_confidence: input.ai_confidence,
      ai_decision: input.ai_decision,
      ai_tokens_used: input.ai_tokens_used,
      step_started_at: input.step_started_at,
      step_completed_at: input.step_completed_at,
      step_duration_ms: input.step_duration_ms,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

/**
 * List execution logs
 */
export async function listExecutionLogs(
  executionId: string,
  filters?: {
    log_level?: APPELogLevel;
    step_id?: string;
    limit?: number;
  }
): Promise<APPEExecutionLog[]> {
  let query = supabaseAdmin
    .from('synthex_appe_execution_logs')
    .select('*')
    .eq('execution_id', executionId)
    .order('created_at', { ascending: true });

  if (filters?.log_level) {
    query = query.eq('log_level', filters.log_level);
  }
  if (filters?.step_id) {
    query = query.eq('step_id', filters.step_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
throw error;
}
  return data || [];
}

// =============================================================================
// Template Operations
// =============================================================================

/**
 * List templates
 */
export async function listTemplates(
  filters?: {
    category?: string;
    search?: string;
    is_official?: boolean;
    limit?: number;
  }
): Promise<APPETemplate[]> {
  let query = supabaseAdmin
    .from('synthex_appe_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.is_official !== undefined) {
    query = query.eq('is_official', filters.is_official);
  }
  if (filters?.search) {
    query = query.or(`template_name.ilike.%${filters.search}%,template_description.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
throw error;
}
  return data || [];
}

/**
 * Get template by ID
 */
export async function getTemplate(templateId: string): Promise<APPETemplate | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_appe_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') {
throw error;
}
  return data;
}

/**
 * Create playbook from template
 */
export async function createFromTemplate(
  tenantId: string,
  templateId: string,
  overrides?: {
    playbook_name?: string;
    playbook_key?: string;
  }
): Promise<APPEPlaybook> {
  const template = await getTemplate(templateId);
  if (!template) {
throw new Error('Template not found');
}

  // Increment usage count
  await supabaseAdmin
    .from('synthex_appe_templates')
    .update({ usage_count: template.usage_count + 1 })
    .eq('id', templateId);

  const playbookKey = overrides?.playbook_key || `${template.template_key}-${Date.now()}`;
  const playbookName = overrides?.playbook_name || template.template_name;

  // Create playbook
  const playbook = await createPlaybook(tenantId, {
    playbook_key: playbookKey,
    playbook_name: playbookName,
    playbook_description: template.template_description,
    category: template.category,
    tags: template.tags,
  });

  // Create steps from template definition
  const definition = template.playbook_definition as { steps?: unknown[] };
  if (definition.steps && Array.isArray(definition.steps)) {
    for (let i = 0; i < definition.steps.length; i++) {
      const stepDef = definition.steps[i] as Record<string, unknown>;
      await createStep(tenantId, playbook.id, {
        step_order: i + 1,
        step_key: `step-${i + 1}`,
        step_name: (stepDef.name as string) || `Step ${i + 1}`,
        step_type: (stepDef.type as APPEStepType) || 'action',
        action_category: stepDef.category as APPEActionCategory,
        step_config: (stepDef.config as Record<string, unknown>) || {},
        delay_seconds: stepDef.delay_seconds as number,
        ai_prompt_template: stepDef.ai_prompt as string,
      });
    }
  }

  return playbook;
}

// =============================================================================
// Stats and Analytics
// =============================================================================

/**
 * Get playbook engine stats
 */
export async function getStats(tenantId: string): Promise<APPEStats> {
  const { data, error } = await supabaseAdmin.rpc('synthex_appe_get_playbook_stats', {
    p_tenant_id: tenantId,
  });

  if (error) {
throw error;
}

  const stats = data?.[0] || {
    total_playbooks: 0,
    active_playbooks: 0,
    total_executions: 0,
    running_executions: 0,
    completed_today: 0,
    failed_today: 0,
    avg_execution_time_ms: 0,
    success_rate: 0,
  };

  return {
    total_playbooks: Number(stats.total_playbooks),
    active_playbooks: Number(stats.active_playbooks),
    total_executions: Number(stats.total_executions),
    running_executions: Number(stats.running_executions),
    completed_today: Number(stats.completed_today),
    failed_today: Number(stats.failed_today),
    avg_execution_time_ms: Number(stats.avg_execution_time_ms),
    success_rate: Number(stats.success_rate),
  };
}

/**
 * Get playbook with all steps
 */
export async function getPlaybookWithSteps(playbookId: string): Promise<{
  playbook: APPEPlaybook;
  steps: APPEStep[];
} | null> {
  const playbook = await getPlaybook(playbookId);
  if (!playbook) {
return null;
}

  const steps = await listSteps(playbookId);
  return { playbook, steps };
}

/**
 * Get execution with logs
 */
export async function getExecutionWithLogs(executionId: string): Promise<{
  execution: APPEExecution;
  logs: APPEExecutionLog[];
} | null> {
  const execution = await getExecution(executionId);
  if (!execution) {
return null;
}

  const logs = await listExecutionLogs(executionId);
  return { execution, logs };
}

// =============================================================================
// AI Decision Making
// =============================================================================

/**
 * Make AI decision for a step
 */
export async function makeAIDecision(
  step: APPEStep,
  context: {
    execution_context: Record<string, unknown>;
    step_input: Record<string, unknown>;
    previous_results: Record<string, unknown>;
  }
): Promise<{
  decision: string;
  confidence: number;
  reasoning: string;
  tokens_used: number;
}> {
  const client = getAnthropicClient();

  const prompt = step.ai_prompt_template || 'Analyze the following context and make a decision:';
  const options = step.ai_decision_options || [];

  const systemPrompt = `You are an AI decision engine for automated playbooks.
Given the context, make a decision and provide your reasoning.

Available decision options: ${JSON.stringify(options)}

Respond in JSON format:
{
  "decision": "your chosen option",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

  const userPrompt = `${prompt}

Context:
${JSON.stringify(context, null, 2)}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);
    return {
      decision: result.decision || 'unknown',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'No reasoning provided',
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (error) {
    console.error('AI decision error:', error);
    return {
      decision: 'error',
      confidence: 0,
      reasoning: error instanceof Error ? error.message : 'Unknown error',
      tokens_used: 0,
    };
  }
}

/**
 * AI-generate playbook from description
 */
export async function aiGeneratePlaybook(description: string): Promise<{
  playbook_name: string;
  playbook_description: string;
  category: string;
  trigger_type: APPETriggerType;
  steps: Array<{
    step_name: string;
    step_type: APPEStepType;
    action_category?: APPEActionCategory;
    step_config: Record<string, unknown>;
    delay_seconds?: number;
  }>;
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an automation playbook architect.
Given a description, design a playbook with appropriate steps.

Step types: trigger, condition, action, delay, branch, loop, parallel, webhook, ai_decision
Action categories: email, sms, notification, crm_update, tag_add, tag_remove, score_update, webhook_call, ai_generate, segment_add, segment_remove, campaign_trigger, custom
Trigger types: manual, scheduled, event_based, condition_met, api_call, webhook_received, segment_entry, segment_exit

Respond in JSON format:
{
  "playbook_name": "...",
  "playbook_description": "...",
  "category": "...",
  "trigger_type": "...",
  "steps": [
    {
      "step_name": "...",
      "step_type": "...",
      "action_category": "...",
      "step_config": {...},
      "delay_seconds": optional number
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: description }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}
