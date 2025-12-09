/**
 * Simulation Twin Service
 * Phase: D78 - Unite Simulation Twin Engine
 *
 * Digital twins for scenario simulation + prediction. Store AI traces.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export interface SimulationTwin {
  id: string;
  name: string;
  state: {
    variables: Record<string, number>;
    parameters: Record<string, unknown>;
    rules?: Array<{ condition: string; action: string }>;
    thresholds?: Record<string, number>;
  };
  metadata?: {
    description?: string;
    version?: string;
    created_by?: string;
  };
  tenant_id?: string;
  updated_at: string;
}

export interface SimulationRun {
  id: string;
  twin_id: string;
  input?: {
    scenario: string;
    variables?: Record<string, number>;
    constraints?: Record<string, unknown>;
  };
  output?: {
    predictions: Record<string, number>;
    confidence_scores: Record<string, number>;
    recommendations: string[];
  };
  ai_trace?: {
    model: string;
    prompt: string;
    response: string;
    thinking_tokens?: number;
  };
  tenant_id?: string;
  executed_at: string;
}

// ============================================================================
// TWIN MANAGEMENT
// ============================================================================

export async function createTwin(
  name: string,
  state: SimulationTwin['state'],
  metadata?: SimulationTwin['metadata'],
  tenantId?: string | null
): Promise<SimulationTwin | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('unite_sim_twin')
      .insert({
        name,
        state,
        metadata,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SimulationTwin;
  } catch (error) {
    console.error('[SimTwin] Create failed:', error);
    return null;
  }
}

export async function listTwins(filters?: {
  tenant_id?: string;
  name?: string;
  limit?: number;
}): Promise<SimulationTwin[]> {
  let query = supabaseAdmin
    .from('unite_sim_twin')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.name) query = query.eq('name', filters.name);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List twins failed: ${error.message}`);
  return data as SimulationTwin[];
}

export async function getTwin(
  twinId: string,
  tenantId?: string | null
): Promise<SimulationTwin | null> {
  let query = supabaseAdmin.from('unite_sim_twin').select('*').eq('id', twinId);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Get twin failed: ${error.message}`);
  }

  return data as SimulationTwin;
}

export async function updateTwin(
  twinId: string,
  updates: Partial<Pick<SimulationTwin, 'state' | 'metadata'>>,
  tenantId?: string | null
): Promise<SimulationTwin | null> {
  try {
    let query = supabaseAdmin
      .from('unite_sim_twin')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', twinId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select().single();

    if (error) throw error;
    return data as SimulationTwin;
  } catch (error) {
    console.error('[SimTwin] Update failed:', error);
    return null;
  }
}

export async function deleteTwin(twinId: string, tenantId?: string | null): Promise<boolean> {
  try {
    let query = supabaseAdmin.from('unite_sim_twin').delete().eq('id', twinId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[SimTwin] Delete failed:', error);
    return false;
  }
}

// ============================================================================
// SIMULATION EXECUTION
// ============================================================================

async function runAISimulation(
  twin: SimulationTwin,
  input: SimulationRun['input']
): Promise<{
  output: SimulationRun['output'];
  ai_trace: SimulationRun['ai_trace'];
}> {
  const client = getAnthropicClient();

  const prompt = `You are a simulation engine. Predict outcomes based on scenario.

**Digital Twin State:**
- Variables: ${JSON.stringify(twin.state.variables, null, 2)}
- Parameters: ${JSON.stringify(twin.state.parameters, null, 2)}
- Rules: ${JSON.stringify(twin.state.rules, null, 2)}

**Simulation Input:**
- Scenario: ${input?.scenario}
- Variables: ${JSON.stringify(input?.variables, null, 2)}
- Constraints: ${JSON.stringify(input?.constraints, null, 2)}

**Simulation Task:**
1. Predict outcomes for given scenario
2. Calculate confidence scores (0-1) for predictions
3. Recommend actions based on predictions

Respond in JSON:
{
  "predictions": {"metric1": number, "metric2": number},
  "confidence_scores": {"metric1": 0-1, "metric2": 0-1},
  "recommendations": ["action1", "action2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const output = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        predictions: {},
        confidence_scores: {},
        recommendations: ['Unable to parse AI response'],
      };

  return {
    output,
    ai_trace: {
      model: 'claude-sonnet-4-5-20250929',
      prompt,
      response: responseText,
      thinking_tokens: response.usage.input_tokens,
    },
  };
}

export async function runSimulation(
  twinId: string,
  input: SimulationRun['input'],
  tenantId?: string | null
): Promise<SimulationRun | null> {
  try {
    // Get twin
    const twin = await getTwin(twinId, tenantId);
    if (!twin) {
      throw new Error('Twin not found');
    }

    // Run AI simulation
    const { output, ai_trace } = await runAISimulation(twin, input);

    // Store run
    const { data, error } = await supabaseAdmin
      .from('unite_sim_runs')
      .insert({
        twin_id: twinId,
        input,
        output,
        ai_trace,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SimulationRun;
  } catch (error) {
    console.error('[SimTwin] Run failed:', error);
    return null;
  }
}

export async function listRuns(filters?: {
  tenant_id?: string;
  twin_id?: string;
  limit?: number;
}): Promise<SimulationRun[]> {
  let query = supabaseAdmin
    .from('unite_sim_runs')
    .select('*')
    .order('executed_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.twin_id) query = query.eq('twin_id', filters.twin_id);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List runs failed: ${error.message}`);
  return data as SimulationRun[];
}

export async function getRunStats(filters?: {
  tenant_id?: string;
  twin_id?: string;
}): Promise<{
  total_runs: number;
  avg_confidence: number;
  by_twin: Record<string, number>;
}> {
  const runs = await listRuns({
    ...filters,
    limit: 10000,
  });

  const byTwin: Record<string, number> = {};
  let totalConfidence = 0;
  let confidenceCount = 0;

  runs.forEach((run) => {
    byTwin[run.twin_id] = (byTwin[run.twin_id] || 0) + 1;

    if (run.output?.confidence_scores) {
      const scores = Object.values(run.output.confidence_scores);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        totalConfidence += avg;
        confidenceCount++;
      }
    }
  });

  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return {
    total_runs: runs.length,
    avg_confidence: Math.round(avgConfidence * 100) / 100,
    by_twin: byTwin,
  };
}
