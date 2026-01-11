/**
 * Scenario Engine Service
 * Phase: D79 - Scenario Engine
 *
 * Multi-path outcome simulations, stress-tests, strategic risk models.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export type ScenarioStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScenarioTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  variables: {
    input_vars?: string[];
    constraints?: Record<string, unknown>;
    expected_outputs?: string[];
  };
  created_at: string;
}

export interface ScenarioRun {
  id: string;
  tenant_id: string;
  template_id: string;
  inputs: {
    variables: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
  };
  outputs?: {
    paths: Array<{
      name: string;
      probability: number;
      outcomes: string[];
    }>;
    probabilities: Record<string, number>;
    risks: string[];
    opportunities: string[];
    timeline: Record<string, string>;
    required_actions: string[];
  };
  status: ScenarioStatus;
  created_at: string;
  completed_at?: string;
}

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

export async function createTemplate(
  name: string,
  description: string | undefined,
  variables: ScenarioTemplate['variables'],
  tenantId: string
): Promise<ScenarioTemplate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('scenario_templates')
      .insert({
        tenant_id: tenantId,
        name,
        description,
        variables,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ScenarioTemplate;
  } catch (error) {
    console.error('[ScenarioEngine] Create template failed:', error);
    return null;
  }
}

export async function listTemplates(filters?: {
  tenant_id?: string;
  limit?: number;
}): Promise<ScenarioTemplate[]> {
  let query = supabaseAdmin
    .from('scenario_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List templates failed: ${error.message}`);
  return data as ScenarioTemplate[];
}

export async function getTemplate(
  templateId: string,
  tenantId?: string
): Promise<ScenarioTemplate | null> {
  let query = supabaseAdmin.from('scenario_templates').select('*').eq('id', templateId);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Get template failed: ${error.message}`);
  }

  return data as ScenarioTemplate;
}

// ============================================================================
// SCENARIO EXECUTION
// ============================================================================

async function aiGenerateScenarioPaths(
  template: ScenarioTemplate,
  inputs: ScenarioRun['inputs']
): Promise<ScenarioRun['outputs']> {
  const client = getAnthropicClient();

  const prompt = `You are the Unite-Hub Scenario Engine. Analyze scenario and generate multi-path outcomes.

**Scenario Template:**
- Name: ${template.name}
- Description: ${template.description}
- Template Variables: ${JSON.stringify(template.variables, null, 2)}

**Scenario Inputs:**
- Variables: ${JSON.stringify(inputs.variables, null, 2)}
- Parameters: ${JSON.stringify(inputs.parameters, null, 2)}
- Constraints: ${JSON.stringify(inputs.constraints, null, 2)}

**Analysis Required:**
Generate 3-5 distinct outcome paths with:
1. Path name and probability (0-1)
2. Key outcomes for each path
3. Overall risks across all paths
4. Opportunities to pursue
5. Timeline impacts (short/medium/long term)
6. Required actions to optimize outcomes

Respond in JSON:
{
  "paths": [
    {
      "name": "string",
      "probability": 0-1,
      "outcomes": ["outcome1", "outcome2"]
    }
  ],
  "probabilities": {"best_case": 0-1, "worst_case": 0-1, "most_likely": 0-1},
  "risks": ["risk1", "risk2"],
  "opportunities": ["opp1", "opp2"],
  "timeline": {"short_term": "string", "medium_term": "string", "long_term": "string"},
  "required_actions": ["action1", "action2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const outputs = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        paths: [],
        probabilities: {},
        risks: ['Unable to parse AI response'],
        opportunities: [],
        timeline: {},
        required_actions: ['Manual review required'],
      };

  return outputs;
}

export async function runScenario(
  templateId: string,
  inputs: ScenarioRun['inputs'],
  tenantId: string
): Promise<ScenarioRun | null> {
  try {
    // Get template
    const template = await getTemplate(templateId, tenantId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create run record
    const { data: run, error: createError } = await supabaseAdmin
      .from('scenario_runs')
      .insert({
        tenant_id: tenantId,
        template_id: templateId,
        inputs,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) throw createError;

    const runId = run.id;

    // Update status to running
    await supabaseAdmin.from('scenario_runs').update({ status: 'running' }).eq('id', runId);

    // Generate scenario paths
    const outputs = await aiGenerateScenarioPaths(template, inputs);

    // Update with results
    await supabaseAdmin
      .from('scenario_runs')
      .update({
        status: 'completed',
        outputs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Get final run record
    const { data: finalRun } = await supabaseAdmin
      .from('scenario_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return finalRun as ScenarioRun;
  } catch (error) {
    console.error('[ScenarioEngine] Run failed:', error);
    return null;
  }
}

export async function listRuns(filters?: {
  tenant_id?: string;
  template_id?: string;
  status?: ScenarioStatus;
  limit?: number;
}): Promise<ScenarioRun[]> {
  let query = supabaseAdmin
    .from('scenario_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.template_id) query = query.eq('template_id', filters.template_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List runs failed: ${error.message}`);
  return data as ScenarioRun[];
}

export async function getRunStats(filters?: {
  tenant_id?: string;
  template_id?: string;
}): Promise<{
  total_runs: number;
  by_status: Record<ScenarioStatus, number>;
  by_template: Record<string, number>;
  avg_paths_per_run: number;
}> {
  const runs = await listRuns({
    ...filters,
    limit: 10000,
  });

  const byStatus: Record<ScenarioStatus, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  const byTemplate: Record<string, number> = {};
  let totalPaths = 0;
  let pathCount = 0;

  runs.forEach((run) => {
    byStatus[run.status]++;
    byTemplate[run.template_id] = (byTemplate[run.template_id] || 0) + 1;

    if (run.outputs?.paths) {
      totalPaths += run.outputs.paths.length;
      pathCount++;
    }
  });

  const avgPaths = pathCount > 0 ? totalPaths / pathCount : 0;

  return {
    total_runs: runs.length,
    by_status: byStatus,
    by_template: byTemplate,
    avg_paths_per_run: Math.round(avgPaths * 10) / 10,
  };
}
