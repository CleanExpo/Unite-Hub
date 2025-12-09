/**
 * Synthex Auto-Optimizer Engine Service
 *
 * Phase: D48 - Auto-Optimizer Engine
 * Tables: synthex_optimizer_runs, synthex_optimizer_actions
 *
 * Features:
 * - Autonomous system health monitoring
 * - AI-powered optimization recommendations
 * - Metrics snapshot and comparison
 * - Actionable tasks with priority and effort estimates
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type OptimizerRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type OptimizerActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type OptimizerActionStatus = 'open' | 'in_progress' | 'applied' | 'dismissed';
export type OptimizerActionCategory = 'performance' | 'cost' | 'quality' | 'engagement' | 'delivery' | 'compliance' | 'strategy';

export interface OptimizerRun {
  id: string;
  tenant_id: string;
  business_id?: string;
  scope: string;
  status: OptimizerRunStatus;
  metrics_snapshot: Record<string, unknown>;
  ai_summary: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface OptimizerAction {
  id: string;
  tenant_id: string;
  optimizer_run_id: string;
  category: OptimizerActionCategory;
  priority: OptimizerActionPriority;
  title: string;
  recommendation: string;
  target_entity?: string;
  eta_minutes?: number;
  ai_rationale: Record<string, unknown>;
  status: OptimizerActionStatus;
  created_at: string;
  applied_at?: string;
}

export interface CreateRunInput {
  scope: string;
  business_id?: string;
}

export interface CreateActionInput {
  optimizer_run_id: string;
  category: OptimizerActionCategory;
  priority: OptimizerActionPriority;
  title: string;
  recommendation: string;
  target_entity?: string;
  eta_minutes?: number;
  ai_rationale?: Record<string, unknown>;
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
// Optimizer Runs
// =============================================================================

/**
 * Create an optimizer run
 */
