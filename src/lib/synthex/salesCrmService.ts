/**
 * Synthex Sales CRM Service
 * Manages sales pipelines, opportunities, and activities
 * Phase B26: Sales CRM Pipeline + Opportunity Engine
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

// =====================================================
// TYPES
// =====================================================

export interface Pipeline {
  pipeline_id: string;
  tenant_id: string;
  name: string;
  stages: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type OpportunityStatus = 'open' | 'won' | 'lost';

export interface Opportunity {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  expected_close: string | null;
  owner_user_id: string;
  contact_id: string | null;
  company_name: string | null;
  notes: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export interface Activity {
  id: string;
  opportunity_id: string;
  tenant_id: string;
  type: ActivityType;
  content: string;
  next_action: string | null;
  due_at: string | null;
  completed: boolean;
  created_at: string;
}

export interface PipelineInput {
  tenant_id: string;
  name: string;
  stages: string[];
  is_default?: boolean;
}

export interface OpportunityInput {
  tenant_id: string;
  pipeline_id: string;
  name: string;
  stage: string;
  value?: number;
  probability?: number;
  expected_close?: string;
  owner_user_id: string;
  contact_id?: string;
  company_name?: string;
  notes?: string;
  status?: OpportunityStatus;
}

export interface OpportunityUpdate {
  name?: string;
  stage?: string;
  value?: number;
  probability?: number;
  expected_close?: string;
  owner_user_id?: string;
  contact_id?: string;
  company_name?: string;
  notes?: string;
  status?: OpportunityStatus;
}

export interface ActivityInput {
  opportunity_id: string;
  tenant_id: string;
  type: ActivityType;
  content: string;
  next_action?: string;
  due_at?: string;
  completed?: boolean;
}

export interface RevenueForecast {
  total_pipeline_value: number;
  weighted_forecast: number;
  open_opportunities: number;
  avg_deal_size: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// PIPELINE MANAGEMENT
// =====================================================

/**
 * List all pipelines for a tenant
 */
