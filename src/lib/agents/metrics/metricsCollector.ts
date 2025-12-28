/**
 * Metrics Collector for Agent Executions
 * Tracks performance, costs, and business metrics via Agent SDK hooks
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Model pricing (Dec 2025) per million tokens
const MODEL_PRICING = {
  'opus-4-5-20251101': { input: 15.00, output: 75.00 },
  'sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  // Aliases
  'opus': { input: 15.00, output: 75.00 },
  'sonnet': { input: 3.00, output: 15.00 },
  'haiku': { input: 0.80, output: 4.00 }
} as const;

export interface MetricsData {
  workspace_id: string;
  agent_name: string;
  execution_id?: string;

  // Performance
  execution_time_ms: number;
  success: boolean;
  error_type?: string;
  retry_count?: number;

  // Cost metrics
  model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;

  // Business metrics
  items_processed?: number;
  items_failed?: number;
  confidence_score?: number;
}

export class MetricsCollector {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for MetricsCollector');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Calculate cost in USD based on token usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const normalizedModel = this.normalizeModelName(model);
    const pricing = MODEL_PRICING[normalizedModel as keyof typeof MODEL_PRICING];

    if (!pricing) {
      console.warn(`Unknown model: ${model}, defaulting to sonnet pricing`);
      const sonnetPricing = MODEL_PRICING['sonnet'];
      return ((inputTokens / 1_000_000) * sonnetPricing.input) +
             ((outputTokens / 1_000_000) * sonnetPricing.output);
    }

    return ((inputTokens / 1_000_000) * pricing.input) +
           ((outputTokens / 1_000_000) * pricing.output);
  }

  /**
   * Normalize model name to match pricing keys
   */
  private normalizeModelName(model: string): string {
    // Handle various model name formats
    if (model.includes('opus')) {
return 'opus-4-5-20251101';
}
    if (model.includes('sonnet')) {
return 'sonnet-4-5-20250929';
}
    if (model.includes('haiku')) {
return 'haiku-4-5-20251001';
}
    return model;
  }

  /**
   * Record agent execution metrics
   */
  async recordMetrics(metrics: MetricsData): Promise<void> {
    try {
      // Auto-calculate cost if tokens provided but cost not
      let cost = metrics.cost_usd;
      if (!cost && metrics.model_used && metrics.input_tokens && metrics.output_tokens) {
        cost = this.calculateCost(
          metrics.model_used,
          metrics.input_tokens,
          metrics.output_tokens
        );
      }

      const { error } = await this.supabase
        .from('agent_execution_metrics')
        .insert({
          workspace_id: metrics.workspace_id,
          agent_name: metrics.agent_name,
          execution_id: metrics.execution_id,

          // Performance
          execution_time_ms: metrics.execution_time_ms,
          success: metrics.success,
          error_type: metrics.error_type,
          retry_count: metrics.retry_count || 0,

          // Cost
          model_used: metrics.model_used ? this.normalizeModelName(metrics.model_used) : null,
          input_tokens: metrics.input_tokens || 0,
          output_tokens: metrics.output_tokens || 0,
          cost_usd: cost || 0,

          // Business
          items_processed: metrics.items_processed || 0,
          items_failed: metrics.items_failed || 0,
          confidence_score: metrics.confidence_score,

          executed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to record agent metrics:', error);
        throw error;
      }
    } catch (err) {
      console.error('MetricsCollector error:', err);
      // Don't fail agent execution if metrics recording fails
    }
  }

  /**
   * Get metrics for an agent in a time window
   */
  async getAgentMetrics(
    agentName: string,
    workspaceId: string,
    hoursAgo: number = 24
  ): Promise<{
    total_executions: number;
    success_rate: number;
    avg_execution_time_ms: number;
    error_rate: number;
    total_cost_usd: number;
    avg_cost_usd: number;
  }> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('*')
        .eq('agent_name', agentName)
        .eq('workspace_id', workspaceId)
        .gte('executed_at', since);

      if (error) {
throw error;
}

      if (!data || data.length === 0) {
        return {
          total_executions: 0,
          success_rate: 0,
          avg_execution_time_ms: 0,
          error_rate: 0,
          total_cost_usd: 0,
          avg_cost_usd: 0
        };
      }

      const successes = data.filter(m => m.success).length;
      const totalTime = data.reduce((sum, m) => sum + (m.execution_time_ms || 0), 0);
      const totalCost = data.reduce((sum, m) => sum + (Number(m.cost_usd) || 0), 0);

      return {
        total_executions: data.length,
        success_rate: (successes / data.length) * 100,
        avg_execution_time_ms: totalTime / data.length,
        error_rate: ((data.length - successes) / data.length) * 100,
        total_cost_usd: totalCost,
        avg_cost_usd: totalCost / data.length
      };
    } catch (err) {
      console.error('Failed to get agent metrics:', err);
      throw err;
    }
  }

  /**
   * Get cost breakdown by model
   */
  async getCostBreakdown(
    workspaceId: string,
    hoursAgo: number = 24
  ): Promise<Record<string, number>> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('model_used, cost_usd')
        .eq('workspace_id', workspaceId)
        .gte('executed_at', since)
        .not('model_used', 'is', null);

      if (error) {
throw error;
}

      const breakdown: Record<string, number> = {};
      data?.forEach(record => {
        const model = record.model_used || 'unknown';
        breakdown[model] = (breakdown[model] || 0) + Number(record.cost_usd || 0);
      });

      return breakdown;
    } catch (err) {
      console.error('Failed to get cost breakdown:', err);
      throw err;
    }
  }

  /**
   * Get top expensive agents
   */
  async getTopExpensiveAgents(
    workspaceId: string,
    hoursAgo: number = 24,
    limit: number = 10
  ): Promise<Array<{ agent_name: string; total_cost_usd: number }>> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('agent_name, cost_usd')
        .eq('workspace_id', workspaceId)
        .gte('executed_at', since);

      if (error) {
throw error;
}

      // Aggregate by agent
      const agentCosts: Record<string, number> = {};
      data?.forEach(record => {
        const agent = record.agent_name;
        agentCosts[agent] = (agentCosts[agent] || 0) + Number(record.cost_usd || 0);
      });

      // Convert to array and sort
      return Object.entries(agentCosts)
        .map(([agent_name, total_cost_usd]) => ({ agent_name, total_cost_usd }))
        .sort((a, b) => b.total_cost_usd - a.total_cost_usd)
        .slice(0, limit);
    } catch (err) {
      console.error('Failed to get top expensive agents:', err);
      throw err;
    }
  }
}

// Singleton instance
let instance: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!instance) {
    instance = new MetricsCollector();
  }
  return instance;
}

/**
 * Agent SDK Hook: Record metrics after tool use
 * Usage in Agent SDK options:
 *
 * hooks: {
 *   PostToolUse: [createMetricsHook(workspaceId, agentName)]
 * }
 */
export function createMetricsHook(workspaceId: string, agentName: string) {
  const collector = getMetricsCollector();

  return async (input: any, toolUseId: string, context: any) => {
    try {
      const executionTime = context?.execution_time_ms || 0;
      const success = context?.success !== false;
      const tokens = context?.usage || {};

      await collector.recordMetrics({
        workspace_id: workspaceId,
        agent_name: agentName,
        execution_id: context?.execution_id,
        execution_time_ms: executionTime,
        success,
        error_type: context?.error_type,
        model_used: context?.model,
        input_tokens: tokens.input_tokens,
        output_tokens: tokens.output_tokens,
        items_processed: context?.items_processed,
        items_failed: context?.items_failed,
        confidence_score: context?.confidence_score
      });
    } catch (err) {
      console.error('MetricsHook error:', err);
    }

    return {}; // Hooks must return empty object
  };
}
