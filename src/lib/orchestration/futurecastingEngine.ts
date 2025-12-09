/**
 * Futurecasting Intelligence Engine
 * Phase: D80 - Futurecasting Engine
 *
 * Predictive intelligence: macro trends, competitive shifts, regulatory changes.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

// ============================================================================
// TYPES
// ============================================================================

export type ForecastTimeframe = 'short_term' | 'medium_term' | 'long_term' | 'multi_horizon';

export interface FuturecastingModel {
  id: string;
  tenant_id: string;
  title: string;
  domain: string;
  timeframe: ForecastTimeframe;
  inputs?: {
    variables?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    data_sources?: string[];
    assumptions?: string[];
  };
  outputs?: {
    macro_trends?: string[];
    industry_shifts?: string[];
    competitor_moves?: string[];
    regulatory_changes?: string[];
    tech_evolution?: string[];
    leading_indicators?: Array<{
      indicator: string;
      current_value: string;
      trend: 'rising' | 'falling' | 'stable';
      significance: 'low' | 'medium' | 'high';
    }>;
    confidence_score?: number;
  };
  created_at: string;
}

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

export async function createModel(
  title: string,
  domain: string,
  timeframe: ForecastTimeframe,
  inputs: FuturecastingModel['inputs'],
  tenantId: string
): Promise<FuturecastingModel | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('futurecasting_models')
      .insert({
        tenant_id: tenantId,
        title,
        domain,
        timeframe,
        inputs,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FuturecastingModel;
  } catch (error) {
    console.error('[Futurecasting] Create model failed:', error);
    return null;
  }
}

export async function listModels(filters?: {
  tenant_id?: string;
  domain?: string;
  timeframe?: ForecastTimeframe;
  limit?: number;
}): Promise<FuturecastingModel[]> {
  let query = supabaseAdmin
    .from('futurecasting_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.domain) query = query.eq('domain', filters.domain);
  if (filters?.timeframe) query = query.eq('timeframe', filters.timeframe);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`List models failed: ${error.message}`);
  return data as FuturecastingModel[];
}

export async function getModel(
  modelId: string,
  tenantId?: string
): Promise<FuturecastingModel | null> {
  let query = supabaseAdmin.from('futurecasting_models').select('*').eq('id', modelId);

  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Get model failed: ${error.message}`);
  }

  return data as FuturecastingModel;
}

// ============================================================================
// FORECASTING EXECUTION
// ============================================================================

async function aiGenerateForecast(
  domain: string,
  timeframe: ForecastTimeframe,
  inputs: FuturecastingModel['inputs']
): Promise<FuturecastingModel['outputs']> {
  const client = getAnthropicClient();

  const timeframeMap = {
    short_term: '3-6 months',
    medium_term: '6-18 months',
    long_term: '18+ months',
    multi_horizon: 'all timeframes (short/medium/long)',
  };

  const prompt = `You are the Unite-Hub Futurecasting Intelligence Engine. Generate predictive analysis.

**Forecast Request:**
- Domain: ${domain}
- Timeframe: ${timeframeMap[timeframe]}
- Variables: ${JSON.stringify(inputs?.variables, null, 2)}
- Constraints: ${JSON.stringify(inputs?.constraints, null, 2)}
- Data Sources: ${inputs?.data_sources?.join(', ') || 'none specified'}
- Assumptions: ${inputs?.assumptions?.join(', ') || 'none specified'}

**Analysis Required:**
Generate comprehensive foresight analysis with:
1. Macro-economic trends affecting this domain
2. Industry-specific shifts and disruptions
3. Likely competitor strategic moves
4. Regulatory/policy changes on horizon
5. Technology evolution impacts
6. Leading indicators to monitor (with current trend direction and significance)
7. Overall confidence score (0-1)

Respond in JSON:
{
  "macro_trends": ["trend1", "trend2"],
  "industry_shifts": ["shift1", "shift2"],
  "competitor_moves": ["move1", "move2"],
  "regulatory_changes": ["change1", "change2"],
  "tech_evolution": ["evolution1", "evolution2"],
  "leading_indicators": [
    {
      "indicator": "string",
      "current_value": "string",
      "trend": "rising|falling|stable",
      "significance": "low|medium|high"
    }
  ],
  "confidence_score": 0-1
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const responseText = content.type === 'text' ? content.text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const outputs = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : {
        macro_trends: [],
        industry_shifts: [],
        competitor_moves: [],
        regulatory_changes: [],
        tech_evolution: [],
        leading_indicators: [],
        confidence_score: 0,
      };

  return outputs;
}

export async function runForecast(
  title: string,
  domain: string,
  timeframe: ForecastTimeframe,
  inputs: FuturecastingModel['inputs'],
  tenantId: string
): Promise<FuturecastingModel | null> {
  try {
    // Generate forecast
    const outputs = await aiGenerateForecast(domain, timeframe, inputs);

    // Create model with outputs
    const { data, error } = await supabaseAdmin
      .from('futurecasting_models')
      .insert({
        tenant_id: tenantId,
        title,
        domain,
        timeframe,
        inputs,
        outputs,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FuturecastingModel;
  } catch (error) {
    console.error('[Futurecasting] Run forecast failed:', error);
    return null;
  }
}

export async function getModelStats(filters?: {
  tenant_id?: string;
}): Promise<{
  total_models: number;
  by_domain: Record<string, number>;
  by_timeframe: Record<ForecastTimeframe, number>;
  avg_confidence: number;
}> {
  const models = await listModels({
    ...filters,
    limit: 10000,
  });

  const byDomain: Record<string, number> = {};
  const byTimeframe: Record<ForecastTimeframe, number> = {
    short_term: 0,
    medium_term: 0,
    long_term: 0,
    multi_horizon: 0,
  };

  let totalConfidence = 0;
  let confidenceCount = 0;

  models.forEach((model) => {
    byDomain[model.domain] = (byDomain[model.domain] || 0) + 1;
    byTimeframe[model.timeframe]++;

    if (model.outputs?.confidence_score !== undefined) {
      totalConfidence += model.outputs.confidence_score;
      confidenceCount++;
    }
  });

  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return {
    total_models: models.length,
    by_domain: byDomain,
    by_timeframe: byTimeframe,
    avg_confidence: Math.round(avgConfidence * 100) / 100,
  };
}
