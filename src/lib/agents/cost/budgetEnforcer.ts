/**
 * Budget Enforcer
 * Checks and enforces agent budget limits
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMetricsCollector } from '../metrics/metricsCollector';

export interface BudgetStatus {
  within_budget: boolean;
  daily_remaining: number | null;
  monthly_remaining: number | null;
  budget_type: 'daily' | 'monthly' | 'per_execution' | 'none';
  message?: string;
}

export interface AgentBudget {
  id: string;
  workspace_id: string;
  agent_name: string;
  daily_budget_usd: number | null;
  monthly_budget_usd: number | null;
  per_execution_limit_usd: number | null;
  daily_spent_usd: number;
  monthly_spent_usd: number;
  pause_on_exceed: boolean;
  alert_at_percentage: number;
}

export class BudgetEnforcer {
  private supabase: SupabaseClient;
  private metricsCollector = getMetricsCollector();

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for BudgetEnforcer');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Check if agent is within budget for estimated cost
   */
  async checkBudget(
    agentName: string,
    workspaceId: string,
    estimatedCostUsd: number = 0.01 // Default small estimate
  ): Promise<BudgetStatus> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_budget_available', {
          p_workspace_id: workspaceId,
          p_agent_name: agentName,
          p_estimated_cost_usd: estimatedCostUsd
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          within_budget: true,
          daily_remaining: null,
          monthly_remaining: null,
          budget_type: 'none'
        };
      }

      const status = data[0];

      return {
        within_budget: status.within_budget,
        daily_remaining: status.daily_remaining,
        monthly_remaining: status.monthly_remaining,
        budget_type: status.budget_type,
        message: status.within_budget
          ? undefined
          : `Budget exceeded: ${status.budget_type} limit reached`
      };
    } catch (err) {
      console.error('Failed to check budget:', err);
      // Fail open: allow execution if budget check fails
      return {
        within_budget: true,
        daily_remaining: null,
        monthly_remaining: null,
        budget_type: 'none',
        message: 'Budget check failed, allowing execution'
      };
    }
  }

  /**
   * Get budget for an agent
   */
  async getBudget(agentName: string, workspaceId: string): Promise<AgentBudget | null> {
    try {
      const { data, error } = await this.supabase
        .from('agent_budgets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('agent_name', agentName)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      return data as AgentBudget | null;
    } catch (err) {
      console.error('Failed to get budget:', err);
      return null;
    }
  }

  /**
   * Create or update budget for an agent
   */
  async setBudget(
    agentName: string,
    workspaceId: string,
    budget: {
      daily_budget_usd?: number;
      monthly_budget_usd?: number;
      per_execution_limit_usd?: number;
      pause_on_exceed?: boolean;
      alert_at_percentage?: number;
    }
  ): Promise<AgentBudget> {
    try {
      const { data, error } = await this.supabase
        .from('agent_budgets')
        .upsert(
          {
            workspace_id: workspaceId,
            agent_name: agentName,
            ...budget
          },
          {
            onConflict: 'workspace_id,agent_name'
          }
        )
        .select()
        .single();

      if (error) throw error;

      return data as AgentBudget;
    } catch (err) {
      console.error('Failed to set budget:', err);
      throw err;
    }
  }

  /**
   * Check if budget alert threshold reached
   */
  async shouldAlert(agentName: string, workspaceId: string): Promise<boolean> {
    try {
      const budget = await this.getBudget(agentName, workspaceId);

      if (!budget) return false;

      const alertThreshold = budget.alert_at_percentage / 100;

      // Check daily budget
      if (budget.daily_budget_usd && budget.daily_budget_usd > 0) {
        const dailyUsagePercent = budget.daily_spent_usd / budget.daily_budget_usd;
        if (dailyUsagePercent >= alertThreshold) {
          return true;
        }
      }

      // Check monthly budget
      if (budget.monthly_budget_usd && budget.monthly_budget_usd > 0) {
        const monthlyUsagePercent = budget.monthly_spent_usd / budget.monthly_budget_usd;
        if (monthlyUsagePercent >= alertThreshold) {
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Failed to check alert threshold:', err);
      return false;
    }
  }

  /**
   * Get all budgets for a workspace
   */
  async getAllBudgets(workspaceId: string): Promise<AgentBudget[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_budgets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('monthly_spent_usd', { ascending: false });

      if (error) throw error;

      return (data || []) as AgentBudget[];
    } catch (err) {
      console.error('Failed to get all budgets:', err);
      throw err;
    }
  }

  /**
   * Reset daily budgets (should run at midnight)
   */
  async resetDailyBudgets(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('agent_budgets')
        .update({
          daily_spent_usd: 0,
          daily_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .lt('daily_reset_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (err) {
      console.error('Failed to reset daily budgets:', err);
      return 0;
    }
  }

  /**
   * Reset monthly budgets (should run on 1st of month)
   */
  async resetMonthlyBudgets(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('agent_budgets')
        .update({
          monthly_spent_usd: 0,
          monthly_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        })
        .lt('monthly_reset_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (err) {
      console.error('Failed to reset monthly budgets:', err);
      return 0;
    }
  }
}

// Singleton instance
let instance: BudgetEnforcer | null = null;

export function getBudgetEnforcer(): BudgetEnforcer {
  if (!instance) {
    instance = new BudgetEnforcer();
  }
  return instance;
}

/**
 * Agent SDK Hook: Check budget before tool use
 * Usage in Agent SDK options:
 *
 * hooks: {
 *   PreToolUse: [createBudgetCheckHook(workspaceId, agentName)]
 * }
 */
export function createBudgetCheckHook(workspaceId: string, agentName: string) {
  const enforcer = getBudgetEnforcer();

  return async (input: any, toolUseId: string, context: any) => {
    try {
      const estimatedCost = context?.estimated_cost_usd || 0.01;
      const status = await enforcer.checkBudget(agentName, workspaceId, estimatedCost);

      if (!status.within_budget) {
        return {
          blocked: true,
          reason: status.message || 'Budget exceeded',
          budget_status: status
        };
      }

      // Check alert threshold
      const shouldAlert = await enforcer.shouldAlert(agentName, workspaceId);
      if (shouldAlert) {
        console.warn(`⚠️ Budget alert: ${agentName} approaching budget limit`);
      }
    } catch (err) {
      console.error('BudgetCheckHook error:', err);
    }

    return {}; // Allow execution
  };
}