export async function listPipelines(tenantId: string): Promise<ServiceResult<Pipeline[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_sales_pipelines')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Create a new sales pipeline
 */
export async function createPipeline(input: PipelineInput): Promise<ServiceResult<Pipeline>> {
  try {
    // If this is set as default, unset any existing defaults
    if (input.is_default) {
      await supabaseAdmin
        .from('synthex_sales_pipelines')
        .update({ is_default: false })
        .eq('tenant_id', input.tenant_id)
        .eq('is_default', true);
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_sales_pipelines')
      .insert([input])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Update a pipeline
 */
export async function updatePipeline(
  pipelineId: string,
  updates: Partial<PipelineInput>
): Promise<ServiceResult<Pipeline>> {
  try {
    // If setting as default, unset other defaults for the tenant
    if (updates.is_default) {
      const { data: pipeline } = await supabaseAdmin
        .from('synthex_sales_pipelines')
        .select('tenant_id')
        .eq('pipeline_id', pipelineId)
        .single();

      if (pipeline) {
        await supabaseAdmin
          .from('synthex_sales_pipelines')
          .update({ is_default: false })
          .eq('tenant_id', pipeline.tenant_id)
          .eq('is_default', true)
          .neq('pipeline_id', pipelineId);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_sales_pipelines')
      .update(updates)
      .eq('pipeline_id', pipelineId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// =====================================================
// OPPORTUNITY MANAGEMENT
// =====================================================

/**
 * List opportunities for a tenant with optional filters
 */
export async function listOpportunities(
  tenantId: string,
  filters?: {
    pipeline_id?: string;
    status?: OpportunityStatus;
    owner_user_id?: string;
    stage?: string;
  }
): Promise<ServiceResult<Opportunity[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_sales_opportunities')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.pipeline_id) {
      query = query.eq('pipeline_id', filters.pipeline_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_user_id) {
      query = query.eq('owner_user_id', filters.owner_user_id);
    }
    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(input: OpportunityInput): Promise<ServiceResult<Opportunity>> {
  try {
    // Validate stage exists in pipeline
    const { data: pipeline } = await supabaseAdmin
      .from('synthex_sales_pipelines')
      .select('stages')
      .eq('pipeline_id', input.pipeline_id)
      .single();

    if (!pipeline) {
      return { success: false, error: 'Pipeline not found' };
    }

    if (!pipeline.stages.includes(input.stage)) {
      return { success: false, error: `Stage "${input.stage}" not found in pipeline` };
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_sales_opportunities')
      .insert([input])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Update an opportunity
 */
export async function updateOpportunity(
  opportunityId: string,
  updates: OpportunityUpdate
): Promise<ServiceResult<Opportunity>> {
  try {
    // If stage is being updated, validate it exists in the pipeline
    if (updates.stage) {
      const { data: opp } = await supabaseAdmin
        .from('synthex_sales_opportunities')
        .select('pipeline_id')
        .eq('id', opportunityId)
        .single();

      if (opp) {
        const { data: pipeline } = await supabaseAdmin
          .from('synthex_sales_pipelines')
          .select('stages')
          .eq('pipeline_id', opp.pipeline_id)
          .single();

        if (pipeline && !pipeline.stages.includes(updates.stage)) {
          return { success: false, error: `Stage "${updates.stage}" not found in pipeline` };
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_sales_opportunities')
      .update(updates)
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Move opportunity to a different stage
 */
export async function moveOpportunityStage(
  opportunityId: string,
  newStage: string
): Promise<ServiceResult<Opportunity>> {
  return updateOpportunity(opportunityId, { stage: newStage });
}

// =====================================================
// ACTIVITY LOGGING
// =====================================================

/**
 * Record an activity for an opportunity
 */
export async function recordActivity(input: ActivityInput): Promise<ServiceResult<Activity>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_sales_activities')
      .insert([input])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * List activities for an opportunity
 */
export async function listActivities(
  opportunityId: string,
  filters?: {
    type?: ActivityType;
    completed?: boolean;
  }
): Promise<ServiceResult<Activity[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_sales_activities')
      .select('*')
      .eq('opportunity_id', opportunityId);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// =====================================================
// REVENUE FORECASTING
// =====================================================

/**
 * Get revenue forecast for a tenant
 */
export async function forecastRevenue(tenantId: string): Promise<ServiceResult<RevenueForecast>> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_revenue_forecast', {
      tenant_id_param: tenantId,
    });

    if (error) throw error;

    // RPC returns array with single row
    const forecast = data && data.length > 0 ? data[0] : null;

    if (!forecast) {
      return {
        success: true,
        data: {
          total_pipeline_value: 0,
          weighted_forecast: 0,
          open_opportunities: 0,
          avg_deal_size: 0,
        },
      };
    }

    return { success: true, data: forecast };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// =====================================================
// AI-POWERED PROBABILITY ESTIMATION (OPTIONAL)
// =====================================================

/**
 * Estimate close probability using Claude AI
 * Optional feature - only called explicitly, not automatically
 */
export async function estimateProbability(
  opportunity: Opportunity,
  recentActivities: Activity[]
): Promise<ServiceResult<number>> {
  try {
    // Lazy load Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a sales forecasting expert. Estimate the close probability (0-100%) for this opportunity.

Opportunity Details:
- Name: ${opportunity.name}
- Company: ${opportunity.company_name || 'Unknown'}
- Stage: ${opportunity.stage}
- Current Probability: ${opportunity.probability}%
- Value: $${opportunity.value}
- Expected Close: ${opportunity.expected_close || 'Not set'}
- Days in Pipeline: ${Math.floor((new Date().getTime() - new Date(opportunity.created_at).getTime()) / (1000 * 60 * 60 * 24))}

Recent Activities (last ${recentActivities.length}):
${recentActivities.map(a => `- ${a.type}: ${a.content.substring(0, 100)}`).join('\n')}

Based on the stage, value, timeline, and activity pattern, estimate the close probability as a percentage (0-100). Consider:
1. Activity frequency and recency
2. Stage progression
3. Time in pipeline vs expected close
4. Quality of engagement (calls/meetings vs just notes)

Return ONLY the percentage number, no explanation.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const probability = parseInt(text.trim());

    if (isNaN(probability) || probability < 0 || probability > 100) {
      return { success: false, error: 'Invalid probability returned from AI' };
    }

    return { success: true, data: probability };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
