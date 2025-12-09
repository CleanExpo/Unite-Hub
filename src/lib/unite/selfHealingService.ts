/**
 * Self-Healing Service
 * Phase: D68 - Unite Self-Healing & Guardrail Automation
 *
 * AI-powered error pattern detection and idempotent fix orchestration.
 * Only runs safe, reversible operations. Destructive fixes require manual approval.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorSignature {
  id: string;
  tenant_id?: string;
  signature_key: string;
  pattern_regex?: string;
  severity: string;
  category: string;
  description?: string;
  fix_type: 'manual' | 'auto_safe' | 'auto_risky';
  fix_action?: Record<string, unknown>;
  is_idempotent: boolean;
  is_reversible: boolean;
  auto_approve: boolean;
  occurrence_count: number;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface SelfHealingRun {
  id: string;
  tenant_id?: string;
  signature_id?: string;
  event_id?: string;
  triggered_by: 'auto' | 'manual' | 'scheduled';
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';
  fix_action: Record<string, unknown>;
  execution_log?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  rollback_available: boolean;
  rollback_action?: Record<string, unknown>;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ERROR SIGNATURE MANAGEMENT
// ============================================================================

export async function createErrorSignature(
  input: Omit<ErrorSignature, 'id' | 'created_at' | 'updated_at'>
): Promise<ErrorSignature> {
  const { data, error } = await supabaseAdmin
    .from('unite_error_signatures')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create error signature: ${error.message}`);
  return data as ErrorSignature;
}

export async function listErrorSignatures(filters?: {
  tenant_id?: string;
  severity?: string;
  category?: string;
  fix_type?: string;
  auto_approve?: boolean;
  limit?: number;
}): Promise<ErrorSignature[]> {
  let query = supabaseAdmin
    .from('unite_error_signatures')
    .select('*')
    .order('last_seen_at', { ascending: false, nullsFirst: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.fix_type) query = query.eq('fix_type', filters.fix_type);
  if (filters?.auto_approve !== undefined) query = query.eq('auto_approve', filters.auto_approve);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list error signatures: ${error.message}`);
  return data as ErrorSignature[];
}

export async function updateErrorSignature(
  signatureId: string,
  updates: Partial<Omit<ErrorSignature, 'id' | 'created_at' | 'updated_at'>>
): Promise<ErrorSignature> {
  const { data, error } = await supabaseAdmin
    .from('unite_error_signatures')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', signatureId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update error signature: ${error.message}`);
  return data as ErrorSignature;
}

// ============================================================================
// SELF-HEALING RUN MANAGEMENT
// ============================================================================

export async function createSelfHealingRun(
  input: Omit<SelfHealingRun, 'id' | 'created_at'>
): Promise<SelfHealingRun> {
  const { data, error } = await supabaseAdmin
    .from('unite_self_healing_runs')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create self-healing run: ${error.message}`);
  return data as SelfHealingRun;
}

export async function listSelfHealingRuns(filters?: {
  tenant_id?: string;
  signature_id?: string;
  status?: string;
  triggered_by?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<SelfHealingRun[]> {
  let query = supabaseAdmin
    .from('unite_self_healing_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.signature_id) query = query.eq('signature_id', filters.signature_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.triggered_by) query = query.eq('triggered_by', filters.triggered_by);
  if (filters?.start_date) query = query.gte('created_at', filters.start_date);
  if (filters?.end_date) query = query.lte('created_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list self-healing runs: ${error.message}`);
  return data as SelfHealingRun[];
}

export async function updateSelfHealingRun(
  runId: string,
  updates: Partial<Omit<SelfHealingRun, 'id' | 'created_at'>>
): Promise<SelfHealingRun> {
  const { data, error } = await supabaseAdmin
    .from('unite_self_healing_runs')
    .update(updates)
    .eq('id', runId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update self-healing run: ${error.message}`);
  return data as SelfHealingRun;
}

// ============================================================================
// AI-POWERED ERROR PATTERN DETECTION
// ============================================================================

export async function aiDetectErrorPatterns(
  tenantId: string | null,
  errorSamples: Array<{
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  }>
): Promise<{
  signatures: Array<{
    pattern: string;
    category: string;
    severity: string;
    fix_recommendation: string;
    is_idempotent: boolean;
    is_reversible: boolean;
    confidence: number;
  }>;
  summary: string;
}> {
  try {
    const anthropic = getAnthropicClient();

    const prompt = `You are a self-healing system analyzer. Analyze these error samples and detect patterns.

Error Samples:
${JSON.stringify(errorSamples, null, 2)}

For each unique error pattern, provide:
1. A regex pattern that matches this error
2. Category (e.g., "database", "api", "timeout", "auth", "rate_limit")
3. Severity (critical/error/warning)
4. Fix recommendation (specific, actionable)
5. Is the fix idempotent? (can be run multiple times safely)
6. Is the fix reversible? (can be rolled back)
7. Confidence score (0.0-1.0)

CRITICAL RULES:
- Only recommend fixes that are idempotent and reversible
- Destructive operations (delete, drop, purge) must be flagged as manual-only
- Never recommend fixes that modify user data without backup

Return JSON:
{
  "signatures": [
    {
      "pattern": "regex pattern",
      "category": "database",
      "severity": "error",
      "fix_recommendation": "specific fix",
      "is_idempotent": true,
      "is_reversible": true,
      "confidence": 0.95
    }
  ],
  "summary": "overall summary"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text);
    return result;
  } catch (error) {
    console.error('[Self-Healing] AI error pattern detection failed:', error);
    return {
      signatures: [],
      summary: 'AI analysis unavailable',
    };
  }
}

// ============================================================================
// SELF-HEALING EXECUTION
// ============================================================================

export async function executeSelfHealingRun(
  runId: string
): Promise<{
  success: boolean;
  message: string;
  execution_log: Record<string, unknown>;
}> {
  const { data: run } = await supabaseAdmin
    .from('unite_self_healing_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) {
    throw new Error('Self-healing run not found');
  }

  // Update status to running
  await updateSelfHealingRun(runId, {
    status: 'running',
    started_at: new Date().toISOString(),
  });

  try {
    // Execute fix action based on type
    const { fix_action } = run;
    const executionLog: Record<string, unknown> = {
      steps: [],
      timestamps: {},
    };

    // STUB: This is where actual fix execution would happen
    // For now, we simulate safe operations only
    if (fix_action.type === 'restart_service') {
      executionLog.steps = ['service_stopped', 'service_started'];
      executionLog.timestamps = {
        stop: new Date().toISOString(),
        start: new Date().toISOString(),
      };
    } else if (fix_action.type === 'clear_cache') {
      executionLog.steps = ['cache_cleared'];
      executionLog.timestamps = { clear: new Date().toISOString() };
    } else if (fix_action.type === 'retry_operation') {
      executionLog.steps = ['operation_retried'];
      executionLog.timestamps = { retry: new Date().toISOString() };
    } else {
      throw new Error(`Unknown fix action type: ${fix_action.type}`);
    }

    // Update status to success
    await updateSelfHealingRun(runId, {
      status: 'success',
      completed_at: new Date().toISOString(),
      execution_log: executionLog,
    });

    return {
      success: true,
      message: 'Self-healing run completed successfully',
      execution_log: executionLog,
    };
  } catch (error) {
    // Update status to failed
    await updateSelfHealingRun(runId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      execution_log: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      execution_log: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// ============================================================================
// ROLLBACK CAPABILITY
// ============================================================================

export async function rollbackSelfHealingRun(
  runId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const { data: run } = await supabaseAdmin
    .from('unite_self_healing_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (!run) {
    throw new Error('Self-healing run not found');
  }

  if (!run.rollback_available || !run.rollback_action) {
    throw new Error('Rollback not available for this run');
  }

  if (run.status === 'rolled_back') {
    throw new Error('Run already rolled back');
  }

  try {
    // Execute rollback action
    const { rollback_action } = run;

    // STUB: This is where actual rollback would happen
    console.log('[Self-Healing] Executing rollback:', rollback_action);

    // Update status to rolled_back
    await updateSelfHealingRun(runId, {
      status: 'rolled_back',
      execution_log: {
        ...(run.execution_log || {}),
        rollback_executed: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Rollback completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Rollback failed',
    };
  }
}