export async function createRun(
  tenantId: string,
  input: CreateRunInput
): Promise<OptimizerRun> {
  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_runs')
    .insert({
      tenant_id: tenantId,
      scope: input.scope,
      business_id: input.business_id,
      metrics_snapshot: {},
      ai_summary: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create optimizer run: ${error.message}`);
  return data as OptimizerRun;
}

/**
 * Get optimizer run by ID
 */
export async function getRun(runId: string): Promise<OptimizerRun | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_runs')
    .select('*')
    .eq('id', runId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get optimizer run: ${error.message}`);
  return data as OptimizerRun | null;
}

/**
 * List optimizer runs
 */
export async function listRuns(
  tenantId: string,
  filters?: {
    businessId?: string;
    status?: OptimizerRunStatus;
    limit?: number;
  }
): Promise<OptimizerRun[]> {
  let query = supabaseAdmin
    .from('synthex_optimizer_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false });

  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list optimizer runs: ${error.message}`);
  return data as OptimizerRun[];
}

/**
 * Update run status
 */
export async function updateRunStatus(
  runId: string,
  status: OptimizerRunStatus,
  errorMessage?: string
): Promise<OptimizerRun> {
  const updates: {
    status: OptimizerRunStatus;
    completed_at?: string;
    error_message?: string;
  } = { status };

  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_runs')
    .update(updates)
    .eq('id', runId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update run status: ${error.message}`);
  return data as OptimizerRun;
}

/**
 * Update run metrics and AI summary
 */
export async function updateRunResults(
  runId: string,
  metricsSnapshot: Record<string, unknown>,
  aiSummary: Record<string, unknown>
): Promise<OptimizerRun> {
  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_runs')
    .update({
      metrics_snapshot: metricsSnapshot,
      ai_summary: aiSummary,
    })
    .eq('id', runId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update run results: ${error.message}`);
  return data as OptimizerRun;
}

// =============================================================================
// Optimizer Actions
// =============================================================================

/**
 * Create an optimizer action
 */
export async function createAction(
  tenantId: string,
  input: CreateActionInput
): Promise<OptimizerAction> {
  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_actions')
    .insert({
      tenant_id: tenantId,
      optimizer_run_id: input.optimizer_run_id,
      category: input.category,
      priority: input.priority,
      title: input.title,
      recommendation: input.recommendation,
      target_entity: input.target_entity,
      eta_minutes: input.eta_minutes,
      ai_rationale: input.ai_rationale ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create optimizer action: ${error.message}`);
  return data as OptimizerAction;
}

/**
 * List actions for a run
 */
export async function listActions(
  tenantId: string,
  runId: string,
  filters?: {
    priority?: OptimizerActionPriority;
    status?: OptimizerActionStatus;
  }
): Promise<OptimizerAction[]> {
  let query = supabaseAdmin
    .from('synthex_optimizer_actions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('optimizer_run_id', runId)
    .order('priority', { ascending: true }) // Critical first
    .order('created_at', { ascending: false });

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list optimizer actions: ${error.message}`);
  return data as OptimizerAction[];
}

/**
 * Update action status
 */
export async function updateActionStatus(
  actionId: string,
  status: OptimizerActionStatus
): Promise<OptimizerAction> {
  const updates: { status: OptimizerActionStatus; applied_at?: string } = { status };

  if (status === 'applied') {
    updates.applied_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_optimizer_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update action status: ${error.message}`);
  return data as OptimizerAction;
}

// =============================================================================
// AI-Powered Optimization
// =============================================================================

/**
 * Execute optimizer run with AI analysis
 */
export async function executeOptimizerRun(
  tenantId: string,
  runId: string
): Promise<{
  run: OptimizerRun;
  actions: OptimizerAction[];
}> {
  try {
    // Update status to running
    await updateRunStatus(runId, 'running');

    // Get run details
    const run = await getRun(runId);
    if (!run) {
      throw new Error('Optimizer run not found');
    }

    // Collect metrics snapshot (example - extend based on scope)
    const metricsSnapshot = await collectMetricsSnapshot(tenantId, run.scope, run.business_id);

    // Generate AI analysis
    const aiAnalysis = await aiAnalyzeMetrics(run.scope, metricsSnapshot);

    // Update run with results
    await updateRunResults(runId, metricsSnapshot, aiAnalysis);

    // Create actions from AI recommendations
    const actions: OptimizerAction[] = [];
    if (aiAnalysis.recommendations && Array.isArray(aiAnalysis.recommendations)) {
      for (const rec of aiAnalysis.recommendations) {
        const action = await createAction(tenantId, {
          optimizer_run_id: runId,
          category: rec.category || 'strategy',
          priority: rec.priority || 'medium',
          title: rec.title,
          recommendation: rec.recommendation,
          target_entity: rec.target_entity,
          eta_minutes: rec.eta_minutes,
          ai_rationale: {
            reasoning: rec.reasoning,
            expected_impact: rec.expected_impact,
            risks: rec.risks,
          },
        });
        actions.push(action);
      }
    }

    // Update status to completed
    const completedRun = await updateRunStatus(runId, 'completed');

    return { run: completedRun, actions };
  } catch (error) {
    await updateRunStatus(runId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Collect metrics snapshot based on scope
 */
async function collectMetricsSnapshot(
  tenantId: string,
  scope: string,
  businessId?: string
): Promise<Record<string, unknown>> {
  // Example implementation - extend based on available tables
  const metrics: Record<string, unknown> = {
    scope,
    collected_at: new Date().toISOString(),
  };

  // You can query various Synthex tables here based on scope
  // For example: campaigns, content, delivery, audience, etc.

  if (scope === 'full' || scope === 'business') {
    // Aggregate business-level metrics
    metrics.placeholder_metric = 'Extend based on existing tables';
  }

  return metrics;
}

/**
 * AI analysis of metrics to generate optimization recommendations
 */
async function aiAnalyzeMetrics(
  scope: string,
  metrics: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const client = getAnthropicClient();

  const prompt = `You are a business optimization AI analyzing system health and performance. Review these metrics and provide actionable optimization recommendations.

Scope: ${scope}

Current Metrics:
${JSON.stringify(metrics, null, 2)}

Provide:
1. Health score (0-100)
2. Key issues identified
3. Opportunities for improvement
4. Specific recommendations (with category, priority, title, recommendation text, target entity, ETA in minutes, reasoning, expected impact, and risks)

Respond in JSON format:
{
  "health_score": 78,
  "key_issues": ["Low engagement on social campaigns", "High cost per acquisition"],
  "opportunities": ["Optimize posting times", "A/B test content variations"],
  "recommendations": [
    {
      "category": "performance|cost|quality|engagement|delivery|compliance|strategy",
      "priority": "critical|high|medium|low",
      "title": "string",
      "recommendation": "string",
      "target_entity": "optional:entity_type:id",
      "eta_minutes": 30,
      "reasoning": "string",
      "expected_impact": "string",
      "risks": "string"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 3000,
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
      health_score: 50,
      key_issues: ['Unable to parse AI response'],
      opportunities: [],
      recommendations: [],
    };
  }
}

/**
 * Get optimizer summary statistics
 */
export async function getOptimizerSummary(
  tenantId: string,
  days = 30
): Promise<{
  total_runs: number;
  completed_runs: number;
  total_actions: number;
  critical_actions: number;
  applied_actions: number;
  avg_health_score: number;
}> {
  const { data, error } = await supabaseAdmin.rpc('synthex_get_optimizer_summary', {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get optimizer summary: ${error.message}`);
  return data[0];
}
